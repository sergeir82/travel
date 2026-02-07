"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Poi } from "@/lib/pois";

type YMapInstance = {
  geoObjects: {
    add: (obj: unknown) => void;
    removeAll?: () => void;
  };
  setCenter: (
    center: [number, number],
    zoom?: number,
    options?: Record<string, unknown>,
  ) => void;
  destroy: () => void;
};

type YMapsApi = {
  ready: (cb: () => void) => void;
  Map: new (
    container: HTMLElement,
    state: {
      center: [number, number];
      zoom: number;
      controls?: string[];
    },
    options?: { suppressMapOpenBlock?: boolean },
  ) => YMapInstance;
  Placemark: new (
    coords: [number, number],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => unknown;
};

declare global {
  interface Window {
    ymaps?: YMapsApi;
  }
}

function loadYandexMaps(apiKey: string): Promise<YMapsApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.ymaps) return Promise.resolve(window.ymaps);

  const scriptId = "yandex-maps-api";
  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => {
        if (!window.ymaps) reject(new Error("Yandex Maps did not initialize"));
        else resolve(window.ymaps);
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps")));
    });
  }

  const src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.id = scriptId;
    s.src = src;
    s.async = true;
    s.onload = () => {
      if (!window.ymaps) reject(new Error("Yandex Maps did not initialize"));
      else resolve(window.ymaps);
    };
    s.onerror = () => reject(new Error("Failed to load Yandex Maps"));
    document.head.appendChild(s);
  });
}

export function ItineraryMapClient(props: { pois: Poi[] }) {
  const { pois } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YMapInstance | null>(null);
  const ymapsRef = useRef<YMapsApi | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const center = useMemo(() => {
    if (!pois.length) return { lat: 59.9386, lon: 30.3141 }; // SPb center-ish
    const lat = pois.reduce((s, p) => s + p.lat, 0) / pois.length;
    const lon = pois.reduce((s, p) => s + p.lon, 0) / pois.length;
    return { lat, lon };
  }, [pois]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
    if (!apiKey) {
      setLoadError("Missing NEXT_PUBLIC_YANDEX_MAPS_API_KEY");
      return;
    }
    if (!containerRef.current) return;

    let cancelled = false;

    loadYandexMaps(apiKey)
      .then((ymaps) => {
        if (cancelled) return;
        if (!ymaps) throw new Error("Yandex Maps did not initialize");
        ymapsRef.current = ymaps;

        ymaps.ready(() => {
          if (cancelled) return;
          if (!containerRef.current) return;

          // Create map once.
          if (!mapRef.current) {
            mapRef.current = new ymaps.Map(
              containerRef.current,
              {
                center: [center.lat, center.lon],
                zoom: 11,
                controls: ["zoomControl"],
              },
              { suppressMapOpenBlock: true },
            );
          }
        });
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        setLoadError(msg);
      });

    return () => {
      cancelled = true;
      // Destroy map instance to avoid leaks.
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch {
          // ignore
        } finally {
          mapRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps = ymapsRef.current;
    if (!map || !ymaps) return;

    // Clear old markers.
    if (map.geoObjects?.removeAll) map.geoObjects.removeAll();

    // Add markers for POIs.
    for (const p of pois) {
      const placemark = new ymaps.Placemark(
        [p.lat, p.lon],
        {
          balloonContentHeader: p.name,
          balloonContentBody: p.short,
        },
        { preset: "islands#blueIcon" },
      );
      map.geoObjects.add(placemark);
    }

    // Recenter.
    map.setCenter([center.lat, center.lon], pois.length ? 11 : 10, { duration: 200 });
  }, [pois, center.lat, center.lon]);

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-black/10 bg-zinc-50">
      {loadError ? (
        <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-red-700">
          {loadError}
        </div>
      ) : (
        <div ref={containerRef} className="h-full w-full" />
      )}
    </div>
  );
}

