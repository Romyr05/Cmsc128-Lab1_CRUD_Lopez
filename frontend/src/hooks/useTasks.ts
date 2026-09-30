// For separation of concerns

import { useEffect, useState } from "react";
import type { task } from "@/types/task";
import { getTasks, createTasks, updateTask, deleteTask, restoreTask } from "@/api/tasks";

// Gets first input of tasks with the same type
type CreateInput = Parameters<typeof createTasks>[0];


export function useTasks() {
  const [tasks, setTasks] = useState<task[]>([]);

  // load once on mount
  useEffect(() => {
    getTasks().then(setTasks).catch(console.error);
  }, []);

  async function addTask(payload: CreateInput) {
    const created = await createTasks(payload);
    setTasks((prev) => [created, ...prev]);
  }

  async function saveTask(id: string, updates: Partial<task>) {
    const updated = await updateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  }

  // Soft delete on later 
  async function removeTask(id: string) {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }

  // undo it 
  async function undoDelete(id: string) {
    const restored = await restoreTask(id);
    setTasks((prev) =>
      [restored, ...prev].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()   // Depends on created at time to get it back
      )
    );
  }

  
  async function toggleCompleted(t: task) {
    const updated = await updateTask(t._id, { completed: !t.completed });
    setTasks((prev) => prev.map((x) => (x._id === t._id ? updated : x)));
  }

  return {
    tasks,
    addTask,
    saveTask,
    removeTask,
    undoDelete,
    toggleCompleted,
  };
}
