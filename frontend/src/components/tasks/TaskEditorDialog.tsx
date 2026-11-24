import { useForm } from "@tanstack/react-form";
import { Flag, Trash2 } from "lucide-react";
import type { task, Tag } from "@/types/task";
import { TAG_OPTIONS } from "@/lib/tags";
import { PRIORITY_ORDER, priorityColor } from "@/lib/priority";
import { taskFormSchema, type TaskFormValues } from "@/lib/taskForm";
import { toLocalDateTime } from "@/lib/dateHelper";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DateTimePicker } from "@/components/tasks/DateTimePicker";

const emptyForm: TaskFormValues = {
  title: "",
  description: "",
  due_date: "",
  priority: "medium",
  tag: "none",
  completed: false,
};

// Turn an existing task into form values (or a blank form when adding)
function toFormValues(t: task | null): TaskFormValues {
  if (!t) return emptyForm;
  return {
    title: t.title,
    description: t.description ?? "",
    due_date: t.due_date ? toLocalDateTime(new Date(t.due_date)) : "",
    priority: t.priority,
    tag: t.tag ?? "none",
    completed: t.completed,
  };
}

type TaskEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: task | null; // null = adding a new task
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onDelete: () => void;
};

// Shared editor for both add and edit
export function TaskEditorDialog({ open, onOpenChange, task, onSubmit, onDelete }: TaskEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{task ? "Edit task" : "Add task"}</DialogTitle>
        </DialogHeader>
        {/* DialogContent unmounts when closed, so this remounts with fresh
            defaultValues every time the dialog opens (no manual form.reset) */}
        <TaskEditorForm task={task} onSubmit={onSubmit} onDelete={onDelete} />
      </DialogContent>
    </Dialog>
  );
}

type TaskEditorFormProps = Omit<TaskEditorDialogProps, "open" | "onOpenChange">;

function TaskEditorForm({ task, onSubmit, onDelete }: TaskEditorFormProps) {
  const form = useForm({
    defaultValues: toFormValues(task),
    validators: { onChange: taskFormSchema },
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <>
      {/* top bar: wraps so nothing overflows the dialog */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3 text-muted-foreground">
        <form.Field name="completed">
          {(field) => (
            <Checkbox
              checked={field.state.value}
              onCheckedChange={(c) => field.handleChange(!!c)}
            />
          )}
        </form.Field>
        <form.Field name="due_date">
          {(field) => (
            <DateTimePicker
              value={field.state.value}
              onChange={(v) => field.handleChange(v)}
            />
          )}
        </form.Field>
        <form.Field name="tag">
          {(field) => (
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as Tag | "none")}
            >
              <SelectTrigger className="min-w-0 flex-1">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No tag</SelectItem>
                {TAG_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </form.Field>
        <form.Field name="priority">
          {(field) => (
            <button
              type="button"
              onClick={() =>
                field.handleChange(
                  PRIORITY_ORDER[
                    (PRIORITY_ORDER.indexOf(field.state.value) + 1) % 3
                  ]
                )
              }
              title={`Priority: ${field.state.value}`}
            >
              <Flag className={`size-5 ${priorityColor[field.state.value]}`} />
            </button>
          )}
        </form.Field>
      </div>

      {/* title */}
      <form.Field name="title">
        {(field) => (
          <div>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Task title"
              className="w-full bg-transparent text-lg font-bold outline-none"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-destructive mt-1 text-sm">
                {field.state.meta.errors.map((e) => e?.message).join(", ")}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* description: auto-grows to a max, then scrolls */}
      <form.Field name="description">
        {(field) => (
          <Textarea
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="Description"
            className="field-sizing-content max-h-60 min-h-24 resize-none overflow-y-auto border-0 shadow-none focus-visible:ring-0"
          />
        )}
      </form.Field>

      <DialogFooter>
        {task && (
          <AlertDialog>
            <AlertDialogTrigger
              render={(props) => (
                <Button {...props} variant="destructive">
                  <Trash2 className="size-4" /> Delete
                </Button>
              )}
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes “{form.state.values.title}”. This can’t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <form.Subscribe
          selector={(s) => ({
            canSubmit: s.canSubmit,
            isSubmitting: s.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              onClick={() => form.handleSubmit()}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Saving…" : task ? "Save" : "Add"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}
