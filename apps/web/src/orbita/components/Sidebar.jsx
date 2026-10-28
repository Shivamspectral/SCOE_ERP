import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  CalendarHeart,
  Users,
  Landmark,
  Trophy,
  Library,
  FileBadge,
  LifeBuoy,
  BedDouble,
  Bus,
  Briefcase,
  Network,
  Bell,
  UserRound,
  Settings,
  X,
  CheckSquare,
  FileCheck,
  Shield,
  Building2,
  ListOrdered,
  KeyRound,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { college } from "../data/portalData";

export function getNavigationForRole(role) {
  if (role === "Faculty") {
    return [
      {
        title: "Main",
        items: [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tooltip: "Faculty command center" },
        ],
      },
      {
        title: "Teaching & Classes",
        items: [
          { label: "My Classes & Attendance", href: "/classes", icon: ClipboardCheck, tooltip: "Course batches & daily roll call" },
          { label: "Exams & Marks Entry", href: "/marks", icon: GraduationCap, tooltip: "In-sem & end-sem continuous evaluation" },
          { label: "Mentoring & TG", href: "/mentoring", icon: Users, tooltip: "Teacher-guardian mentee counselling" },
          { label: "Tasks & Responsibilities", href: "/tasks", icon: CheckSquare, tooltip: "Syllabus deadlines & accreditation tasks" },
        ],
      },
      {
        title: "Academics & Students",
        items: [
          { label: "Student Directory", href: "/students", icon: Users, tooltip: "Enrolled student records & dossiers" },
          { label: "Timetable", href: "/timetable", icon: CalendarDays, tooltip: "Weekly lecture & lab schedule" },
          { label: "Academics", href: "/academics", icon: BookOpen, tooltip: "Syllabus & course outcomes" },
        ],
      },
      {
        title: "Governance & Campus",
        items: [
          { label: "Approvals & Leave", href: "/approvals", icon: FileCheck, tooltip: "Sanctions, leave & requisitions" },
          { label: "Departments", href: "/departments", icon: Building2, tooltip: "Departmental labs & resources" },
          { label: "Notices & Alerts", href: "/notices", icon: Bell, tooltip: "Official circulars", aliases: ["/notifications"] },
        ],
      },
      {
        title: "System",
        items: [
          { label: "Faculty Profile", href: "/profile", icon: UserRound, tooltip: "Personal profile & publications" },
          { label: "Settings", href: "/settings", icon: Settings, tooltip: "Security & preferences" },
        ],
      },
    ];
  }

  if (role === "Staff") {
    return [
      { title: "Main", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tooltip: "Office operations overview" }] },
      { title: "Office Operations", items: [
        { label: "Notices & Alerts", href: "/notices", icon: Bell, tooltip: "Official circulars and updates", aliases: ["/notifications"] },
        { label: "Documents", href: "/documents", icon: FileBadge, tooltip: "Institutional documents and records" },
        { label: "Tasks & Requests", href: "/tasks", icon: CheckSquare, tooltip: "Assigned office tasks" },
      ] },
      { title: "System", items: [
        { label: "Profile", href: "/profile", icon: UserRound, tooltip: "Staff profile" },
        { label: "Settings", href: "/settings", icon: Settings, tooltip: "Preferences and security" },
      ] },
    ];
  }

  if (role === "HOD") {
    return [
      {
        title: "Main",
        items: [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tooltip: "Department command center" },
        ],
      },
      {
        title: "Department Management",
        items: [
          { label: "Department Overview", href: "/department", icon: Building2, tooltip: "Labs, intake & accreditation", aliases: ["/departments"] },
          { label: "Faculty & Workload", href: "/faculty", icon: Users, tooltip: "Teaching staff workload & cabins" },
          { label: "Student Directory", href: "/students", icon: Users, tooltip: "Department student strength" },
          { label: "Department Attendance", href: "/attendance", icon: ClipboardCheck, tooltip: "Attendance & defaulters list" },
        ],
      },
      {
        title: "Governance & Sanctions",
        items: [
          { label: "Approvals & Requisitions", href: "/approvals", icon: FileCheck, tooltip: "Pending sanctions & clearances" },
          { label: "Results & SPPU Marks", href: "/examinations", icon: GraduationCap, tooltip: "Result analysis & pass rates" },
          { label: "NBA & Audit Reports", href: "/reports", icon: FileSpreadsheet, tooltip: "Accreditation & SAR documentation" },
        ],
      },
      {
        title: "Campus & Services",
        items: [
          { label: "Timetable Schedule", href: "/timetable", icon: CalendarDays, tooltip: "Department timetable" },
          { label: "Events & Fests", href: "/events", icon: CalendarHeart, tooltip: "Innovatia & symposiums" },
          { label: "Feedback & Grievances", href: "/feedback", icon: LifeBuoy, tooltip: "Student welfare & support desk", aliases: ["/support"] },
          { label: "Notices & Circulars", href: "/notices", icon: Bell, tooltip: "Department circulars", aliases: ["/notifications"] },
        ],
      },
      {
        title: "System",
        items: [
          { label: "HOD Profile", href: "/profile", icon: UserRound, tooltip: "Officer identity & credentials" },
          { label: "Settings", href: "/settings", icon: Settings, tooltip: "Preferences & security" },
        ],
      },
    ];
  }

  if (role === "Principal" || role === "Vice-Principal") {
    return [
      {
        title: "Main",
        items: [
          { label: "Executive Overview", href: "/dashboard", icon: LayoutDashboard, tooltip: "Institutional leadership overview" },
        ],
      },
      {
        title: "Institutional Oversight",
        items: [
          { label: "Departments Overview", href: "/departments", icon: Building2, tooltip: "All 6 engineering branches", aliases: ["/department"] },
          { label: "Faculty Directory", href: "/faculty", icon: Users, tooltip: "Faculty strength & designations" },
          { label: "Student Management", href: "/students", icon: Users, tooltip: "Campus-wide student registry" },
          { label: "Institutional Attendance", href: "/attendance", icon: ClipboardCheck, tooltip: "Campus-wide attendance & defaulters" },
        ],
      },
      {
        title: "Executive Approvals & Audits",
        items: [
          { label: "Approvals & Sanctions", href: "/approvals", icon: FileCheck, tooltip: "Sanction leave, budget & requisitions" },
          { label: "Reports & Accreditations", href: "/reports", icon: FileSpreadsheet, tooltip: "SPPU, NBA & NAAC audit files" },
          { label: "Training & Placements", href: "/placements", icon: Briefcase, tooltip: "Campus recruitment & top packages" },
          { label: "Examinations & SGPA", href: "/examinations", icon: GraduationCap, tooltip: "University pass rates & toppers" },
        ],
      },
      {
        title: "Campus Operations",
        items: [
          { label: "Campus Timetable", href: "/timetable", icon: CalendarDays, tooltip: "Institutional master schedule" },
          { label: "Events & Fests", href: "/events", icon: CalendarHeart, tooltip: "Innovatia, sports & symposiums" },
          { label: "Grievance Redressal Desk", href: "/feedback", icon: LifeBuoy, tooltip: "Grievances & escalation desk", aliases: ["/support"] },
          { label: "Institutional Notices", href: "/notices", icon: Bell, tooltip: "Principal circulars & orders", aliases: ["/notifications"] },
        ],
      },
      {
        title: "System",
        items: [
          { label: "Executive Profile", href: "/profile", icon: UserRound, tooltip: "Principal / VP identity" },
          { label: "Settings", href: "/settings", icon: Settings, tooltip: "Security & configurations" },
        ],
      },
    ];
  }

  if (role === "Super Admin") {
    return [
      {
        title: "Main",
        items: [
          { label: "Administration Dashboard", href: "/dashboard", icon: LayoutDashboard, tooltip: "Root administration overview" },
        ],
      },
      {
        title: "Identity & Security",
        items: [
          { label: "User Management (IAM)", href: "/users", icon: Users, tooltip: "Manage students, faculty & admins" },
          { label: "Approvals & Clearances", href: "/approvals", icon: FileCheck, tooltip: "Root administrative sanction desk" },
          { label: "System Audit Logs", href: "/logs", icon: Shield, tooltip: "Security & transaction logs" },
        ],
      },
      {
        title: "Campus Infrastructure",
        items: [
          { label: "Departments Overview", href: "/departments", icon: Building2, tooltip: "Engineering departments & centers", aliases: ["/department"] },
          { label: "Faculty Directory", href: "/faculty", icon: Users, tooltip: "Faculty registry" },
          { label: "Student Directory", href: "/students", icon: Users, tooltip: "Student records" },
          { label: "Audit Reports", href: "/reports", icon: FileSpreadsheet, tooltip: "Accreditation & system reports" },
        ],
      },
      {
        title: "Campus Services",
        items: [
          { label: "Broadcast Notices", href: "/notices", icon: Bell, tooltip: "Push system notices & circulars", aliases: ["/notifications"] },
          { label: "Grievances Desk", href: "/feedback", icon: LifeBuoy, tooltip: "Tickets & support tracking", aliases: ["/support"] },
          { label: "Events & Fests", href: "/events", icon: CalendarHeart, tooltip: "Campus events" },
        ],
      },
      {
        title: "System",
        items: [
          { label: "Admin Profile", href: "/profile", icon: UserRound, tooltip: "Root credentials" },
          { label: "System Settings", href: "/settings", icon: Settings, tooltip: "Firewall & ERP integrations" },
        ],
      },
    ];
  }

  // Default: Student role
  return [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tooltip: "Your command center" },
      ],
    },
    {
      title: "Academics",
      items: [
        { label: "Academics", href: "/academics", icon: BookOpen, tooltip: "Syllabus, courses & faculty" },
        { label: "Timetable", href: "/timetable", icon: CalendarDays, tooltip: "Weekly class schedule" },
        { label: "Attendance", href: "/attendance", icon: ClipboardCheck, tooltip: "Subject attendance & stats" },
        { label: "Examinations & Results", href: "/examinations", icon: GraduationCap, tooltip: "Exams & SGPA/CGPA", aliases: ["/results"] },
      ],
    },
    {
      title: "Campus Life",
      items: [
        { label: "Events", href: "/events", icon: CalendarHeart, tooltip: "Symposiums, fests & workshops" },
        { label: "Clubs & Communities", href: "/clubs", icon: Users, tooltip: "Technical & cultural clubs" },
        { label: "Student Council", href: "/student-council", icon: Landmark, tooltip: "Council leaders & initiatives", aliases: ["/members", "/council"] },
        { label: "Sports", href: "/sports", icon: Trophy, tooltip: "Tournaments & fitness" },
      ],
    },
    {
      title: "Services",
      items: [
        { label: "Library", href: "/library", icon: Library, tooltip: "Catalog & book reserves" },
        { label: "Certificates & Documents", href: "/documents", icon: FileBadge, tooltip: "Bonafide, receipts & forms" },
        { label: "Feedback / Complaints", href: "/feedback", icon: LifeBuoy, tooltip: "Grievances & support desk", aliases: ["/support", "/grievances"] },
        { label: "Hostel", href: "/hostel", icon: BedDouble, tooltip: "Hostel facilities & mess" },
        { label: "Transport", href: "/transport", icon: Bus, tooltip: "Bus routes & schedules" },
      ],
    },
    {
      title: "Career",
      items: [
        { label: "Training & Placement", href: "/placements", icon: Briefcase, tooltip: "Campus drives & internships" },
        { label: "Alumni", href: "/alumni", icon: Network, tooltip: "Alumni network & mentors" },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notices & Alerts", href: "/notices", icon: Bell, tooltip: "Official circulars & alerts", aliases: ["/notifications"] },
        { label: "Profile", href: "/profile", icon: UserRound, tooltip: "Student identity & details" },
        { label: "Settings", href: "/settings", icon: Settings, tooltip: "Preferences & security" },
      ],
    },
  ];
}

