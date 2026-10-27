import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarHeart,
  CheckSquare,
  ClipboardCheck,
  FileCheck,
  FileText,
  GraduationCap,
  LifeBuoy,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { usePortal } from "../context/PortalContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { safeGet } from "../lib/api";
import {
  college,
  attendanceTrend,
  departmentStrength,
  timetable,
  notices,
  noticeCategoryColor,
  events,
  placementStats,
} from "../data/portalData";

const emptySummary = {
  students: 0,
  faculty: 0,
  departments: 0,
  classes: 0,
  subjects: 0,
  assignments: 0,
  mentees: 0,
  pendingApprovals: 0,
  pendingTasks: 0,
  notices: 0,
  attendanceSessions: 0,
  attendanceRate: null,
  averageScore: null,
  lowScoreStudents: 0,
  averageCgpa: null,
  backlogStudents: 0,
  averageBacklogs: null,
};

function MetricCard({ icon: Icon, label, value, detail, onClick, tone = "primary" }) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    accent: "bg-accent/15 text-accent-foreground",
  };
  return (
    <button
      onClick={onClick}
      className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-md sm:gap-3.5 sm:p-4"
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone] || toneClasses.primary} transition-transform group-hover:scale-105 sm:size-11`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">{label}</p>
        <p className="font-display text-base font-bold text-foreground sm:text-xl">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{detail}</p>
      </div>
    </button>
  );
}

export function DashboardPage() {
  const {
    student,
    userRole,
    activeProfile,
    navigate,
    unreadCount,
    registeredEvents,
    approvals,
    tasks,
    facultyClassesList,
    mentees,
    scopeMeta,
  } = usePortal();

  const [greeting, setGreeting] = useState("Good morning");
  const [summary, setSummary] = useState(emptySummary);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    let cancelled = false;
    safeGet("/api/dashboard/summary", undefined, null).then((data) => {
      if (!cancelled && data) setSummary({ ...emptySummary, ...data });
    });
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const pendingApprovalsCount = summary.pendingApprovals || approvals.filter((a) => a.status === "Pending").length;
  const pendingTasksCount = summary.pendingTasks || tasks.filter((t) => !t.completed).length;
  const activeNoticesCount = summary.notices || notices.length;
  const fallbackAverageCgpa = mentees.length
    ? Number((mentees.reduce((sum, item) => sum + Number(item.cgpa || 0), 0) / mentees.length).toFixed(2))
    : null;
  const fallbackBacklogStudents = mentees.filter((item) => Number(item.backlogs || 0) > 0).length;
  const averageCgpa = summary.averageCgpa ?? fallbackAverageCgpa;
  const backlogStudents = summary.backlogStudents ?? fallbackBacklogStudents;
  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isLeadership = ["HOD", "Principal", "Vice-Principal"].includes(userRole);
  const isCollegeWide = ["Principal", "Vice-Principal"].includes(userRole);

  const roleMeta = useMemo(() => {
    if (userRole === "Faculty") {
      return {
        scope: scopeMeta.label,
        heroActions: [
          ["Take Attendance", "/classes"],
          ["Enter Exam Marks", "/marks"],
        ],
        cards: [
          [ClipboardCheck, "Assigned Classes", summary.classes || facultyClassesList.length, "Class/advisor scope", "/classes", "primary"],
          [BookOpen, "Assigned Subjects", summary.subjects || summary.assignments || "—", "Teaching allocation", "/academics", "success"],
          [Users, "Students in Scope", summary.students || "—", "Assigned classes", "/students", "primary"],
          [CheckSquare, "Action Tasks", `${pendingTasksCount} Pending`, "Syllabus & exams", "/tasks", "warning"],
        ],
        secondary: [
          [ClipboardCheck, "Attendance Sessions", summary.attendanceSessions || "—", "Recorded in scope", "/attendance", "primary"],
          [Users, "Mentee Students", summary.mentees || mentees.length, "Assigned mentees", "/mentoring", "success"],
          [FileCheck, "Pending Approvals", pendingApprovalsCount, "Requests awaiting action", "/approvals", "warning"],
          [Bell, "Unread Notices", unreadCount, "Official circulars", "/notices", "accent"],
        ],
      };
    }

    if (userRole === "HOD") {
      return {
        scope: scopeMeta.label,
        heroActions: [
          [`${pendingApprovalsCount} Pending Sanctions`, "/approvals"],
          ["Department Reports", "/reports"],
        ],
        cards: [
          [Users, "Department Students", summary.students || "—", "Active enrolments", "/students", "primary"],
          [Users, "Faculty Members", summary.faculty || "—", "Department staff", "/faculty", "success"],
          [Building2, "Active Classes", summary.classes || "—", "Department classes", "/classes", "primary"],
          [FileCheck, "Pending Approvals", pendingApprovalsCount, "Department requests", "/approvals", "warning"],
        ],
        secondary: [
          [Award, "Average CGPA", averageCgpa !== null ? averageCgpa.toFixed(2) : "—", "Department aggregate", "/reports", "success"],
          [ShieldAlert, "Students with Backlogs", backlogStudents, "At least one active backlog", "/students", "warning"],
          [ClipboardCheck, "Average Academic Score", summary.averageScore !== null ? `${summary.averageScore}%` : "—", "Published marks", "/reports", "primary"],
          [Bell, "Unread Notices", unreadCount, "Department circulars", "/notices", "accent"],
        ],
      };
    }

    if (isCollegeWide) {
      return {
        scope: "College-wide · Institutional Oversight",
        heroActions: [
          [`${pendingApprovalsCount} Pending Sanctions`, "/approvals"],
          ["Departments Overview", "/departments"],
        ],
        cards: [
          [Users, "Total Students", summary.students || "—", "All active enrolments", "/students", "primary"],
          [Users, "Faculty & Staff", summary.faculty || "—", `${summary.departments || "—"} departments`, "/faculty", "success"],
          [Building2, "Departments", summary.departments || "—", "Active departments", "/departments", "primary"],
          [FileCheck, "Pending Approvals", pendingApprovalsCount, "Institutional requests", "/approvals", "warning"],
        ],
        secondary: [
          [Building2, "Active Classes", summary.classes || "—", "College-wide", "/classes", "primary"],
          [ClipboardCheck, "Attendance Sessions", summary.attendanceSessions || "—", "College-wide activity", "/attendance", "primary"],
          [CalendarHeart, "Upcoming Events", `${events.length} Active`, `${registeredEvents.size} registered`, "/events", "success"],
          [Bell, "Unread Notices", unreadCount, "Official circulars", "/notices", "accent"],
        ],
      };
    }

    if (userRole === "Super Admin") {
      return {
        scope: "System Administration · Access & Security",
        heroActions: [["Manage Users", "/users"], ["Security Audit Logs", "/logs"]],
        cards: [
          [Users, "Active Users", "—", "IAM directory", "/users", "primary"],
          [FileCheck, "Pending Approvals", pendingApprovalsCount, "Administrative requests", "/approvals", "warning"],
          [ShieldAlert, "Audit Logs", "Live", "Security activity", "/logs", "primary"],
          [Building2, "Departments", summary.departments || "—", "Institution structure", "/departments", "accent"],
        ],
        secondary: [
          [Bell, "Unread Notices", unreadCount, "System notifications", "/notices", "accent"],
          [Users, "Faculty Directory", summary.faculty || "—", "Institutional staff", "/faculty", "success"],
          [Users, "Student Directory", summary.students || "—", "Active students", "/students", "primary"],
          [FileText, "Reports", "Available", "Audit & institutional reports", "/reports", "warning"],
        ],
      };
    }

    return {
      scope: `${student.dept || student.branch || "Academic Profile"} · ${student.year || "Current Year"}`,
      heroActions: [["Today's Classes", "/timetable"], [`${activeNoticesCount} Active Notices`, "/notices"]],
      cards: [
        [ClipboardCheck, "Attendance", student.attendance || "81.4%", "Current academic attendance", "/attendance", "primary"],
        [Award, "Cumulative CGPA", student.cgpa || "8.64", "Academic performance", "/examinations", "success"],
        [GraduationCap, "Earned Credits", "112 / 160", "Semester progress", "/examinations", "primary"],
        [Briefcase, "Placement Rate", placementStats.placementRate, `Highest ${placementStats.highestPackage}`, "/placements", "accent"],
      ],
      secondary: [
        [CalendarHeart, "Upcoming Events", `${events.length} Active`, `${registeredEvents.size} registered`, "/events", "success"],
        [Bell, "Unread Notices", unreadCount, "Official circulars", "/notices", "warning"],
        [BookOpen, "Academics", "View", "Courses & syllabus", "/academics", "primary"],
        [LifeBuoy, "Support", "Open", "Feedback & grievances", "/feedback", "accent"],
      ],
    };
  }, [userRole, student, activeProfile, scopeMeta, summary, facultyClassesList.length, mentees.length, pendingApprovalsCount, pendingTasksCount, unreadCount, registeredEvents.size, activeNoticesCount, averageCgpa, backlogStudents]);

  const chartData = isCollegeWide
    ? departmentStrength
    : userRole === "HOD"
      ? attendanceTrend
      : userRole === "Faculty"
        ? attendanceTrend
        : attendanceTrend;

  return (
    <div className="space-y-5 overflow-x-hidden pb-2 animate-fade-in-up sm:space-y-6">
      <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg">
        <div className="relative flex flex-col gap-4 p-4 sm:gap-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "url(/scoe-logo.png)", backgroundSize: "260px", backgroundRepeat: "no-repeat", backgroundPosition: "right -30px center" }} />
          <div className="relative min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-medium text-primary-foreground/80">
              <span>{todayFormatted}</span><span>•</span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 font-semibold text-white">AY 2025-26</span>
            </div>
            <h1 className="font-display text-xl font-bold text-primary-foreground sm:text-3xl">{greeting}, {student.name}!</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-primary-foreground/85 sm:text-sm">{college.name} · {roleMeta.scope}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-2.5 py-1">ID: {student.id}</span>
              <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">{userRole}</span>
            </div>
          </div>
          <div className="relative flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            {roleMeta.heroActions.map(([label, href], index) => (
              <button key={label} onClick={() => navigate(href)} className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto ${index === 1 ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-white/15 text-white hover:bg-white/25"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {roleMeta.cards.map(([icon, label, value, detail, href, tone]) => (
            <MetricCard key={label} icon={icon} label={label} value={value} detail={detail} onClick={() => navigate(href)} tone={tone} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {roleMeta.secondary.map(([icon, label, value, detail, href, tone]) => (
            <MetricCard key={label} icon={icon} label={label} value={value} detail={detail} onClick={() => navigate(href)} tone={tone} />
          ))}
        </div>
      </section>

      {isLeadership || userRole === "Super Admin" ? (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div><CardTitle>{isCollegeWide ? "Department Strength" : userRole === "HOD" ? "Department Attendance Trend" : "Institution Activity"}</CardTitle><p className="text-xs text-muted-foreground">{isCollegeWide ? "Active student enrolment by department" : "Metrics within your authorised scope"}</p></div>
              <button onClick={() => navigate(isCollegeWide ? "/departments" : "/reports")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">View details <ArrowRight className="size-3.5" /></button>
            </CardHeader>
            <CardContent><div className="h-56 w-full min-w-0">
              {isCollegeWide ? (
                <div className="flex h-56 items-end gap-3 px-3 pb-6 pt-3">
                  {chartData.slice(0, 7).map((item, index) => {
                    const amount = Number(item.students || item.value || 0);
                    const max = Math.max(1, ...chartData.map((row) => Number(row.students || row.value || 0)));
                    return <div key={item.department || index} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-muted-foreground">{amount || "—"}</span><div className="w-full max-w-10 rounded-t-md bg-primary/80" style={{ height: `${Math.max(4, amount / max * 72)}%` }} /><span className="max-w-full truncate text-[10px] text-muted-foreground">{item.department || item.name || ""}</span></div>;
                  })}
                </div>
              ) : (
                <svg viewBox="0 0 600 220" role="img" aria-label="Attendance trend chart" className="h-56 w-full overflow-visible">
                  {[40, 80, 120, 160].map((y) => <line key={y} x1="28" y1={y} x2="580" y2={y} stroke="currentColor" strokeOpacity=".12" strokeDasharray="4 5" />)}
                  <polygon points={`28,180 ${chartData.map((item, index) => `${36 + index * (530 / Math.max(1, chartData.length - 1))},${180 - (Math.max(0, Math.min(100, Number(item.attendance || 0))) * 1.35)}`).join(" ")} 566,180`} fill="#4671b7" fillOpacity=".12" />
                  <polyline points={chartData.map((item, index) => `${36 + index * (530 / Math.max(1, chartData.length - 1))},${180 - (Math.max(0, Math.min(100, Number(item.attendance || 0))) * 1.35)}`).join(" ")} fill="none" stroke="#4671b7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {chartData.map((item, index) => <g key={item.week || index}><circle cx={36 + index * (530 / Math.max(1, chartData.length - 1))} cy={180 - (Math.max(0, Math.min(100, Number(item.attendance || 0))) * 1.35)} r="4" fill="#4671b7" /><text x={36 + index * (530 / Math.max(1, chartData.length - 1))} y="204" fontSize="10" fill="currentColor" textAnchor="middle" opacity=".7">{item.week || ""}</text></g>)}
                </svg>
              )}
            </div></CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3"><div><CardTitle>Recent Notices</CardTitle><p className="text-xs text-muted-foreground">Official circulars & alerts</p></div><button onClick={() => navigate("/notices")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">View all <ArrowRight className="size-3.5" /></button></CardHeader>
            <CardContent className="space-y-3">{notices.slice(0, 5).map((notice) => <button key={notice.id} onClick={() => navigate("/notices")} className="block w-full border-b border-border pb-2.5 text-left last:border-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className={`font-semibold ${noticeCategoryColor[notice.category]}`}>{notice.category}</span><span className="text-muted-foreground">{notice.date}</span></div><p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">{notice.title}</p></button>)}</CardContent>
          </Card>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card><CardHeader className="flex-row items-center justify-between pb-3"><div><CardTitle>Today's Schedule</CardTitle><p className="text-xs text-muted-foreground">Your current timetable</p></div><button onClick={() => navigate("/timetable")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Full timetable <ArrowRight className="size-3.5" /></button></CardHeader><CardContent className="space-y-2.5">{timetable.slice(0, 5).map((item, idx) => <button key={idx} onClick={() => navigate("/timetable")} className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/50"><div className="flex min-w-0 items-center gap-3"><span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">{item.time}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.subject}</p><p className="truncate text-xs text-muted-foreground">{item.faculty} · {item.room}</p></div></div><Badge variant={item.type === "Lab" ? "accent" : "secondary"}>{item.type}</Badge></button>)}</CardContent></Card>
          <Card><CardHeader className="flex-row items-center justify-between pb-3"><div><CardTitle>Recent Notices</CardTitle><p className="text-xs text-muted-foreground">Official circulars & alerts</p></div><button onClick={() => navigate("/notices")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">View all <ArrowRight className="size-3.5" /></button></CardHeader><CardContent className="space-y-3">{notices.slice(0, 5).map((notice) => <button key={notice.id} onClick={() => navigate("/notices")} className="block w-full border-b border-border pb-2.5 text-left last:border-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className={`font-semibold ${noticeCategoryColor[notice.category]}`}>{notice.category}</span><span className="text-muted-foreground">{notice.date}</span></div><p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">{notice.title}</p></button>)}</CardContent></Card>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(userRole === "Faculty"
          ? [["Classes", ClipboardCheck, "/classes"], ["Attendance", ClipboardCheck, "/attendance"], ["Marks", GraduationCap, "/marks"], ["Mentoring", Users, "/mentoring"], ["Tasks", CheckSquare, "/tasks"], ["Reports", FileText, "/reports"]]
          : userRole === "HOD"
            ? [["Students", Users, "/students"], ["Faculty", Users, "/faculty"], ["Attendance", ClipboardCheck, "/attendance"], ["Approvals", FileCheck, "/approvals"], ["Reports", FileText, "/reports"], ["Notices", Bell, "/notices"]]
            : isCollegeWide
              ? [["Departments", Building2, "/departments"], ["Students", Users, "/students"], ["Faculty", Users, "/faculty"], ["Approvals", FileCheck, "/approvals"], ["Reports", FileText, "/reports"], ["Notices", Bell, "/notices"]]
              : [["Timetable", ClipboardCheck, "/timetable"], ["Attendance", ClipboardCheck, "/attendance"], ["Events", CalendarHeart, "/events"], ["Council", MapPin, "/student-council"], ["Support", LifeBuoy, "/feedback"], ["Examinations", GraduationCap, "/examinations"]]
        ).map(([label, Icon, href]) => <button key={label} onClick={() => navigate(href)} className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/40 hover:shadow-sm sm:p-4"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10"><Icon className="size-5" /></div><span className="max-w-full truncate text-xs font-semibold">{label}</span></button>)}
      </section>
    </div>
  );
}
