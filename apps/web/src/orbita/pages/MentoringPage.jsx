import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, MessageSquare, Plus, RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { usePortal } from "../context/PortalContext";
import { facultyApi, isBackendConfigured, mentoringApi, studentsApi } from "../lib/api";

const DEMO_ASSIGNMENTS = [{
  id: "demo-mentoring-1", student_id: "demo-student-1", faculty_user_id: "demo-faculty-1",
  academic_year: "2026-27", status: "active", student: { full_name: "Demo Mentee", roll_number: "DEMO-001", registration_number: "PREVIEW" },
  faculty: { name: "Demo Faculty" }, notes: "Sample preview record only",
}];
const DEMO_MEETINGS = [{
  id: "demo-meeting-1", meeting_at: "2026-10-20T10:30:00Z", category: "academic",
  notes: "Demo counselling note — no real student information.", action_plan: "Review the next assessment plan.",
  follow_up_on: "2026-11-05", status: "open",
}];
const listOf = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.items) ? value.items : [];
const CATEGORIES = ["academic", "attendance", "career", "wellbeing", "discipline", "other"];

export function MentoringPage() {
  const { toast, isAuthenticated, session, isDemoPreview, userRole, departments, activeProfile } = usePortal();
  const liveMode = Boolean(isBackendConfigured && isAuthenticated && session?.access_token && !isDemoPreview);
  const canAssign = ["Principal", "HOD", "Coordinator", "Administrator", "Super Admin"].includes(userRole);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ studentId: "", facultyUserId: "", academicYear: "2026-27", notes: "" });
  const [meetingForm, setMeetingForm] = useState({ category: "academic", meetingAt: new Date().toISOString().slice(0, 16), notes: "", actionPlan: "", followUpOn: "" });

  const load = useCallback(async () => {
    if (!liveMode) {
      setAssignments(DEMO_ASSIGNMENTS);
      setStudents([]);
      setFaculty([]);
      setMeetings(selectedAssignmentId ? DEMO_MEETINGS : []);
      setSelectedAssignmentId((current) => current || DEMO_ASSIGNMENTS[0].id);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const assignmentResult = await mentoringApi.assignments({ status: "active" });
      const nextAssignments = listOf(assignmentResult);
      setAssignments(nextAssignments);
      setSelectedAssignmentId((current) => nextAssignments.some((row) => row.id === current) ? current : nextAssignments[0]?.id || "");
      if (canAssign) {
        const [studentResult, facultyResult] = await Promise.all([
          studentsApi.list({ status: "active", limit: 500 }),
          facultyApi.list(),
        ]);
        setStudents(listOf(studentResult));
        setFaculty(listOf(facultyResult));
      } else {
        setStudents([]);
        setFaculty([]);
      }
    } catch (e) {
      setError(e?.message || "Mentor assignments could not be loaded.");
      setAssignments([]);
      setStudents([]);
      setFaculty([]);
    } finally { setLoading(false); }
  }, [liveMode, canAssign]);

  useEffect(() => { void load(); }, [load]);

  const selectedAssignment = assignments.find((row) => row.id === selectedAssignmentId) || null;
  const filteredAssignments = useMemo(() => assignments.filter((row) => {
    const student = row.academic_students || row.student || {};
    const term = [student.full_name, student.roll_number, student.registration_number, row.academic_year, row.faculty?.name, row.faculty?.email].filter(Boolean).join(" ").toLowerCase();
    return term.includes(search.toLowerCase());
  }), [assignments, search]);

  const loadMeetings = useCallback(async (assignmentId) => {
    if (!assignmentId) { setMeetings([]); return; }
    if (!liveMode) { setMeetings(DEMO_MEETINGS); return; }
    setMeetingsLoading(true);
    try {
      setMeetings(listOf(await mentoringApi.meetings(assignmentId)));
    } catch (e) {
      setMeetings([]);
      toast({ title: "Could not load counselling history", description: e?.message || "Check your role and assignment scope.", variant: "error" });
    } finally { setMeetingsLoading(false); }
  }, [liveMode, toast]);

  useEffect(() => { void loadMeetings(selectedAssignmentId); }, [selectedAssignmentId, loadMeetings]);

  const createAssignment = async (event) => {
    event.preventDefault();
    if (!liveMode) return toast({ title: "Demo preview only", description: "Sample mentor assignments are read-only.", variant: "info" });
    if (!assignmentForm.studentId || !assignmentForm.facultyUserId || !assignmentForm.academicYear.trim()) return toast({ title: "Missing assignment details", description: "Choose a student, faculty mentor and academic year.", variant: "warning" });
    setSaving(true);
    try {
      const created = await mentoringApi.createAssignment(assignmentForm);
      toast({ title: "Mentor assigned", description: "The mentor-mentee assignment has been recorded.", variant: "success" });
      setShowAssignmentForm(false);
      setAssignmentForm({ studentId: "", facultyUserId: "", academicYear: "2026-27", notes: "" });
      await load();
      setSelectedAssignmentId(created.id);
    } catch (e) { toast({ title: "Could not assign mentor", description: e?.message || "Check the student's department and faculty assignment.", variant: "error" }); }
    finally { setSaving(false); }
  };

  const createMeeting = async (event) => {
    event.preventDefault();
    if (!selectedAssignment) return;
    if (!liveMode) return toast({ title: "Demo preview only", description: "Counselling notes cannot be saved in preview mode.", variant: "info" });
    if (!meetingForm.notes.trim()) return toast({ title: "Meeting notes required", description: "Record a concise summary of the discussion.", variant: "warning" });
    setSaving(true);
    try {
      const created = await mentoringApi.createMeeting(selectedAssignment.id, {
        ...meetingForm,
        meetingAt: meetingForm.meetingAt ? new Date(meetingForm.meetingAt).toISOString() : undefined,
        followUpOn: meetingForm.followUpOn || undefined,
      });
      setMeetings((current) => [created, ...current]);
      setMeetingForm({ category: "academic", meetingAt: new Date().toISOString().slice(0, 16), notes: "", actionPlan: "", followUpOn: "" });
      setShowMeetingForm(false);
      toast({ title: "Counselling record saved", description: "The confidential meeting note is saved to the institutional record.", variant: "success" });
    } catch (e) { toast({ title: "Could not save meeting", description: e?.message || "Check assignment access and required fields.", variant: "error" }); }
    finally { setSaving(false); }
  };

  const updateMeetingStatus = async (meeting, status) => {
    if (!liveMode) return;
    try {
      const updated = await mentoringApi.updateMeeting(meeting.id, { status });
      setMeetings((current) => current.map((row) => row.id === meeting.id ? { ...row, ...updated } : row));
      toast({ title: "Follow-up updated", description: status === "resolved" ? "The follow-up is marked resolved." : "The follow-up has been reopened.", variant: "success" });
    } catch (e) { toast({ title: "Could not update follow-up", description: e?.message || "Check your assignment permissions.", variant: "error" }); }
  };

  const activeStudent = selectedAssignment?.academic_students || selectedAssignment?.student || {};
  const activeFaculty = selectedAssignment?.faculty || {};
  const selectedStudentForAssignment = students.find((student) => student.id === assignmentForm.studentId);
  const eligibleFaculty = selectedStudentForAssignment ? faculty.filter((person) => (person.roleAssignmentDepartmentId || person.department_id) === selectedStudentForAssignment.department_id) : faculty;
  return <div className="space-y-6 animate-fade-in-up">
    <Breadcrumb title="Mentor–Mentee Programme" subtitle="Confidential student support, counselling notes, action plans and follow-up tracking" />
    {!liveMode && <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"><strong>Demo preview — fictional data only.</strong> No real student records or counselling notes are shown or saved.</div>}
    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"><AlertCircle className="mt-0.5 size-4" /><span>{error}</span><button className="ml-auto underline" onClick={() => void load()}>Retry</button></div>}
    <div className="grid gap-3 sm:grid-cols-3">{[["Active assignments",assignments.length],["Counselling records",meetings.length],["Open follow-ups",meetings.filter((m) => m.status === "open").length]].map(([label,value])=><div key={label} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>

    <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border p-4"><div><h2 className="font-semibold">My mentees</h2><p className="mt-1 text-xs text-muted-foreground">Visible assignments are restricted by role and department.</p></div>{canAssign && <button onClick={() => setShowAssignmentForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />Assign</button>}</div>
        {showAssignmentForm && <form onSubmit={createAssignment} className="space-y-3 border-b border-border bg-muted/20 p-4">
          <label className="block text-xs font-medium">Student<select required value={assignmentForm.studentId} onChange={(e) => setAssignmentForm({...assignmentForm,studentId:e.target.value,facultyUserId:""})} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select student…</option>{students.filter((student) => student.status === "active" && (!activeProfile?.dept || !departments.find((d) => d.name?.toLowerCase() === activeProfile.dept.toLowerCase()) || student.department_id === departments.find((d) => d.name?.toLowerCase() === activeProfile.dept.toLowerCase())?.id)).map((student) => <option key={student.id} value={student.id}>{student.roll_number || student.registration_number || "No roll"} — {student.full_name}</option>)}</select></label>
          <label className="block text-xs font-medium">Faculty mentor<select required value={assignmentForm.facultyUserId} onChange={(e) => setAssignmentForm({...assignmentForm,facultyUserId:e.target.value})} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select faculty…</option>{eligibleFaculty.map((person) => <option key={person.id} value={person.id}>{person.name || person.email} · {person.dept || "Faculty"}</option>)}</select></label>
          <Field label="Academic year" value={assignmentForm.academicYear} onChange={(v) => setAssignmentForm({...assignmentForm,academicYear:v})} required />
          <label className="block text-xs font-medium">Assignment note<textarea value={assignmentForm.notes} onChange={(e) => setAssignmentForm({...assignmentForm,notes:e.target.value})} rows={2} className="mt-1 block w-full rounded-lg border border-input bg-background p-3 text-sm" placeholder="Optional assignment context" /></label>
          <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Save assignment</button><button type="button" onClick={() => setShowAssignmentForm(false)} className="rounded-lg border border-border px-3 py-2 text-xs">Cancel</button></div>
        </form>}
        <div className="border-b border-border p-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search mentee or roll number…" className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm" /></div></div>
        <div className="max-h-[620px] divide-y divide-border overflow-y-auto">{loading ? <p className="p-6 text-sm text-muted-foreground">Loading mentor assignments…</p> : filteredAssignments.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No active mentee assignments are visible in your scope.</p> : filteredAssignments.map((row) => { const student = row.academic_students || row.student || {}; const selected = row.id === selectedAssignmentId; return <button key={row.id} onClick={() => setSelectedAssignmentId(row.id)} className={`block w-full p-4 text-left transition-colors hover:bg-muted/40 ${selected ? "bg-primary/5 ring-inset ring-1 ring-primary/30" : ""}`}><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{student.full_name || "Student record"}</p><p className="mt-0.5 text-xs text-muted-foreground">{student.roll_number || student.registration_number || "No roll number"} · {row.academic_year}</p><p className="mt-1 text-xs text-muted-foreground">Mentor: {row.faculty?.name || "Assigned faculty"}</p></div><span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Active</span></div></button>; })}</div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Counselling & follow-up history</h2><p className="mt-1 text-xs text-muted-foreground">{activeStudent.full_name || "Select a mentee"}{activeStudent.roll_number ? ` · ${activeStudent.roll_number}` : ""} {activeFaculty.name ? ` · Mentor: ${activeFaculty.name}` : ""}</p></div><button disabled={!selectedAssignment || !liveMode} onClick={() => setShowMeetingForm((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Plus className="size-3.5" />Log meeting</button></div>
        {showMeetingForm && <form onSubmit={createMeeting} className="grid gap-3 border-b border-border bg-muted/20 p-4 sm:grid-cols-2">
          <label className="text-xs font-medium">Category<select value={meetingForm.category} onChange={(e) => setMeetingForm({...meetingForm,category:e.target.value})} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{CATEGORIES.map((value) => <option key={value} value={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}</select></label>
          <Field label="Meeting date & time" type="datetime-local" value={meetingForm.meetingAt} onChange={(v) => setMeetingForm({...meetingForm,meetingAt:v})} required />
          <label className="text-xs font-medium sm:col-span-2">Discussion notes<textarea required value={meetingForm.notes} onChange={(e) => setMeetingForm({...meetingForm,notes:e.target.value})} rows={3} className="mt-1 block w-full rounded-lg border border-input bg-background p-3 text-sm" placeholder="Record the counselling discussion; keep notes factual and respectful." /></label>
          <label className="text-xs font-medium sm:col-span-2">Action plan<textarea value={meetingForm.actionPlan} onChange={(e) => setMeetingForm({...meetingForm,actionPlan:e.target.value})} rows={2} className="mt-1 block w-full rounded-lg border border-input bg-background p-3 text-sm" placeholder="Agreed next steps and support required" /></label>
          <Field label="Follow-up date" type="date" value={meetingForm.followUpOn} onChange={(v) => setMeetingForm({...meetingForm,followUpOn:v})} />
          <div className="flex items-end gap-2"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save meeting</button><button type="button" onClick={() => setShowMeetingForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div>
        </form>}
        <div className="divide-y divide-border">{meetingsLoading ? <p className="p-8 text-sm text-muted-foreground">Loading counselling history…</p> : meetings.length === 0 ? <div className="p-8 text-center"><MessageSquare className="mx-auto size-7 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No counselling records are available for this mentee.</p></div> : meetings.map((meeting) => <article key={meeting.id} className="p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold">{meeting.category}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${meeting.status === "resolved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"}`}>{meeting.status}</span><time className="ml-auto text-xs text-muted-foreground">{meeting.meeting_at ? new Date(meeting.meeting_at).toLocaleString("en-IN") : "—"}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{meeting.notes}</p>{meeting.action_plan && <div className="mt-3 rounded-lg bg-muted/40 p-3"><p className="text-xs font-semibold">Action plan</p><p className="mt-1 whitespace-pre-wrap text-sm">{meeting.action_plan}</p></div>}<div className="mt-3 flex items-center justify-between gap-3">{meeting.follow_up_on && <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" />Follow-up: {meeting.follow_up_on}</p>}{liveMode && <button onClick={() => void updateMeetingStatus(meeting,meeting.status === "resolved" ? "open" : "resolved")} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold">{meeting.status === "resolved" ? <><RefreshCw className="size-3.5" />Reopen</> : <><CheckCircle2 className="size-3.5" />Resolve follow-up</>}</button>}</div></article>)}</div>
      </section>
    </div>
    <p className="text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline size-3.5" />Mentoring notes are tenant-scoped and visible only to the assigned mentor and authorized academic leadership.</p>
  </div>;
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }) {
  return <label className="block text-xs font-medium">{label}<input type={type} value={value ?? ""} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>;
}
