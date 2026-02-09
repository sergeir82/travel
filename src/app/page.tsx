"use client";

import { useMemo, useState } from "react";
import type { Itinerary, TripRequest } from "@/lib/itinerary";
import { TagPicker } from "@/components/TagPicker";
import { ItineraryMap } from "@/components/ItineraryMap";
import type { Poi, PoiTag } from "@/lib/pois";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ApiOk = { request: TripRequest; itinerary: Itinerary; pois: Poi[] };
type ApiErr = { error: string; details?: unknown; raw?: unknown };

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
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            AI-Гид по Санкт-Петербургу и Ленобласти
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Персональный маршрут за 60 секунд: предпочтения &rarr; план дня &rarr; карта.

          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Запрос</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Дней</label>
                    <Select
                      value={String(days)}
                      onValueChange={(v) => setDays(Number(v) as 1 | 2 | 3)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Регион</label>
                    <Select
                      value={baseRegion}
                      onValueChange={(v) =>
                        setBaseRegion(v as "spb" | "lenobl" | "both")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spb">СПб</SelectItem>
                        <SelectItem value="lenobl">Ленобласть</SelectItem>
                        <SelectItem value="both">СПб + ЛО</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Темп</label>
                    <Select
                      value={pace}
                      onValueChange={(v) =>
                        setPace(v as "relaxed" | "normal" | "active")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relaxed">Спокойно</SelectItem>
                        <SelectItem value="normal">Нормально</SelectItem>
                        <SelectItem value="active">Активно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Транспорт</label>
                    <Select
                      value={transport}
                      onValueChange={(v) =>
                        setTransport(v as "walk" | "public" | "car")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walk">Пешком</SelectItem>
                        <SelectItem value="public">Общ. транспорт</SelectItem>
                        <SelectItem value="car">Авто</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Погода</label>
                    <Select
                      value={weather}
                      onValueChange={(v) =>
                        setWeather(v as "any" | "sun" | "rain" | "cold")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Не важно</SelectItem>
                        <SelectItem value="sun">Солнечно</SelectItem>
                        <SelectItem value="rain">Дождь</SelectItem>
                        <SelectItem value="cold">Холодно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Интересы</div>
                  <TagPicker value={interests} onChange={setInterests} />
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    Комментарий (опционально)
                  </div>
                  <Textarea
                    className="min-h-24 resize-none"
                    placeholder="Например: без очередей, люблю кофе, хочу больше прогулок…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("first_time")}
                  >
                    Пресет: впервые в СПб
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("rainy")}
                  >
                    Пресет: дождливый день
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("lenobl_daytrip")}
                  >
                    Пресет: выезд в ЛО
                  </Button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={generate} disabled={loading}>
                    {loading ? "Генерирую…" : "Сгенерировать маршрут"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Нужен только <code className="font-mono">GEMINI_API_KEY</code>
                  </span>
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Результат</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                {!result ? (
                  <p className="text-sm text-muted-foreground">
                    Нажмите &laquo;Сгенерировать маршрут&raquo; &mdash; здесь появится план дня и карта точек.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <div className="text-lg font-semibold">
                        {result.itinerary.title}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {result.itinerary.summary}
                      </p>
                    </div>

                    <ItineraryMap pois={result.pois} />

                    <div className="grid gap-4 md:grid-cols-1">
                      {result.itinerary.days
                        .slice()
                        .sort((a, b) => a.dayNumber - b.dayNumber)
                        .map((d) => (
                          <Card key={d.dayNumber} className="py-4">
                            <CardHeader className="pb-0">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">
                                  День {d.dayNumber}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                  {d.label}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ol className="space-y-3">
                                {d.items.map((it, idx) => (
                                  <li key={`${it.poiId}-${idx}`} className="text-sm">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="font-mono text-xs text-muted-foreground">
                                        {it.time}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {result.pois.find((p) => p.id === it.poiId)?.name ??
                                            it.poiId}
                                        </div>
                                        <div className="text-muted-foreground">{it.why}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          {it.move} &bull; ~{it.durationMin} мин
                                        </div>
                                        {it.tips?.length ? (
                                          <div className="mt-2 flex flex-wrap gap-1.5">
                                            {it.tips.slice(0, 4).map((t, i) => (
                                              <Badge key={i} variant="secondary">
                                                {t}
                                              </Badge>
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </CardContent>
                          </Card>
                        ))}
                    </div>

                    {result.itinerary.alternatives?.length ? (
                      <div>
                        <div className="mb-2 text-xs font-medium text-muted-foreground">
                          Альтернативы (быстрые правки)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.itinerary.alternatives.map((a, i) => (
                            <Badge key={i} variant="outline">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
        <footer className="mt-6">
          <Badge variant="secondary" className="text-xs">
            Demo &bull; Next.js &bull; Gemini &bull; Vercel-ready
          </Badge>
          </footer>
      </div>
    </div>
  );
}
