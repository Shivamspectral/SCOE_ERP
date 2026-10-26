'use client'

import { Download, FileSpreadsheet } from 'lucide-react'

type ExportRow = Record<string, string | number | null>

function csvValue(value: string | number | null) {
  const text = value == null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function downloadCsv(filename: string, rows: ExportRow[]) {
  if (!rows.length) return
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const csv = [headers.map(csvValue).join(','), ...rows.map((row) => headers.map((header) => csvValue(row[header] ?? '')).join(','))].join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function PrincipalDashboardTools({
  reportRows,
  summaryRows,
}: {
  reportRows: ExportRow[]
  summaryRows: ExportRow[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => downloadCsv('astra-campus-principal-report.csv', reportRows)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <FileSpreadsheet aria-hidden="true" className="size-4" /> Export report
      </button>
      <button
        type="button"
        onClick={() => downloadCsv('astra-campus-weekly-summary.csv', summaryRows)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Download aria-hidden="true" className="size-4" /> Download summary
      </button>
    </div>
  )
}
