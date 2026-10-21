import type { Role } from "@/types/list";
import { getLists, createList, addMember, updateMemberRole, removeMember } from "@/api/lists";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useLists() {
  const queryClient = useQueryClient();

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: ["lists"] });

  // READ
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  // WRITES
  const createMutation = useMutation({
    mutationFn: (name: string) => createList(name),
    onSuccess: invalidateLists,
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ listId, email, role }: { listId: string; email: string; role: Role }) =>
      addMember(listId, email, role),
    onSuccess: invalidateLists,
  });

  const roleMutation = useMutation({
    mutationFn: ({ listId, userId, role }: { listId: string; userId: string; role: Role }) =>
      updateMemberRole(listId, userId, role),
    onSuccess: invalidateLists,
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ listId, userId }: { listId: string; userId: string }) =>
      removeMember(listId, userId),
    onSuccess: invalidateLists,
  });

  return {
    lists,
    isLoading,
    createGroupList: (name: string) => createMutation.mutateAsync(name),
    addListMember: (listId: string, email: string, role: Role) =>
      addMemberMutation.mutateAsync({ listId, email, role }),
    changeMemberRole: (listId: string, userId: string, role: Role) =>
      roleMutation.mutateAsync({ listId, userId, role }),
    removeListMember: (listId: string, userId: string) =>
      removeMemberMutation.mutateAsync({ listId, userId }),
  };
}
