// For separation of concerns

import type { Task } from "shared";
import { getTasks, createTasks, updateTask, deleteTask, restoreTask } from "@/api/tasks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Gets first input of tasks with the same type
type CreateInput = Parameters<typeof createTasks>[0];

// listId = null -> personal tasks; a list id -> that group list's tasks
export function useTasks(listId: string | null = null) {
  const queryClient = useQueryClient();

  // reused so we don't repeat the invalidate object everywhere
  // ["tasks"] is a prefix, so this refreshes personal and every list's cache
  const invalidateTasks = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks"] });

  // READ: separate cache per view so switching tabs doesn't mix tasks
  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ["tasks", listId ?? "personal"],
    queryFn: () => getTasks(listId ?? undefined),
  });

  // WRITES
  const toggleMutation = useMutation({
    mutationFn: (t: Task) => updateTask(t._id, { completed: !t.completed }),
    onSuccess: invalidateTasks,
  });

  const addMutation = useMutation({
    // new tasks go into whichever view is open
    mutationFn: (payload: CreateInput) =>
      createTasks({ ...payload, list: listId ?? undefined }),
    onSuccess: invalidateTasks,
  });

  // two args, bundle into one object
  const saveMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      updateTask(id, updates),
    onSuccess: invalidateTasks,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: invalidateTasks,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreTask(id),
    onSuccess: invalidateTasks,
  });


    // Function calls 
  function toggleCompleted(t: Task) {
    return toggleMutation.mutateAsync(t); // returns a promise so the page can catch errors
  }
  function addTask(payload: CreateInput) {
    return addMutation.mutateAsync(payload);
  }
  function saveTask(id: string, updates: Partial<Task>) {
    return saveMutation.mutateAsync({ id, updates });
  }
  function removeTask(id: string) {
    return removeMutation.mutateAsync(id);
  }
  function undoDelete(id: string) {
    return restoreMutation.mutateAsync(id);
  }

  return {
    tasks,
    isLoading,
    isError,
    addTask,
    saveTask,
    removeTask,
    undoDelete,
    toggleCompleted,
  };
}
