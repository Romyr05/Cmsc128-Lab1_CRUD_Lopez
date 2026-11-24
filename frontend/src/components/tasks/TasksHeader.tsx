import { Link } from "react-router-dom";
import { ChevronRight, LogOut, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type TasksHeaderProps = {
  userName: string | undefined;
  onLogout: () => void;
};

// "Romyr Lopez" -> "RL", "Romyr" -> "R", undefined -> ""
function getInitials(name: string | undefined): string {
  return (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

// Top bar: greeting (links to profile) + logout
export function TasksHeader({ userName, onLogout }: TasksHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      {/* A real link (navigation) that only *looks* like a ghost Button.
          Not <Button render={<Link/>}>: Base UI would add role="button",
          and screen readers would announce a button instead of a link. */}
      <Link
        to="/profile"
        title="View profile"
        className={cn(buttonVariants({ variant: "ghost" }), "h-auto gap-2 py-1 pr-2 pl-1")}
      >
        <Avatar aria-hidden="true">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {getInitials(userName) || <User className="size-4" />}
          </AvatarFallback>
        </Avatar>
        Hello, {userName}
        <ChevronRight className="text-muted-foreground" />
      </Link>
      <Button variant="outline" size="sm" onClick={onLogout}>
        <LogOut className="size-4" /> Logout
      </Button>
    </div>
  );
}
