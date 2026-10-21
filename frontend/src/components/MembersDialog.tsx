import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { GroupList, Role } from "@/types/list";
import { useLists } from "@/hooks/useLists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MembersDialogProps = {
  list: GroupList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Owner-only: add members by email, change their role, remove them.
// Only shown to the owner, but the backend rejects non-owners anyway (403).
export function MembersDialog({ list, open, onOpenChange }: MembersDialogProps) {
  const { addListMember, changeMemberRole, removeListMember } = useLists();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("view");

  // Show the backend's message (e.g. "No user with that email") instead of crashing
  async function run(action: Promise<void>, success: string) {
    try {
      await action;
      toast.success(success);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    await run(addListMember(list._id, email.trim(), role), "Member added");
    setEmail("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Members of {list.name}</DialogTitle>
        </DialogHeader>

        {/* add by email + role */}
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email to add"
          />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">view</SelectItem>
              <SelectItem value="edit">edit</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" aria-label="Add member">
            <UserPlus className="size-4" />
          </Button>
        </form>

        {/* current members */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {list.owner.name} <span className="text-muted-foreground">(you)</span>
            </span>
            <span className="text-muted-foreground">owner</span>
          </div>

          {list.members.length === 0 && (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}

          {list.members.map((m) => (
            <div key={m.user._id} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="truncate">{m.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-1">
                <Select
                  value={m.role}
                  onValueChange={(v) =>
                    run(changeMemberRole(list._id, m.user._id, v as Role), "Role updated")
                  }
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">view</SelectItem>
                    <SelectItem value="edit">edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${m.user.name}`}
                  onClick={() => run(removeListMember(list._id, m.user._id), "Member removed")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
