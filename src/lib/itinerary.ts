import { z } from "zod";

export const TripRequestSchema = z.object({
  days: z.number().int().min(1).max(3).default(2),
  baseRegion: z.enum(["spb", "lenobl", "both"]).default("spb"),
  pace: z.enum(["relaxed", "normal", "active"]).default("normal"),
  transport: z.enum(["walk", "public", "car"]).default("public"),
  weather: z.enum(["any", "sun", "rain", "cold"]).default("any"),
  interests: z.array(z.string()).default([]),
  notes: z.string().max(500).optional().default(""),
});

export type TripRequest = z.infer<typeof TripRequestSchema>;

export const ItinerarySchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(1000),
  days: z
    .array(
      z.object({
        dayNumber: z.number().int().min(1).max(3),
        label: z.string().min(1).max(140),
        items: z.array(
          z.object({
            time: z.string().regex(/^\d{2}:\d{2}$/),
            poiId: z.string().min(1),
            durationMin: z.number().int().min(15).max(240),
            why: z.string().min(1).max(320),
            move: z.string().min(1).max(320),
            tips: z.array(z.string().min(1).max(120)).max(4).default([]),
          }),
        ),
      }),
    )
    .min(1)
    .max(3),
  // Optional short “alternatives” the UI can show as chips.
  alternatives: z.array(z.string().min(1).max(240)).max(8).default([]),
});

export type Itinerary = z.infer<typeof ItinerarySchema>;

export function safeJsonParse<T>(raw: string): { ok: true; data: T } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export function extractFirstJsonObject(text: string): string | null {
  // Tries to find the first top-level JSON object/array.
  const trimmed = text.trim();
  if (!trimmed) return null;

  // If it's already JSON.
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;

  // If wrapped in code fences.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    const inner = fenceMatch[1].trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }

  // Fallback: scan for first '{' or '[' and attempt to slice to last '}' or ']'.
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);
  if (start === -1) return null;

  const candidate = trimmed.slice(start);
  const lastBrace = candidate.lastIndexOf("}");
  const lastBracket = candidate.lastIndexOf("]");
  const end = Math.max(lastBrace, lastBracket);
  if (end === -1) return null;
  return candidate.slice(0, end + 1).trim();
}

