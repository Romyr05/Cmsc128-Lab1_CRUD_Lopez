import type { Priority } from "@/types/task";

//Priority Order Least to Highest
export const PRIORITY_ORDER: Priority[] = ["low", "medium", "high"];

// Extends an are all strings (Record)
export const priorityColor: Record<Priority, string> = {
  low: "text-muted-foreground",
  medium: "text-amber-500",
  high: "text-red-500",
};

// checkbox Color 
export const priorityCheckbox: Record<Priority, string> = {
  low: "",
  medium: "border-amber-500 data-[checked]:bg-amber-500 data-[checked]:border-amber-500",
  high: "border-red-500 data-[checked]:bg-red-500 data-[checked]:border-red-500",
};
