import React, { useEffect, useState } from "react";
import { BookOpen, User, Download, FileText, CheckCircle2, Sparkles, Building } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { faculty, college, syllabusCompletion } from "../data/portalData";
import { usePortal } from "../context/PortalContext";
import { academicApi } from "../lib/api";

export function AcademicsPage() {
  const { toast, backendConfigured, isAuthenticated, session } = usePortal();

  const courses = [
    { code: "CE-501", name: "Data Structures", credits: 4, type: "Theory + Lab", hours: "4L + 2P", faculty: "Prof. R. Kale", progress: 78, units: ["Unit I: Stacks & Queues", "Unit II: Trees & BST", "Unit III: Graphs & Shortest Path", "Unit IV: Hashing & Heaps"] },
    { code: "CE-502", name: "Database Management Systems", credits: 4, type: "Theory + Lab", hours: "4L + 2P", faculty: "Prof. A. Deshmukh", progress: 71, units: ["Unit I: ER Modeling & Relational Algebra", "Unit II: SQL & Constraints", "Unit III: Normalization 1NF to BCNF", "Unit IV: Transactions & ACID"] },
    { code: "CE-503", name: "Operating Systems", credits: 3, type: "Theory + Lab", hours: "3L + 2P", faculty: "Dr. S. Pawar", progress: 64, units: ["Unit I: OS Architecture & System Calls", "Unit II: Process Synchronization & IPC", "Unit III: CPU Scheduling", "Unit IV: Memory Management & Paging"] },
    { code: "CE-504", name: "Computer Networks", credits: 3, type: "Theory + Lab", hours: "3L + 2P", faculty: "Dr. M. Joshi", progress: 52, units: ["Unit I: Physical & Data Link Layers", "Unit II: Medium Access Sublayer", "Unit III: Network Layer & IPv4/IPv6", "Unit IV: Transport Layer TCP/UDP"] },
    { code: "CE-505", name: "Software Engineering", credits: 3, type: "Theory", hours: "3L", faculty: "Prof. N. Kulkarni", progress: 85, units: ["Unit I: Agile & Waterfall Models", "Unit II: SRS & Requirements", "Unit III: UML & System Design", "Unit IV: Testing & QA"] },
    { code: "CE-506", name: "Theory of Computation", credits: 3, type: "Theory", hours: "3L", faculty: "Dr. V. Shinde", progress: 60, units: ["Unit I: Regular Expressions & Finite Automata", "Unit II: Context-Free Grammars", "Unit III: Pushdown Automata", "Unit IV: Turing Machines"] },
  ];

  const [liveCourses, setLiveCourses] = useState(null);
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  useEffect(() => {
    if (!liveSession) return;
    let cancelled = false;
    Promise.all([academicApi.subjects({ status: "active" }), academicApi.syllabus()])
      .then(([subjects, syllabus]) => {
        if (cancelled) return;
        const progressRows = Array.isArray(syllabus) ? syllabus : [];
        const rows = (Array.isArray(subjects) ? subjects : []).map((subject) => {
          const units = progressRows.filter((row) => row.subject?.toLowerCase() === subject.name?.toLowerCase());
          const planned = units.reduce((sum, row) => sum + (Number(row.planned_hours) || 0), 0);
          const completed = units.reduce((sum, row) => sum + (Number(row.completed_hours) || 0), 0);
          return {
            code: subject.code || subject.name?.slice(0, 8) || subject.id,
            name: subject.name,
            credits: Number(subject.credits) || 0,
            type: "Course",
            hours: `${Number(subject.credits) || 0} credits`,
            faculty: "Assigned faculty",
            progress: planned ? Math.round((completed / planned) * 100) : 0,
            units: units.map((row) => row.unit),
          };
        });
        setLiveCourses(rows);
      })
      .catch((error) => {
        console.warn("[academics] unable to load live curriculum", error);
        if (!cancelled) setLiveCourses([]);
      });
    return () => { cancelled = true; };
  }, [liveSession, session?.access_token]);

  const displayedCourses = liveSession ? (liveCourses ?? []) : courses;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Academics & Curriculum"
        subtitle="Savitribai Phule Pune University (SPPU) 2019 Course Syllabus · Computer Engineering TE"
        actions={
          <button
            onClick={() =>
              toast({
                title: "Curriculum Downloaded",
                description: "SPPU TE Computer Engineering complete syllabus scheme saved.",
                variant: "success",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Download className="size-3.5" />
            <span>Download Syllabus Scheme (PDF)</span>
          </button>
        }
      />

      {/* Courses List */}
      <div className="space-y-4">
        {displayedCourses.map((c) => (
          <Card key={c.code} className="hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{c.code}</span>
                    <Badge variant="accent">{c.type}</Badge>
                    <span className="text-xs text-muted-foreground">{c.hours} Weekly</span>
                  </div>
                  <CardTitle className="text-lg mt-1">{c.name}</CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Credits</span>
                  <span className="font-display font-bold text-foreground text-base">
                    {c.credits} Credits
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Faculty In-Charge: <strong className="text-foreground">{c.faculty}</strong>
                </span>
                <span className="font-semibold text-primary">Syllabus Progress: {c.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${c.progress}%` }}
                />
              </div>

              {/* Units */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border">
                {c.units.map((u, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/30 p-2 text-muted-foreground">
                    <p className="font-medium text-foreground">{u}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Faculty Directory */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="size-4 text-primary" />
            <CardTitle>Department Faculty & Mentors</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Professors and cabin locations for student counseling</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            {faculty.map((f) => (
              <div key={f.id} className="rounded-xl border border-border p-3.5 bg-card flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{f.name}</h4>
                  <p className="text-muted-foreground text-[11px]">{f.designation}</p>
                  <p className="text-primary font-medium text-[11px] mt-1">{f.subject}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border text-[11px] text-muted-foreground flex justify-between items-center">
                  <span>{f.cabin}</span>
                  <a href={`mailto:${f.email}`} className="text-primary hover:underline">
                    Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
