import React, { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardCheck, RotateCcw, ShieldCheck } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";
import { attendanceApi } from "../lib/api";

const previewSessions = [
  { id: "preview-att-001", session_date: "2026-10-27", session_label: "Lecture 2", status: "submitted", departments: { name: "Computer Engineering" }, academic_classes: { name: "SE Computer", division: "A" }, academic_subjects: { name: "Data Structures" }, submitted_at: "2026-10-27T09:35:00.000Z" },
  { id: "preview-att-002", session_date: "2026-10-27", session_label: "Practical 1", status: "submitted", departments: { name: "Computer Engineering" }, academic_classes: { name: "TE Computer", division: "B" }, academic_subjects: { name: "Database Systems" }, submitted_at: "2026-10-27T11:10:00.000Z" },
  { id: "preview-att-003", session_date: "2026-10-26", session_label: "Lecture 1", status: "verified", departments: { name: "Information Technology" }, academic_classes: { name: "SE IT", division: "A" }, academic_subjects: { name: "Computer Networks" }, submitted_at: "2026-10-26T08:55:00.000Z", verified_at: "2026-10-26T10:00:00.000Z" },
  { id: "preview-att-004", session_date: "2026-10-24", session_label: "Lecture 3", status: "returned", review_note: "Please reconcile the absent count with the signed roll call.", departments: { name: "Computer Engineering" }, academic_classes: { name: "BE Computer", division: "A" }, academic_subjects: { name: "Software Engineering" } },
];

export function AttendancePage() {
  const { toast, backendConfigured, isAuthenticated, session, userRole } = usePortal();
  const liveMode = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const [reviewSessions, setReviewSessions] = useState(liveMode ? [] : previewSessions);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [returningSessionId, setReturningSessionId] = useState(null);
  const [reviewReason, setReviewReason] = useState("");
  // Keep the UI aligned with roles currently supported by the database and API.
  const canReviewAttendance = ["Principal", "Super Admin", "HOD", "Coordinator"].includes(userRole);

  useEffect(() => {
    if (!liveMode) return;
    let cancelled = false;
    setReviewSessions([]);
    setReviewLoading(true);
    attendanceApi.sessions().then((rows) => {
      if (!cancelled) setReviewSessions(Array.isArray(rows) ? rows : []);
    }).catch((error) => {
      if (!cancelled) {
        setReviewSessions([]);
        toast({ title: "Could not load attendance sessions", description: error?.message || "Check your access and try again.", variant: "error" });
      }
    }).finally(() => { if (!cancelled) setReviewLoading(false); });
    return () => { cancelled = true; };
  }, [liveMode, session?.access_token]);

  const handleAttendanceReview = async (record, decision) => {
    if (decision === "returned" && !reviewReason.trim()) {
      toast({ title: "Correction reason required", description: "Explain what the faculty member needs to correct.", variant: "warning" });
      return;
    }
    if (!liveMode) {
      setReviewSessions((previous) => previous.map((item) => item.id === record.id
        ? { ...item, status: decision, review_note: decision === "returned" ? reviewReason.trim() : null }
        : item));
      setReturningSessionId(null);
      setReviewReason("");
      toast({ title: "Preview only", description: "The sample attendance status changed locally and was not saved to college records.", variant: "info" });
      return;
    }
    try {
      const updated = await attendanceApi.review(record.id, decision, decision === "returned" ? reviewReason.trim() : undefined);
      setReviewSessions((previous) => previous.map((item) => item.id === record.id ? { ...item, ...updated } : item));
      setReturningSessionId(null);
      setReviewReason("");
      toast({ title: decision === "verified" ? "Attendance verified" : "Attendance returned", description: decision === "verified" ? "The attendance session is now verified." : "The faculty member can correct and resubmit this session.", variant: "success" });
    } catch (error) {
      toast({ title: "Review failed", description: error?.message || "The attendance session could not be reviewed.", variant: "error" });
    }
  };

  const pendingReview = reviewSessions.filter((item) => item.status === "submitted");
  const verifiedCount = reviewSessions.filter((item) => item.status === "verified").length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Department Attendance Review"
        subtitle="Review submitted class attendance, verify records, or return incomplete sessions to faculty."
      />
      {!liveMode && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          Demo workspace · sample records only. Actions here do not update institutional data.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Sessions in scope</p><p className="mt-1 text-2xl font-bold text-foreground">{reviewSessions.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Awaiting review</p><p className="mt-1 text-2xl font-bold text-foreground">{pendingReview.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Verified</p><p className="mt-1 text-2xl font-bold text-foreground">{verifiedCount}</p></CardContent></Card>
      </div>
      {reviewLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading attendance sessions…</p>}
      {!reviewLoading && reviewSessions.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No attendance sessions are available in your permitted scope yet.</CardContent></Card>}
      <div className="space-y-3">
        {reviewSessions.map((record) => (
          <Card key={record.id}>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="size-5" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{record.academic_classes?.name || "Class"}{record.academic_classes?.division ? ` · ${record.academic_classes.division}` : ""}</h2>
                    <Badge variant={record.status === "verified" ? "success" : record.status === "submitted" ? "warning" : "outline"}>{record.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{record.departments?.name || "Department"} · {record.academic_subjects?.name || record.session_label || "Attendance session"}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /> {record.session_date ? new Date(record.session_date + "T00:00:00").toLocaleDateString("en-IN") : "—"}{record.submitted_at ? ` · Submitted ${new Date(record.submitted_at).toLocaleString("en-IN")}` : ""}</p>
                  {record.review_note && <p className="mt-2 rounded-lg bg-warning/10 p-2 text-xs text-foreground">Correction note: {record.review_note}</p>}
                </div>
              </div>
              {canReviewAttendance && record.status === "submitted" && (
                <div className="flex shrink-0 flex-col gap-2 md:w-72">
                  {returningSessionId === record.id && <textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} maxLength={1000} rows={2} placeholder="Explain the required correction…" className="w-full rounded-lg border border-input bg-background p-2 text-xs outline-none focus:border-primary" />}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleAttendanceReview(record, "verified")} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><ShieldCheck className="size-3.5" /> Verify</button>
                    {returningSessionId === record.id
                      ? <button onClick={() => handleAttendanceReview(record, "returned")} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"><RotateCcw className="size-3.5" /> Send back</button>
                      : <button onClick={() => { setReturningSessionId(record.id); setReviewReason(""); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"><RotateCcw className="size-3.5" /> Return for correction</button>}
                  </div>
                </div>
              )}
              {!canReviewAttendance && record.status === "submitted" && <p className="text-xs text-muted-foreground">Awaiting review by department leadership.</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
