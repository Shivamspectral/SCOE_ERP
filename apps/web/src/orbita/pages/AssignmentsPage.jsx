import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, ClipboardList, Plus, Save } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Badge } from "../components/Badge";
import { Card, CardContent } from "../components/Card";
import { usePortal } from "../context/PortalContext";
import { academicApi, assignmentsApi, studentsApi } from "../lib/api";

const demoAssignments = [
  { id: "demo-assignment-1", title: "Data Structures — Unit 2 Problem Set", class_id: "demo-class-1", className: "SE Computer · A", subject_id: "", subjectName: "Data Structures", due_at: "2026-11-05T18:00:00.000Z", max_marks: 20, status: "published", instructions: "Solve the linked-list and stack problems with complexity analysis." },
  { id: "demo-assignment-2", title: "Database Normalization Worksheet", class_id: "demo-class-2", className: "TE Computer · B", subject_id: "", subjectName: "Database Systems", due_at: "2026-11-08T18:00:00.000Z", max_marks: 15, status: "draft", instructions: "Normalize the provided schema through BCNF." },
];

const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No due date";

export function AssignmentsPage() {
  const { toast, backendConfigured, isAuthenticated, session, userRole } = usePortal();
  const liveMode = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const [assignments, setAssignments] = useState(liveMode ? [] : demoAssignments);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingStudent, setSavingStudent] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ classId: "", subjectId: "", title: "", instructions: "", dueAt: "", maxMarks: "20" });

  useEffect(() => {
    if (!liveMode) {
      const previewRows = demoAssignments.filter((item) => !statusFilter || item.status === statusFilter);
      setAssignments(previewRows);
      setClasses([{ id: "demo-class-1", name: "SE Computer", division: "A" }, { id: "demo-class-2", name: "TE Computer", division: "B" }]);
      setSubjects([]);
      setSelectedId((current) => previewRows.some((item) => item.id === current) ? current : (previewRows[0]?.id || ""));
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      assignmentsApi.list({ status: statusFilter || undefined }),
      academicApi.classes({ status: "active" }),
      academicApi.subjects({ status: "active" }),
    ]).then(([assignmentRows, classRows, subjectRows]) => {
      if (cancelled) return;
      const nextAssignments = Array.isArray(assignmentRows) ? assignmentRows : [];
      setAssignments(nextAssignments);
      setClasses(Array.isArray(classRows) ? classRows : []);
      setSubjects(Array.isArray(subjectRows) ? subjectRows : []);
      setSelectedId((current) => nextAssignments.some((item) => item.id === current) ? current : (nextAssignments[0]?.id || ""));
      setForm((current) => ({ ...current, classId: current.classId || classRows?.[0]?.id || "" }));
    }).catch((error) => {
      if (!cancelled) toast({ title: "Assignments could not be loaded", description: error?.message || "Check your staff access and try again.", variant: "error" });
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [liveMode, session?.access_token, statusFilter]);

  const selectedAssignment = assignments.find((item) => item.id === selectedId) || null;
  const canManage = ["Faculty", "HOD", "Principal", "Vice-Principal", "Coordinator", "Super Admin", "Administrator"].includes(userRole);

  useEffect(() => {
    if (!selectedAssignment) {
      setStudents([]);
      setSubmissions([]);
      setDrafts({});
      return;
    }
    if (!liveMode || selectedAssignment.id.startsWith("demo-")) {
      setStudents([
        { id: "demo-student-1", roll_number: "01", full_name: "Sample Student One" },
        { id: "demo-student-2", roll_number: "02", full_name: "Sample Student Two" },
        { id: "demo-student-3", roll_number: "03", full_name: "Sample Student Three" },
      ]);
      setSubmissions([]);
      setDrafts({});
      return;
    }
    let cancelled = false;
    Promise.all([
      studentsApi.list({ classId: selectedAssignment.class_id, status: "active", limit: 200 }),
      assignmentsApi.submissions(selectedAssignment.id),
    ]).then(([studentRows, submissionRows]) => {
      if (cancelled) return;
      const nextStudents = Array.isArray(studentRows) ? studentRows : [];
      const nextSubmissions = Array.isArray(submissionRows) ? submissionRows : [];
      const byStudent = new Map(nextSubmissions.map((row) => [row.student_id, row]));
      setStudents(nextStudents);
      setSubmissions(nextSubmissions);
      setDrafts(Object.fromEntries(nextStudents.map((student) => {
        const row = byStudent.get(student.id);
        return [student.id, { marks: row?.marks == null ? "" : String(row.marks), feedback: row?.feedback || "", status: row?.status || "pending" }];
      })));
    }).catch((error) => {
      if (!cancelled) toast({ title: "Class register could not be loaded", description: error?.message || "Student records are unavailable.", variant: "error" });
    });
    return () => { cancelled = true; };
  }, [selectedId, liveMode, session?.access_token]);

  const completedCount = useMemo(() => submissions.filter((row) => row.status === "evaluated").length, [submissions]);

  const createAssignment = async (event) => {
    event.preventDefault();
    if (!liveMode) {
      toast({ title: "Demo preview is read-only", description: "Connect an authenticated backend to create institutional assignments.", variant: "info" });
      return;
    }
    if (!form.classId || !form.title.trim()) return;
    setCreating(true);
    try {
      const created = await assignmentsApi.create({
        classId: form.classId,
        subjectId: form.subjectId || undefined,
        title: form.title.trim(),
        instructions: form.instructions.trim() || undefined,
        dueAt: form.dueAt ? new Date(`${form.dueAt}T23:59:00`).toISOString() : undefined,
        maxMarks: form.maxMarks === "" ? undefined : Number(form.maxMarks),
      });
      setAssignments((previous) => [created, ...previous]);
      setSelectedId(created.id);
      setForm((previous) => ({ ...previous, title: "", instructions: "", dueAt: "" }));
      toast({ title: "Assignment created", description: "The assignment is saved as a draft.", variant: "success" });
    } catch (error) {
      toast({ title: "Assignment creation failed", description: error?.message || "The assignment could not be saved.", variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (assignment, status) => {
    if (!liveMode || assignment.id.startsWith("demo-")) {
      toast({ title: "Demo preview is read-only", description: "Status changes are not saved in preview mode.", variant: "info" });
      return;
    }
    try {
      const updated = await assignmentsApi.updateStatus(assignment.id, status);
      setAssignments((previous) => previous.map((item) => item.id === assignment.id ? { ...item, ...updated } : item));
      toast({ title: "Assignment status updated", description: `Assignment is now ${status}.`, variant: "success" });
    } catch (error) {
      toast({ title: "Status update failed", description: error?.message || "The status could not be updated.", variant: "error" });
    }
  };

  const saveGrade = async (student) => {
    if (!liveMode || !selectedAssignment || selectedAssignment.id.startsWith("demo-")) {
      toast({ title: "Demo preview is read-only", description: "Grades in preview mode are not saved to college records.", variant: "info" });
      return;
    }
    const draft = drafts[student.id] || { marks: "", feedback: "", status: "pending" };
    if (draft.marks !== "" && (!Number.isFinite(Number(draft.marks)) || Number(draft.marks) < 0 || (selectedAssignment.max_marks != null && Number(draft.marks) > Number(selectedAssignment.max_marks)))) {
      toast({ title: "Invalid marks", description: `Enter a value between 0 and ${selectedAssignment.max_marks ?? "the allowed maximum"}.`, variant: "warning" });
      return;
    }
    setSavingStudent(student.id);
    try {
      const saved = await assignmentsApi.saveSubmission(selectedAssignment.id, {
        studentId: student.id,
        marks: draft.marks === "" ? undefined : Number(draft.marks),
        feedback: draft.feedback,
        status: draft.marks !== "" ? "evaluated" : (draft.status || "pending"),
      });
      setSubmissions((previous) => [...previous.filter((row) => row.student_id !== student.id), saved]);
      setDrafts((previous) => ({ ...previous, [student.id]: { marks: saved.marks == null ? "" : String(saved.marks), feedback: saved.feedback || "", status: saved.status } }));
      toast({ title: "Assessment saved", description: `Saved assessment for ${student.full_name}.`, variant: "success" });
    } catch (error) {
      toast({ title: "Could not save assessment", description: error?.message || "Check assignment permissions and try again.", variant: "error" });
    } finally {
      setSavingStudent("");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb title="Assignments & Evaluation" subtitle="Create class assignments, track submissions, record marks and give individual feedback." />
      {!liveMode && <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">Demo workspace · sample assignments and students only. Changes are not saved to college records.</div>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <Card><CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-foreground">Assignment register</h2><p className="mt-1 text-xs text-muted-foreground">{assignments.length} assignments in your permitted scope</p></div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="archived">Archived</option></select>
          </div>
          {loading && <p className="py-5 text-sm text-muted-foreground">Loading assignments…</p>}
          {!loading && assignments.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No assignments found. Create the first class assignment.</p>}
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const selected = assignment.id === selectedId;
              const classInfo = classes.find((item) => item.id === assignment.class_id);
              return <button key={assignment.id} onClick={() => setSelectedId(assignment.id)} className={`w-full rounded-xl border p-4 text-left transition-colors ${selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2"><span className="font-semibold text-foreground">{assignment.title}</span><Badge variant={assignment.status === "published" ? "success" : assignment.status === "draft" ? "warning" : "outline"}>{assignment.status}</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">{assignment.academic_classes?.name || assignment.className || classInfo?.name || "Class"}{assignment.academic_classes?.division || classInfo?.division ? ` · ${assignment.academic_classes?.division || classInfo?.division}` : ""} · {assignment.academic_subjects?.name || assignment.subjectName || "General"}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> Due {dateLabel(assignment.due_at)} · {assignment.max_marks ?? "—"} marks</p>
              </button>;
            })}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground"><Plus className="size-4" /> Create assignment</h2>
          <p className="mt-1 text-xs text-muted-foreground">New assignments start as drafts. Publish when ready for the class.</p>
          <form onSubmit={createAssignment} className="mt-4 space-y-3">
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>Class *</span><select required value={form.classId} onChange={(event) => setForm((previous) => ({ ...previous, classId: event.target.value, subjectId: "" }))} disabled={!liveMode || !canManage} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"><option value="">{liveMode ? "Choose a class" : "Demo preview"}</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}{item.division ? ` · ${item.division}` : ""}</option>)}</select></label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>Subject</span><select value={form.subjectId} onChange={(event) => setForm((previous) => ({ ...previous, subjectId: event.target.value }))} disabled={!liveMode || !canManage} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"><option value="">General / not specified</option>{subjects.filter((item) => !form.classId || !item.class_id || item.class_id === form.classId).map((item) => <option key={item.id} value={item.id}>{item.name}{item.code ? ` · ${item.code}` : ""}</option>)}</select></label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>Title *</span><input required minLength={2} maxLength={180} value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} disabled={!liveMode || !canManage} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" placeholder="e.g. Unit 3 problem set" /></label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>Instructions</span><textarea maxLength={5000} rows={3} value={form.instructions} onChange={(event) => setForm((previous) => ({ ...previous, instructions: event.target.value }))} disabled={!liveMode || !canManage} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" placeholder="Brief, requirements and submission guidance" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>Due date</span><input type="date" value={form.dueAt} onChange={(event) => setForm((previous) => ({ ...previous, dueAt: event.target.value }))} disabled={!liveMode || !canManage} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>Maximum marks</span><input type="number" min="0" max="100000" step="0.01" value={form.maxMarks} onChange={(event) => setForm((previous) => ({ ...previous, maxMarks: event.target.value }))} disabled={!liveMode || !canManage} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground" /></label>
            </div>
            <button type="submit" disabled={!liveMode || !canManage || creating} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{creating ? "Saving…" : <><Plus className="size-4" /> Save draft</>}</button>
          </form>
        </CardContent></Card>
      </div>

      {selectedAssignment && <Card><CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-semibold text-foreground"><ClipboardList className="size-4" /> Student assessment register</h2><p className="mt-1 text-sm text-muted-foreground">{selectedAssignment.title} · {students.length} active students · {completedCount} evaluated</p></div>
          {liveMode && canManage && <div className="flex flex-wrap gap-2">{selectedAssignment.status === "draft" && <button onClick={() => void changeStatus(selectedAssignment, "published")} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Publish</button>}{selectedAssignment.status === "published" && <button onClick={() => void changeStatus(selectedAssignment, "closed")} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">Close assignment</button>}</div>}
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Roll no.</th><th className="px-3 py-3 font-medium">Student</th><th className="px-3 py-3 font-medium">Marks / {selectedAssignment.max_marks ?? "—"}</th><th className="px-3 py-3 font-medium">Feedback</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Action</th></tr></thead>
            <tbody className="divide-y divide-border">{students.map((student) => { const draft = drafts[student.id] || { marks: "", feedback: "", status: "pending" }; return <tr key={student.id}><td className="px-3 py-3 text-muted-foreground">{student.roll_number || "—"}</td><td className="px-3 py-3 font-medium text-foreground">{student.full_name}</td><td className="px-3 py-3"><input aria-label={`Marks for ${student.full_name}`} type="number" min="0" max={selectedAssignment.max_marks ?? undefined} step="0.01" value={draft.marks} onChange={(event) => setDrafts((previous) => ({ ...previous, [student.id]: { ...draft, marks: event.target.value } }))} disabled={!liveMode || !canManage || ["closed","archived"].includes(selectedAssignment.status)} className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground" /></td><td className="px-3 py-3"><input aria-label={`Feedback for ${student.full_name}`} maxLength={3000} value={draft.feedback} onChange={(event) => setDrafts((previous) => ({ ...previous, [student.id]: { ...draft, feedback: event.target.value } }))} disabled={!liveMode || !canManage || ["closed","archived"].includes(selectedAssignment.status)} className="w-64 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground" placeholder="Individual feedback" /></td><td className="px-3 py-3"><Badge variant={draft.status === "evaluated" ? "success" : draft.status === "submitted" ? "warning" : "outline"}>{draft.status}</Badge></td><td className="px-3 py-3"><button onClick={() => void saveGrade(student)} disabled={!liveMode || !canManage || savingStudent === student.id || ["closed","archived"].includes(selectedAssignment.status)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"><Save className="size-3.5" />{savingStudent === student.id ? "Saving…" : "Save"}</button></td></tr>; })}</tbody>
          </table>
        </div>
        {!students.length && <p className="mt-3 text-sm text-muted-foreground">No active student records are assigned to this class.</p>}
        {!liveMode && <p className="mt-3 text-xs text-muted-foreground">Preview only — grading inputs are disabled and no marks are saved.</p>}
      </CardContent></Card>}
    </div>
  );
}
