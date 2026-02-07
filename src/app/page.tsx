"use client";

import { useMemo, useState } from "react";
import type { Itinerary, TripRequest } from "@/lib/itinerary";
import { TagPicker } from "@/components/TagPicker";
import { ItineraryMap } from "@/components/ItineraryMap";
import type { Poi, PoiTag } from "@/lib/pois";

type ApiOk = { request: TripRequest; itinerary: Itinerary; pois: Poi[] };
type ApiErr = { error: string; details?: unknown; raw?: unknown };

function pickEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  fallback: T,
): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-zinc-900">{props.title}</div>
      {props.children}
    </section>
  );
}

export default function Home() {
  const [days, setDays] = useState<1 | 2 | 3>(2);
  const [baseRegion, setBaseRegion] = useState<"spb" | "lenobl" | "both">("spb");
  const [pace, setPace] = useState<"relaxed" | "normal" | "active">("normal");
  const [transport, setTransport] = useState<"walk" | "public" | "car">("public");
  const [weather, setWeather] = useState<"any" | "sun" | "rain" | "cold">("any");
  const [interests, setInterests] = useState<PoiTag[]>(["classic", "walk", "coffee"]);
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiOk | null>(null);

  const request: TripRequest = useMemo(
    () => ({
      days,
      baseRegion,
      pace,
      transport,
      weather,
      interests,
      notes,
    }),
    [days, baseRegion, pace, transport, weather, interests, notes],
  );

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = (await res.json().catch(() => null)) as ApiOk | ApiErr | null;
      if (!res.ok || !data) {
        const msg =
          (data && "error" in data && data.error) ||
          `Request failed with status ${res.status}`;
        setError(msg);
        setResult(null);
        return;
      }
      setResult(data as ApiOk);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(p: "first_time" | "rainy" | "lenobl_daytrip") {
    if (p === "first_time") {
      setBaseRegion("spb");
      setDays(2);
      setPace("normal");
      setTransport("public");
      setWeather("any");
      setInterests(["classic", "history", "walk", "views", "coffee"]);
      setNotes("Хочу максимум впечатлений без лишней беготни.");
    }
    if (p === "rainy") {
      setBaseRegion("spb");
      setDays(1);
      setPace("relaxed");
      setTransport("public");
      setWeather("rain");
      setInterests(["art", "history", "coffee", "rain_ok"]);
      setNotes("Дождь. Хочу уютно, без длинных перебежек по улице.");
    }
    if (p === "lenobl_daytrip") {
      setBaseRegion("lenobl");
      setDays(1);
      setPace("normal");
      setTransport("public");
      setWeather("any");
      setInterests(["daytrip", "nature", "views", "history"]);
      setNotes("Хочу выезд из СПб на электричке/автобусе, без авто.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-zinc-600">
            Demo • Next.js • Gemini • Vercel-ready
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            AI‑Гид по Санкт‑Петербургу и Ленобласти
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            Персональный маршрут за 60 секунд: предпочтения → план дня → карта. Подходит
            для инвест‑демо (минимум инфраструктуры, только ключ Gemini).
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <Card title="Запрос">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-zinc-600">Дней</div>
                  <select
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value) as 1 | 2 | 3)}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </label>

                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-zinc-600">Регион</div>
                  <select
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                    value={baseRegion}
                    onChange={(e) =>
                      setBaseRegion(
                        pickEnum(e.target.value, ["spb", "lenobl", "both"] as const, "spb"),
                      )
                    }
                  >
                    <option value="spb">СПб</option>
                    <option value="lenobl">Ленобласть</option>
                    <option value="both">СПб + ЛО</option>
                  </select>
                </label>

                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-zinc-600">Темп</div>
                  <select
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                    value={pace}
                    onChange={(e) =>
                      setPace(
                        pickEnum(e.target.value, ["relaxed", "normal", "active"] as const, "normal"),
                      )
                    }
                  >
                    <option value="relaxed">Спокойно</option>
                    <option value="normal">Нормально</option>
                    <option value="active">Активно</option>
                  </select>
                </label>

                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-zinc-600">Транспорт</div>
                  <select
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                    value={transport}
                    onChange={(e) =>
                      setTransport(
                        pickEnum(e.target.value, ["walk", "public", "car"] as const, "public"),
                      )
                    }
                  >
                    <option value="walk">Пешком</option>
                    <option value="public">Общ. транспорт</option>
                    <option value="car">Авто</option>
                  </select>
                </label>

                <label className="col-span-2 text-sm">
                  <div className="mb-1 text-xs font-medium text-zinc-600">Погода</div>
                  <select
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                    value={weather}
                    onChange={(e) =>
                      setWeather(
                        pickEnum(e.target.value, ["any", "sun", "rain", "cold"] as const, "any"),
                      )
                    }
                  >
                    <option value="any">Не важно</option>
                    <option value="sun">Солнечно</option>
                    <option value="rain">Дождь</option>
                    <option value="cold">Холодно</option>
                  </select>
                </label>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-xs font-medium text-zinc-600">Интересы</div>
                <TagPicker value={interests} onChange={setInterests} />
              </div>

              <div className="mt-4">
                <div className="mb-2 text-xs font-medium text-zinc-600">
                  Комментарий (опционально)
                </div>
                <textarea
                  className="h-24 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="Например: без очередей, люблю кофе, хочу больше прогулок…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("first_time")}
                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm hover:bg-zinc-50"
                >
                  Пресет: впервые в СПб
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("rainy")}
                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm hover:bg-zinc-50"
                >
                  Пресет: дождливый день
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("lenobl_daytrip")}
                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm hover:bg-zinc-50"
                >
                  Пресет: выезд в ЛО
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={generate}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "Генерирую…" : "Сгенерировать маршрут"}
                </button>
                <div className="text-xs text-zinc-500">
                  Нужен только <code className="font-mono">GEMINI_API_KEY</code>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Результат">
              {!result ? (
                <div className="text-sm text-zinc-600">
                  Нажмите «Сгенерировать маршрут» — здесь появится план дня и карта точек.
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="text-lg font-semibold text-zinc-950">
                      {result.itinerary.title}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {result.itinerary.summary}
                    </div>
                  </div>

                  <ItineraryMap pois={result.pois} />

                  <div className="grid gap-4 md:grid-cols-2">
                    {result.itinerary.days
                      .slice()
                      .sort((a, b) => a.dayNumber - b.dayNumber)
                      .map((d) => (
                        <div
                          key={d.dayNumber}
                          className="rounded-2xl border border-black/10 bg-white p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-semibold text-zinc-900">
                              День {d.dayNumber}
                            </div>
                            <div className="text-xs text-zinc-500">{d.label}</div>
                          </div>
                          <ol className="space-y-3">
                            {d.items.map((it, idx) => (
                              <li key={`${it.poiId}-${idx}`} className="text-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="font-mono text-xs text-zinc-500">
                                    {it.time}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-zinc-950">
                                      {result.pois.find((p) => p.id === it.poiId)?.name ??
                                        it.poiId}
                                    </div>
                                    <div className="text-zinc-600">{it.why}</div>
                                    <div className="mt-1 text-xs text-zinc-500">
                                      {it.move} • ~{it.durationMin} мин
                                    </div>
                                    {it.tips?.length ? (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {it.tips.slice(0, 4).map((t, i) => (
                                          <span
                                            key={i}
                                            className="rounded-full border border-black/10 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                  </div>

                  {result.itinerary.alternatives?.length ? (
                    <div>
                      <div className="mb-2 text-xs font-medium text-zinc-600">
                        Альтернативы (быстрые правки)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.itinerary.alternatives.map((a, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm text-zinc-700"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Card>

            <Card title="Как это работает (для инвест‑демо)">
              <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>
                  UI отправляет параметры в <code className="font-mono">/api/itinerary</code>
                </li>
                <li>
                  Сервер даёт Gemini список разрешённых POI (СПб/ЛО) и просит вернуть
                  строгий JSON
                </li>
                <li>UI отображает таймлайн и карту; точки не “галлюцинируются”</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
