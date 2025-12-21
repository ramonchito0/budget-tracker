import { createClient } from "@/lib/supabase/client"

export async function getExpenses() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("expenses")
    .select(`
      id,
      title,
      amount,
      spent_at,
      category:categories (
        id,
        name
      )
    `)
    .order("spent_at", { ascending: false })

  if (error) throw error
  return data
}

export async function updateExpense(id, values) {
  const supabase = createClient()

  const { error } = await supabase
    .from("expenses")
    .update(values)
    .eq("id", id)

  if (error) throw error
}


export async function addExpense(expense) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("expenses")
    .insert({
      ...expense,
      user_id: user.id,
    })

  if (error) throw error
}

export async function deleteExpense(id) {
  const supabase = createClient()

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)

  if (error) throw error
}
