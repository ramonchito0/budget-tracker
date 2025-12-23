import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProtectedShell from "@/components/ProtectedShell"

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return <ProtectedShell>{children}</ProtectedShell>
}
