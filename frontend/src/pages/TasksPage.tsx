import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { task, Priority, Tag } from "@/types/task";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";
import { useLists } from "@/hooks/useLists";
import { toPayload, type TaskFormValues } from "@/lib/taskForm";
import { TasksHeader } from "@/components/tasks/TasksHeader";
import { ListSwitcher } from "@/components/tasks/ListSwitcher";
import { ListTitleBar } from "@/components/tasks/ListTitleBar";
import { SortFilterBar, type SortBy } from "@/components/tasks/SortFilterBar";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskEditorDialog } from "@/components/tasks/TaskEditorDialog";
import { MembersDialog } from "@/components/tasks/MembersDialog";


function TasksPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Personal vs group list view: "personal" or a list's _id
  const { lists, createGroupList } = useLists();
  const [view, setView] = useState<string>("personal");
  const [membersOpen, setMembersOpen] = useState(false);
  // If the selected list disappears (e.g. I was removed), fall back to personal
  const activeList = lists.find((l) => l._id === view) ?? null;
  const ownsAList = lists.some((l) => l.myRole === "owner");
  const readOnly = activeList?.myRole === "view"; // UI only; the backend enforces it

  async function handleCreateList() {
    try {
      await createGroupList(`${user?.name}'s Group List`);
      toast.success("Group list created");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  //on hooks
  const { tasks, isLoading, isError, addTask, saveTask, removeTask, undoDelete, toggleCompleted } =
    useTasks(activeList?._id ?? null);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  //editor
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<task | null>(null); // null = adding

  async function handleSubmit(value: TaskFormValues) {
    const payload = toPayload(value);
    try {
      if (editing) {
        await saveTask(editing._id, payload);
        toast.success("Task updated");
      } else {
        await addTask(payload);
        toast.success("Task added");
      }
      setOpen(false); // only close on success, so a failed save keeps the user's input
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  function handleToggle(t: task) {
    toggleCompleted(t).catch((error: Error) => toast.error(error.message));
  }

  // Sorting and Filter
  const [sortBy, setSortBy] = useState<SortBy>("added");
  const [filterTag, setFilterTag] = useState<Tag | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(t: task) {
    setEditing(t);
    setOpen(true);
  }

  async function handleDelete() {
    if (!editing) return;
    const deletedId = editing._id;
    setOpen(false);

    try {
      await removeTask(deletedId); // soft-delete in the DB immediately
    } catch (error) {
      toast.error((error as Error).message);
      return;
    }

    toast("Task deleted", {
      duration: 3000,
      action: {
        label: "Undo",
        onClick: () => {
          // clears the flag, restores same task
          undoDelete(deletedId).catch((error: Error) => toast.error(error.message));
        },
      },
    });
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
      <TasksHeader userName={user?.name} onLogout={handleLogout} />

      <ListSwitcher
        lists={lists}
        activeListId={activeList?._id ?? null}
        onSelect={setView}
        canCreate={!ownsAList}
        onCreate={handleCreateList}
      />

      <ListTitleBar
        activeList={activeList}
        taskCount={tasks.length}
        onOpenMembers={() => setMembersOpen(true)}
      />

      <SortFilterBar
        sortBy={sortBy}
        onSortByChange={setSortBy}
        filterTag={filterTag}
        onFilterTagChange={setFilterTag}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
      />

      {/*Task Cards (depends on filter and sort)*/}
      <TaskList
        tasks={visible}
        isLoading={isLoading}
        isError={isError}
        onToggle={handleToggle}
        onEdit={openEdit}
        readOnly={readOnly}
      />

      {/*Add button Floating (hidden for view-only members)*/}
      {!readOnly && (
        <Button
          onClick={openAdd}
          aria-label="Add task"
          className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
        >
          <Plus className="size-6" />
        </Button>
      )}

      {activeList?.myRole === "owner" && (
        <MembersDialog list={activeList} open={membersOpen} onOpenChange={setMembersOpen} />
      )}

      <TaskEditorDialog
        open={open}
        onOpenChange={setOpen}
        task={editing}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default TasksPage;
