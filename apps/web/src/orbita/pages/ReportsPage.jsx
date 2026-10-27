import React, { useState } from "react";
import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  Eye,
  X,
  FileCheck,
  Building,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";

export function ReportsPage() {
  const { reportsList, toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveMode = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  // Reports API generation/download is not implemented on the server yet. Never
  // present the demo catalog as institutional reports in a live session.
  const displayedReports = liveMode ? [] : reportsList;

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = displayedReports.filter((r) => {
    const matchesCategory =
      categoryFilter === "All" || r.category === categoryFilter;

    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleDownload = (r) => {
    const columns = ["title", "category", "department", "author", "publishedDate", "summary"];
    const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [columns.join(","), ...[r].map((row) => columns.map((key) => escapeCell(row[key])).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-metadata-${String(r.id || "preview").replace(/[^a-zA-Z0-9_-]/g, "")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({
      title: "Report metadata exported",
      description: "Downloaded a CSV summary. This does not include or represent an official PDF document.",
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Institutional & Audit Reports" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Institutional Audit & Accreditations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Official SPPU audits, NBA Self-Assessment Reports, T&P summaries, and NAAC documentation.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs">
          <span className="text-muted-foreground">Published Reports: </span>
          <span className="font-bold text-foreground">{displayedReports.length}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
          {["All", "Academic", "Accreditation", "Placement", "Attendance"].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === c
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px] max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search report title, author…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      {liveMode && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Institutional report generation and file delivery are not connected yet. Demo report entries are hidden in this signed-in session to avoid confusing sample metadata with official college records.
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-3.5">
        {filteredReports.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {liveMode ? "No institutional reports are available from the connected report service yet." : "No sample reports match your filters."}
          </div>
        )}
        {filteredReports.map((r) => (
          <div
            key={r.id}
            className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] font-bold text-foreground">
                    {r.category}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {r.department}
                  </span>
                </div>

                <h3 className="mt-1 font-display text-base font-bold text-foreground">
                  {r.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                  {r.summary}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Author: {r.author}</span>
                  <span>·</span>
                  <span>Published: {r.publishedDate}</span>
                  <span>·</span>
                  <span>Size: {r.fileSize}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:shrink-0">
              <button
                onClick={() => setSelectedReport(r)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="size-3.5" />
                <span>Executive Summary</span>
              </button>
              <button
                onClick={() => handleDownload(r)}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <Download className="size-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                  {selectedReport.category}
                </span>
                <h3 className="mt-1.5 font-display text-lg font-bold text-foreground">
                  {selectedReport.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Signatory: {selectedReport.author} · {selectedReport.publishedDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-lg bg-muted/40 p-3 leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Executive Summary:</p>
                {selectedReport.summary}
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Department:</span>
                  <span className="font-semibold text-foreground">{selectedReport.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Audit Document Format:</span>
                  <span className="font-semibold text-foreground">No official file attached in this preview</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Internal Downloads:</span>
                  <span className="font-semibold text-foreground">{selectedReport.downloads ?? "Not tracked"}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDownload(selectedReport);
                    setSelectedReport(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="size-3.5" />
                  <span>Download Full Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
