import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Plus, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { operationsApi, academicApi, isBackendConfigured } from "../lib/api";
import { usePortal } from "../context/PortalContext";

const DEMO_SESSIONS = [
  { id: "demo-exam-1", exam_code: "INSEM-2026-ODD", name: "Odd Semester In-Semester Assessment", exam_type: "in_semester", academic_year: "2026-27", starts_on: "2026-11-16", ends_on: "2026-11-21", status: "scheduled", instructions: "Demo schedule only" },
  { id: "demo-exam-2", exam_code: "ENDSEM-2026-ODD", name: "Odd Semester End-Semester Examination", exam_type: "end_semester", academic_year: "2026-27", starts_on: "2026-12-01", ends_on: "2026-12-18", status: "draft", instructions: "Demo schedule only" },
];
const DEMO_TIMETABLE = [
  { id: "demo-slot-1", session_id: "demo-exam-1", subject_id: "demo-subject-1", subject_name: "Data Structures", exam_date: "2026-11-16", starts_at: "2026-11-16T10:30", ends_at: "2026-11-16T11:30", venue: "Hall A-102", max_marks: 30, passing_marks: 12, status: "scheduled" },
  { id: "demo-slot-2", session_id: "demo-exam-1", subject_id: "demo-subject-2", subject_name: "Database Management Systems", exam_date: "2026-11-18", starts_at: "2026-11-18T10:30", ends_at: "2026-11-18T11:30", venue: "Hall A-104", max_marks: 30, passing_marks: 12, status: "scheduled" },
];
const blankSession = { exam_code: "", name: "", exam_type: "in_semester", academic_year: "2026-27", starts_on: "", ends_on: "", instructions: "" };
const blankSlot = { session_id: "", subject_id: "", exam_date: "", starts_at: "", ends_at: "", venue: "", invigilator_id: "", max_marks: "100", passing_marks: "40", instructions: "" };
const dateLabel = (value) => value ? new Date(value + (String(value).length === 10 ? "T12:00:00" : "")).toLocaleDateString() : "—";
const statusStyle = (status) => status === "published" || status === "completed" ? "bg-success/10 text-success" : status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground";
const unwrapList = (value) => Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : Array.isArray(value?.data) ? value.data : [];

