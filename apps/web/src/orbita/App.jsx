"use client";
import React, { useState } from "react";
import { usePortal } from "./context/PortalContext";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Toaster } from "./components/Toaster";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TimetablePage } from "./pages/TimetablePage";
import { AttendancePage } from "./pages/AttendancePage";
import { EventsPage } from "./pages/EventsPage";
import { NoticesPage } from "./pages/NoticesPage";
import { CouncilMembersPage } from "./pages/CouncilMembersPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AcademicsPage } from "./pages/AcademicsPage";
import { ExaminationsPage } from "./pages/ExaminationsPage";
import { ClubsPage } from "./pages/ClubsPage";
import { SportsPage } from "./pages/SportsPage";
import { LibraryPage } from "./pages/LibraryPage";
import { FinancePage } from "./pages/FinancePage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { PlacementsPage } from "./pages/PlacementsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HostelPage } from "./pages/HostelPage";
import { TransportPage } from "./pages/TransportPage";
import { AlumniPage } from "./pages/AlumniPage";
import { OperationsPage } from "./pages/OperationsPage";

// Role-specific interactive pages
import { FacultyClassesPage } from "./pages/FacultyClassesPage";
import { FacultyMarksPage } from "./pages/FacultyMarksPage";
import { FacultyMentoringPage } from "./pages/FacultyMentoringPage";
import { FacultyTasksPage } from "./pages/FacultyTasksPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { FacultyListPage } from "./pages/FacultyListPage";
import { StudentsManagementPage } from "./pages/StudentsManagementPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersManagementPage } from "./pages/UsersManagementPage";
import { SystemLogsPage } from "./pages/SystemLogsPage";

import { college } from "./data/portalData";

const OPERATION_ROUTES = new Set([
  "/hr", "/leave", "/procurement", "/catalogue", "/work-orders", "/assets",
  "/hostel-rooms", "/vehicles", "/employers", "/drives", "/research",
  "/accreditation", "/institution-events", "/committees", "/committee-members", "/clubs-admin",
  "/alumni-records", "/lab-inventory", "/sports-facilities", "/visitors", "/programmes",
  "/academic-terms", "/curriculum", "/course-outcomes", "/program-outcomes", "/obe-mapping",
  "/attainment-cycles", "/attainment-results", "/institution-settings", "/budgets", "/vendors", "/expense-claims",
  "/clubs", "/sports", "/alumni", "/hostel", "/transport", "/placements", "/events",
]);

export default function App() {
  const { isAuthenticated, currentRoute, userRole, logout, isDemoPreview, backendConfigured, session, navigate } = usePortal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!isAuthenticated || currentRoute === "/login") {
    return <><LoginPage /><Toaster /></>;
  }

  if (isAuthenticated && userRole === "Pending") {
    return <main className="min-h-screen bg-background flex items-center justify-center p-6"><section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm"><div className="mb-5 inline-flex rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning-foreground">ACCESS REVIEW</div><h1 className="font-display text-2xl font-bold text-foreground">Your account is awaiting approval</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">An institutional administrator must activate your staff profile and assign the appropriate role before you can access college records.</p><button className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" onClick={() => void logout()}>Sign out</button></section><Toaster /></main>;
  }

  const renderCurrentPage = () => {
    const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token && !isDemoPreview);
    const liveDataRoutes = new Set([
      "/dashboard", "/timetable", "/attendance", "/marks", "/notices", "/notifications", "/profile", "/settings",
      "/academics", "/courses", "/subjects", "/classes", "/enrollments", "/documents", "/logs", "/tasks", "/library", "/finance",
      "/department", "/departments", "/faculty", "/students", "/approvals", "/users",
      ...OPERATION_ROUTES,
    ]);
    if (liveSession && !liveDataRoutes.has(currentRoute)) {
      return <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-7 shadow-sm"><div className="mb-4 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">LIVE DATA SAFETY</div><h1 className="font-display text-2xl font-bold text-foreground">This module is not connected to live records yet</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Sample fixtures are intentionally hidden for authenticated institutional accounts. This module needs its database workflows, permissions, and acceptance tests connected before it can operate on college records.</p><button onClick={() => navigate("/dashboard")} className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Back to live dashboard</button></section>;
    }
    if (OPERATION_ROUTES.has(currentRoute)) return <OperationsPage route={currentRoute} />;
    switch (currentRoute) {
      case "/dashboard": return <DashboardPage />;
      case "/timetable": return <TimetablePage />;
      case "/attendance": return <AttendancePage />;
      case "/events": return <EventsPage />;
      case "/notices": return <NoticesPage />;
      case "/student-council": case "/members": case "/council": return <CouncilMembersPage />;
      case "/feedback": case "/support": case "/grievances": return <FeedbackPage />;
      case "/profile": return <ProfilePage />;
      case "/academics": case "/courses": case "/subjects": return <AcademicsPage />;
      case "/examinations": case "/results": return <ExaminationsPage />;
      case "/clubs": return <ClubsPage />;
      case "/sports": return <SportsPage />;
      case "/library": return <LibraryPage />;
      case "/finance": return <FinancePage />;
      case "/documents": return <DocumentsPage />;
      case "/placements": return <PlacementsPage />;
      case "/notifications": return <NotificationsPage />;
      case "/settings": return <SettingsPage />;
      case "/hostel": return <HostelPage />;
      case "/transport": return <TransportPage />;
      case "/alumni": return <AlumniPage />;
      case "/classes": case "/enrollments": return <FacultyClassesPage />;
      case "/marks": return <FacultyMarksPage />;
      case "/mentoring": return <FacultyMentoringPage />;
      case "/tasks": return <FacultyTasksPage />;
      case "/department": case "/departments": return <DepartmentsPage />;
      case "/faculty": return <FacultyListPage />;
      case "/students": return <StudentsManagementPage />;
      case "/approvals": return <ApprovalsPage />;
      case "/reports": return <ReportsPage />;
      case "/users": return <UsersManagementPage />;
      case "/logs": return <SystemLogsPage />;
      default: return <DashboardPage />;
    }
  };

  return <div className="min-h-screen bg-background font-sans antialiased text-foreground">
    <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
    <div className={`flex min-h-screen flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
      <Navbar onMenuClick={() => setMobileSidebarOpen(true)} onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)} collapsed={sidebarCollapsed} />
      {isDemoPreview && <div className="mx-4 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 sm:mx-6"><strong className="font-semibold">DEMO PREVIEW — sample data only.</strong>{" "}This workspace is not connected to an authenticated staff account. Changes are not saved to college records.</div>}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{renderCurrentPage()}</main>
      <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground bg-card/40"><p>© 2026 {college.name} ({college.group}). {college.system}.{" "}<span className="text-muted-foreground/80 font-medium">Developed by {college.developer}</span></p></footer>
    </div>
    <Toaster />
  </div>;
}
