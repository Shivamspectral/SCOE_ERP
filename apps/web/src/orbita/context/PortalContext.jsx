import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { supabase, supabaseResetPassword } from "../lib/supabase";
import { authApi, usersApi, isBackendConfigured, safeGet, api } from "../lib/api";
import { roleLabel, roleEnum, ROLES } from "../lib/roles";
import {
  student as initialStudent,
  college,
  notifications as initialNotifications,
  feedbackTickets as initialFeedbackTickets,
  events as initialEvents,
  departments as initialDepartments,
  facultyClasses as initialFacultyClasses,
  classStudents as initialClassStudents,
  menteesList as initialMenteesList,
  initialTasks,
  initialApprovals,
  institutionalReports as initialReports,
  adminUsersList as initialAdminUsers,
  systemLogs as initialSystemLogs,
  faculty as initialFaculty,
  students as initialStudents,
} from "../data/portalData";

const PortalContext = createContext(null);

/**
 * Presentation defaults per role.
 *
 * These are NOT credentials and NOT an access-control mechanism. The signed-in
 * identity, role and institutional scope always come from the backend
 * (`GET /api/auth/me`, README §25). These values only fill cosmetic gaps
 * (avatar initials, designation wording) when a profile field is absent, and
 * they drive the seed dataset when the portal runs without a backend.
 */
export const ROLE_PROFILE_DEFAULTS = {
  Student: {
    id: "SCOE2023CE042",
    name: "Rahul Patil",
    role: "Student",
    designation: "Technical Secretary · Student Council",
    dept: "Computer Engineering",
    year: "TE",
    branch: "Computer Engineering",
    email: "",
    avatar: "RP",
  },
  Faculty: {
    id: "SCOEFAC-CE08",
    name: "Prof. R. Kale",
    role: "Faculty",
    designation: "Assistant Professor & Class Coordinator",
    dept: "Computer Engineering",
    year: "Faculty",
    branch: "Computer Engineering",
    email: "",
    avatar: "RK",
  },
  HOD: {
    id: "SCOE-HOD-CE",
    name: "Dr. S. Pawar",
    role: "HOD",
    designation: "Professor & Head of Department",
    dept: "Computer Engineering",
    year: "Department Head",
    branch: "Computer Engineering",
    email: "",
    avatar: "SP",
  },
  "Vice-Principal": {
    id: "SCOE-VP-01",
    name: "Dr. A. Sharma",
    role: "Vice-Principal",
    designation: "Vice-Principal (Academic Affairs)",
    dept: "Institutional Administration",
    year: "Executive Officer",
    branch: "All Departments",
    email: "",
    avatar: "AS",
  },
  Principal: {
    id: "SCOE-PRIN-01",
    name: "Dr. V. Patil",
    role: "Principal",
    designation: "Principal & Institutional Head",
    dept: "Executive Office",
    year: "Head of Institution",
    branch: "Siddhant Group of Institutions",
    email: "",
    avatar: "VP",
  },
  Staff: {
    id: "SCOE-STAFF-01", name: "Pooja Nair", role: "Staff", designation: "Administrative Staff", dept: "Administration Office", year: "Staff", branch: "Administration", email: "", avatar: "PN",
  },
  Pending: {
    id: "SCOE-PENDING-01", name: "Arjun Mehta", role: "Pending", designation: "Awaiting institutional approval", dept: "Unassigned", year: "Pending", branch: "Unassigned", email: "", avatar: "AM",
  },
  "Super Admin": {
    id: "SCOE-ADMIN-ROOT",
    name: "ASTRA SysAdmin",
    role: "Super Admin",
    designation: "Chief Portal Administrator & Security Officer",
    dept: "IT & Systems Cell",
    year: "Root Admin",
    branch: "System Architecture",
    email: "",
    avatar: "SA",
  },
};