export function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { currentRoute, navigate, userRole } = usePortal();

  const navigationGroups = getNavigationForRole(userRole);

  const isItemActive = (item) => {
    if (currentRoute === item.href) return true;
    if (item.aliases && item.aliases.includes(currentRoute)) return true;
    if (item.href !== "/dashboard" && currentRoute.startsWith(item.href + "/")) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Aside container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:z-30 ${
          collapsed ? "lg:w-[76px]" : "lg:w-64"
        } w-72 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Primary"
      >
        {/* Sidebar Brand Header */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
          <button
            onClick={() => {
              navigate("/dashboard");
              if (mobileOpen) onClose();
            }}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="relative size-10 shrink-0 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-border flex items-center justify-center overflow-hidden">
              <img
                src="/scoe-logo.png"
                alt="Siddhant Group of Institutions crest"
                className="size-full object-contain"
                width={40}
                height={40}
              />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold leading-tight text-sidebar-foreground">
                  {college.short} Portal
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-muted-foreground">{college.name}</span>
                  <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold text-primary shrink-0">
                    {userRole}
                  </span>
                </div>
              </div>
            )}
          </button>
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {navigationGroups.map((group) => {
            const isExecutive = userRole === "Principal" || userRole === "Vice-Principal";
            const isExecutiveDropdown = isExecutive && group.title !== "Main";
            const groupActive = group.items.some(isItemActive);

            if (isExecutiveDropdown) {
              const GroupIcon = group.items[0]?.icon || LayoutDashboard;
              return (
                <div key={group.title} className="relative group/nav">
                  <div
                    tabIndex={0}
                    title={collapsed ? group.title : undefined}
                    className={`flex w-full cursor-default items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-semibold transition-colors outline-none ${
                      groupActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:bg-sidebar-accent"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <GroupIcon className="size-[18px] shrink-0" />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{group.title}</span>}
                    {!collapsed && <ChevronDown className="size-4 shrink-0 transition-transform group-hover/nav:rotate-180 group-focus-within/nav:rotate-180" />}
                  </div>
                  <div className={`z-50 mt-1 rounded-xl border border-sidebar-border bg-sidebar p-1.5 shadow-lg ring-1 ring-black/5 transition-opacity group-hover/nav:block group-focus-within/nav:block ${
                    collapsed
                      ? "absolute left-full top-0 ml-2 hidden w-64"
                      : "hidden w-full"
                  }`}>
                    {group.items.map((item) => {
                      const active = isItemActive(item);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            navigate(item.href);
                            if (mobileOpen) onClose();
                          }}
                          title={item.tooltip}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {active && <span className="size-1.5 rounded-full bg-current" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <div key={group.title}>
                {!collapsed && !isExecutive && (
                  <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </p>
                )}
                {collapsed && !isExecutive && <div className="mx-2 mb-2 h-px bg-sidebar-border" />}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isItemActive(item);
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <button
                          onClick={() => {
                            navigate(item.href);
                            if (mobileOpen) onClose();
                          }}
                          title={collapsed ? item.label : item.tooltip}
                          className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors text-left ${
                            collapsed ? "justify-center" : ""
                          } ${
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-semibold"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          {active && !collapsed && (
                            <span className="absolute -left-3 h-6 w-1 rounded-r-full bg-sidebar-primary" />
                          )}
                          <Icon className="size-[18px] shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {!collapsed && (
          <div className="shrink-0 border-t border-sidebar-border p-3">
            <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
              {college.system}
              <br />
              <span className="text-muted-foreground/70">
                Role: <span className="font-semibold text-foreground">{userRole}</span> · {college.developer}
              </span>
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
