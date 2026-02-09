"use client";

import { ALL_TAGS, type PoiTag } from "@/lib/pois";
import { Badge } from "@/components/ui/badge";

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
          <Badge
            key={tag}
            variant={active ? "default" : "outline"}
            className="cursor-pointer select-none transition-colors"
            onClick={() => toggle(tag)}
          >
            {label}
          </Badge>
        );
      })}
    </div>
  );
}
