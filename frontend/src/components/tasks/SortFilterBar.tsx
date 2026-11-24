import type { Priority, Tag } from "shared";
import { TAG_OPTIONS } from "@/lib/tags";
import type { SortBy } from "@/lib/sortTasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortFilterBarProps = {
  sortBy: SortBy;
  onSortByChange: (v: SortBy) => void;
  filterTag: Tag | "all";
  onFilterTagChange: (v: Tag | "all") => void;
  filterPriority: Priority | "all";
  onFilterPriorityChange: (v: Priority | "all") => void;
};

// sort & filter toolbar: sort on the left, filters on the right
export function SortFilterBar({
  sortBy,
  onSortByChange,
  filterTag,
  onFilterTagChange,
  filterPriority,
  onFilterPriorityChange,
}: SortFilterBarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Sort By:</span>
        <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="added">Date Added</SelectItem>
            <SelectItem value="due">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="tag">Tag</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter By:</span>
        <Select value={filterTag} onValueChange={(v) => onFilterTagChange(v as Tag | "all")}>
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {TAG_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterPriority}
          onValueChange={(v) => onFilterPriorityChange(v as Priority | "all")}
        >
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
