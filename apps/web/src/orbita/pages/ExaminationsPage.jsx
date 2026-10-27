import React, { useState } from "react";
import {
  GraduationCap,
  Calendar,
  Clock,
  Download,
  Award,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { student, college } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

export function ExaminationsPage() {
  const { toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  const insemSchedule = [
    { code: "CE-501", subject: "Data Structures", date: "28 Sep 2026", time: "10:30 AM - 11:30 AM", room: "Hall A-102", marks: 30, units: "Units I & II" },
    { code: "CE-502", subject: "Database Management Systems", date: "29 Sep 2026", time: "10:30 AM - 11:30 AM", room: "Hall A-102", marks: 30, units: "Units I & II" },
    { code: "CE-503", subject: "Operating Systems", date: "30 Sep 2026", time: "10:30 AM - 11:30 AM", room: "Hall A-104", marks: 30, units: "Units I & II" },
    { code: "CE-504", subject: "Computer Networks", date: "01 Oct 2026", time: "10:30 AM - 11:30 AM", room: "Hall A-104", marks: 30, units: "Units I & II" },
    { code: "CE-505", subject: "Software Engineering", date: "03 Oct 2026", time: "10:30 AM - 11:30 AM", room: "Hall B-201", marks: 30, units: "Units I & II" },
    { code: "CE-506", subject: "Theory of Computation", date: "04 Oct 2026", time: "10:30 AM - 11:30 AM", room: "Hall B-201", marks: 30, units: "Units I & II" },
  ];

  const handleDownloadHallTicket = () => {
    toast({
      title: "Hall ticket unavailable",
      description: liveSession
        ? "Official hall-ticket generation is not connected to the institutional backend. No document was downloaded."
        : "This is sample preview data only. No official hall ticket or barcode was generated.",
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Examinations & University Results"
        subtitle="SPPU In-semester & End-semester examination timetables, hall tickets and grade transcripts"
        actions={
          <button
            onClick={handleDownloadHallTicket}
            disabled={liveSession}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Download className="size-3.5" />
            <span>Download In-sem Hall Ticket</span>
          </button>
        }
      />

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status">
        <strong>Preview data only.</strong> Examination dates, seat numbers, grades and CGPA on this screen are sample values, not verified college or SPPU records. Official examination data and hall-ticket downloads are not connected.
      </div>

      {/* Top Academic Standing Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Cumulative CGPA</span>
            <p className="font-display text-2xl font-bold text-foreground mt-1">{student.cgpa}</p>
            <Badge variant="success" className="mt-2 text-[10px]">Rank 4 in Department</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Exam Seat / PRN</span>
            <p className="font-mono text-lg font-bold text-foreground mt-1">{student.prn}</p>
            <span className="text-[10px] text-muted-foreground mt-2 block">SPPU Pune Verified</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Credits Cleared</span>
            <p className="font-display text-2xl font-bold text-foreground mt-1">84 / 160</p>
            <span className="text-[10px] text-success font-medium mt-2 block">0 Backlogs (All Clear)</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Examination Centre</span>
            <p className="font-semibold text-foreground text-sm mt-1">{college.short} Campus</p>
            <span className="text-[10px] text-muted-foreground mt-2 block">Centre Code: 6149</span>
          </CardContent>
        </Card>
      </div>

      {/* In-sem Exam Timetable Schedule */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
          <div>
            <CardTitle>Semester V In-Semester Theory Timetable (September 2026)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Conducted by Savitribai Phule Pune University (SPPU)
            </p>
          </div>
          <Badge variant="default">Commencing 28 Sep</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3">Subject / Course</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Examination Hall</th>
                  <th className="py-2.5 px-3 text-center">Max Marks</th>
                  <th className="py-2.5 px-3">Syllabus Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {insemSchedule.map((exam) => (
                  <tr key={exam.code} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-foreground text-sm">{exam.subject}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{exam.code}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{exam.date}</td>
                    <td className="py-3 px-3 text-muted-foreground">{exam.time}</td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-muted px-2 py-0.5 font-medium text-foreground">
                        {exam.room}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-primary">{exam.marks}</td>
                    <td className="py-3 px-3 text-muted-foreground">{exam.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Semester Results History */}
      <Card>
        <CardHeader>
          <CardTitle>Semester SGPA History & Grade Cards</CardTitle>
          <p className="text-xs text-muted-foreground">Official university grade results across preceding academic years</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {student.sgpaHistory.map((s) => (
              <div key={s.sem} className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-foreground text-base">{s.sem}</span>
                    <Badge variant="success">{s.status}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">Credits Earned: {s.credits}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">SGPA</span>
                    <span className="font-display text-2xl font-bold text-primary">{s.sgpa}</span>
                  </div>
                  <button
                    onClick={() => toast({ title: "Result sheet unavailable", description: "No official grade card is attached to this preview; nothing was downloaded.", variant: "info" })}
                    disabled={liveSession}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View Sheet →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
