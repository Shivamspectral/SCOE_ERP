import React, { useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  RotateCcw,
  Search,
  Filter,
  Download,
  Calendar,
  BookOpen,
  MapPin,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";
import { academicApi, attendanceApi, studentsApi } from "../lib/api";

export function FacultyClassesPage() {
  const {
    facultyClassesList,
    attendanceSheet: demoAttendanceSheet,
    toggleStudentAttendance,
    markAllClassAttendance,
    saveAttendanceSheet,
    addSystemLog,
    toast,
    backendConfigured,
    isAuthenticated,
    session,
  } = usePortal();

  const [liveClasses, setLiveClasses] = useState(null);
  const [liveRoster, setLiveRoster] = useState([]);
  const [liveAttendanceSession, setLiveAttendanceSession] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  useEffect(() => {
    if (!liveSession) return;
    let cancelled = false;
    academicApi.classes({ status: "active" }).then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      const mapped = rows.map((row) => ({
        id: row.id,
        courseName: row.name,
        courseCode: row.name,
        division: row.division || "—",
        branch: row.departments?.name || "",
        year: row.year_of_study ? `Year ${row.year_of_study}` : row.academic_year || "",
        academicYear: row.academic_year || "",
        departmentId: row.department_id,
      }));
      setLiveClasses(mapped);
      setSelectedClassId((current) => mapped.some((item) => item.id === current) ? current : (mapped[0]?.id || ""));
    }).catch((error) => {
      console.warn("[classes] unable to load classes", error);
      if (!cancelled) setLiveClasses([]);
    });
    return () => { cancelled = true; };
  }, [liveSession, session?.access_token]);

  const [selectedClassId, setSelectedClassId] = useState("cls-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDivision, setSelectedDivision] = useState("All");

  const availableClasses = liveSession ? (liveClasses ?? []) : facultyClassesList;
  const currentClass = availableClasses.find((item) => item.id === selectedClassId) || availableClasses[0] || {
    id: "", courseName: "No class assigned", courseCode: "", division: "—", branch: "", year: "",
  };
  const currentRoster = liveSession ? liveRoster : demoAttendanceSheet;

  useEffect(() => {
    if (!liveSession || !selectedClassId || !liveClasses?.some((item) => item.id === selectedClassId)) return;
    let cancelled = false;
    setLiveLoading(true);
    Promise.all([
      studentsApi.list({ classId: selectedClassId, status: "active", limit: 200 }),
      attendanceApi.byClass(selectedClassId),
    ]).then(async ([students, sessions]) => {
      const openSession = (Array.isArray(sessions) ? sessions : [])
        .filter((item) => ["draft", "returned"].includes(item.status))
        .sort((left, right) => new Date(right.session_date).getTime() - new Date(left.session_date).getTime())[0] || null;
      const records = openSession ? await attendanceApi.records(openSession.id) : [];
      if (cancelled) return;
      const recordMap = new Map((Array.isArray(records) ? records : []).map((record) => [record.student_id, record]));
      const statusMap = { present: "Present", absent: "Absent", late: "Late", excused: "Excused", on_duty: "On Duty" };
      setLiveRoster((Array.isArray(students) ? students : []).map((student) => {
        const record = recordMap.get(student.id);
        return {
          id: student.id,
          name: student.full_name,
          rollNo: student.roll_number,
          branch: student.departments?.name || currentClass.branch || "",
          status: statusMap[record?.attendance_status] || "Pending",
          attendance: "",
          note: record?.note || "",
          recordId: record?.id || null,
        };
      }));
      setLiveAttendanceSession(openSession);
    }).catch((error) => {
      console.warn("[attendance] unable to load class roster", error);
      if (!cancelled) { setLiveRoster([]); setLiveAttendanceSession(null); }
    }).finally(() => { if (!cancelled) setLiveLoading(false); });
    return () => { cancelled = true; };
  }, [liveSession, selectedClassId, liveClasses, session?.access_token]);

  const handleToggle = (studentId, status) => {
    if (liveSession) setLiveRoster((prev) => prev.map((student) => student.id === studentId ? { ...student, status } : student));
    else toggleStudentAttendance(studentId, status);
  };

  const handleMarkAll = (status) => {
    if (liveSession) setLiveRoster((prev) => prev.map((student) => ({ ...student, status })));
    else markAllClassAttendance(status);
  };

  // Filter students
  const filteredStudents = currentRoster.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const presentCount = currentRoster.filter((s) => s.status === "Present").length;
  const absentCount = currentRoster.filter((s) => s.status === "Absent").length;
  const lateCount = currentRoster.filter((s) => s.status === "Late").length;
  const attendanceRate = currentRoster.length ? Math.round((presentCount / currentRoster.length) * 100) : 0;

  const handleSave = async () => {
    if (liveSession) {
      if (!currentClass.id || !liveRoster.length) {
        toast({ title: "No roster available", description: "No active students were returned for this class.", variant: "warning" });
        return;
      }
      if (liveRoster.some((student) => student.status === "Pending")) {
        toast({ title: "Attendance incomplete", description: "Mark each student before saving the session.", variant: "warning" });
        return;
      }
      const statusMap = { Present: "present", Absent: "absent", Late: "late", Excused: "excused", "On Duty": "on_duty" };
      try {
        let sessionRecord = liveAttendanceSession;
        if (!sessionRecord) {
          sessionRecord = await attendanceApi.createSession({
            classId: currentClass.id,
            sessionDate: new Date().toISOString().slice(0, 10),
            sessionLabel: "Daily attendance",
            academicYear: currentClass.academicYear || undefined,
          });
        }
        await attendanceApi.markRecords(sessionRecord.id, liveRoster.map((student) => ({
          studentId: student.id,
          status: statusMap[student.status] || "absent",
          note: student.note || undefined,
        })));
        setLiveAttendanceSession(sessionRecord);
        addSystemLog(`Attendance saved for ${currentClass.courseName}: ${presentCount} present, ${absentCount} absent`, "Success");
        toast({ title: "Attendance saved", description: "Records were saved to the institutional database.", variant: "success" });
      } catch (error) {
        toast({ title: "Attendance save failed", description: error?.message || "The session could not be saved.", variant: "error" });
      }
      return;
    }

    saveAttendanceSheet(currentClass.id);
    addSystemLog(
      `Marked attendance for ${currentClass.courseName} (${currentClass.division}): ${presentCount} Present, ${absentCount} Absent`,
      "Success"
    );
    toast({
      title: "Attendance Saved & Synchronized",
      description: `Updated record for ${currentClass.courseName} (${presentCount}/${currentRoster.length} Present).`,
      variant: "success",
    });
  };

  const handleSubmitAttendance = async () => {
    if (!liveSession) {
      toast({ title: "Preview only", description: "Demo attendance is not submitted to college records.", variant: "info" });
      return;
    }
    if (!liveAttendanceSession?.id) {
      toast({ title: "Save attendance first", description: "Save the complete roll call before submitting it for HOD review.", variant: "warning" });
      return;
    }
    if (liveRoster.some((student) => student.status === "Pending")) {
      toast({ title: "Attendance incomplete", description: "Every active student must have an attendance status before submission.", variant: "warning" });
      return;
    }
    try {
      const submitted = await attendanceApi.submit(liveAttendanceSession.id);
      setLiveAttendanceSession((current) => ({ ...current, ...submitted }));
      toast({ title: "Attendance submitted", description: "The session is now locked for editing and awaits authorized department review.", variant: "success" });
    } catch (error) {
      toast({ title: "Submission failed", description: error?.message || "The attendance session could not be submitted.", variant: "error" });
    }
  };

  const handleExportCSV = () => {
    const headers = "Roll No,Student ID,Name,Branch,Status,Overall Attendance\n";
    const rows = filteredStudents
      .map(
        (s) =>
          `"${s.rollNo}","${s.id}","${s.name}","${s.branch}","${s.status}","${s.attendance}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Attendance_${currentClass.courseCode}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Attendance Sheet Exported",
      description: `Downloaded attendance roll for ${currentClass.courseName}.`,
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Classes & Attendance" },
        ]}
      />

      {liveSession && liveAttendanceSession?.status === "returned" && liveAttendanceSession?.review_note && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
          <p className="font-semibold">Attendance returned for correction</p>
          <p className="mt-1 text-muted-foreground">{liveAttendanceSession.review_note}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Classes & Daily Attendance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage course batches, take digital roll call, and synchronize session logs with the SPPU ERP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleSave}
            disabled={liveSession && Boolean(liveAttendanceSession?.status && !["draft", "returned"].includes(liveAttendanceSession.status))}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" />
            <span>{liveAttendanceSession?.status === "submitted" ? "Submitted" : liveAttendanceSession?.status === "verified" ? "Verified" : "Save Attendance"}</span>
          </button>
          {liveSession && (
            <button
              onClick={handleSubmitAttendance}
              disabled={!liveAttendanceSession?.id || !["draft", "returned"].includes(liveAttendanceSession.status)}
              className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              <span>{liveAttendanceSession?.status === "submitted" ? "Submitted for review" : liveAttendanceSession?.status === "verified" ? "Verified" : "Submit for review"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Class Cards Selector */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {availableClasses.map((cls) => {
          const isSelected = cls.id === selectedClassId;
          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                    {cls.courseCode}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {cls.division}
                  </span>
                </div>
                <h3 className="mt-2.5 font-display text-sm font-bold text-foreground line-clamp-1">
                  {cls.courseName}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground/70" />
                    <span>{cls.time}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground/70" />
                    <span>{cls.room}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Syllabus Progress</span>
                  <span className="font-semibold text-foreground">{cls.syllabusCompleted}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${cls.syllabusCompleted}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Session Overview Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current Session
          </span>
          <h2 className="mt-0.5 font-display text-lg font-bold text-foreground">
            {currentClass.courseName} ({currentClass.year} {currentClass.division})
          </h2>
          <p className="text-xs text-muted-foreground">
            Scheduled: {currentClass.time} · Room: {currentClass.room} · Batch: {currentClass.batch}
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-1.5 text-center">
            <span className="block text-[11px] font-medium text-success">Present</span>
            <span className="font-display text-lg font-bold text-success">{presentCount}</span>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 text-center">
            <span className="block text-[11px] font-medium text-destructive">Absent</span>
            <span className="font-display text-lg font-bold text-destructive">{absentCount}</span>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-1.5 text-center">
            <span className="block text-[11px] font-medium text-warning-foreground">Late</span>
            <span className="font-display text-lg font-bold text-warning-foreground">{lateCount}</span>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-center">
            <span className="block text-[11px] font-medium text-primary">Session Rate</span>
            <span className="font-display text-lg font-bold text-primary">{attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* Filter and Quick Action Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
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

          {/* Status Filter Tabs */}
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            {["All", "Present", "Absent", "Late"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMarkAll("Present")}
            className="flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/20 transition-colors"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Mark All Present</span>
          </button>
          <button
            onClick={() => handleMarkAll("Absent")}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
          >
            <XCircle className="size-3.5" />
            <span>Mark All Absent</span>
          </button>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">PRN / ID</th>
                <th className="px-4 py-3 text-center">Semester Record</th>
                <th className="px-4 py-3 text-center">Session Status</th>
                <th className="px-4 py-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No students match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">
                      {s.rollNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {s.avatar}
                        </div>
                        <span className="font-semibold text-foreground">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {s.id}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                        {s.attendance}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          s.status === "Present"
                            ? "bg-success/15 text-success"
                            : s.status === "Absent"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-warning/15 text-warning-foreground"
                        }`}
                      >
                        {s.status === "Present" && <CheckCircle2 className="size-3" />}
                        {s.status === "Absent" && <XCircle className="size-3" />}
                        {s.status === "Late" && <Clock className="size-3" />}
                        <span>{s.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
                        <button
                          onClick={() => handleToggle(s.id, "Present")}
                          className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                            s.status === "Present"
                              ? "bg-success text-white shadow-sm"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          title="Mark Present"
                        >
                          P
                        </button>
                        <button
                          onClick={() => handleToggle(s.id, "Absent")}
                          className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                            s.status === "Absent"
                              ? "bg-destructive text-white shadow-sm"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          title="Mark Absent"
                        >
                          A
                        </button>
                        <button
                          onClick={() => handleToggle(s.id, "Late")}
                          className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                            s.status === "Late"
                              ? "bg-warning text-warning-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          title="Mark Late"
                        >
                          L
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
