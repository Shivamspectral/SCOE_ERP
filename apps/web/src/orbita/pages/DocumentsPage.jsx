import React, { useEffect, useState } from "react";
import { FileBadge, Plus, Search, Calendar, Building2, Archive, Save, X } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";
import { documentsApi } from "../lib/api";

const previewDocuments = [
  { id: "preview-doc-1", title: "Academic Integrity & Examination Policy", category: "policy", status: "active", version: 1, updated_at: "2026-09-18", department: null },
  { id: "preview-doc-2", title: "Computer Laboratory Operating Procedure", category: "academic", status: "active", version: 2, updated_at: "2026-09-12", department: { name: "Computer Engineering" } },
  { id: "preview-doc-3", title: "Department Meeting Minutes — September", category: "general", status: "draft", version: 1, updated_at: "2026-09-10", department: { name: "Computer Engineering" } },
  { id: "preview-doc-4", title: "Institutional Quality Assurance Framework", category: "quality", status: "active", version: 1, updated_at: "2026-08-30", department: null },
];

const categoryLabels = {
  general: "General", academic: "Academic", policy: "Policy", finance: "Finance",
  student: "Student records", staff: "Staff records", quality: "Quality assurance",
};

export function DocumentsPage() {
  const { toast, backendConfigured, isAuthenticated, session, departments = [] } = usePortal();
  const liveMode = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const [documents, setDocuments] = useState(liveMode ? [] : previewDocuments);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", category: "general", departmentId: "" });

  const loadDocuments = async () => {
    if (!liveMode) return;
    setLoading(true);
    try {
      const rows = await documentsApi.list();
      setDocuments(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setDocuments([]);
      toast({ title: "Could not load document register", description: error?.message || "Check your access and try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!liveMode) return;
    let cancelled = false;
    setLoading(true);
    documentsApi.list().then((rows) => {
      if (!cancelled) setDocuments(Array.isArray(rows) ? rows : []);
    }).catch((error) => {
      if (!cancelled) {
        setDocuments([]);
        toast({ title: "Could not load document register", description: error?.message || "Check your access and try again.", variant: "error" });
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [liveMode]);

  const filtered = documents.filter((doc) => {
    const title = doc.title || "";
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const createDocument = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (liveMode) {
        await documentsApi.create({
          title: form.title.trim(), category: form.category,
          departmentId: form.departmentId || undefined,
        });
        await loadDocuments();
        toast({ title: "Document registered", description: "The document metadata has been saved. File upload is not enabled yet.", variant: "success" });
      } else {
        setDocuments((prev) => [{
          id: `preview-doc-${Date.now()}`, title: form.title.trim(), category: form.category,
          status: "draft", version: 1, updated_at: new Date().toISOString(),
          department: departments.find((department) => department.id === form.departmentId) || null,
        }, ...prev]);
        toast({ title: "Preview only", description: "This sample document exists only in this browser session and was not saved to college records.", variant: "info" });
      }
      setForm({ title: "", category: "general", departmentId: "" });
      setCreateOpen(false);
    } catch (error) {
      toast({ title: "Could not register document", description: error?.message || "Check your role and try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const archiveDocument = async (doc) => {
    if (!liveMode) {
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, status: item.status === "archived" ? "draft" : "archived" } : item));
      toast({ title: "Preview only", description: "The document status changed in sample data only.", variant: "info" });
      return;
    }
    try {
      await documentsApi.update(doc.id, { status: doc.status === "archived" ? "draft" : "archived" });
      await loadDocuments();
      toast({ title: "Document status updated", description: "The register was updated.", variant: "success" });
    } catch (error) {
      toast({ title: "Could not update document", description: error?.message || "Check your permissions.", variant: "error" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Institutional Document Register"
        subtitle="Manage policies, procedures, department records and quality-assurance evidence. This register stores metadata; file storage is a separate future integration."
        actions={
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
            <Plus className="size-3.5" /> Register document
          </button>
        }
      />

      {createOpen && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Register a document</h2>
              <button onClick={() => setCreateOpen(false)} aria-label="Close form" className="rounded-md p-1 hover:bg-muted"><X className="size-4" /></button>
            </div>
            <form onSubmit={createDocument} className="grid gap-4 md:grid-cols-3">
              <label className="text-xs font-medium text-foreground md:col-span-2">Document title
                <input required maxLength={180} value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="e.g. Laboratory safety SOP" />
              </label>
              <label className="text-xs font-medium text-foreground">Category
                <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                  {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-foreground md:col-span-2">Department (optional)
                <select value={form.departmentId} onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="">Institution-wide / unassigned</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
              </label>
              <div className="flex items-end">
                <button type="submit" disabled={saving} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="size-4" />{saving ? "Saving…" : "Save register entry"}</button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
          <Search className="size-4 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search document titles…" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none sm:w-64" />
        </div>
        <div className="flex gap-1.5">
          {["all","active","draft","archived"].map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-2 text-xs font-medium capitalize ${statusFilter === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{status === "all" ? "All records" : status}</button>)}
        </div>
      </div>

      <div className="space-y-3">
        {loading && <p className="py-6 text-center text-sm text-muted-foreground">Loading document register…</p>}
        {!loading && filtered.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No documents match these filters.</CardContent></Card>}
        {filtered.map((doc) => (
          <Card key={doc.id} className="transition-colors hover:border-primary/40">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileBadge className="size-5" /></div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{doc.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{categoryLabels[doc.category] || doc.category || "General"}</Badge>
                    <span className="inline-flex items-center gap-1"><Building2 className="size-3.5" />{doc.departments?.name || doc.department?.name || "Institution-wide"}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" />Updated {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString("en-IN") : "recently"}</span>
                    <span>Version {doc.version || 1}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={doc.status === "active" ? "success" : doc.status === "archived" ? "outline" : "warning"}>{doc.status}</Badge>
                <button onClick={() => archiveDocument(doc)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"><Archive className="size-3.5" />{doc.status === "archived" ? "Restore" : "Archive"}</button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
