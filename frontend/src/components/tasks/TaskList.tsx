import type { Task } from "shared";
import { TaskCard } from "@/components/tasks/TaskCard";

type TaskListProps = {
  tasks: Task[]; // already filtered and sorted by the page
  isLoading: boolean;
  isError: boolean;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  readOnly: boolean;
};

// Task cards, or a loading / error message
export function TaskList({ tasks, isLoading, isError, onToggle, onEdit, onDelete, readOnly }: TaskListProps) {
  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : isError ? (
        <p className="text-destructive text-sm">Failed to load tasks.</p>
      ) : (
        tasks.map((t) => (
          <TaskCard
            key={t._id}
            task={t}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            readOnly={readOnly}
          />
        ))
      )}
    </div>
  );
}
