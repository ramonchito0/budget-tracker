import Link from "next/link"
import { LayoutDashboard, Tags, CreditCard } from "lucide-react"

import LogoutButton from "./logout-button";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background p-6 hidden md:block">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Budget Tracker</h2>
        <p className="text-sm text-muted-foreground">Personal finance</p>
      </div>

    <nav className="space-y-1">
        <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
        >
            <LayoutDashboard size={18} />
            Dashboard
        </Link>

        <Link
            href="/categories"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
        >
            <Tags size={18} />
            Categories
        </Link>

        {/* Placeholder for next step */}
        <Link
            href="/transactions"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
        >
            <CreditCard size={18} />
            Transactions
        </Link>
        
        <Link
          href="/data"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
        >
          Import / Export
        </Link>

    </nav>

    {/* Spacer */}
    <div className="flex-1" />

    {/* Logout */}
    <LogoutButton />

    </aside>
  );
}
