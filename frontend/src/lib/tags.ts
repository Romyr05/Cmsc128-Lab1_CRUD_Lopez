import type { Tag } from "@/types/task";

export const TAG_OPTIONS: { value: Tag; label: string }[] = [
  { value: "curricular", label: "Curricular" },
  { value: "extra-curricular", label: "Extra-Curricular" },
  { value: "home", label: "Home" },
];

// derived from TAG_OPTIONS for faster lookup since i made the values into lowercase for Convention PUrposes
export const tagLabel = Object.fromEntries(
  TAG_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Tag, string>;
