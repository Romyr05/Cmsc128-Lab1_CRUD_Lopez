import type { Priority, Tag } from "shared";
import { TAG_OPTIONS } from "@/lib/tags";
import type { SortBy } from "@/lib/sortTasks";
import { Label } from "@/components/ui/label";
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

// sort & filter toolbar: 3 equal columns (label on top), one row on phones too
export function SortFilterBar({
  sortBy,
  onSortByChange,
  filterTag,
  onFilterTagChange,
  filterPriority,
  onFilterPriorityChange,
}: SortFilterBarProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <div className="flex grow basis-24 flex-col gap-1">
        <Label htmlFor="sort-by" className="text-xs text-muted-foreground">
          Sort by
        </Label>
        <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
          <SelectTrigger id="sort-by" className="w-full">
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

      <div className="flex grow basis-24 flex-col gap-1">
        <Label htmlFor="filter-tag" className="text-xs text-muted-foreground">
          Tag
        </Label>
        <Select value={filterTag} onValueChange={(v) => onFilterTagChange(v as Tag | "all")}>
          <SelectTrigger id="filter-tag" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {TAG_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex grow basis-24 flex-col gap-1">
        <Label htmlFor="filter-priority" className="text-xs text-muted-foreground">
          Priority
        </Label>
        <Select
          value={filterPriority}
          onValueChange={(v) => onFilterPriorityChange(v as Priority | "all")}
        >
          <SelectTrigger id="filter-priority" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
