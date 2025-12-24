import Link from "next/link"
import { LayoutDashboard, Tags, CreditCard } from "lucide-react"
import LogoutButton from "./logout-button"

export default function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Budget Tracker</h2>
        <p className="text-sm text-muted-foreground">Personal finance</p>
      </div>

      <nav className="space-y-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          href="/categories"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
        >
          <Tags size={18} />
          Categories
        </Link>

        <Link
          href="/transactions"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
        >
          <CreditCard size={18} />
          Transactions
        </Link>

        <Link
          href="/data"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
        >
          Import / Export
        </Link>
      </nav>

      <div className="mt-auto pt-6">
        <LogoutButton />
      </div>
    </>
  )
}
