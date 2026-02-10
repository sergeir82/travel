import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ItinerarySchema,
  TripRequestSchema,
  extractFirstJsonObject,
  safeJsonParse,
} from "@/lib/itinerary";
import { POI_BY_ID, POIS, type Poi } from "@/lib/pois";

export const runtime = "nodejs";

// Prefer stable API version. The SDK defaults to v1beta; for newer models (2.5/3) v1 is often safer.
const GEMINI_API_VERSION = (process.env.GEMINI_API_VERSION ?? "v1").trim() || "v1";

type ModelInfo = {
  name: string; // e.g. "models/gemini-2.5-flash"
  supportedGenerationMethods?: string[];
};

function logApiError(event: string, payload: Record<string, unknown>) {
  // Logs go to stdout/stderr in dev terminal and Vercel logs.
  // Do NOT log secrets (API keys).
  try {
    console.error(`\n[api/itinerary] ${event}`);
    console.error(JSON.stringify(payload, null, 2));
  } catch (e) {
    console.error(`[api/itinerary] ${event} (failed to stringify payload)`, e);
  }
}

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function trunc(s: unknown, maxLen: number, fallback = ""): string {
  const str = typeof s === "string" ? s : s == null ? fallback : String(s);
  const t = str.trim();
  if (!t) return fallback;
  return t.length <= maxLen ? t : t.slice(0, maxLen - 1).trimEnd() + "…";
}

function safeRequestForLog(req: unknown) {
  if (!req || typeof req !== "object") return req;
  const r = req as Record<string, unknown>;
  return { ...r, notes: trunc(r.notes, 200) };
}

function normalizeTime(t: unknown): string {
  const str = typeof t === "string" ? t.trim() : String(t ?? "").trim();
  if (!str) return "10:00";
  const m = str.match(/^(\d{1,2})\s*[:.\- ]\s*(\d{1,2})$/);
  if (!m) return str;
  const hh = clampInt(m[1], 0, 23, 10).toString().padStart(2, "0");
  const mm = clampInt(m[2], 0, 59, 0).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function repairItineraryShape(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  const daysRaw = Array.isArray(obj.days) ? obj.days : [];
  const days = daysRaw
    .filter((d) => d && typeof d === "object")
    .slice(0, 3)
    .map((d, idx) => {
      const dayObj = d as Record<string, unknown>;
      const itemsRaw = Array.isArray(dayObj.items) ? dayObj.items : [];
      const items = itemsRaw
        .filter((it) => it && typeof it === "object")
        .slice(0, 6)
        .map((it) => {
          const itObj = it as Record<string, unknown>;
          const tipsRaw = Array.isArray(itObj.tips) ? itObj.tips : [];
          const tips = tipsRaw
            .map((x) => trunc(x, 120))
            .filter(Boolean)
            .slice(0, 4);

          return {
            time: normalizeTime(itObj.time),
            poiId: trunc(itObj.poiId, 80, "palace-square"),
            durationMin: clampInt(itObj.durationMin, 15, 240, 90),
            why: trunc(itObj.why, 320, "Хорошая точка маршрута."),
            move: trunc(itObj.move, 320, "Перемещение по городу."),
            tips,
          };
        });

      return {
        dayNumber: clampInt(dayObj.dayNumber, 1, 3, idx + 1),
        label: trunc(dayObj.label, 140, `День ${idx + 1}`),
        items,
      };
    });

  const alternativesRaw = Array.isArray(obj.alternatives) ? obj.alternatives : [];
  const alternatives = alternativesRaw
    .map((x) => trunc(x, 240))
    .filter(Boolean)
    .slice(0, 8);

  return {
    title: trunc(obj.title, 120, "Маршрут"),
    summary: trunc(obj.summary, 1000, "Персональный маршрут по выбранным интересам."),
    days,
    alternatives,
  };
}

function normalizeModelId(model: string): string {
  // SDK wants "gemini-..." (without "models/").
  const trimmed = model.trim();
  return trimmed.startsWith("models/") ? trimmed.slice("models/".length) : trimmed;
}

function isModelNotFound(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("not found") || m.includes("not supported for generatecontent");
}

function isQuotaExceeded(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("quota") || m.includes("[429") || m.includes("resource_exhausted");
}

function isGeoBlocked(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("user location is not supported");
}

let cachedModelId: { value: string; cachedAtMs: number } | null = null;
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

async function resolveModelId(apiKey: string, preferred?: string): Promise<string> {
  if (preferred) return normalizeModelId(preferred);

  const now = Date.now();
  if (cachedModelId && now - cachedModelId.cachedAtMs < MODEL_CACHE_TTL_MS) {
    return cachedModelId.value;
  }

  const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    logApiError("ListModels failed; using default model", { status: res.status });
    return "gemini-2.5-flash";
  }

  const data = (await res.json().catch(() => null)) as { models?: ModelInfo[] } | null;
  const models = data?.models ?? [];
  const candidates = models
    .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m) => normalizeModelId(m.name))
    .filter(Boolean);

  // Prefer Flash 2.5; then any Flash that isn't obviously experimental; otherwise first.
  const pick =
    candidates.find((m) => m.includes("2.5") && m.includes("flash")) ??
    candidates.find((m) => m.includes("flash") && !m.includes("lite")) ??
    candidates.find((m) => m.includes("gemini")) ??
    candidates[0];

  const modelId = pick ?? "gemini-2.5-flash";
  cachedModelId = { value: modelId, cachedAtMs: now };
  return modelId;
}

