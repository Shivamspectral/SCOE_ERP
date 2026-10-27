import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";
import { auditApi } from "../lib/api";

export function SystemLogsPage() {
  const { logs, toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveMode = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const [liveLogs, setLiveLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!liveMode) return;
    let cancelled = false;
    setLiveLogs([]);
    setLoading(true);
    auditApi.list({ limit: 100 }).then((rows) => {
      if (cancelled) return;
      const mapped = (Array.isArray(rows) ? rows : []).map((row) => {
        const metadata = row.metadata || {};
        const statusChange = metadata.status_before !== undefined || metadata.status_after !== undefined
          ? ` (${metadata.status_before ?? "—"} → ${metadata.status_after ?? "—"})` : "";
        const changedFields = Array.isArray(metadata.changed_fields) && metadata.changed_fields.length
          ? ` · ${metadata.changed_fields.join(", ")}` : "";
        const entityType = String(row.entity_type || "record").replace(/_/g, " ");
        return {
          id: row.id,
          timestamp: row.created_at ? new Date(row.created_at).toLocaleString("en-IN") : "—",
          user: row.actor_id ? `User · ${row.actor_id.slice(0, 8)}` : "System / automation",
          action: `${String(row.action || "event").toUpperCase()} ${entityType}${statusChange}${changedFields}`,
          entity: `${entityType} · ${row.entity_id ? String(row.entity_id).slice(0, 8) : "—"}`,
          severity: row.action === "delete" ? "Warning" : metadata.role_before !== undefined ? "Security" : row.action === "insert" ? "Success" : "Info",
        };
      });
      setLiveLogs(mapped);
    }).catch((error) => {
      if (!cancelled) toast({ title: "Could not load audit events", description: error?.message || "Check your access and try again.", variant: "error" });
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [liveMode, session?.access_token]);

  const displayedLogs = liveMode ? liveLogs : logs;

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  const filteredLogs = displayedLogs.filter((l) => {
    const matchesSearch =
      l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.entity || l.ip || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === "All" || l.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const handleExportCSV = () => {
    const headers = "Timestamp,Actor,Action,Entity,Severity\n";
    const rows = filteredLogs
      .map((l) => `"${l.timestamp}","${l.user}","${l.action}","${l.entity || l.ip || "—"}","${l.severity}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ASTRA_Security_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Audit Trail Exported",
      description: "Downloaded CSV security and transaction logs.",
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "System Security & Audit Logs" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Security & Transaction Audit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Database-recorded audit events for staff access, academic records, attendance, marks, circulars and workflow changes.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          <Download className="size-4 text-muted-foreground" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[220px] max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search action, actor or entity…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs outline-none focus:border-primary"
          >
            <option value="All">All Events</option>
            <option value="Info">Info</option>
            <option value="Success">Success</option>
            <option value="Security">Security</option>
            <option value="Warning">Warning</option>
            <option value="System">System</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor / Identity</th>
                <th className="px-4 py-3">Action Description</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading audit events…</td></tr>}\n              {!loading && filteredLogs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No audit events match these filters.</td></tr>}\n              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {l.timestamp}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {l.user}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">
                    {l.action}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {l.ip}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        l.severity === "Success"
                          ? "bg-success/15 text-success"
                          : l.severity === "Security"
                          ? "bg-destructive/15 text-destructive"
                          : l.severity === "Warning"
                          ? "bg-warning/15 text-warning-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {l.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
