import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck, Plus, RefreshCw, Search, UserRoundCheck } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { usePortal } from "../context/PortalContext";
import { isBackendConfigured, operationsApi } from "../lib/api";

const DEMO_CAMPAIGNS = [
  { id: "demo-campaign-1", campaign_code: "FY-2026", name: "First Year Engineering Admissions 2026-27", academic_year: "2026-27", starts_on: "2026-05-01", ends_on: "2026-11-30", status: "open" },
];
const DEMO_APPLICATIONS = [
  { id: "demo-app-1", application_number: "APP-DEMO-001", applicant_name: "Demo Applicant One", email: "applicant@example.invalid", phone: "0000000000", campaign_id: "demo-campaign-1", programme_id: "", qualifying_percentage: 87.4, status: "under_review", decision_note: "Sample record only" },
  { id: "demo-app-2", application_number: "APP-DEMO-002", applicant_name: "Demo Applicant Two", email: "applicant2@example.invalid", phone: "0000000000", campaign_id: "demo-campaign-1", programme_id: "", qualifying_percentage: 78.2, status: "submitted", decision_note: "Sample record only" },
];
const emptyCampaign = { campaign_code: "", name: "", academic_year: "2026-27", starts_on: "", ends_on: "", notes: "" };
const emptyApplication = { application_number: "", applicant_name: "", email: "", phone: "", campaign_id: "", programme_id: "", qualifying_exam: "", qualifying_board: "", passing_year: "", qualifying_percentage: "", entrance_exam: "", entrance_score: "" };
const listOf = (v) => Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : Array.isArray(v?.data) ? v.data : [];
const label = (value) => String(value || "—").replaceAll("_", " ");

const NEXT_STATES = {
  submitted: ["documents_pending", "under_review", "withdrawn"],
  documents_pending: ["under_review", "withdrawn"],
  under_review: ["shortlisted", "offered", "waitlisted", "rejected", "withdrawn"],
  shortlisted: ["offered", "waitlisted", "rejected", "withdrawn"],
  offered: ["accepted", "rejected", "withdrawn"],
  waitlisted: ["offered", "rejected", "withdrawn"],
};

