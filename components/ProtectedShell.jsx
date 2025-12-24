"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"


import AddTransactionDialog from "@/components/add-transaction-dialog"
import SidebarContent from "./sidebar"

export default function ProtectedShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b bg-background px-4 h-14 md:hidden">
        <div className="flex items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-6">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>

              {/* 👇 pass close handler */}
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <span className="font-semibold">Menu</span>
        </div>

        <AddTransactionDialog />
      </header>

      <div className="flex pt-14 md:pt-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 border-r bg-background p-6">
          <SidebarContent />
        </aside>

        <main className="flex-1 p-4 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
