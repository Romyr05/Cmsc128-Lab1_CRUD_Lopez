import { Users } from "lucide-react";
import type { GroupList } from "@/types/list";
import { Button } from "@/components/ui/button";

type ListTitleBarProps = {
  activeList: GroupList | null; // null = personal
  taskCount: number;
  onOpenMembers: () => void;
};

// Current list's name, who shared it, members button (owner only), task count
export function ListTitleBar({ activeList, taskCount, onOpenMembers }: ListTitleBarProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold">{activeList ? activeList.name : "To Do List"}</h1>
        {activeList && activeList.myRole !== "owner" && (
          <p className="text-muted-foreground text-xs">
            Shared by {activeList.owner.name} · you can {activeList.myRole}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {activeList?.myRole === "owner" && (
          <Button variant="outline" size="sm" onClick={onOpenMembers}>
            <Users className="size-4" /> Members
          </Button>
        )}
        <span className="text-muted-foreground text-sm">{taskCount}</span>
      </div>
    </div>
  );
}
