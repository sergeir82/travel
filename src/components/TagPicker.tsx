"use client";

import { ALL_TAGS, type PoiTag } from "@/lib/pois";

export function TagPicker(props: {
  value: PoiTag[];
  onChange: (next: PoiTag[]) => void;
}) {
  const { value, onChange } = props;

  function toggle(tag: PoiTag) {
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else onChange([...value, tag]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TAGS.map(({ tag, label }) => {
        const active = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={[
              "rounded-full border px-3 py-1 text-sm transition",
              active
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-black/10 bg-white hover:bg-zinc-50",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

