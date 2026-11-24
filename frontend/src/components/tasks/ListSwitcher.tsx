import { Plus } from "lucide-react";
import type { GroupList } from "@/types/list";
import { Button } from "@/components/ui/button";

type ListSwitcherProps = {
  lists: GroupList[];
  activeListId: string | null; // null = personal
  onSelect: (view: string) => void; // "personal" or a list's _id
  canCreate: boolean;
  onCreate: () => void;
};

// Personal / group list switcher
export function ListSwitcher({
  lists,
  activeListId,
  onSelect,
  canCreate,
  onCreate,
}: ListSwitcherProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={activeListId ? "outline" : "default"}
        onClick={() => onSelect("personal")}
      >
        Personal
      </Button>
      {lists.map((l) => (
        <Button
          key={l._id}
          size="sm"
          variant={activeListId === l._id ? "default" : "outline"}
          onClick={() => onSelect(l._id)}
        >
          {l.name}
        </Button>
      ))}
      {canCreate && (
        <Button size="sm" variant="ghost" onClick={onCreate}>
          <Plus className="size-4" /> Create group list
        </Button>
      )}
    </div>
  );
}
