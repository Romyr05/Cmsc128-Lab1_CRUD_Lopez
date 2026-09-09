import { CalendarClock } from "lucide-react";
import type { task } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { priorityCheckbox } from "@/lib/priority";
import { tagLabel } from "@/lib/tags";

type TaskCardProps = {
  task: task;
  onToggle: (t: task) => void;
  onEdit: (t: task) => void;
};

export function TaskCard({ task, onToggle, onEdit }: TaskCardProps) {
  return (
    <Card
      onClick={() => onEdit(task)}
      className="cursor-pointer transition-colors hover:bg-accent/40"
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Stop unwanted Propagation, not click the onEdit (Go up the Parent) */}
        <span onClick={(e) => e.stopPropagation()}>    
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggle(task)}
            className={priorityCheckbox[task.priority]}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={
              task.completed
                ? "truncate line-through text-muted-foreground"
                : "truncate font-medium"
            }
          >
            {task.title}
          </p>

          {task.description && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {task.description}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {task.tag && (
              <span className="rounded bg-muted px-1.5 py-0.5">
                {tagLabel[task.tag]}
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <CalendarClock className="size-3" />
                {new Date(task.due_date).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