function getFallbackModelIds(): string[] {
  // Covers common naming for "Gemini 3 Flash" and "Gemini 2.5 Flash".
  // We'll try in order and stop on the first that works.
  return [
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.0-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];
}

function buildPrompt(input: {
  request: ReturnType<typeof TripRequestSchema.parse>;
  candidates: Poi[];
}) {
  const { request, candidates } = input;

  const poiJson = JSON.stringify(
    candidates.map((p) => ({
      id: p.id,
      name: p.name,
      region: p.region,
      tags: p.tags,
      lat: p.lat,
      lon: p.lon,
      short: p.short,
    })),
  );

  const promt = [
    "Ты — AI-консьерж по Санкт‑Петербургу и Ленобласти.",
    "Составь компактный маршрут по дням и времени под запрос пользователя.",
    "",
    "ЖЁСТКИЕ ПРАВИЛА:",
    "- Используй ТОЛЬКО poiId из списка POI ниже (нельзя придумывать новые места).",
    "- Верни ТОЛЬКО валидный JSON (без markdown, без пояснений).",
    "- На каждый день 4–6 пунктов. Время формата HH:MM (например, 10:30).",
    "- Учитывай темп (pace), транспорт (transport) и погоду (weather).",
    "- Не ставь далёкие точки подряд без логичной причины — описывай перемещение в поле move.",
    "",
    "ВХОД (TripRequest):",
    JSON.stringify(request),
    "",
    "POI (разрешённые точки):",
    poiJson,
    "",
    "СХЕМА ОТВЕТА (строго):",
    JSON.stringify(
      {
        title: "string",
        summary: "string",
        days: [
          {
            dayNumber: 1,
            label: "string",
            items: [
              {
                time: "10:30",
                poiId: "hermitage",
                durationMin: 90,
                why: "string",
                move: "string",
                tips: ["string"],
              },
            ],
          },
        ],
        alternatives: ["string"],
      },
      null,
      0,
    ),
  ].join("\n");

  console.log('!promt', promt);

  return promt;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logApiError("Missing GEMINI_API_KEY", {});
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY environment variable." },
        { status: 500 },
      );
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = TripRequestSchema.safeParse(raw);
    if (!parsed.success) {
      logApiError("Invalid request", {
        request: safeRequestForLog(raw),
        details: parsed.error.flatten(),
      });
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const request = parsed.data;

    const candidates = POIS.filter((p) => {
      if (request.baseRegion === "both") return true;
      return p.region === request.baseRegion;
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const preferredModel = process.env.GEMINI_MODEL;
    const primaryModelId = await resolveModelId(apiKey, preferredModel);

    const prompt = buildPrompt({ request, candidates });

    const tried = new Set<string>();
    const modelCandidates = [
      normalizeModelId(preferredModel ?? ""),
      primaryModelId,
      ...getFallbackModelIds(),
    ].filter(Boolean);

    let result: { response: { text: () => string } } | null = null;
    let lastErrMsg = "";
    for (const id of modelCandidates) {
      if (tried.has(id)) continue;
      tried.add(id);
      try {
        const model = genAI.getGenerativeModel(
          { model: id },
          { apiVersion: GEMINI_API_VERSION },
        );
        result = await model.generateContent(prompt);
        lastErrMsg = "";
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        lastErrMsg = msg;

        if (isQuotaExceeded(msg)) {
          logApiError("Gemini quota exceeded", {
            apiVersion: GEMINI_API_VERSION,
            modelTried: id,
            modelsTried: Array.from(tried),
            request: safeRequestForLog(request),
            error: msg,
          });
          return NextResponse.json(
            { error: "Gemini quota exceeded", details: msg },
            { status: 429 },
          );
        }

        if (isGeoBlocked(msg)) {
          logApiError("Gemini geo blocked", {
            apiVersion: GEMINI_API_VERSION,
            modelTried: id,
            modelsTried: Array.from(tried),
            request: safeRequestForLog(request),
            error: msg,
          });
          return NextResponse.json(
            {
              error: "Gemini API is not available from current location/network",
              details: msg,
            },
            { status: 503 },
          );
        }

        // Continue only if it looks like a model-id issue.
        if (!isModelNotFound(msg)) break;
      }
    }

    if (!result) {
      logApiError("Gemini request failed", {
        apiVersion: GEMINI_API_VERSION,
        modelsTried: Array.from(tried),
        request: safeRequestForLog(request),
        error: lastErrMsg || "Unknown error",
      });
      return NextResponse.json(
        { error: "Gemini request failed", details: lastErrMsg || "Unknown error" },
        { status: 502 },
      );
    }

    const text = result.response.text();
    const jsonText = extractFirstJsonObject(text);
    if (!jsonText) {
      logApiError("Model did not return JSON", {
        apiVersion: GEMINI_API_VERSION,
        modelsTried: Array.from(tried),
        request: safeRequestForLog(request),
        rawText: trunc(text, 4000),
      });
      return NextResponse.json(
        { error: "Model did not return JSON", raw: text },
        { status: 502 },
      );
    }

    const parsedJson = safeJsonParse<unknown>(jsonText);
    if (!parsedJson.ok) {
      logApiError("Failed to parse JSON", {
        apiVersion: GEMINI_API_VERSION,
        modelsTried: Array.from(tried),
        request: safeRequestForLog(request),
        parseError: parsedJson.error,
        jsonText: trunc(jsonText, 4000),
        rawText: trunc(text, 4000),
      });
      return NextResponse.json(
        { error: "Failed to parse JSON", details: parsedJson.error, raw: text },
        { status: 502 },
      );
    }

    let validated = ItinerarySchema.safeParse(parsedJson.data);
    if (!validated.success) {
      const repaired = repairItineraryShape(parsedJson.data);
      validated = ItinerarySchema.safeParse(repaired);
      if (!validated.success) {
        logApiError("JSON does not match schema", {
          apiVersion: GEMINI_API_VERSION,
          modelsTried: Array.from(tried),
          request: safeRequestForLog(request),
          details: validated.error.flatten(),
          raw: parsedJson.data,
        });
        return NextResponse.json(
          {
            error: "JSON does not match schema",
            details: validated.error.flatten(),
            raw: parsedJson.data,
          },
          { status: 502 },
        );
      }
    }

    const itinerary = validated.data;

    // Post-process: keep only known POIs.
    const usedPoiIds = new Set<string>();
    for (const d of itinerary.days) {
      d.items = d.items.filter((it) => {
        const ok = Boolean(POI_BY_ID[it.poiId]);
        if (ok) usedPoiIds.add(it.poiId);
        return ok;
      });
    }

    const pois = Array.from(usedPoiIds)
      .map((id) => POI_BY_ID[id])
      .filter(Boolean);

    return NextResponse.json({ request, itinerary, pois });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logApiError("Unexpected error", { error: msg });
    return NextResponse.json({ error: "Unexpected error", details: msg }, { status: 500 });
  }
}

