import type { Task } from "shared";
import { priorityRank } from "@/lib/priority";
import { tagRank } from "@/lib/tags";

export type SortBy = "added" | "due" | "priority" | "tag";

// Returns a new sorted array; the input isn't mutated (sort() works in place, so copy first)
export function sortTasks(tasks: Task[], sortBy: SortBy): Task[] {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "due":
        // soonest first; tasks with no due date sink to the bottom
        if (!a.due_date) return 1;
        if (!b.due_date) return -1; // if b has no date still a stays up
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case "priority":
        return priorityRank[a.priority] - priorityRank[b.priority];
      case "tag":
        return (a.tag ? tagRank[a.tag] : 99) - (b.tag ? tagRank[b.tag] : 99); //99 for the no tag
      case "added":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}
