import { useState } from "react";
import { Flag, Plus, Trash2 } from "lucide-react";
import type { task, Priority, Tag } from "@/types/task";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TAG_OPTIONS } from "@/lib/tags";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { DateTimePicker } from "@/components/DateTimePicker";
import { TaskCard } from "@/components/TaskCard";
import { PRIORITY_ORDER, priorityColor } from "@/lib/priority";
import { useTasks } from "@/hooks/useTasks";
import type { FormState } from "@/types/addEditForm";


const emptyForm: FormState = {
  title: "",
  description: "",
  due_date: "",
  priority: "medium",
  tag: "none",
  completed: false,
};

function TasksPage() {
  //on hooks
  const { tasks, addTask, saveTask, removeTask, undoDelete, toggleCompleted } =
    useTasks();

  //editor 
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null); // null = adding
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false); // blocks double-submit

  // Sorting and Filter
  const [sortBy, setSortBy] = useState<"added" | "due" | "priority" | "tag">("added");
  const [filterTag, setFilterTag] = useState<Tag | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(t: task) {
    setEditId(t._id);
    setForm({
      title: t.title,
      description: t.description ?? "",
      due_date: t.due_date ? t.due_date.slice(0, 16) : "",
      priority: t.priority,
      tag: t.tag ?? "none",
      completed: t.completed,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (saving) return; // a request in motion 
    if (form.title.trim().length === 0) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(), // always send (empty string clears it)
      due_date: form.due_date || undefined,
      priority: form.priority,
      tag: form.tag === "none" ? undefined : form.tag,
      completed: form.completed,
    };

    setSaving(true);
    try {
      if (editId) {
        await saveTask(editId, payload);
        toast.success("Task updated");
      } else {
        await addTask(payload);
        toast.success("Task added");
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editId) return;
    const deletedId = editId;
    setOpen(false);

    await removeTask(deletedId); // soft-delete in the DB immediately

    toast("Task deleted", {
      duration: 3000,
      action: {
        label: "Undo",
        onClick: () => {
          undoDelete(deletedId).catch(console.error); // clears the flag, restores same task
        },
      },
    });
  }

  function cyclePriority() {
    const next =
      PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(form.priority) + 1) % 3];
    setForm({ ...form, priority: next });
  }

  // rank maps so "sort by priority/tag" has a defined order (maps)
  const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  const tagRank: Record<Tag, number> = {
    curricular: 0,
    "extra-curricular": 1, 
    home: 2,
  };

  // apply filters, then sort all on the already-loaded list
  // THESE ARE ALL TASKS SO . WORKS (TYPE)
  const visible = [...tasks]
    .filter((t) => (filterTag === "all" ? true : t.tag === filterTag))
    .filter((t) => (filterPriority === "all" ? true : t.priority === filterPriority))
    .sort((a, b) => {
      switch (sortBy) {
        case "due":
          // soonest first; tasks with no due date sink to the bottom
          if (!a.due_date) return 1;
          if (!b.due_date) return -1; // if b has no date still a stays up
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();   
        case "priority":     
          return priorityRank[a.priority] - priorityRank[b.priority]; 
        case "tag":
          return (a.tag ? tagRank[a.tag] : 99) - (b.tag ? tagRank[b.tag] : 99);  //99 for the no tag 
        case "added":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">To Do List</h1>
        <span className="text-muted-foreground text-sm">{tasks.length}</span>
      </div>

      {/* sort & filter toolbar: sort on the left, filters on the right */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Sort By:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
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
        <Select value={filterTag} onValueChange={(v) => setFilterTag(v as Tag | "all")}>
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
          onValueChange={(v) => setFilterPriority(v as Priority | "all")}
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

     {/*Task Cards (depends on filter and sort)*/}  
      <div className="flex flex-col gap-2">
        {visible.map((t) => (
          <TaskCard
            key={t._id}
            task={t}
            onToggle={toggleCompleted}
            onEdit={openEdit}
          />
        ))}
      </div>

      {/*Add button Floating*/}
      <Button
        onClick={openAdd}
        aria-label="Add task"
        className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
      >
        <Plus className="size-6" />
      </Button>

      {/* Shared Editor for both add and edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {editId ? "Edit task" : "Add task"}
            </DialogTitle>
          </DialogHeader>

          {/* top bar: wraps so nothing overflows the dialog */}
          <div className="flex flex-wrap items-center gap-2 border-b pb-3 text-muted-foreground">
            <Checkbox
              checked={form.completed}
              onCheckedChange={(c) => setForm({ ...form, completed: !!c })}
            />
            <DateTimePicker
              value={form.due_date}
              onChange={(v) => setForm({ ...form, due_date: v })}
            />
            <Select
              value={form.tag}
              onValueChange={(v) => setForm({ ...form, tag: v as Tag | "none" })}
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
            <button
              type="button"
              onClick={cyclePriority}
              title={`Priority: ${form.priority}`}
            >
              <Flag className={`size-5 ${priorityColor[form.priority]}`} />
            </button>
          </div>

          {/* title */}
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title"
            className="w-full bg-transparent text-lg font-bold outline-none"
          />

          {/* description: auto-grows to a max, then scrolls */}
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="field-sizing-content max-h-60 min-h-24 resize-none overflow-y-auto border-0 shadow-none focus-visible:ring-0"
          />

          <DialogFooter>
            {editId && (
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
                      This permanently removes “{form.title}”. This can’t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editId ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TasksPage;