export function AdmissionsPage({ route = "/admission-applications" }) {
  const { toast, isAuthenticated, session, isDemoPreview, userRole } = usePortal();
  const liveMode = Boolean(isBackendConfigured && isAuthenticated && session?.access_token && !isDemoPreview);
  const canCreate = ["Principal", "Vice-Principal", "Super Admin", "Administrator", "Coordinator", "Admissions Officer", "Staff"].includes(userRole);
  const canReview = ["Principal", "Vice-Principal", "Super Admin", "Administrator", "Coordinator", "Admissions Officer"].includes(userRole);
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState(emptyCampaign);
  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [decisionNotes, setDecisionNotes] = useState({});

  const load = useCallback(async () => {
    if (!liveMode) {
      setCampaigns(DEMO_CAMPAIGNS);
      setApplications(DEMO_APPLICATIONS);
      setProgrammes([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [campaignResult, applicationResult, programmeResult] = await Promise.all([
        operationsApi.list("admissionCampaigns", { limit: 100 }),
        operationsApi.list("admissionApplications", { limit: 200 }),
        operationsApi.list("programmes", { limit: 200 }),
      ]);
      setCampaigns(listOf(campaignResult));
      setApplications(listOf(applicationResult));
      setProgrammes(listOf(programmeResult));
      setApplicationForm((current) => ({ ...current, campaign_id: current.campaign_id || listOf(campaignResult).find((x) => x.status === "open")?.id || "" }));
    } catch (e) {
      setError(e?.message || "Admissions records could not be loaded.");
      setCampaigns([]);
      setApplications([]);
      setProgrammes([]);
    } finally { setLoading(false); }
  }, [liveMode]);

  useEffect(() => { void load(); }, [load]);

  const filteredApplications = useMemo(() => applications.filter((app) => {
    const term = search.toLowerCase();
    const matchesSearch = [app.applicant_name, app.application_number, app.email, app.phone].filter(Boolean).join(" ").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesCampaign = campaignFilter === "all" || app.campaign_id === campaignFilter;
    return matchesSearch && matchesStatus && matchesCampaign;
  }), [applications, search, statusFilter, campaignFilter]);

  const createCampaign = async (event) => {
    event.preventDefault();
    if (!liveMode) return toast({ title: "Demo preview only", description: "Sample admissions campaigns are read-only.", variant: "info" });
    if (!campaignForm.campaign_code.trim() || !campaignForm.name.trim() || !campaignForm.starts_on || !campaignForm.ends_on) return toast({ title: "Missing details", description: "Enter a campaign code, name and date range.", variant: "warning" });
    if (campaignForm.ends_on < campaignForm.starts_on) return toast({ title: "Invalid date range", description: "The campaign end date must be on or after its start date.", variant: "warning" });
    setSaving(true);
    try {
      const created = await operationsApi.create("admissionCampaigns", { ...campaignForm, status: "draft" });
      setCampaigns((prev) => [created, ...prev]);
      setCampaignForm(emptyCampaign);
      setShowCampaignForm(false);
      toast({ title: "Campaign created", description: "The campaign is saved as a draft until opened.", variant: "success" });
    } catch (e) { toast({ title: "Could not create campaign", description: e?.message || "Check your access and try again.", variant: "error" }); }
    finally { setSaving(false); }
  };

  const createApplication = async (event) => {
    event.preventDefault();
    if (!liveMode) return toast({ title: "Demo preview only", description: "Sample applications cannot be submitted to the institution.", variant: "info" });
    if (!applicationForm.application_number.trim() || !applicationForm.applicant_name.trim() || !applicationForm.campaign_id || !applicationForm.programme_id) return toast({ title: "Missing details", description: "Application number, applicant name, campaign and programme are required.", variant: "warning" });
    setSaving(true);
    try {
      const payload = { ...applicationForm, qualifying_percentage: applicationForm.qualifying_percentage === "" ? undefined : Number(applicationForm.qualifying_percentage), passing_year: applicationForm.passing_year === "" ? undefined : Number(applicationForm.passing_year), entrance_score: applicationForm.entrance_score === "" ? undefined : Number(applicationForm.entrance_score), status: "submitted" };
      const created = await operationsApi.create("admissionApplications", payload);
      setApplications((prev) => [created, ...prev]);
      setApplicationForm({ ...emptyApplication, campaign_id: applicationForm.campaign_id });
      setShowApplicationForm(false);
      toast({ title: "Application registered", description: "The applicant is now in the submitted queue.", variant: "success" });
    } catch (e) { toast({ title: "Could not register application", description: e?.message || "Check campaign/programme selection and permissions.", variant: "error" }); }
    finally { setSaving(false); }
  };

  const changeStatus = async (app, nextStatus) => {
    if (!liveMode) return toast({ title: "Demo preview only", description: "Workflow actions are disabled in preview mode.", variant: "info" });
    setSaving(true);
    try {
      const decision_note = decisionNotes[app.id] ?? app.decision_note ?? "";
      const updated = await operationsApi.update("admissionApplications", app.id, { status: nextStatus, decision_note });
      setApplications((prev) => prev.map((row) => row.id === app.id ? { ...row, ...updated } : row));
      toast({ title: "Application updated", description: `${app.application_number} moved to ${label(nextStatus)}.`, variant: "success" });
    } catch (e) { toast({ title: "Transition blocked", description: e?.message || "This status change is not permitted.", variant: "error" }); }
    finally { setSaving(false); }
  };

  const changeCampaignStatus = async (campaign, nextStatus) => {
    if (!liveMode) return toast({ title: "Demo preview only", description: "Campaign workflow actions are disabled in preview mode.", variant: "info" });
    try {
      const updated = await operationsApi.update("admissionCampaigns", campaign.id, { status: nextStatus });
      setCampaigns((prev) => prev.map((row) => row.id === campaign.id ? { ...row, ...updated } : row));
      toast({ title: "Campaign updated", description: `${campaign.name}: ${label(nextStatus)}.`, variant: "success" });
    } catch (e) { toast({ title: "Campaign transition blocked", description: e?.message || "This status change is not permitted.", variant: "error" }); }
  };

  const counts = {
    total: applications.length,
    review: applications.filter((a) => ["submitted", "documents_pending", "under_review", "shortlisted", "waitlisted"].includes(a.status)).length,
    offered: applications.filter((a) => ["offered", "accepted"].includes(a.status)).length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return <div className="space-y-6 animate-fade-in-up">
    <Breadcrumb title="Admissions Office" subtitle="Campaign planning, applicant intake, document review and admission decisions" />
    {!liveMode && <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"><strong>Demo preview — sample applicants only.</strong> These records are fictional and are not applications submitted to the college.</div>}
    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"><AlertCircle className="mt-0.5 size-4" /><span>{error}</span><button className="ml-auto underline" onClick={() => void load()}>Retry</button></div>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Applications",counts.total],["In pipeline",counts.review],["Offers / accepted",counts.offered],["Rejected",counts.rejected]].map(([name,value])=><div key={name} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{name}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>

    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Admissions campaigns</h2><p className="mt-1 text-xs text-muted-foreground">Manage application cycles and open/close dates.</p></div><div className="flex gap-2"><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold"><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</button>{canCreate && <button onClick={() => setShowCampaignForm((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />New campaign</button>}</div></div>
      {showCampaignForm && <form onSubmit={createCampaign} className="grid gap-3 border-b border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Campaign code" value={campaignForm.campaign_code} required onChange={(v) => setCampaignForm({...campaignForm,campaign_code:v})} placeholder="FY-2027" /><Field label="Campaign name" value={campaignForm.name} required onChange={(v) => setCampaignForm({...campaignForm,name:v})} /><Field label="Academic year" value={campaignForm.academic_year} required onChange={(v) => setCampaignForm({...campaignForm,academic_year:v})} /><Field label="Starts on" type="date" value={campaignForm.starts_on} required onChange={(v) => setCampaignForm({...campaignForm,starts_on:v})} /><Field label="Ends on" type="date" value={campaignForm.ends_on} required onChange={(v) => setCampaignForm({...campaignForm,ends_on:v})} /><label className="text-xs font-medium">Notes<textarea value={campaignForm.notes} onChange={(e) => setCampaignForm({...campaignForm,notes:e.target.value})} rows={2} className="mt-1 block w-full rounded-lg border border-input bg-background p-3 text-sm" /></label><div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save draft</button><button type="button" onClick={() => setShowCampaignForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div></form>}
      <div className="divide-y divide-border">{campaigns.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No campaigns found.</p> : campaigns.map((campaign) => <div key={campaign.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{campaign.campaign_code}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{label(campaign.status)}</span></div><h3 className="mt-1 font-semibold">{campaign.name}</h3><p className="mt-1 text-xs text-muted-foreground">{campaign.academic_year} · {campaign.starts_on || "—"} to {campaign.ends_on || "—"} · {applications.filter((a) => a.campaign_id === campaign.id).length} applications</p></div><div className="flex flex-wrap gap-2">{canReview && campaign.status === "draft" && <button onClick={() => void changeCampaignStatus(campaign,"open")} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Open campaign</button>}{canReview && campaign.status === "open" && <button onClick={() => void changeCampaignStatus(campaign,"closed")} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">Close campaign</button>}{canReview && campaign.status === "closed" && <button onClick={() => void changeCampaignStatus(campaign,"open")} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">Reopen</button>}</div></div>)}</div>
    </section>

    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Applicant review queue</h2><p className="mt-1 text-xs text-muted-foreground">Progress applicants through documented screening decisions.</p></div>{canCreate && <button onClick={() => setShowApplicationForm((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />Register application</button>}</div>
      {showApplicationForm && <form onSubmit={createApplication} className="grid gap-3 border-b border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Application number" value={applicationForm.application_number} required onChange={(v) => setApplicationForm({...applicationForm,application_number:v})} placeholder="APP-2027-0001" /><Field label="Applicant full name" value={applicationForm.applicant_name} required onChange={(v) => setApplicationForm({...applicationForm,applicant_name:v})} /><Field label="Email" type="email" value={applicationForm.email} onChange={(v) => setApplicationForm({...applicationForm,email:v})} /><Field label="Phone" type="tel" value={applicationForm.phone} onChange={(v) => setApplicationForm({...applicationForm,phone:v})} /><label className="text-xs font-medium">Campaign<select required value={applicationForm.campaign_id} onChange={(e) => setApplicationForm({...applicationForm,campaign_id:e.target.value})} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select campaign…</option>{campaigns.filter((c) => c.status === "open").map((c) => <option key={c.id} value={c.id}>{c.campaign_code} — {c.name}</option>)}</select></label><label className="text-xs font-medium">Programme<select required value={applicationForm.programme_id} onChange={(e) => setApplicationForm({...applicationForm,programme_id:e.target.value})} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select programme…</option>{programmes.map((p) => <option key={p.id} value={p.id}>{p.programme_code} — {p.name}</option>)}</select></label><Field label="Qualifying exam" value={applicationForm.qualifying_exam} onChange={(v) => setApplicationForm({...applicationForm,qualifying_exam:v})} /><Field label="Qualifying board" value={applicationForm.qualifying_board} onChange={(v) => setApplicationForm({...applicationForm,qualifying_board:v})} /><Field label="Passing year" type="number" value={applicationForm.passing_year} onChange={(v) => setApplicationForm({...applicationForm,passing_year:v})} /><Field label="Qualifying percentage" type="number" value={applicationForm.qualifying_percentage} onChange={(v) => setApplicationForm({...applicationForm,qualifying_percentage:v})} /><Field label="Entrance exam" value={applicationForm.entrance_exam} onChange={(v) => setApplicationForm({...applicationForm,entrance_exam:v})} /><Field label="Entrance score" type="number" value={applicationForm.entrance_score} onChange={(v) => setApplicationForm({...applicationForm,entrance_score:v})} /><div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving || !campaigns.some((c) => c.status === "open") || !programmes.length} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Register as submitted</button><button type="button" onClick={() => setShowApplicationForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div></form>}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicant, application number, email…" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">All statuses</option>{["submitted","documents_pending","under_review","shortlisted","offered","waitlisted","accepted","rejected","withdrawn"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select><select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">All campaigns</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.campaign_code}</option>)}</select></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Applicant</th><th className="px-4 py-3">Campaign / programme</th><th className="px-4 py-3">Academic profile</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Review action</th></tr></thead><tbody className="divide-y divide-border">{loading ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading applications…</td></tr> : filteredApplications.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No applications match these filters.</td></tr> : filteredApplications.map((app) => { const campaign = campaigns.find((c) => c.id === app.campaign_id); const programme = programmes.find((p) => p.id === app.programme_id); return <tr key={app.id} className="align-top hover:bg-muted/20"><td className="px-4 py-3"><div className="flex items-start gap-2"><UserRoundCheck className="mt-0.5 size-4 text-muted-foreground" /><div><p className="font-semibold">{app.applicant_name}</p><p className="text-xs text-muted-foreground">{app.application_number}</p><p className="mt-1 text-xs text-muted-foreground">{app.email || "No email"}{app.phone ? ` · ${app.phone}` : ""}</p></div></div></td><td className="px-4 py-3"><p>{campaign?.name || "Campaign not resolved"}</p><p className="text-xs text-muted-foreground">{programme?.name || (app.programme_id ? "Programme not resolved" : "Programme not recorded")}</p></td><td className="px-4 py-3 text-xs"><p>Qualifying: {app.qualifying_percentage ?? "—"}%</p><p className="text-muted-foreground">{app.qualifying_exam || "Exam not recorded"}{app.passing_year ? ` · ${app.passing_year}` : ""}</p><p className="text-muted-foreground">Entrance score: {app.entrance_score ?? "—"}</p></td><td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold">{label(app.status)}</span>{app.decision_note && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{app.decision_note}</p>}</td><td className="min-w-52 px-4 py-3">{canReview && NEXT_STATES[app.status]?.length ? <div className="space-y-2"><input value={decisionNotes[app.id] ?? app.decision_note ?? ""} onChange={(e) => setDecisionNotes((prev) => ({...prev,[app.id]:e.target.value}))} placeholder="Decision / review note" className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs" /><div className="flex flex-wrap gap-1.5">{NEXT_STATES[app.status].map((next) => <button key={next} disabled={saving} onClick={() => void changeStatus(app,next)} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${["offered","accepted"].includes(next) ? "bg-success/10 text-success" : ["rejected","withdrawn"].includes(next) ? "bg-destructive/10 text-destructive" : "border border-border"}`}>{label(next)}</button>)}</div></div> : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="size-3.5" />{["accepted","rejected","withdrawn"].includes(app.status) ? "Closed" : "View only"}</span>}</td></tr>; })}</tbody></table></div>
    </section>
    <p className="text-xs text-muted-foreground">This is a staff-only admissions workspace. Applicant records remain tenant-scoped, and each status change is validated by the backend workflow.</p>
  </div>;
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }) {
  return <label className="text-xs font-medium">{label}<input type={type} value={value ?? ""} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>;
}
