import type { task } from "@/types/task";
import { TaskCard } from "@/components/tasks/TaskCard";

type TaskListProps = {
  tasks: task[]; // already filtered and sorted by the page
  isLoading: boolean;
  isError: boolean;
  onToggle: (t: task) => void;
  onEdit: (t: task) => void;
  readOnly: boolean;
};

// Task cards, or a loading / error message
export function TaskList({ tasks, isLoading, isError, onToggle, onEdit, readOnly }: TaskListProps) {
  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : isError ? (
        <p className="text-destructive text-sm">Failed to load tasks.</p>
      ) : (
        tasks.map((t) => (
          <TaskCard key={t._id} task={t} onToggle={onToggle} onEdit={onEdit} readOnly={readOnly} />
        ))
      )}
    </div>
  );
}
