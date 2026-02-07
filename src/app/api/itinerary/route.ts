import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ItinerarySchema, TripRequestSchema, extractFirstJsonObject, safeJsonParse } from "@/lib/itinerary";
import { POI_BY_ID, POIS, type Poi } from "@/lib/pois";

export const runtime = "nodejs";

type ModelInfo = {
  name: string; // e.g. "models/gemini-1.5-flash"
  supportedGenerationMethods?: string[];
};

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

function normalizeTime(t: unknown): string {
  const str = typeof t === "string" ? t.trim() : String(t ?? "").trim();
  if (!str) return "10:00";
  // Accept 10:00, 10.00, 10-00, 10 00, 10:0
  const m = str.match(/^(\d{1,2})\s*[:.\- ]\s*(\d{1,2})$/);
  if (!m) return str; // let schema validation handle it
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
        .slice(0, 6) // keep demo compact
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

let cachedModelId: { value: string; cachedAtMs: number } | null = null;
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

function normalizeModelId(model: string): string {
  // SDK wants "gemini-..." (without "models/").
  return model.startsWith("models/") ? model.slice("models/".length) : model;
}

async function resolveModelId(apiKey: string, preferred?: string): Promise<string> {
  if (preferred) return normalizeModelId(preferred.trim());

  const now = Date.now();
  if (cachedModelId && now - cachedModelId.cachedAtMs < MODEL_CACHE_TTL_MS) {
    return cachedModelId.value;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    // Fall back to a conservative default if listing fails.
    // (Some keys don't have access to newer model IDs.)
    return "gemini-pro";
  }

  const data = (await res.json().catch(() => null)) as { models?: ModelInfo[] } | null;
  const models = data?.models ?? [];

  const candidates = models
    .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m) => normalizeModelId(m.name))
    .filter(Boolean);

  // Prefer "flash" family for fast demo, otherwise take the first available.
  const pick =
    candidates.find((m) => m.includes("flash")) ??
    candidates.find((m) => m.includes("gemini")) ??
    candidates[0];

  const modelId = pick ?? "gemini-1.5-flash";
  cachedModelId = { value: modelId, cachedAtMs: now };
  return modelId;
}

function buildPrompt(input: {
  request: ReturnType<typeof TripRequestSchema.parse>;
  candidates: Poi[];
}) {
  const { request, candidates } = input;

  // Keep dataset concise in the prompt (demo-friendly).
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

  return [
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
    "",
    "Сгенерируй ответ по схеме выше.",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY environment variable." },
        { status: 500 },
      );
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = TripRequestSchema.safeParse(raw);
    if (!parsed.success) {
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
    let modelId = await resolveModelId(apiKey, preferredModel);
    let model = genAI.getGenerativeModel({ model: modelId });

    const prompt = buildPrompt({ request, candidates });

    // Keep SDK usage minimal for demo stability.
    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // If model is missing/unsupported, retry with a fresh resolved model.
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("not supported")) {
        cachedModelId = null;
        modelId = await resolveModelId(apiKey);
        // If resolveModelId couldn't find anything better, try a legacy model id too.
        if (modelId === normalizeModelId(preferredModel ?? "")) {
          modelId = "gemini-pro";
        }
        model = genAI.getGenerativeModel({ model: modelId });
        result = await model.generateContent(prompt);
      } else {
        throw e;
      }
    }

    const text = result.response.text();
    const jsonText = extractFirstJsonObject(text);
    if (!jsonText) {
      return NextResponse.json(
        { error: "Model did not return JSON", raw: text },
        { status: 502 },
      );
    }

    const parsedJson = safeJsonParse<unknown>(jsonText);
    if (!parsedJson.ok) {
      return NextResponse.json(
        { error: "Failed to parse JSON", details: parsedJson.error, raw: text },
        { status: 502 },
      );
    }

    let validated = ItinerarySchema.safeParse(parsedJson.data);
    if (!validated.success) {
      // Attempt a best-effort repair (format time, clamp lengths, etc.).
      const repaired = repairItineraryShape(parsedJson.data);
      validated = ItinerarySchema.safeParse(repaired);
      if (!validated.success) {
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

    // Post-process: drop unknown poiIds (shouldn't happen, but keeps demo robust).
    const itinerary = validated.data;
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
    return NextResponse.json({ error: "Unexpected error", details: msg }, { status: 500 });
  }
}