export function ExaminationsPage() {
  const { toast, isAuthenticated, session, isDemoPreview, userRole } = usePortal();
  const liveMode = Boolean(isBackendConfigured && isAuthenticated && session?.access_token && !isDemoPreview);
  const canManage = ["Principal", "Vice-Principal", "HOD", "Coordinator", "Administrator", "Exam Cell"].includes(userRole);
  const canPublish = ["Principal", "Vice-Principal", "HOD", "Coordinator", "Administrator", "Exam Cell"].includes(userRole);
  const [sessions, setSessions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [sessionForm, setSessionForm] = useState(blankSession);
  const [slotForm, setSlotForm] = useState(blankSlot);
  const [activeSession, setActiveSession] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!liveMode) {
      setSessions(DEMO_SESSIONS);
      setSlots(DEMO_TIMETABLE);
      setSubjects([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [sessionResult, slotResult, subjectResult] = await Promise.all([
        operationsApi.list("examinationSessions", { limit: 100 }),
        operationsApi.list("examinationTimetable", { limit: 100 }),
        academicApi.subjects({ limit: 200 }),
      ]);
      const nextSessions = unwrapList(sessionResult);
      const nextSlots = unwrapList(slotResult);
      setSessions(nextSessions);
      setSlots(nextSlots);
      setSubjects(unwrapList(subjectResult));
      setSessionForm((current) => ({ ...current }));
      setSlotForm((current) => ({ ...current, session_id: current.session_id || nextSessions[0]?.id || "" }));
    } catch (e) {
      setError(e?.message || "Institutional examination records could not be loaded.");
      setSessions([]);
      setSlots([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [liveMode]);

  useEffect(() => { void load(); }, [load]);

  const filteredSlots = useMemo(() => slots.filter((slot) => {
    const matchesSession = activeSession === "all" || slot.session_id === activeSession;
    const subject = subjects.find((item) => item.id === slot.subject_id);
    const sessionRow = sessions.find((item) => item.id === slot.session_id);
    const haystack = [slot.venue, slot.subject_name, subject?.name, subject?.title, subject?.subject_name, sessionRow?.name, sessionRow?.exam_code].filter(Boolean).join(" ").toLowerCase();
    return matchesSession && haystack.includes(search.toLowerCase());
  }), [slots, activeSession, search, subjects, sessions]);

  const createSession = async (event) => {
    event.preventDefault();
    if (!liveMode) return toast({ title: "Demo preview only", description: "Sample examination sessions are read-only.", variant: "info" });
    if (!sessionForm.exam_code.trim() || !sessionForm.name.trim() || !sessionForm.starts_on || !sessionForm.ends_on) {
      return toast({ title: "Missing details", description: "Enter an exam code, name, start date and end date.", variant: "warning" });
    }
    if (sessionForm.ends_on < sessionForm.starts_on) return toast({ title: "Invalid date range", description: "The end date must be on or after the start date.", variant: "warning" });
    setSaving(true);
    try {
      const created = await operationsApi.create("examinationSessions", { ...sessionForm, status: "draft" });
      setSessions((current) => [created, ...current]);
      setSessionForm(blankSession);
      setShowSessionForm(false);
      setSlotForm((current) => ({ ...current, session_id: current.session_id || created.id }));
      toast({ title: "Examination session created", description: "The session is saved as a draft.", variant: "success" });
    } catch (e) {
      toast({ title: "Could not create session", description: e?.message || "Check your permissions and try again.", variant: "error" });
    } finally { setSaving(false); }
  };

  const createSlot = async (event) => {
    event.preventDefault();
    if (!liveMode) return toast({ title: "Demo preview only", description: "Sample timetable slots are read-only.", variant: "info" });
    if (!slotForm.session_id || !slotForm.subject_id || !slotForm.exam_date || !slotForm.starts_at || !slotForm.ends_at || !slotForm.venue.trim()) {
      return toast({ title: "Missing details", description: "Select a session and subject, date, time range and venue.", variant: "warning" });
    }
    if (new Date(slotForm.ends_at) <= new Date(slotForm.starts_at)) return toast({ title: "Invalid time range", description: "The end time must be later than the start time.", variant: "warning" });
    if (Number(slotForm.passing_marks) > Number(slotForm.max_marks)) return toast({ title: "Invalid marks", description: "Passing marks cannot exceed maximum marks.", variant: "warning" });
    setSaving(true);
    try {
      const payload = { ...slotForm, max_marks: Number(slotForm.max_marks), passing_marks: Number(slotForm.passing_marks), starts_at: new Date(slotForm.starts_at).toISOString(), ends_at: new Date(slotForm.ends_at).toISOString(), status: "draft" };
      const created = await operationsApi.create("examinationTimetable", payload);
      setSlots((current) => [created, ...current]);
      setSlotForm({ ...blankSlot, session_id: slotForm.session_id });
      setShowSlotForm(false);
      toast({ title: "Timetable slot added", description: "Room and invigilator overlap constraints are enforced by the database.", variant: "success" });
    } catch (e) {
      toast({ title: "Could not add timetable slot", description: e?.message || "Check the subject, session and room availability.", variant: "error" });
    } finally { setSaving(false); }
  };

  const transition = async (row, module, nextStatus, collection, setter) => {
    if (!liveMode) return toast({ title: "Demo preview only", description: "Workflow changes are disabled in preview mode.", variant: "info" });
    try {
      const updated = await operationsApi.update(module, row.id, { status: nextStatus });
      setter((current) => current.map((item) => item.id === row.id ? { ...item, ...updated } : item));
      toast({ title: "Workflow updated", description: `${row.name || row.exam_code || row.venue || "Record"} moved to ${nextStatus.replaceAll("_", " ")}.`, variant: "success" });
    } catch (e) {
      toast({ title: "Status change blocked", description: e?.message || "The transition may not be allowed for this record.", variant: "error" });
    }
  };

  const sessionCounts = {
    total: sessions.length,
    published: sessions.filter((item) => item.status === "published").length,
    upcoming: sessions.filter((item) => ["draft", "scheduled", "published"].includes(item.status)).length,
    slots: slots.length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb title="Examination Cell" subtitle="Academic examination calendar, subject timetable, venue allocation and publishing workflow" />
      {!liveMode && <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"><strong>Demo preview — sample records only.</strong> No official dates, room allocations or examination results are represented. Connect an authenticated staff session to manage institutional records.</div>}
      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{error}</span><button className="ml-auto underline" onClick={() => void load()}>Retry</button></div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Examination sessions", sessionCounts.total, CalendarDays], ["Published sessions", sessionCounts.published, ShieldCheck], ["Active planning", sessionCounts.upcoming, Clock3], ["Subject timetable slots", sessionCounts.slots, CheckCircle2]].map(([label, value, Icon]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{label}</span><Icon className="size-4 text-muted-foreground" /></div><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p></div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold">Examination calendar</h2><p className="mt-1 text-xs text-muted-foreground">Create exam windows and progress them through the controlled publication lifecycle.</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</button>
            {canManage && <button onClick={() => setShowSessionForm((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />New session</button>}
          </div>
        </div>
        {showSessionForm && <form onSubmit={createSession} className="grid gap-3 border-b border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Exam code" value={sessionForm.exam_code} required onChange={(v) => setSessionForm({ ...sessionForm, exam_code: v })} placeholder="INSEM-2026-ODD" />
          <Field label="Examination name" value={sessionForm.name} required onChange={(v) => setSessionForm({ ...sessionForm, name: v })} placeholder="Odd semester in-semester" />
          <label className="text-xs font-medium">Exam type<select value={sessionForm.exam_type} onChange={(e) => setSessionForm({ ...sessionForm, exam_type: e.target.value })} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{["in_semester","end_semester","practical","oral","retest","entrance","other"].map((x) => <option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label>
          <Field label="Academic year" value={sessionForm.academic_year} required onChange={(v) => setSessionForm({ ...sessionForm, academic_year: v })} placeholder="2026-27" />
          <Field label="Starts on" type="date" value={sessionForm.starts_on} required onChange={(v) => setSessionForm({ ...sessionForm, starts_on: v })} />
          <Field label="Ends on" type="date" value={sessionForm.ends_on} required onChange={(v) => setSessionForm({ ...sessionForm, ends_on: v })} />
          <label className="text-xs font-medium sm:col-span-2 lg:col-span-3">Instructions<textarea value={sessionForm.instructions} onChange={(e) => setSessionForm({ ...sessionForm, instructions: e.target.value })} rows={2} className="mt-1 block w-full rounded-lg border border-input bg-background p-3 text-sm" placeholder="Rules, reporting instructions, permitted materials…" /></label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4" />Save draft</button><button type="button" onClick={() => setShowSessionForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div>
        </form>}
        <div className="divide-y divide-border">
          {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading examination sessions…</p> : sessions.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No examination sessions in your permitted institutional scope.</p> : sessions.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{row.exam_code}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle(row.status)}`}>{row.status?.replaceAll("_"," ")}</span></div><h3 className="mt-1 font-semibold">{row.name}</h3><p className="mt-1 text-xs text-muted-foreground">{row.exam_type?.replaceAll("_"," ")} · {row.academic_year} · {dateLabel(row.starts_on)} – {dateLabel(row.ends_on)}</p>{row.instructions && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.instructions}</p>}</div>
              <div className="flex flex-wrap items-center gap-2">{canManage && <button onClick={() => { setSlotForm((current) => ({ ...current, session_id: row.id })); setActiveSession(row.id); setShowSlotForm(true); }} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Add subject slot</button>}{canPublish && row.status === "draft" && <button onClick={() => void transition(row,"examinationSessions","scheduled",sessions,setSessions)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Schedule</button>}{canPublish && row.status === "scheduled" && <button onClick={() => void transition(row,"examinationSessions","published",sessions,setSessions)} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Publish</button>}{canPublish && row.status === "published" && <button onClick={() => void transition(row,"examinationSessions","in_progress",sessions,setSessions)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Start exam</button>}{canPublish && row.status === "in_progress" && <button onClick={() => void transition(row,"examinationSessions","completed",sessions,setSessions)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Mark complete</button>}{canPublish && !["completed","cancelled"].includes(row.status) && <button onClick={() => void transition(row,"examinationSessions","cancelled",sessions,setSessions)} className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5">Cancel</button>}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Subject-wise timetable</h2><p className="mt-1 text-xs text-muted-foreground">Room and invigilator conflicts are prevented by database constraints for scheduled/published slots.</p></div>{canManage && <button onClick={() => setShowSlotForm((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />Add timetable slot</button>}</div>
        {showSlotForm && <form onSubmit={createSlot} className="grid gap-3 border-b border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-medium">Examination session<select required value={slotForm.session_id} onChange={(e) => setSlotForm({ ...slotForm, session_id: e.target.value })} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select session…</option>{sessions.filter((item) => !["completed","cancelled"].includes(item.status)).map((item) => <option key={item.id} value={item.id}>{item.exam_code} — {item.name}</option>)}</select></label>
          <label className="text-xs font-medium">Subject<select required value={slotForm.subject_id} onChange={(e) => setSlotForm({ ...slotForm, subject_id: e.target.value })} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select subject…</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.subject_code || item.code || item.name || item.title || item.id} — {item.name || item.title || item.subject_name || "Subject"}</option>)}</select>{liveMode && subjects.length === 0 && <span className="mt-1 block text-amber-700">No subjects returned; check academic subject setup and access.</span>}</label>
          <Field label="Exam date" type="date" value={slotForm.exam_date} required onChange={(v) => setSlotForm({ ...slotForm, exam_date: v })} />
          <Field label="Starts at" type="datetime-local" value={slotForm.starts_at} required onChange={(v) => setSlotForm({ ...slotForm, starts_at: v })} />
          <Field label="Ends at" type="datetime-local" value={slotForm.ends_at} required onChange={(v) => setSlotForm({ ...slotForm, ends_at: v })} />
          <Field label="Venue / room" value={slotForm.venue} required onChange={(v) => setSlotForm({ ...slotForm, venue: v })} placeholder="Hall A-102" />
          <Field label="Invigilator user ID (optional)" value={slotForm.invigilator_id} onChange={(v) => setSlotForm({ ...slotForm, invigilator_id: v })} placeholder="Staff profile UUID" />
          <Field label="Maximum marks" type="number" value={slotForm.max_marks} required onChange={(v) => setSlotForm({ ...slotForm, max_marks: v })} />
          <Field label="Passing marks" type="number" value={slotForm.passing_marks} required onChange={(v) => setSlotForm({ ...slotForm, passing_marks: v })} />
          <label className="text-xs font-medium sm:col-span-2 lg:col-span-3">Instructions<textarea value={slotForm.instructions} onChange={(e) => setSlotForm({ ...slotForm, instructions: e.target.value })} rows={2} className="mt-1 block w-full rounded-lg border border-input bg-background p-3 text-sm" /></label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving || (liveMode && subjects.length === 0)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4" />Save timetable slot</button><button type="button" onClick={() => setShowSlotForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div>
        </form>}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject, exam or venue…" className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm" /><select value={activeSession} onChange={(e) => setActiveSession(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">All sessions</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.exam_code}</option>)}</select></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Exam / subject</th><th className="px-4 py-3">Date & time</th><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Workflow</th></tr></thead><tbody className="divide-y divide-border">{filteredSlots.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No timetable slots match the selected filters.</td></tr> : filteredSlots.map((slot) => { const parent = sessions.find((item) => item.id === slot.session_id); const subject = subjects.find((item) => item.id === slot.subject_id); return <tr key={slot.id} className="hover:bg-muted/20"><td className="px-4 py-3"><p className="font-semibold">{subject?.name || subject?.title || subject?.subject_name || slot.subject_name || "Subject"}</p><p className="text-xs text-muted-foreground">{parent?.exam_code || "Demo session"} · {parent?.name || ""}</p></td><td className="px-4 py-3"><p>{dateLabel(slot.exam_date)}</p><p className="text-xs text-muted-foreground">{slot.starts_at ? new Date(slot.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} – {slot.ends_at ? new Date(slot.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</p></td><td className="px-4 py-3">{slot.venue || "—"}{slot.invigilator_id && <p className="text-xs text-muted-foreground">Invigilator assigned</p>}</td><td className="px-4 py-3">{slot.max_marks} max / {slot.passing_marks} pass</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyle(slot.status)}`}>{slot.status?.replaceAll("_"," ")}</span></td><td className="px-4 py-3">{canPublish && slot.status === "draft" && <button onClick={() => void transition(slot,"examinationTimetable","scheduled",slots,setSlots)} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold">Schedule</button>}{canPublish && slot.status === "scheduled" && <button onClick={() => void transition(slot,"examinationTimetable","published",slots,setSlots)} className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground">Publish</button>}{canPublish && slot.status === "published" && <button onClick={() => void transition(slot,"examinationTimetable","completed",slots,setSlots)} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold">Complete</button>}{canPublish && ["draft","scheduled","published"].includes(slot.status) && <button onClick={() => void transition(slot,"examinationTimetable","cancelled",slots,setSlots)} className="ml-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive">Cancel</button>}</td></tr>; })}</tbody></table></div>
      </section>
      <p className="text-xs text-muted-foreground">Publishing is restricted by staff role and database policy. This workspace does not generate official hall tickets or claim to sync results to SPPU.</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }) {
  return <label className="text-xs font-medium">{label}<input type={type} value={value ?? ""} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>;
}
