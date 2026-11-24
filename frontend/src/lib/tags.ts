import type { Tag } from "shared";

export const TAG_OPTIONS: { value: Tag; label: string }[] = [
  { value: "curricular", label: "Curricular" },
  { value: "extra-curricular", label: "Extra-Curricular" },
  { value: "home", label: "Home" },
];

// derived from TAG_OPTIONS for faster lookup since i made the values into lowercase for Convention PUrposes
export const tagLabel = Object.fromEntries(
  TAG_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Tag, string>;

// Sort order for "sort by tag" = position in TAG_OPTIONS, so it can't drift out of sync
export const tagRank = Object.fromEntries(
  TAG_OPTIONS.map((o, i) => [o.value, i]),
) as Record<Tag, number>;
