"use client";

import dynamic from "next/dynamic";
import type { Poi } from "@/lib/pois";

const ItineraryMapClient = dynamic(
  () => import("./ItineraryMapClient").then((m) => m.ItineraryMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] w-full items-center justify-center rounded-2xl border border-black/10 bg-zinc-50 text-sm text-zinc-600">
        Загружаю карту…
      </div>
    ),
  },
);

export function ItineraryMap(props: { pois: Poi[] }) {
  return <ItineraryMapClient {...props} />;
}

