// For separation of concerns

import type { task } from "@/types/task";
import { getTasks, createTasks, updateTask, deleteTask, restoreTask } from "@/api/tasks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Gets first input of tasks with the same type
type CreateInput = Parameters<typeof createTasks>[0];

export function useTasks() {
  const queryClient = useQueryClient();

  // reused so we don't repeat the invalidate object everywhere
  const invalidateTasks = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks"] });

  // READ
  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  // WRITES
  const toggleMutation = useMutation({
    mutationFn: (t: task) => updateTask(t._id, { completed: !t.completed }),
    onSuccess: invalidateTasks,
  });

  const addMutation = useMutation({
    mutationFn: (payload: CreateInput) => createTasks(payload),
    onSuccess: invalidateTasks,
  });

  // two args, bundle into one object
  const saveMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<task> }) =>
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
  function toggleCompleted(t: task) {
    toggleMutation.mutate(t);
  }
  function addTask(payload: CreateInput) {
    return addMutation.mutateAsync(payload);
  }
  function saveTask(id: string, updates: Partial<task>) {
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
