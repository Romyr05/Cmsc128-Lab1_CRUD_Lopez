import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type TasksHeaderProps = {
  userName: string | undefined;
  onLogout: () => void;
};

// Top bar: greeting (links to profile) + logout
export function TasksHeader({ userName, onLogout }: TasksHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <Link
        to="/profile"
        className="text-sm font-medium underline-offset-4 hover:underline"
        title="View profile"
      >
        Hello, {userName}
      </Link>
      <Button variant="outline" size="sm" onClick={onLogout}>
        <LogOut className="size-4" /> Logout
      </Button>
    </div>
  );
}