export function PortalProvider({ children }) {
  // Auth state. Nothing is trusted until Supabase Auth returns a session AND the
  // backend resolves the caller's role + institutional scope (README §9, §25).
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoPreview, setIsDemoPreview] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("Faculty");
  const [serverProfile, setServerProfile] = useState(null);
  const [scope, setScope] = useState(null);

  // Navigation route: defaults to /login when unauthenticated
  const [currentRoute, setCurrentRoute] = useState("/login");

  // Keep browser history in sync if available, while enforcing auth protection
  const navigate = useCallback((route) => {
    if (!isAuthenticated && route !== "/login") {
      setCurrentRoute("/login");
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", "/login");
      }
      return;
    }

    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", route);
    }
  }, [isAuthenticated]);

  // Listen to popstate (back/forward buttons) with authentication enforcement
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || "/login";
      if (!isAuthenticated) {
        setCurrentRoute("/login");
      } else {
        setCurrentRoute(path === "/" || path === "/login" ? "/dashboard" : path);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAuthenticated]);

  /**
   * Resolve the authenticated identity from the backend.
   * The role is whatever the server says it is — never something the client picks.
   */
  const hydrateIdentity = useCallback(async () => {
    if (!isBackendConfigured) return null;
    const me = await safeGet("/api/auth/me", undefined, null);
    if (!me) return null;
    const roleLabels = {
      principal: "Principal",
      administrator: "Super Admin",
      coordinator: "Vice-Principal",
      hod: "HOD",
      faculty: "Faculty",
      staff: "Staff",
    };
    const rawRole = me.primaryRole || me.roles?.[0]?.role || null;
    const normalizedRole = rawRole
      ? (roleLabels[String(rawRole).toLowerCase()] || roleLabel(rawRole))
      : "Pending";
    const sourceProfile = me.profile || me.user || null;
    const profile = sourceProfile ? {
      ...sourceProfile,
      id: sourceProfile.user_id || sourceProfile.id,
      name: sourceProfile.full_name || sourceProfile.name,
      designation: sourceProfile.title || sourceProfile.designation,
      department_name: sourceProfile.departments?.name || sourceProfile.department_name,
      email: me.identity?.email || sourceProfile.email || "",
    } : null;
    const accessStatus = me.accessStatus || profile?.status || "profile_missing";
    const effectiveRole = accessStatus === "active" && normalizedRole !== "Pending" ? normalizedRole : "Pending";
    setServerProfile(profile);
    setScope({ institution_id: profile?.institution_id, department_id: profile?.department_id, roles: me.roles || [] });
    setUserRole(effectiveRole);
    return { ...me, profile, role: effectiveRole, scope: { institution_id: profile?.institution_id, department_id: profile?.department_id } };
  }, []);

  /** Restore an existing Supabase session on boot. */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const existing = data?.session || null;
        if (cancelled) return;
        if (existing?.access_token) {
          setSession(existing);
          setIsAuthenticated(true);
          await hydrateIdentity();
          const path = window.location.pathname;
          setCurrentRoute(!path || path === "/" || path === "/login" ? "/dashboard" : path);
        } else {
          const response = await fetch("/api/demo-login", { credentials: "same-origin" }).catch(() => null);
          const demo = response?.ok ? await response.json().catch(() => null) : null;
          if (!cancelled && demo?.ok && demo?.account) {
            const roleMap = { Principal: "Principal", Administrator: "Super Admin", Coordinator: "Vice-Principal", "HOD (Computer Eng.)": "HOD", Faculty: "Faculty", Staff: "Staff", "New member (pending)": "Pending" };
            setUserRole(roleMap[demo.account.label] || "Student");
            setIsAuthenticated(true);
            const path = window.location.pathname;
            setCurrentRoute(!path || path === "/" || path === "/login" ? "/dashboard" : path);
          }
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((next) => {
      setSession(next || null);
      if (!next) {
        setIsAuthenticated(false);
        setServerProfile(null);
        setScope(null);
      }
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [hydrateIdentity]);

  /**
   * Sign in with Supabase Auth (README §9 — the app never stores or verifies
   * passwords itself), then load role + scope from the backend.
   */
  const signIn = useCallback(async ({ email, password, registrationId }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    setSession(data || null);
    setIsDemoPreview(false);
    setIsAuthenticated(true);

    const me = await hydrateIdentity();
    if (registrationId && me?.profile?.registration_id?.toUpperCase() !== registrationId.toUpperCase()) {
      await supabase.auth.signOut();
      setSession(null);
      setIsAuthenticated(false);
      throw new Error("Registration ID does not match this account");
    }
    setCurrentRoute("/dashboard");
    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", "/dashboard");
    }
    return me;
  }, [hydrateIdentity]);

  /**
   * Activate an account against an institutional registration ID (README §8).
   * The backend verifies the ID and its status; the client only relays it.
   */
  const activateAccount = useCallback(async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (error) throw error;
    const newSession = data?.session || (data?.access_token ? data : null);
    if (!newSession?.access_token) return { needsEmailConfirmation: true };

    setSession(newSession);
    setIsDemoPreview(false);
    setIsAuthenticated(true);
    const me = await hydrateIdentity();
    setCurrentRoute("/dashboard");
    if (window.history && window.history.pushState) window.history.pushState(null, "", "/dashboard");
    return { needsEmailConfirmation: false, me };
  }, [hydrateIdentity]);

  const requestPasswordReset = useCallback(async (email) => {
    return supabaseResetPassword(email);
  }, []);

  /**
   * Demo entry point used only when no backend is configured (pure UI preview).
   * It grants no server access: every protected API call still fails closed.
   */
  const previewSignIn = useCallback((role = "Faculty") => {
    const demoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS !== "false";
    if (!demoEnabled) {
      throw new Error("Demo previews are disabled by VITE_ENABLE_DEMO_ACCOUNTS=false.");
    }
    setUserRole(role);
    setSession(null);
    setServerProfile(null);
    setScope(null);
    setIsDemoPreview(true);
    setIsAuthenticated(true);
    setCurrentRoute("/dashboard");
    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", "/dashboard");
    }
  }, []);

  // Logout: clears the Supabase session and resets local state.
  const logout = useCallback(async () => {
    try {
      await fetch("/api/demo-login", { method: "DELETE", credentials: "same-origin" }).catch(() => {});
      if (isBackendConfigured) await authApi.logout().catch(() => {});
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setIsDemoPreview(false);
      setServerProfile(null);
      setScope(null);
      setIsAuthenticated(false);
      setUserRole("Faculty");
      setCurrentRoute("/login");
      setApprovals(initialApprovals);
      setWorkflowsLoaded(false);
      setNotifications(initialNotifications);
      setNotificationsLoaded(false);
      setUsersList(initialAdminUsers);
      setUsersLoaded(false);
      setDepartmentsList(null);
      setInstitutionStudents(null);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", "/login");
      }
    }
  }, []);

  // Active user profile: server identity wins, cosmetic defaults fill the gaps.
  const roleDefaults = ROLE_PROFILE_DEFAULTS[userRole] || ROLE_PROFILE_DEFAULTS.Faculty;
  const activeProfile = React.useMemo(() => {
    if (!serverProfile) return roleDefaults;
    const name = serverProfile.name || roleDefaults.name;
    return {
      ...roleDefaults,
      id: serverProfile.registration_id || serverProfile.id || roleDefaults.id,
      name,
      role: userRole,
      designation: serverProfile.designation || roleDefaults.designation,
      dept: serverProfile.department_name || serverProfile.department || roleDefaults.dept,
      branch: serverProfile.department_name || roleDefaults.branch,
      email: serverProfile.email || roleDefaults.email,
      avatar: name
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || roleDefaults.avatar,
    };
  }, [serverProfile, roleDefaults, userRole]);

  // Editable Student profile state
  const [student, setStudent] = useState({
    ...initialStudent,
    ...activeProfile,
  });

  // Keep the visible student profile synchronized with the authenticated
  // backend profile. Never overwrite real account identity with demo defaults
  // after /api/auth/me has resolved. Academic fields that are not yet stored
  // in the backend remain available from the presentation dataset for V1.
  useEffect(() => {
    if (!isAuthenticated || !serverProfile) return;

    setStudent((prev) => ({
      ...prev,
      ...activeProfile,
      id: serverProfile.registration_id || serverProfile.id || prev.id,
      name: serverProfile.name || prev.name,
      email: serverProfile.email || prev.email,
      role: userRole,
      ...(serverProfile.profile_data || {}),
    }));
  }, [activeProfile, isAuthenticated, serverProfile, userRole]);

  const updateStudentProfile = useCallback(async (fields) => {
    if (!serverProfile?.id) throw new Error("Your profile is not loaded");
    const updated = await usersApi.update(serverProfile.id, {
      name: fields.name,
      phone: fields.phone,
      profile_data: {
        personalEmail: fields.personalEmail,
        address: fields.address,
        emergencyContact: fields.emergencyContact,
      },
    });
    setServerProfile((prev) => ({ ...prev, ...(updated || {}), ...fields }));
    setStudent((prev) => ({ ...prev, ...fields }));
    return updated;
  }, [serverProfile?.id]);

  const changePassword = useCallback((payload) => authApi.changePassword(payload), []);
  const changeEmail = useCallback((payload) => authApi.changeEmail(payload), []);

  // Approvals & Leave Requests State
  const [approvals, setApprovals] = useState(initialApprovals);
  const [workflowsLoaded, setWorkflowsLoaded] = useState(false);

  useEffect(() => {
    if (!isBackendConfigured || !isAuthenticated || !session?.access_token) return;
    let cancelled = false;
    setWorkflowsLoaded(false);
    const statusLabels = { pending: "Pending", approved: "Approved", rejected: "Rejected", returned: "Pending", completed: "Approved", cancelled: "Rejected" };
    const urgencyLabels = { low: "Low", normal: "Medium", high: "High", urgent: "High" };
    api.get("/api/workflows").then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      setApprovals(rows.map((row) => ({
        id: row.id,
        type: row.title || row.module || "Institutional request",
        applicant: row.requester_name || "Institutional member",
        role: row.requester_title || "Staff member",
        department: row.department_name || "Institution",
        details: row.description || row.title || "",
        date: row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN") : "",
        status: statusLabels[row.status] || "Pending",
        urgency: urgencyLabels[row.priority] || "Medium",
        budget: row.payload?.budget ?? null,
        backendStatus: row.status,
      })));
      setWorkflowsLoaded(true);
    }).catch((error) => {
      console.warn("[workflows] unable to load queue", error);
      if (!cancelled) { setApprovals([]); setWorkflowsLoaded(true); }
    });
    return () => { cancelled = true; };
  }, [isBackendConfigured, isAuthenticated, session?.access_token]);

  const approveRequest = useCallback(async (id, note = "") => {
    if (isBackendConfigured && session?.access_token) {
      await api.post(`/api/workflows/${id}/decision`, { decision: "approve", comment: note || undefined });
    }
    setApprovals((prev) => prev.map((app) => app.id === id
      ? { ...app, status: "Approved", actionDate: "Just now", approverNote: note || `Approved by ${activeProfile.name} (${userRole})` }
      : app));
  }, [activeProfile.name, userRole, isBackendConfigured, session?.access_token]);

  const rejectRequest = useCallback(async (id, reason = "") => {
    if (isBackendConfigured && session?.access_token) {
      await api.post(`/api/workflows/${id}/decision`, { decision: "reject", comment: reason });
    }
    setApprovals((prev) => prev.map((app) => app.id === id
      ? { ...app, status: "Rejected", actionDate: "Just now", rejectionReason: reason || `Declined by ${activeProfile.name} (${userRole})` }
      : app));
  }, [activeProfile.name, userRole, isBackendConfigured, session?.access_token]);

  const addApprovalRequest = useCallback(async (req) => {
    const title = req.type || "Requisition";
    let id;
    if (isBackendConfigured && session?.access_token) {
      const module = /leave|medical/i.test(title) ? "leave"
        : /budget|equipment|department/i.test(title) ? "department"
        : /syllabus|academic/i.test(title) ? "syllabus"
        : /attendance/i.test(title) ? "attendance" : "other";
      const created = await api.post("/api/workflows", {
        module, title, description: req.details,
        priority: req.urgency === "High" ? "high" : req.urgency === "Low" ? "low" : "normal",
        payload: { budget: req.budget || null },
      });
      id = created?.id;
    } else {
      id = `APP-2026-${String(Math.floor(200 + Math.random() * 800))}`;
    }
    const newEntry = {
      id, type: title, applicant: activeProfile.name, role: activeProfile.designation,
      department: activeProfile.dept, details: req.details,
      date: new Date().toLocaleDateString("en-IN"), status: "Pending",
      urgency: req.urgency || "Medium", budget: req.budget || null,
    };
    setApprovals((prev) => [newEntry, ...prev]);
    return newEntry;
  }, [activeProfile, isBackendConfigured, session?.access_token]);

  // Faculty Attendance Management State
  const [facultyClassesList, setFacultyClassesList] = useState(initialFacultyClasses);
  const [attendanceSheet, setAttendanceSheet] = useState(initialClassStudents);

  const toggleStudentAttendance = useCallback((studentId, newStatus) => {
    setAttendanceSheet((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  }, []);

  const markAllClassAttendance = useCallback((status = "Present") => {
    setAttendanceSheet((prev) => prev.map((s) => ({ ...s, status })));
  }, []);

  const saveAttendanceSheet = useCallback((classId) => {
    const presentCount = attendanceSheet.filter((s) => s.status === "Present").length;
    setFacultyClassesList((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, presentToday: presentCount, lastMarked: "Today, Just now" }
          : c
      )
    );
  }, [attendanceSheet]);

  // Faculty Marks & Grading State
  const [marksList, setMarksList] = useState(initialClassStudents);
  const updateStudentMarks = useCallback((studentId, inSem, endSem) => {
    setMarksList((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, marksInSem: Number(inSem), marksEndSem: Number(endSem) }
          : s
      )
    );
  }, []);

  // Faculty Mentoring State
  const [mentees, setMentees] = useState(initialMenteesList);
  const logMentoringMeeting = useCallback((studentId, note) => {
    setMentees((prev) =>
      prev.map((m) =>
        m.id === studentId
          ? {
              ...m,
              lastMeeting: "Today, 16 Sep 2026",
              concerns: note ? `${note} (Logged by ${activeProfile.name})` : m.concerns,
            }
          : m
      )
    );
  }, [activeProfile.name]);

  // Faculty Tasks State
  const [tasks, setTasks] = useState(initialTasks);
  const toggleTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);
  const addTask = useCallback((task) => {
    const newId = `tsk-${Date.now()}`;
    const newTask = {
      id: newId,
      title: task.title,
      priority: task.priority || "Medium",
      dueDate: task.dueDate || "Next Week",
      completed: false,
      category: task.category || "General",
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);
  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // User Management State (Super Admin)
  const addUser = useCallback(async (newUser) => {
    if (realSession) {
      throw new Error("Account invitations are not configured yet. Create the Supabase Auth account through the approved institutional process, then assign its role here.");
    }
    const created = { ...newUser, id: newUser.id || `DEMO-USER-${Date.now()}`, status: newUser.status || "Active" };
    setUsersList((prev) => [created, ...prev]);
    return created;
  }, [realSession]);

  const deleteUser = useCallback(async (id) => {
    if (realSession) {
      await usersApi.remove(id);
    }
    setUsersList((prev) => prev.filter((user) => user.id !== id));
  }, [realSession]);

  const updateUserRole = useCallback(async (id, newRole) => {
    let updated;
    if (realSession) {
      updated = await usersApi.update(id, { role: newRole });
    } else {
      const current = usersList.find((user) => user.id === id);
      updated = { ...current, role: newRole };
    }
    setUsersList((prev) => prev.map((user) => (user.id === id ? { ...user, ...updated } : user)));
    return updated;
  }, [realSession, usersList]);


  // System Logs & Audit
  const [logs, setLogs] = useState(initialSystemLogs);
  const addSystemLog = useCallback((action, severity = "Info") => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: "Today, Just now",
      user: `${activeProfile.name} (${userRole})`,
      action,
      ip: "192.168.1.102",
      severity,
    };
    setLogs((prev) => [newLog, ...prev]);
  }, [activeProfile.name, userRole]);

  // Reports
  const [reportsList, setReportsList] = useState(initialReports);

  // Set-based interactive states for students
  const [registeredEvents, setRegisteredEvents] = useState(new Set(["ev4"]));
  const toggleEvent = useCallback((id) => {
    setRegisteredEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const [joinedClubs, setJoinedClubs] = useState(new Set(["c1", "c2"]));
  const toggleClub = useCallback((id) => {
    setJoinedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const [appliedCompanies, setAppliedCompanies] = useState(new Set(["co1"]));
  const applyCompany = useCallback((id) => {
    setAppliedCompanies((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);


  const [reservedBooks, setReservedBooks] = useState(new Set(["b5"]));
  const reserveBook = useCallback((id) => {
    setReservedBooks((prev) => new Set(prev).add(id));
  }, []);

  // Feedback / Complaints tickets
  const [feedbackList, setFeedbackList] = useState(initialFeedbackTickets);
  const addFeedbackTicket = useCallback((ticket) => {
    const newId = `GRV-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const newEntry = {
      id: newId,
      title: ticket.title,
      category: ticket.category,
      urgency: ticket.urgency || "Medium",
      date: "Today, 16 Sep 2026",
      status: "Under Review",
      description: ticket.description,
      location: ticket.location || "Campus Facility",
      assignedTo: "Student Council Welfare Committee",
      timeline: [
        { date: "16 Sep 2026, Just now", event: `Grievance registered #${newId}` },
        { date: "16 Sep 2026, Just now", event: "Auto-routed to Welfare Cell" }
      ],
      resolutionNote: "Acknowledged by council desk. Estimated initial response within 24 working hours."
    };
    setFeedbackList((prev) => [newEntry, ...prev]);
    return newEntry;
  }, []);

  // Notifications
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  useEffect(() => {
    if (!isBackendConfigured || !isAuthenticated || !session?.access_token) return;
    let cancelled = false;
    setNotificationsLoaded(false);
    const kindToType = { info: "academic", approval: "warning", workflow: "warning", circular: "academic", access: "warning" };
    api.get("/api/notifications").then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      setNotifications(rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.body || "",
        type: kindToType[row.kind] || "academic",
        href: row.href || "/notifications",
        unread: !row.read_at,
        time: row.created_at ? new Date(row.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "",
      })));
      setNotificationsLoaded(true);
    }).catch((error) => {
      console.warn("[notifications] unable to load inbox", error);
      if (!cancelled) { setNotifications([]); setNotificationsLoaded(true); }
    });
    return () => { cancelled = true; };
  }, [isBackendConfigured, isAuthenticated, session?.access_token]);

  const markRead = useCallback(async (id) => {
    if (isBackendConfigured && session?.access_token) {
      try { await api.patch(`/api/notifications/${id}/read`, {}); }
      catch (error) { console.warn("[notifications] mark-read failed", error); return; }
    }
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  }, [isBackendConfigured, session?.access_token]);

  const markAllRead = useCallback(async () => {
    if (isBackendConfigured && session?.access_token) {
      const unread = notifications.filter((item) => item.unread);
      try {
        await Promise.all(unread.map((item) => api.patch(`/api/notifications/${item.id}/read`, {})));
      } catch (error) {
        console.warn("[notifications] mark-all-read failed", error);
        return;
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, [isBackendConfigured, session?.access_token, notifications]);

  const visibleNotifications = realSession ? (notificationsLoaded ? notifications : []) : notifications;
  const unreadCount = visibleNotifications.filter((n) => n.unread).length;

    // Toasts
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const toast = useCallback(({ title, description, variant = "success" }) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Human-readable scope metadata. This is presentation only; backend
   * authorization remains the source of truth for every protected request.
   */
  const scopeMeta = useMemo(() => {
    const collegeWide = Boolean(scope?.college_wide);
    if (collegeWide || ["Principal", "Vice-Principal", "Super Admin"].includes(userRole)) {
      return {
        level: "college",
        label: "College-wide",
        description: "Institution-level access",
      };
    }
    if (userRole === "HOD") {
      return {
        level: "department",
        label: `${activeProfile.dept || "Department"} · Department`,
        description: "Department-scoped access",
      };
    }
    if (userRole === "Faculty") {
      return {
        level: "assigned",
        label: `${activeProfile.dept || "Department"} · Assigned classes & subjects`,
        description: "Class + subject assignment scope",
      };
    }
    return {
      level: "self",
      label: `${activeProfile.dept || activeProfile.branch || "Academic Profile"} · Personal`,
      description: "Own academic and campus data",
    };
  }, [scope?.college_wide, userRole, activeProfile.dept, activeProfile.branch]);

  const [departmentsList, setDepartmentsList] = useState(null);
  useEffect(() => {
    if (!isBackendConfigured || !isAuthenticated || !session?.access_token) return;
    let cancelled = false;
    api.get("/api/departments", { status: "active" }).then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      setDepartmentsList(rows.map((row) => ({
        id: row.id, code: row.code, name: row.name,
        description: row.description || "", status: row.status,
        hod_user_id: row.hod_user_id || null,
      })));
    }).catch((error) => { console.warn("[departments] unable to load directory", error); if (!cancelled) setDepartmentsList([]); });
    return () => { cancelled = true; };
  }, [isBackendConfigured, isAuthenticated, session?.access_token]);

  const [institutionStudents, setInstitutionStudents] = useState(null);
  useEffect(() => {
    if (!isBackendConfigured || !isAuthenticated || !session?.access_token) return;
    let cancelled = false;
    api.get("/api/students", { limit: 200, status: "active" }).then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      setInstitutionStudents(rows.map((row) => {
        const departmentName = row.departments?.name || "";
        const className = row.academic_classes?.name || "";
        const fullName = row.full_name || "Unnamed record";
        return {
          id: row.id,
          classId: row.class_id || null,
          name: fullName,
          full_name: fullName,
          rollNo: row.roll_number,
          roll_number: row.roll_number,
          registrationId: row.registration_number || "",
          registration_number: row.registration_number || "",
          email: row.email || "",
          branch: departmentName,
          dept: departmentName,
          year: className || (row.academic_classes?.year_of_study ? `Year ${row.academic_classes.year_of_study}` : ""),
          course: className,
          status: row.status,
          avatar: fullName.split(/\\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
        };
      }));
    }).catch((error) => {
      console.warn("[students] unable to load staff-managed roster", error);
      if (!cancelled) setInstitutionStudents([]);
    });
    return () => { cancelled = true; };
  }, [isBackendConfigured, isAuthenticated, session?.access_token]);

  const realSession = Boolean(isBackendConfigured && isAuthenticated && session?.access_token);

  // Seed-data filtering mirrors the server scope when the portal is running
  // without a backend. With a backend configured, API authorization remains
  // authoritative and these lists are only UI fallbacks.
  const scopedDepartments = useMemo(() => {
    if (realSession) return departmentsList ?? [];
    if (scopeMeta.level === "college") return departmentsList ?? initialDepartments;
    const dept = activeProfile.dept?.toLowerCase();
    if (!dept) return departmentsList ?? initialDepartments;
    return (departmentsList ?? initialDepartments).filter((item) => item.name?.toLowerCase() === dept);
  }, [scopeMeta.level, activeProfile.dept, departmentsList, realSession]);

  const [usersList, setUsersList] = useState(initialAdminUsers);
  const [usersLoaded, setUsersLoaded] = useState(false);
  useEffect(() => {
    if (!realSession) return;
    let cancelled = false;
    setUsersLoaded(false);
    usersApi.list({ limit: 100 }).then((rows) => {
      if (!cancelled) { setUsersList(Array.isArray(rows) ? rows : []); setUsersLoaded(true); }
    }).catch((error) => {
      console.warn("[users] unable to load directory", error);
      if (!cancelled) { setUsersList([]); setUsersLoaded(true); }
    });
    return () => { cancelled = true; };
  }, [realSession]);
  const scopedFaculty = useMemo(() => {
    if (realSession) return (usersLoaded ? (usersList ?? []) : []).filter((item) => ["Faculty", "faculty"].includes(item.role) || item.roles?.some((role) => role.role === "faculty")).map((item) => ({ id: item.id, name: item.name, email: item.email || "", dept: item.department?.name || "", designation: item.title || "Faculty", role: "Faculty" }));
    if (scopeMeta.level === "college") return initialFaculty;
    const dept = activeProfile.dept?.toLowerCase();
    if (userRole === "Faculty") {
      return initialFaculty.filter((item) =>
        item.id === activeProfile.id || item.email === activeProfile.email
      );
    }
    if (!dept) return initialFaculty;
    return initialFaculty.filter((item) => item.dept?.toLowerCase() === dept);
  }, [scopeMeta.level, activeProfile.dept, activeProfile.id, activeProfile.email, userRole, realSession, usersList]);

  const scopedStudents = useMemo(() => {
    if (realSession) {
      return institutionStudents ?? [];
    }
    if (scopeMeta.level === "college") return initialStudents;
    if (userRole === "Faculty") {
      return initialClassStudents.map((item) => ({
        ...item,
        branch: item.branch || "Computer Engineering",
      }));
    }
    const dept = activeProfile.dept?.toLowerCase();
    if (!dept) return initialStudents;
    return initialStudents.filter((item) =>
      `${item.branch || ""}`.toLowerCase().includes(dept.replace(" engineering", ""))
    );
  }, [scopeMeta.level, userRole, activeProfile.dept, realSession, institutionStudents]);

  const scopedFacultyClasses = useMemo(() => {
    if (scopeMeta.level === "college") return facultyClassesList;
    if (userRole === "Faculty") return facultyClassesList;
    const dept = activeProfile.dept?.toLowerCase();
    if (!dept) return facultyClassesList;
    return facultyClassesList.filter((item) =>
      item.branch?.toLowerCase() === dept
    );
  }, [facultyClassesList, scopeMeta.level, userRole, activeProfile.dept]);

  const value = {
    isAuthenticated,
    isDemoPreview,
    authLoading,
    session,
    userRole,
    roleEnum: roleEnum(userRole),
    ROLES,
    scope,
    scopeMeta,
    serverProfile,
    backendConfigured: isBackendConfigured,
    activeProfile,
    signIn,
    activateAccount,
    requestPasswordReset,
    changePassword,
    changeEmail,
    previewSignIn,
    refreshIdentity: hydrateIdentity,
    logout,
    currentRoute,
    navigate,
    student,
    updateStudentProfile,
    college,
    registeredEvents,
    toggleEvent,
    joinedClubs,
    toggleClub,
    appliedCompanies,
    applyCompany,
    reservedBooks,
    reserveBook,
    feedbackList,
    addFeedbackTicket,
    notifications: visibleNotifications,
    markRead,
    markAllRead,
    unreadCount,
    toasts,
    toast,
    dismissToast,
    // Role-based state & actions
    approvals: realSession ? (workflowsLoaded ? approvals : []) : approvals,
    approveRequest,
    rejectRequest,
    addApprovalRequest,
    facultyClassesList: scopedFacultyClasses,
    attendanceSheet,
    toggleStudentAttendance,
    markAllClassAttendance,
    saveAttendanceSheet,
    marksList,
    updateStudentMarks,
    mentees,
    logMentoringMeeting,
    tasks,
    toggleTask,
    addTask,
    deleteTask,
    usersList: realSession ? (usersLoaded ? usersList : []) : usersList,
    addUser,
    deleteUser,
    updateUserRole,
    logs,
    addSystemLog,
    reportsList,
    departments: scopedDepartments,
    facultyList: scopedFaculty,
    studentsList: scopedStudents,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return context;
}
