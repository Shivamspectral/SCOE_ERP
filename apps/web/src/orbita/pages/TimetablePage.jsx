import React, { useEffect, useState } from "react";
import { Clock, MapPin, Download, Filter, Calendar, User, BookOpen, Plus, Save, X } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { weeklyTimetable, college } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

const groupTimetableRows = (rows) => {
  const dayNames = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
  const grouped = {};
  (rows || []).forEach((row) => {
    const day = dayNames[row.day_of_week];
    if (!day) return;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push({
      subject: row.subject,
      type: /lab|practical/i.test(row.subject) ? "Lab" : "Lecture",
      time: `${String(row.starts_at).slice(0, 5)} - ${String(row.ends_at).slice(0, 5)}`,
      room: row.room || "Room not assigned",
      faculty: row.faculty_name || "",
      cohort: row.cohort,
      department_id: row.department_id,
      faculty_id: row.faculty_id,
      id: row.id,
    });
  });
  return grouped;
};
import { academicApi, facultyApi } from "../lib/api";

export function TimetablePage() {
  const { toast, backendConfigured, isAuthenticated, session, departments, activeProfile, userRole } = usePortal();
  const [liveTimetable, setLiveTimetable] = useState(null);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryForm, setEntryForm] = useState({ departmentId: "", facultyId: "", subject: "", cohort: "", room: "", dayOfWeek: "1", startsAt: "09:00", endsAt: "10:00" });

  useEffect(() => {
    if (!backendConfigured || !isAuthenticated || !session?.access_token) return;
    let cancelled = false;
    setTimetableLoading(true);
    setLiveTimetable(null);
    academicApi.timetable().then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      if (!cancelled) setLiveTimetable(groupTimetableRows(rows));
    }).catch((error) => {
      console.warn("[timetable] unable to load live schedule", error);
      if (!cancelled) {
        setLiveTimetable({});
        toast({ title: "Could not load institutional timetable", description: error?.message || "The live schedule is unavailable.", variant: "error" });
      }
    }).finally(() => { if (!cancelled) setTimetableLoading(false); });
    return () => { cancelled = true; };
  }, [backendConfigured, isAuthenticated, session?.access_token, toast]);
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const canManageTimetable = ["Principal", "HOD", "Coordinator", "Administrator"].includes(userRole);
  const matchingDepartment = departments.find((department) => department.name?.toLowerCase() === activeProfile?.dept?.toLowerCase());
  const selectedDepartmentId = entryForm.departmentId || matchingDepartment?.id || departments[0]?.id || "";

  useEffect(() => {
    if (!liveSession) { setFacultyOptions([]); return; }
    let cancelled = false;
    facultyApi.list().then((rows) => { if (!cancelled) setFacultyOptions(Array.isArray(rows) ? rows : Array.isArray(rows?.data) ? rows.data : []); })
      .catch((error) => { console.warn("[timetable] faculty directory unavailable", error); if (!cancelled) setFacultyOptions([]); });
    return () => { cancelled = true; };
  }, [liveSession, session?.access_token]);

  const createTimetableEntry = async (event) => {
    event.preventDefault();
    if (!liveSession) return toast({ title: "Demo preview only", description: "Sample timetable entries are read-only.", variant: "info" });
    if (!selectedDepartmentId || !entryForm.facultyId || !entryForm.subject.trim() || !entryForm.cohort.trim() || !entryForm.startsAt || !entryForm.endsAt) {
      return toast({ title: "Missing timetable details", description: "Choose a department and faculty member, and complete subject, cohort and time fields.", variant: "warning" });
    }
    if (entryForm.endsAt <= entryForm.startsAt) return toast({ title: "Invalid time range", description: "The end time must be later than the start time.", variant: "warning" });
    setSavingEntry(true);
    try {
      await academicApi.createTimetableEntry({ departmentId: selectedDepartmentId, facultyId: entryForm.facultyId, subject: entryForm.subject.trim(), cohort: entryForm.cohort.trim(), room: entryForm.room.trim() || undefined, dayOfWeek: Number(entryForm.dayOfWeek), startsAt: entryForm.startsAt, endsAt: entryForm.endsAt });
      const rows = await academicApi.timetable();
      setLiveTimetable(groupTimetableRows(Array.isArray(rows) ? rows : []));
      setEntryForm({ departmentId: selectedDepartmentId, facultyId: "", subject: "", cohort: "", room: "", dayOfWeek: "1", startsAt: "09:00", endsAt: "10:00" });
      setShowCreateForm(false);
      toast({ title: "Timetable entry created", description: "The new schedule entry is saved to the institutional timetable.", variant: "success" });
    } catch (error) {
      toast({ title: "Could not create timetable entry", description: error?.message || "Check department scope, faculty assignment and room/cohort conflicts.", variant: "error" });
    } finally { setSavingEntry(false); }
  };
  const schedule = liveSession ? (liveTimetable ?? {}) : weeklyTimetable;
  const [selectedDay, setSelectedDay] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedSlot, setSelectedSlot] = useState(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  const filteredDays = selectedDay === "All" ? days : [selectedDay];

  const handleDownloadPDF = () => {
    const rows = Object.entries(schedule).flatMap(([day, slots]) =>
      (slots || []).map((slot) => ({
        day,
        time: slot.time || "",
        subject: slot.subject || "",
        type: slot.type || "",
        room: slot.room || "",
        faculty: slot.faculty || "",
        cohort: slot.cohort || "",
      }))
    );
    if (timetableLoading) {
      toast({ title: "Timetable is still loading", description: "Wait for the institutional schedule to load before exporting.", variant: "info" });
      return;
    }
    if (rows.length === 0) {
      toast({ title: "No timetable to export", description: "There are no schedule entries available to export.", variant: "warning" });
      return;
    }
    const columns = ["day", "time", "subject", "type", "room", "faculty", "cohort"];
    const escapeCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [columns.join(","), ...rows.map((row) => columns.map((key) => escapeCell(row[key])).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scoe-timetable.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Timetable exported", description: "A CSV file of the currently available schedule was downloaded.", variant: "success" });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb & Header */}
      <Breadcrumb
        title="Timetable"
        subtitle="Your weekly class schedule for Semester V"
        actions={
          <div className="flex items-center gap-2">
            {canManageTimetable && liveSession && <button onClick={() => setShowCreateForm((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />Add entry</button>}
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <Download className="size-3.5 text-primary" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {showCreateForm && liveSession && <form onSubmit={createTimetableEntry} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium">Department<select value={selectedDepartmentId} onChange={(e) => setEntryForm({ ...entryForm, departmentId: e.target.value, facultyId: "" })} required className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select department…</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <label className="text-xs font-medium">Faculty member<select value={entryForm.facultyId} onChange={(e) => setEntryForm({ ...entryForm, facultyId: e.target.value })} required className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select faculty…</option>{facultyOptions.filter((faculty) => (faculty.roleAssignmentDepartmentId || faculty.department_id) === selectedDepartmentId).map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name || faculty.email || faculty.id}</option>)}</select></label>
        <Field label="Subject / class" value={entryForm.subject} onChange={(value) => setEntryForm({ ...entryForm, subject: value })} required placeholder="Data Structures" />
        <Field label="Cohort / batch" value={entryForm.cohort} onChange={(value) => setEntryForm({ ...entryForm, cohort: value })} required placeholder="SE-CE-A" />
        <Field label="Room / lab" value={entryForm.room} onChange={(value) => setEntryForm({ ...entryForm, room: value })} placeholder="Lab 2" />
        <label className="text-xs font-medium">Day<select value={entryForm.dayOfWeek} onChange={(e) => setEntryForm({ ...entryForm, dayOfWeek: e.target.value })} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{[["1","Monday"],["2","Tuesday"],["3","Wednesday"],["4","Thursday"],["5","Friday"],["6","Saturday"]].map(([value,name]) => <option key={value} value={value}>{name}</option>)}</select></label>
        <Field label="Starts at" type="time" value={entryForm.startsAt} onChange={(value) => setEntryForm({ ...entryForm, startsAt: value })} required />
        <Field label="Ends at" type="time" value={entryForm.endsAt} onChange={(value) => setEntryForm({ ...entryForm, endsAt: value })} required />
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4"><button disabled={savingEntry} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4" />Save timetable</button><button type="button" onClick={() => setShowCreateForm(false)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm"><X className="size-4" />Cancel</button></div>
      </form>}

      {/* Interactive Controls Bar: Day Tabs & Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Day Pills */}
        <div className="scrollbar-thin flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDay("All")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedDay === "All"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Week
          </button>
          {days.map((day) => {
            const isToday = day === currentDayName;
            const active = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{day.slice(0, 3)}</span>
                {isToday && (
                  <span
                    className={`size-1.5 rounded-full ${
                      active ? "bg-accent" : "bg-primary"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="size-3.5" />
          <span className="hidden sm:inline">Type:</span>
          <div className="flex items-center gap-1">
            {["All", "Lecture", "Lab"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-muted font-semibold text-foreground"
                    : "hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {timetableLoading && <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Loading institutional timetable…</div>}

      {/* Week Grid matching original reference */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredDays.map((day) => {
          const isToday = day === currentDayName;
          const slots = schedule[day] || [];
          const visibleSlots = slots.filter((slot) => {
            if (typeFilter === "All") return true;
            if (typeFilter === "Lab") return slot.type.includes("Lab") || slot.type === "Project";
            if (typeFilter === "Lecture") return slot.type === "Lecture" || slot.type === "Guest";
            return true;
          });

          return (
            <div
              key={day}
              data-slot="card"
              className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all ${
                isToday ? "ring-2 ring-primary/40 shadow-md" : ""
              }`}
            >
              <div data-slot="card-content" className="p-5">
                {/* Day Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {day}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({visibleSlots.length} {visibleSlots.length === 1 ? "session" : "sessions"})
                    </span>
                  </div>
                  {isToday && <Badge variant="default">Today</Badge>}
                </div>

                {/* Slots List */}
                <div className="space-y-2">
                  {visibleSlots.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                      No {typeFilter} sessions scheduled for {day}
                    </div>
                  ) : (
                    visibleSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedSlot({ ...slot, day })}
                        className="group cursor-pointer rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {slot.subject}
                          </p>
                          <Badge
                            variant={
                              slot.type === "Lab" || slot.type === "Project"
                                ? "accent"
                                : slot.type === "Guest"
                                ? "success"
                                : "muted"
                            }
                            className="text-[10px] px-2 py-0"
                          >
                            {slot.type}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="lucide-clock size-3 text-muted-foreground" />{" "}
                            {slot.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="lucide-map-pin size-3 text-muted-foreground" />{" "}
                            {slot.room}
                          </span>
                          {slot.faculty && (
                            <span className="flex items-center gap-1 text-muted-foreground/80">
                              <User className="size-3" />
                              {slot.faculty}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Callout */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 text-xs text-muted-foreground flex items-start gap-3">
        <BookOpen className="size-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Academic Timetable Guidelines</p>
          <p className="mt-0.5 leading-relaxed">
            Attendance is mandatory for all lecture and lab sessions. 75% minimum attendance is compulsory to be eligible for SPPU University Insem & Endsem examinations. For lab batch allocations or clash queries, contact your respective Class Teacher (Prof. R. Kale).
          </p>
        </div>
      </div>

      {/* Detailed Slot Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {selectedSlot.day} Session Detail
                </span>
                <h3 className="font-display text-xl font-bold text-foreground mt-1">
                  {selectedSlot.subject}
                </h3>
              </div>
              <Badge variant={selectedSlot.type === "Lab" ? "accent" : "default"}>
                {selectedSlot.type}
              </Badge>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-border py-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" /> Time Slot
                </span>
                <span className="font-semibold text-foreground">{selectedSlot.time}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-accent" /> Venue / Room
                </span>
                <span className="font-semibold text-foreground">{selectedSlot.room}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-chart-5" /> Faculty In-Charge
                </span>
                <span className="font-semibold text-foreground">{selectedSlot.faculty}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2">
                <span className="text-muted-foreground">Department & Year</span>
                <span className="font-semibold text-foreground">Computer Engineering · TE Div A</span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Syllabus Module Active</p>
              <p className="mt-0.5">
                Unit III: Implementation algorithms, complexity analysis and practical evaluation.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSlot(null)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }) {
  return <label className="text-xs font-medium">{label}<input type={type} value={value ?? ""} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label>;
}
