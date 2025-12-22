import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ExportTransactionsButton from "@/components/export-transactions-button"
import ImportTransactionsButton from "@/components/import-transactions-button"

export default function DataPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Import & Export
        </h1>
        <p className="text-sm text-muted-foreground">
          Backup your data or move it between devices
        </p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download your transactions and categories for backup or analysis.
          </p>

          <div className="flex flex-wrap gap-3">
            <ExportTransactionsButton/>
            <Button variant="outline">
              Export Categories (CSV)
            </Button>
            <Button variant="outline">
              Export All (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload previously exported files to restore your data.
          </p>

          <div className="space-y-2">
            <input
              type="file"
              accept=".csv,.json"
              className="block w-full text-sm"
            />

           <ImportTransactionsButton />

            <p className="text-xs text-muted-foreground">
              Supported formats: CSV, JSON
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
