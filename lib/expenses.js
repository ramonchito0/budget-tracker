import { createClient } from "@/lib/supabase/client"

export async function getExpenses() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      category:categories (
        id,
        name,
        type
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}


export async function updateExpense(id, {
  title,
  amount,
  spent_at,
  category_id,
  type,
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("expenses")
    .update({
      title: title.trim(),
      amount: Number(amount),
      spent_at,
      category_id,
      type,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw error
}


export async function addExpense({
  title,
  amount,
  spent_at,
  category_id,
  type,
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("expenses").insert({
    title: title.trim(),
    amount: Number(amount),
    spent_at,
    category_id,
    type,
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
