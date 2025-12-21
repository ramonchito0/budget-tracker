import { LayoutDashboard, LogOut } from "lucide-react";
import LogoutButton from "./logout-button";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background p-6 hidden md:block">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Budget Tracker</h2>
        <p className="text-sm text-muted-foreground">Personal finance</p>
      </div>

      <nav className="space-y-2">
        <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-muted">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </div>

        <LogoutButton />
      </nav>
    </aside>
  );
}
