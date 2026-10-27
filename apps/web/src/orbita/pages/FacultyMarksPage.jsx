import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  Save,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  Sparkles,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";
import { isBackendConfigured, marksApi, studentsApi } from "../lib/api";

export function FacultyMarksPage() {
  const { marksList: previewMarks, updateStudentMarks: updatePreviewMarks, addSystemLog, toast, session } = usePortal();
  const [liveMarks, setLiveMarks] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isBackendConfigured || !session?.access_token) return;
    let cancelled = false;
    Promise.all([studentsApi.list({ status: "active", limit: 200 }), marksApi.list({ limit: 300 })])
      .then(([students, records]) => {
        if (cancelled || !Array.isArray(students) || !Array.isArray(records)) return;
        const rows = students.map((student) => {
          const studentRecords = records.filter((record) => record.student_id === student.id);
          const inSem = studentRecords.find((record) => /in.?sem|internal/i.test(record.assessment_name));
          const endSem = studentRecords.find((record) => /end.?sem|university/i.test(record.assessment_name));
          return {
            ...student,
            id: student.id,
            name: student.full_name || student.name || "Unnamed student",
            rollNo: student.roll_number || student.rollNo || "",
            marksInSem: Number(inSem?.marks_obtained ?? 0),
            marksEndSem: Number(endSem?.marks_obtained ?? 0),
            inSemRecordId: inSem?.id || null,
            endSemRecordId: endSem?.id || null,
          };
        });
        setLiveMarks(rows);
      })
      .catch((error) => console.warn("[marks] live marks could not be loaded", error));
    return () => { cancelled = true; };
  }, [session?.access_token]);

  const displayedMarks = liveMarks ?? previewMarks;
  const changeMarks = (studentId, inSem, endSem) => {
    if (liveMarks) {
      setLiveMarks((prev) => prev.map((student) => student.id === studentId
        ? { ...student, marksInSem: Number(inSem), marksEndSem: Number(endSem) }
        : student));
    } else {
      updatePreviewMarks(studentId, inSem, endSem);
    }
  };

  const persistMarks = async () => {
    if (!isBackendConfigured || !session?.access_token || !liveMarks) return false;
    setSaving(true);
    try {
      await Promise.all(liveMarks.flatMap((student) => [
        student.inSemRecordId
          ? marksApi.update({ id: student.inSemRecordId, marksObtained: Number(student.marksInSem || 0) })
          : marksApi.upsert({ studentId: student.id, classId: student.class_id || undefined, assessmentName: "In-Sem", maxMarks: 30, marksObtained: Number(student.marksInSem || 0) }),
        student.endSemRecordId
          ? marksApi.update({ id: student.endSemRecordId, marksObtained: Number(student.marksEndSem || 0) })
          : marksApi.upsert({ studentId: student.id, classId: student.class_id || undefined, assessmentName: "End-Sem", maxMarks: 70, marksObtained: Number(student.marksEndSem || 0) }),
      ]));
      const records = await marksApi.list({ limit: 300 });
      if (Array.isArray(records)) setLiveMarks((prev) => prev.map((student) => {
        const rows = records.filter((record) => record.student_id === student.id);
        return {
          ...student,
          inSemRecordId: rows.find((record) => /in.?sem|internal/i.test(record.assessment_name))?.id || student.inSemRecordId,
          endSemRecordId: rows.find((record) => /end.?sem|university/i.test(record.assessment_name))?.id || student.endSemRecordId,
        };
      }));
      return true;
    } finally {
      setSaving(false);
    }
  };

  const [selectedExam, setSelectedExam] = useState("In-Sem");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStanding, setFilterStanding] = useState("All");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const filteredStudents = displayedMarks.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    const total = (s.marksInSem || 0) + (s.marksEndSem || 0);
    const matchesStanding =
      filterStanding === "All" ||
      (filterStanding === "Distinction" && total >= 75) ||
      (filterStanding === "First Class" && total >= 60 && total < 75) ||
      (filterStanding === "Needs Attention" && total < 50);

    return matchesSearch && matchesStanding;
  });

  const handleSaveMarks = async () => {
    try {
      const saved = await persistMarks();
      if (!saved) {
        toast({ title: "Demo preview only", description: "These sample marks are not connected to a college database and will not be saved.", variant: "info" });
        return;
      }
      addSystemLog("Saved draft examination marks", "Success");
      toast({ title: "Draft marks saved", description: "Marks were saved to the institutional database.", variant: "success" });
    } catch (error) {
      toast({ title: "Could not save marks", description: error?.message || "Check your access and try again.", variant: "error" });
    }
  };

  const handleSubmitToSPPU = async () => {
    setConfirmModalOpen(false);
    try {
      const saved = await persistMarks();
      if (!saved) {
        toast({ title: "Demo preview only", description: "Sample marks cannot be submitted to an institution or SPPU.", variant: "info" });
        return;
      }
      const records = await marksApi.list({ limit: 300 });
      const ids = new Set(liveMarks.flatMap((student) => [student.inSemRecordId, student.endSemRecordId]).filter(Boolean));
      await Promise.all((records || []).filter((record) => ids.has(record.id) && ["draft", "returned"].includes(record.status)).map((record) => marksApi.submit(record.id)));
      addSystemLog("Submitted examination marks for internal review", "Success");
      toast({ title: "Submitted for internal review", description: "The marks are recorded in the ERP review workflow. This does not upload anything to SPPU.", variant: "success" });
    } catch (error) {
      toast({ title: "Submission failed", description: error?.message || "Check your access and try again.", variant: "error" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academics", href: "/academics" },
          { label: "Exams & Marks Entry" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Exams & Marks Evaluation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter In-Semester (30) and End-Semester (70) theory & practical assessment scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveMarks} disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
          >
            <Save className="size-4 text-muted-foreground" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => setConfirmModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Send className="size-4" />
            <span>Submit for Review</span>
          </button>
        </div>
      </div>

      {/* Course Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subject Evaluation
          </span>
          <h2 className="mt-0.5 font-display text-lg font-bold text-foreground">
            Data Structures & Algorithms (310242)
          </h2>
          <p className="text-xs text-muted-foreground">
            Class: TE Computer Div A · Academic Year: 2025-26 Term I · Coordinator: Prof. R. Kale
          </p>
        </div>

        {/* Evaluation Weights */}
        <div className="flex items-center gap-4 text-xs">
          <div className="rounded-lg bg-muted/60 p-2.5 text-center">
            <span className="block text-muted-foreground">In-Sem Exam</span>
            <span className="font-display text-sm font-bold text-foreground">Max 30</span>
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5 text-center">
            <span className="block text-muted-foreground">End-Sem Exam</span>
            <span className="font-display text-sm font-bold text-foreground">Max 70</span>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-center">
            <span className="block text-primary font-medium">Total Marks</span>
            <span className="font-display text-sm font-bold text-primary">100</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student or roll no…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter:</span>
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            {["All", "Distinction", "First Class", "Needs Attention"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStanding(f)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterStanding === f
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 text-center">In-Sem (30)</th>
                <th className="px-4 py-3 text-center">End-Sem (70)</th>
                <th className="px-4 py-3 text-center">Total (100)</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredStudents.map((s) => {
                const inSem = s.marksInSem || 0;
                const endSem = s.marksEndSem || 0;
                const total = inSem + endSem;
                let grade = "F";
                if (total >= 80) grade = "O (Outstanding)";
                else if (total >= 70) grade = "A+ (Excellent)";
                else if (total >= 60) grade = "A (Very Good)";
                else if (total >= 50) grade = "B+ (Good)";
                else if (total >= 40) grade = "P (Pass)";

                const isPass = total >= 40;

                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">
                      {s.rollNo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{s.id}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={s.marksInSem}
                        onChange={(e) =>
                          changeMarks(s.id, e.target.value, s.marksEndSem)
                        }
                        className="h-8 w-16 rounded border border-input bg-card text-center font-mono text-xs font-semibold text-foreground focus:border-primary outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="70"
                        value={s.marksEndSem}
                        onChange={(e) =>
                          changeMarks(s.id, s.marksInSem, e.target.value)
                        }
                        className="h-8 w-16 rounded border border-input bg-card text-center font-mono text-xs font-semibold text-foreground focus:border-primary outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-foreground">
                      {total}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                      {grade}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isPass
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {isPass ? "Passed" : "Needs Retest"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground">
              Confirm Submission to SPPU
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to lock and transmit final continuous assessment marks for TE Computer Div A? Once submitted, modifications require HOD & Principal authorization.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitToSPPU}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
