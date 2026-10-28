/**
 * Single HTTP entry point from the client (web + Capacitor Android) to the
 * NestJS API.
 *
 * README §4 / §27: the client never talks to privileged infrastructure and never
 * carries privileged credentials. It sends the Supabase Auth access token; the
 * backend performs every authentication and authorization decision. Web and
 * Android use this exact same client, so both get identical rules.
 */

import { supabase } from "./supabase";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "";
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, "");

/** False in pure UI/demo mode (no backend deployed yet). */
export const isBackendConfigured = Boolean(API_BASE_URL);

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function accessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

function buildUrl(path, query) {
  const rawPath = path.startsWith("/") ? path : `/${path}`;
  const apiPath = rawPath.startsWith("/api/") ? rawPath.replace(/^\/api\//, "/api/v1/") : rawPath;
  const url = `${API_BASE_URL}${apiPath}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((item) => qs.append(k, String(item)));
    else qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

async function request(method, path, { body, query, signal } = {}) {
  if (!isBackendConfigured) {
    throw new ApiError("Backend API is not configured (VITE_API_BASE_URL).", 0, "NO_BACKEND");
  }

  const token = await accessToken();
  const res = await fetch(buildUrl(path, query), {
    method,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const err = payload && typeof payload === "object" ? payload.error || payload : {};
    throw new ApiError(
      err.message || `Request failed (${res.status})`,
      res.status,
      err.code || String(res.status),
      err.details
    );
  }

  return payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
}

async function uploadRequest(path, file) {
  if (!isBackendConfigured) throw new ApiError("Backend API is not configured (VITE_API_BASE_URL).", 0, "NO_BACKEND");
  const token = await accessToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: token ? { Authorization: "Bearer " + token } : {},
    body: form,
  });
  const text = await res.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!res.ok) {
    const err = payload && typeof payload === "object" ? payload.error || payload : {};
    throw new ApiError(err.message || "File upload failed (" + res.status + ")", res.status, err.code || String(res.status), err.details);
  }
  return payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
}

export const api = {
  get: (path, query, opts) => request("GET", path, { query, ...opts }),
  post: (path, body, opts) => request("POST", path, { body, ...opts }),
  patch: (path, body, opts) => request("PATCH", path, { body, ...opts }),
  put: (path, body, opts) => request("PUT", path, { body, ...opts }),
  del: (path, opts) => request("DELETE", path, opts),
  upload: (path, file) => uploadRequest(path, file),
};

/**
 * Best-effort read: returns `fallback` when the backend is absent or the call
 * fails, so the portal stays usable against seed data while modules are wired up.
 * Authorization failures (401/403) are never swallowed silently in logs.
 */
export async function safeGet(path, query, fallback = null) {
  if (!isBackendConfigured) return fallback;
  try {
    return await api.get(path, query);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      console.warn(`[api] ${path} denied by backend authorization:`, error.message);
    } else {
      console.warn(`[api] ${path} unavailable, using local data:`, error.message);
    }
    return fallback;
  }
}

/* ------------------------------------------------------------------ *
 * Endpoint helpers — mirror of README §21
 * ------------------------------------------------------------------ */

export const authApi = {
  me: () => api.get("/api/auth/me"),
};

export const usersApi = {
  list: (query) => api.get("/api/users", query),
  create: (payload) => api.post("/api/users", payload),
  get: (id) => api.get(`/api/users/${id}`),
  update: (id, payload) => api.patch(`/api/users/${id}`, payload),
  remove: (id) => api.del(`/api/users/${id}`),
};

export const libraryApi = {
  books: (query) => api.get("/api/library/books", query),
  createBook: (payload) => api.post("/api/library/books", payload),
  updateBook: (id, payload) => api.patch(`/api/library/books/${id}`, payload),
  loans: (query) => api.get("/api/library/loans", query),
  issue: (payload) => api.post("/api/library/loans", payload),
  returnLoan: (id) => api.post(`/api/library/loans/${id}/return`, {}),
};

export const studentsApi = {
  list: (query) => api.get("/api/students", query),
  get: (id) => api.get(`/api/students/${id}`),
  create: (payload) => api.post("/api/students", payload),
  update: (id, payload) => api.patch(`/api/students/${id}`, payload),
};

export const facultyApi = {
  list: (query) => api.get("/api/faculty", query),
  get: (id) => api.get(`/api/faculty/${id}`),
  create: (payload) => api.post("/api/faculty", payload),
  update: (id, payload) => api.patch(`/api/faculty/${id}`, payload),
};

export const attendanceApi = {
  sessions: (query) => api.get("/api/attendance/sessions", query),
  records: (sessionId) => api.get(`/api/attendance/sessions/${sessionId}/records`),
  createSession: (payload) => api.post("/api/attendance/sessions", payload),
  markRecords: (sessionId, records) =>
    api.post(`/api/attendance/sessions/${sessionId}/records`, { records }),
  submit: (sessionId) => api.post(`/api/attendance/sessions/${sessionId}/submit`, {}),
  review: (sessionId, decision, reason) => api.post(`/api/attendance/sessions/${sessionId}/review`, { decision, reason }),
  updateRecord: (recordId, payload) => api.patch(`/api/attendance/records/${recordId}`, payload),
  byStudent: (studentId, query) => api.get(`/api/attendance/student/${studentId}`, query),
  byClass: (classId, query) => api.get(`/api/attendance/class/${classId}`, query),
};

export const marksApi = {
  list: (query) => api.get("/api/marks", query),
  get: (id) => api.get(`/api/marks/${id}`),
  submit: (id) => api.post(`/api/marks/${id}/submit`, {}),
  returnForCorrection: (id, reason) => api.post(`/api/marks/${id}/return`, { reason }),
  upsert: (payload) => api.post("/api/marks", payload),
  update: (payload) => api.patch("/api/marks", payload),
  lock: (id, reason) => api.post(`/api/marks/${id}/lock`, { reason }),
  unlock: (id, reason) => api.post(`/api/marks/${id}/unlock`, { reason }),
};

export const academicApi = {
  classes: (query) => api.get("/api/academic/classes", query),
  subjects: (query) => api.get("/api/academic/subjects", query),
  timetable: (query) => api.get("/api/academic/timetable", query),
  createTimetableEntry: (payload) => api.post("/api/academic/timetable", payload),
  syllabus: (query) => api.get("/api/academic/syllabus", query),
  createSyllabusProgress: (payload) => api.post("/api/academic/syllabus", payload),
  updateSyllabusProgress: (id, payload) => api.patch(`/api/academic/syllabus/${id}`, payload),
};

export const auditApi = {
  list: (query) => api.get("/api/audit-logs", query),
};

export const documentsApi = {
  list: (query) => api.get("/api/documents", query),
  create: (payload) => api.post("/api/documents", payload),
  update: (id, payload) => api.patch(`/api/documents/${id}`, payload),
  uploadFile: (id, file) => api.upload(`/api/documents/${id}/file`, file),
  fileUrl: (id) => api.get(`/api/documents/${id}/file`),
};

export const noticesApi = {
  list: (query) => api.get("/api/circulars", query),
  create: (payload) => api.post("/api/circulars", payload),
  publish: (id) => api.post(`/api/circulars/${id}/publish`, {}),
};

export const grievancesApi = {
  list: (query) => api.get("/api/grievances", query),
  create: (payload) => api.post("/api/grievances", payload),
  assign: (id, assignedTo, remarks) =>
    api.post(`/api/grievances/${id}/assign`, { assigned_to: assignedTo, remarks }),
  resolve: (id, remarks) => api.post(`/api/grievances/${id}/resolve`, { remarks }),
};

export const reportsApi = {
  generate: (kind, filters) => api.get(`/api/reports/${kind}`, filters),
  download: (token) => api.get(`/api/reports/download/${token}`),
};

export const notificationsApi = {
  list: (query) => api.get("/api/notifications", query),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`, {}),
  registerDevice: (payload) => api.post("/api/notifications/devices", payload),
};

export const auditLogsApi = {
  list: (query) => api.get("/api/audit-logs", query),
};

export const tasksApi = {
  list: (query) => api.get("/api/tasks", query),
  create: (payload) => api.post("/api/tasks", payload),
  update: (id, payload) => api.patch(`/api/tasks/${id}`, payload),
  cancel: (id) => api.del(`/api/tasks/${id}`),
};

export const settingsApi = {
  preferences: () => api.get("/api/notifications/preferences"),
  savePreferences: (payload) => api.put("/api/notifications/preferences", payload),
};
