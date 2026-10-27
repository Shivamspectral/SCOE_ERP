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
import { DocumentsPage } from "./pages/DocumentsPage";
import { PlacementsPage } from "./pages/PlacementsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HostelPage } from "./pages/HostelPage";
import { TransportPage } from "./pages/TransportPage";
import { AlumniPage } from "./pages/AlumniPage";

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
import { RegistrationIdsPage } from "./pages/RegistrationIdsPage";

import { college } from "./data/portalData";

export default function App() {
  const { isAuthenticated, currentRoute } = usePortal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If unauthenticated or explicitly on /login
  if (!isAuthenticated || currentRoute === "/login") {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  // Routing Switch
  const renderCurrentPage = () => {
    switch (currentRoute) {
      case "/dashboard":
        return <DashboardPage />;
      case "/timetable":
        return <TimetablePage />;
      case "/attendance":
        return <AttendancePage />;
      case "/events":
        return <EventsPage />;
      case "/notices":
        return <NoticesPage />;
      case "/student-council":
      case "/members":
      case "/council":
        return <CouncilMembersPage />;
      case "/feedback":
      case "/support":
      case "/grievances":
        return <FeedbackPage />;
      case "/profile":
        return <ProfilePage />;
      case "/academics":
      case "/courses":
      case "/subjects":
        return <AcademicsPage />;
      case "/examinations":
      case "/results":
        return <ExaminationsPage />;
      case "/clubs":
        return <ClubsPage />;
      case "/sports":
        return <SportsPage />;
      case "/library":
        return <LibraryPage />;
      case "/documents":
        return <DocumentsPage />;
      case "/placements":
        return <PlacementsPage />;
      case "/notifications":
        return <NotificationsPage />;
      case "/settings":
        return <SettingsPage />;
      case "/hostel":
        return <HostelPage />;
      case "/transport":
        return <TransportPage />;
      case "/alumni":
        return <AlumniPage />;

      // Role Routes
      case "/classes":
      case "/enrollments":
        return <FacultyClassesPage />;
      case "/marks":
        return <FacultyMarksPage />;
      case "/mentoring":
        return <FacultyMentoringPage />;
      case "/tasks":
        return <FacultyTasksPage />;
      case "/department":
      case "/departments":
        return <DepartmentsPage />;
      case "/faculty":
        return <FacultyListPage />;
      case "/students":
        return <StudentsManagementPage />;
      case "/approvals":
        return <ApprovalsPage />;
      case "/reports":
        return <ReportsPage />;
      case "/users":
        return <UsersManagementPage />;
      case "/logs":
        return <SystemLogsPage />;
      case "/registration-ids":
        return <RegistrationIdsPage />;

      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      {/* Sidebar navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Layout */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64"
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          onMenuClick={() => setMobileSidebarOpen(true)}
          onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          collapsed={sidebarCollapsed}
        />

        {/* Dynamic Route Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {renderCurrentPage()}
        </main>

        {/* Unified Portal Footer */}
        <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground bg-card/40">
          <p>
            © 2026 {college.name} ({college.group}). {college.system}.{" "}
            <span className="text-muted-foreground/80 font-medium">
              Developed by {college.developer}
            </span>
          </p>
        </footer>
      </div>

      {/* Toast Alert Container */}
      <Toaster />
    </div>
  );
}
