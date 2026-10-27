import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Menu,
  PanelLeft,
  PanelLeftClose,
  Search,
  CornerDownLeft,
  Zap,
  FileUp,
  ClipboardCheck,
  CalendarDays,
  CalendarHeart,
  Briefcase,
  Bell,
  ChevronDown,
  UserRound,
  FileBadge,
  Settings,
  LogOut,
  TriangleAlert,
  BookOpen,
  CheckCircle2,
  LifeBuoy,
  ShieldCheck,
  Users,
  Building2,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import {
  college,
  events,
  clubs,
  books,
  companies,
  notices,
} from "../data/portalData";

export function Navbar({ onMenuClick, onCollapseToggle, collapsed }) {
  const {
    student,
    currentRoute,
    navigate,
    logout,
    userRole,
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    toast,
    studentsList,
    facultyList,
    scopeMeta,
  } = usePortal();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Quick actions state
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef(null);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  // User menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Search items database
  const searchableItems = useMemo(() => [
    ...(scopeMeta.level !== "self" && scopeMeta.level !== "assigned"
      ? studentsList.map((s) => ({
          label: s.name,
          sub: `Student · ${s.branch || s.dept || "In scope"}${s.year ? ` (${s.year})` : ""}`,
          type: "Students",
          href: `/students`,
        }))
      : []),
    ...(scopeMeta.level === "department" || scopeMeta.level === "college"
      ? facultyList.map((f) => ({
          label: f.name,
          sub: `Faculty · ${f.dept || f.designation || "In scope"}`,
          type: "Faculty",
          href: `/faculty`,
        }))
      : []),
    ...events.map((e) => ({ label: e.name, sub: `Event · ${e.date}`, type: "Events", href: `/events` })),
    ...clubs.map((c) => ({ label: c.name, sub: `Club · ${c.category}`, type: "Clubs", href: `/clubs` })),
    ...books.map((b) => ({ label: b.title, sub: `Book · ${b.author}`, type: "Library", href: `/library` })),
    ...companies.map((c) => ({ label: c.name, sub: `Placement · ${c.role}`, type: "Placements", href: `/placements` })),
    ...notices.map((n) => ({ label: n.title, sub: `Notice · ${n.date}`, type: "Notices", href: `/notices` })),
  ], [scopeMeta.level, studentsList, facultyList]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchableItems
      .filter((item) => item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, searchableItems]);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target)) {
        setQuickActionsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectResult = (href) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(href);
  };

  const quickActionItems =
    userRole === "Faculty"
      ? [
          { label: "Take Attendance", icon: ClipboardCheck, href: "/classes" },
          { label: "Enter Exam Marks", icon: FileBadge, href: "/marks" },
          { label: "Mentoring", icon: UserRound, href: "/mentoring" },
          { label: "My Tasks", icon: CheckCircle2, href: "/tasks" },
          { label: "View Timetable", icon: CalendarDays, href: "/timetable" },
        ]
      : userRole === "HOD"
        ? [
            { label: "Department Students", icon: Users, href: "/students" },
            { label: "Faculty Directory", icon: UserRound, href: "/faculty" },
            { label: "Approvals", icon: FileBadge, href: "/approvals" },
            { label: "Department Reports", icon: BookOpen, href: "/reports" },
            { label: "Attendance", icon: ClipboardCheck, href: "/attendance" },
          ]
        : userRole === "Principal" || userRole === "Vice-Principal"
          ? [
              { label: "Departments", icon: Building2, href: "/departments" },
              { label: "Student Directory", icon: Users, href: "/students" },
              { label: "Approvals", icon: FileBadge, href: "/approvals" },
              { label: "Institution Reports", icon: BookOpen, href: "/reports" },
              { label: "Faculty Directory", icon: UserRound, href: "/faculty" },
            ]
          : userRole === "Staff"
            ? [
                { label: "Official Notices", icon: Bell, href: "/notices" },
                { label: "Documents", icon: FileBadge, href: "/documents" },
                { label: "My Tasks", icon: CheckCircle2, href: "/tasks" },
              ]
            : [
              { label: "Raise Grievance", icon: FileUp, href: "/grievances" },
              { label: "View Attendance", icon: ClipboardCheck, href: "/attendance" },
              { label: "View Timetable", icon: CalendarDays, href: "/timetable" },
              { label: "Browse Events", icon: CalendarHeart, href: "/events" },
              { label: "Apply for Placement", icon: Briefcase, href: "/placements" },
              { label: "Submit Grievance / Feedback", icon: LifeBuoy, href: "/feedback" },
            ];

  const notificationIcons = {
    warning: { icon: TriangleAlert, tone: "bg-warning/15 text-warning-foreground" },
    academic: { icon: BookOpen, tone: "bg-primary/10 text-primary" },
    placement: { icon: Briefcase, tone: "bg-chart-5/10 text-chart-5" },
    event: { icon: CalendarHeart, tone: "bg-accent/15 text-accent-foreground" },
    success: { icon: CheckCircle2, tone: "bg-success/15 text-success" },
  };

  const studentInitials = student.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-20 flex h-16 min-w-0 items-center gap-1.5 overflow-visible border-b border-border bg-card/85 px-2 backdrop-blur-md sm:gap-3 sm:px-6">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Desktop Collapse Toggle */}
      <button
        onClick={onCollapseToggle}
        className="hidden size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
      </button>

      {/* Mobile Brand Logo */}
      <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
        <div className="size-8 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-border flex items-center justify-center overflow-hidden">
          <img
            src="/scoe-logo.png"
            alt="SCOE crest"
            className="size-full object-contain"
            width={32}
            height={32}
          />
        </div>
        <span className="hidden font-display text-sm font-bold text-foreground sm:inline">
          {college.short}
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="ml-0 flex min-w-0 flex-1 justify-center px-0.5 lg:ml-0 lg:max-w-xl lg:px-1">
        <div ref={searchContainerRef} className="relative w-full max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => searchQuery && setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === "Enter" && searchResults[selectedIndex]) {
                  handleSelectResult(searchResults[selectedIndex].href);
                } else if (e.key === "Escape") {
                  setSearchOpen(false);
                }
              }}
              placeholder="Search…"
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 sm:pr-16"
              aria-label="Global search"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </div>

          {/* Search Dropdown */}
          {searchOpen && searchQuery && (
            <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-xl animate-fade-in-up">
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <ul className="max-h-[360px] overflow-y-auto py-1.5">
                  {searchResults.map((item, idx) => (
                    <li key={item.label + idx}>
                      <button
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => handleSelectResult(item.href)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                          idx === selectedIndex ? "bg-muted" : "hover:bg-muted/60"
                        }`}
                      >
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          {item.type}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.sub}
                          </span>
                        </span>
                        {idx === selectedIndex && (
                          <CornerDownLeft className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Quick Actions, Notifications, User Menu */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
        {/* Quick Actions Dropdown */}
        <div ref={quickActionsRef} className="relative">
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className="inline-flex size-10 items-center justify-center rounded-lg bg-primary px-0 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-10 sm:w-auto sm:px-3"
            aria-haspopup="menu"
            aria-expanded={quickActionsOpen}
          >
            <Zap className="size-4" />
            <span className="hidden sm:inline">Quick Actions</span>
          </button>

          {quickActionsOpen && (
            <div
              role="menu"
              className="animate-fade-in-up absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl"
            >
              <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {userRole} · Quick Actions
              </p>
              {quickActionItems.map((item) => {
                const ActionIcon = item.icon;
                return (
                  <button
                    key={item.label}
                    role="menuitem"
                    onClick={() => {
                      setQuickActionsOpen(false);
                      toast({
                        title: item.label,
                        description: "Opening section…",
                        variant: "info",
                      });
                      navigate(item.href);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ActionIcon className="size-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            aria-haspopup="menu"
            aria-expanded={notificationsOpen}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="animate-fade-in-up absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <ul className="max-h-[380px] overflow-y-auto">
                {notifications.map((n) => {
                  const conf = notificationIcons[n.type] || notificationIcons.academic;
                  const Icon = conf.icon;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => {
                          markRead(n.id);
                          setNotificationsOpen(false);
                          navigate(n.href);
                        }}
                        className={`flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                          n.unread ? "bg-primary/[0.04]" : ""
                        }`}
                      >
                        <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${conf.tone}`}>
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-1">
                            <span className="truncate text-sm font-medium text-foreground">
                              {n.title}
                            </span>
                            {n.unread && (
                              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                            )}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {n.description}
                          </span>
                          <span className="mt-1 block text-[11px] text-muted-foreground/70">
                            {n.time}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate("/notices");
                }}
                className="block w-full bg-muted/40 px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-muted transition-colors border-t border-border"
              >
                View all notifications & notices
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted focus:outline-none"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
              {studentInitials}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-semibold leading-tight text-foreground">
                {student.id}
              </span>
              <span className="block text-xs leading-tight text-muted-foreground">
                {userRole || student.role}
              </span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="animate-fade-in-up absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
            >
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{student.name}</p>
                <p className="text-xs text-muted-foreground">
                  {student.branch} · {student.year}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/80 font-mono">
                  {student.email}
                </p>
              </div>

              <div className="p-1.5 space-y-0.5">
                {[
                  { label: "My Profile & ID Card", icon: UserRound, href: "/profile" },
                  { label: "Attendance Summary", icon: ClipboardCheck, href: "/attendance" },
                  { label: "Official Documents", icon: FileBadge, href: "/documents" },
                  { label: "Account Settings", icon: Settings, href: "/settings" },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.label}
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate(item.href);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted text-left"
                    >
                      <ItemIcon className="size-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/*
                Role is issued by the backend from the signed-in identity
                (README §25). There is deliberately no client-side role switch:
                changing it here would change nothing server-side.
              */}
              <div className="border-t border-border p-2 bg-muted/20">
                <div className="flex items-center gap-2 px-1 py-1">
                  <ShieldCheck className="size-3.5 text-success shrink-0" />
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    Signed in as{" "}
                    <span className="font-semibold text-foreground">{userRole}</span>. Access is
                    granted by the server from your institutional scope.
                  </p>
                </div>
              </div>

              <div className="border-t border-border p-1.5">
                <button
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    toast({
                      title: "Signed out",
                      description: "You have been securely signed out.",
                      variant: "info",
                    });
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 text-left"
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
