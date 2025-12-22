import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CategoryManager from "@/components/category-manager"

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Categories
        </h1>
        <p className="text-sm text-muted-foreground">
          Organize your income and expense categories.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager />
        </CardContent>
      </Card>
    </div>
  )
}