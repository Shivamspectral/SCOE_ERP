import React, { useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  User,
  Calculator,
  FileUp,
  Download,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { attendanceData, college, student } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

export function AttendancePage() {
  const { toast } = usePortal();
  const [filterType, setFilterType] = useState("All");
  const [calcTarget, setCalcTarget] = useState(75);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    reason: "Medical",
    from: "2026-09-16",
    to: "2026-09-17",
    notes: "",
  });

  const subjects = attendanceData.subjects.filter((s) => {
    if (filterType === "All") return true;
    if (filterType === "Theory") return s.type === "Theory";
    if (filterType === "Practical") return s.type === "Practical";
    if (filterType === "Warning") return s.status === "Warning";
    return true;
  });

  const handleApplyLeave = (e) => {
    e.preventDefault();
    setLeaveModalOpen(false);
    toast({
      title: "Leave Application Submitted",
      description: `Your ${leaveForm.reason} leave request from ${leaveForm.from} to ${leaveForm.to} has been submitted to Mentor Prof. R. Kale.`,
      variant: "success",
    });
  };

  const handleDownloadReport = () => {
    toast({
      title: "Attendance Report Downloaded",
      description: `Official attendance statement for ${student.id} generated as PDF.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb Header */}
      <Breadcrumb
        title="Attendance Tracking"
        subtitle={`Live academic attendance records for ${student.name} (${student.id}) · Semester V`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <FileUp className="size-3.5" />
              <span>Apply Duty / Medical Leave</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <Download className="size-3.5 text-primary" />
              <span>Statement PDF</span>
            </button>
          </div>
        }
      />

      {/* Attendance Summary Top Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Overall Attendance</span>
              <Badge variant="success">Safe</Badge>
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">
              {attendanceData.overall}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mandatory SPPU requirement: 75%
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${attendanceData.overall}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Conducted Lectures</span>
              <CheckCircle2 className="size-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">
              {attendanceData.totalConducted}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Across 9 course modules</p>
            <p className="mt-3 text-xs text-success font-medium">100% curriculum on track</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Attended Sessions</span>
              <ClipboardCheck className="size-4 text-success" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-success">
              {attendanceData.totalAttended}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Present in lecture & lab</p>
            <p className="mt-3 text-xs text-muted-foreground font-medium">92.09% lecture accuracy</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Absent Sessions</span>
              <AlertTriangle className="size-4 text-warning" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">
              {attendanceData.totalAbsent}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">12 in Theory of Computation</p>
            <p className="mt-3 text-xs text-warning-foreground font-medium">
              1 Defaulter subject alert
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Defaulter Alert Warning Banner if any subject < 75% */}
      <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">
              Attendance Alert: Theory of Computation (CE-506) is at 70.0%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current attendance is 5.0% below the statutory 75% threshold. You must attend the next 4 consecutive lectures to attain clearance for the Insem exam hall ticket.
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            toast({
              title: "Mentor Appointment",
              description:
                "Appointment notification sent to Prof. R. Kale (HOD Cabin 4). Meeting scheduled for Thursday 2:00 PM.",
              variant: "info",
            })
          }
          className="shrink-0 rounded-lg bg-warning/20 border border-warning/30 px-3 py-1.5 text-xs font-semibold text-warning-foreground hover:bg-warning/30 transition-colors"
        >
          Consult Mentor
        </button>
      </div>

      {/* Subject-Wise Breakdown Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <div>
            <CardTitle>Subject-Wise Attendance Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">
              Detailed theory and laboratory attendance percentages with safe/defaulter status
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Theory", "Practical", "Warning"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterType === f
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="py-3 px-3 font-semibold">Course / Subject</th>
                  <th className="py-3 px-3 font-semibold">Faculty In-Charge</th>
                  <th className="py-3 px-3 font-semibold">Type</th>
                  <th className="py-3 px-3 font-semibold text-center">Conducted</th>
                  <th className="py-3 px-3 font-semibold text-center">Attended</th>
                  <th className="py-3 px-3 font-semibold text-center">Absent</th>
                  <th className="py-3 px-4 font-semibold text-center w-40">Progress</th>
                  <th className="py-3 px-3 font-semibold text-center">Percentage</th>
                  <th className="py-3 px-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {subjects.map((sub) => {
                  const isLow = sub.percentage < 75;
                  const isSafe = sub.percentage >= 85;

                  return (
                    <tr
                      key={sub.code}
                      onClick={() => setSelectedSubject(sub)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {sub.subject}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">{sub.code}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-foreground">{sub.faculty}</span>
                        <span className="block text-[11px] text-muted-foreground">{sub.room}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant={sub.type === "Practical" ? "accent" : "muted"}>
                          {sub.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium text-foreground">
                        {sub.conducted}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-success">
                        {sub.attended}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-destructive">
                        {sub.absent}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLow
                                  ? "bg-destructive"
                                  : isSafe
                                  ? "bg-success"
                                  : "bg-warning"
                              }`}
                              style={{ width: `${Math.min(100, sub.percentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-display text-sm font-bold">
                        <span
                          className={
                            isLow
                              ? "text-destructive"
                              : isSafe
                              ? "text-success"
                              : "text-warning-foreground"
                          }
                        >
                          {sub.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Badge
                          variant={isLow ? "destructive" : isSafe ? "success" : "warning"}
                        >
                          {sub.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Attendance Calculator & Simulator */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-primary" />
              <CardTitle>Attendance Bunk & Recovery Calculator</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulate how many lectures you can safely miss or must attend to meet your target
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-foreground">Target Minimum Attendance:</span>
                <span className="font-bold text-primary font-display text-sm">{calcTarget}%</span>
              </div>
              <input
                type="range"
                min="65"
                max="95"
                step="1"
                value={calcTarget}
                onChange={(e) => setCalcTarget(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>65% (Risk)</span>
                <span>75% (Mandatory)</span>
                <span>85% (Safe)</span>
                <span>95% (Excellence)</span>
              </div>
            </div>

            {/* Calculations preview */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-muted-foreground">Can Safely Miss (Overall):</p>
                <p className="font-display text-xl font-bold text-foreground mt-1">
                  {Math.max(
                    0,
                    Math.floor(
                      (attendanceData.totalAttended -
                        (calcTarget / 100) * attendanceData.totalConducted) /
                        (calcTarget / 100)
                    )
                  )}{" "}
                  <span className="text-xs font-normal text-muted-foreground">lectures</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Without dropping below {calcTarget}% overall.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-muted-foreground">TOC Needed to Reach 75%:</p>
                <p className="font-display text-xl font-bold text-destructive mt-1">
                  4 <span className="text-xs font-normal text-muted-foreground">lectures</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Must attend next 4 classes without absence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Daily Lecture Attendance Log */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-accent" />
              <CardTitle>Recent Session Log</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Daily period-by-period biometric & teacher roll-call logs
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {attendanceData.recentLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{log.subject}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {log.date} · {log.time} · {log.faculty}
                    </p>
                  </div>
                  <Badge
                    variant={
                      log.status === "Present"
                        ? "success"
                        : log.status === "Absent"
                        ? "destructive"
                        : "accent"
                    }
                  >
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Application Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground">
              Apply for Duty / Medical Leave
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Leaves approved by Class Teacher and HOD will be credited as authorized attendance.
            </p>

            <form onSubmit={handleApplyLeave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Leave Category</label>
                <select
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                >
                  <option value="Medical Leave">Medical Leave (Doctor Certificate attached)</option>
                  <option value="On-Duty Council Work">On-Duty Council Work (Technical/Cultural)</option>
                  <option value="University Sports / NSS">University Sports / NSS Event</option>
                  <option value="Hackathon / External Competition">Hackathon / External Competition</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">From Date</label>
                  <input
                    type="date"
                    value={leaveForm.from}
                    onChange={(e) => setLeaveForm({ ...leaveForm, from: e.target.value })}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">To Date</label>
                  <input
                    type="date"
                    value={leaveForm.to}
                    onChange={(e) => setLeaveForm({ ...leaveForm, to: e.target.value })}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Reason & Supporting Details
                </label>
                <textarea
                  rows="3"
                  value={leaveForm.notes}
                  onChange={(e) => setLeaveForm({ ...leaveForm, notes: e.target.value })}
                  placeholder="Specify illness or council duty assignment details…"
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="rounded-lg border border-dashed border-border p-3 text-center text-muted-foreground">
                <FileUp className="size-5 mx-auto text-primary mb-1" />
                <span className="text-[11px] block">Upload Doctor Certificate or Council OD Pass (PDF/JPG)</span>
                <span className="text-[10px] text-muted-foreground/70">Max size 5 MB</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Detail Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant={selectedSubject.status === "Warning" ? "destructive" : "success"}>
                  {selectedSubject.status}
                </Badge>
                <h3 className="font-display text-xl font-bold text-foreground mt-2">
                  {selectedSubject.subject}
                </h3>
                <p className="text-xs text-muted-foreground">{selectedSubject.code}</p>
              </div>
              <p className="font-display text-2xl font-bold text-primary">
                {selectedSubject.percentage}%
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-muted/60 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Conducted</span>
                <span className="font-bold text-foreground text-sm">{selectedSubject.conducted}</span>
              </div>
              <div className="rounded-lg bg-success/10 p-2.5">
                <span className="text-success block text-[11px]">Attended</span>
                <span className="font-bold text-success text-sm">{selectedSubject.attended}</span>
              </div>
              <div className="rounded-lg bg-destructive/10 p-2.5">
                <span className="text-destructive block text-[11px]">Absent</span>
                <span className="font-bold text-destructive text-sm">{selectedSubject.absent}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faculty In-Charge:</span>
                <span className="font-semibold text-foreground">{selectedSubject.faculty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classroom / Lab:</span>
                <span className="font-semibold text-foreground">{selectedSubject.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course Category:</span>
                <span className="font-semibold text-foreground">{selectedSubject.type} Course</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSubject(null)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
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
