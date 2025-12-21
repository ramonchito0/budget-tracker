import { createClient } from "@/lib/supabase/client"

export async function getCategories() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  if (error) throw error
  return data
}

export async function addCategory(name) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("categories")
    .insert({
      name,
      user_id: user.id,
    })

  if (error) throw error
}

export async function updateCategory(id, name) {
  const supabase = createClient()

  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)

  if (error) throw error
}

export async function deleteCategory(id) {
  const supabase = createClient()

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)

  if (error) throw error
}
