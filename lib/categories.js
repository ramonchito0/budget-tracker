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

export async function addCategory(name, type) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("categories")
    .insert({
      name: name.trim(),
      type,
      user_id: user.id,
    })

  if (error) {
    if (error.code === "23505") {
      throw new Error("Category already exists for this type.")
    }
    throw error
  }
}



export async function updateCategory(id, name, type) {
  const supabase = createClient()

  const { error } = await supabase
    .from("categories")
    .update({
      name: name.trim(),
      type,
    })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      throw new Error("Category already exists for this type.")
    }
    throw error
  }
}



export async function deleteCategory(id) {
  const supabase = createClient()

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)

  if (error) {
    if (error.code === "23503") {
      throw new Error("This category is used by existing expenses.")
    }
    throw error
  }
}

