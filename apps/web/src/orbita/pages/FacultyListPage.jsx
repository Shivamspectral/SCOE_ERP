import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Mail,
  MapPin,
  BookOpen,
  Award,
  ChevronRight,
  X,
  Send,
  MessageSquare,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";

export function FacultyListPage() {
  const { facultyList, departments, toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const filteredFaculty = facultyList.filter((f) => {
    const matchesSearch =
      String(f.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(f.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(f.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDept === "All" || f.dept === selectedDept;

    return matchesSearch && matchesDept;
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (liveSession) { toast({ title: "Messaging unavailable", description: "Faculty email or internal messaging is not connected. No message was sent.", variant: "info" }); return; }
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast({
        title: "All Fields Required",
        description: "Please enter both subject and message body.",
        variant: "warning",
      });
      return;
    }

    setMessageModalOpen(false);
    toast({
      title: "Preview only",
      description: "Messaging is not connected in preview mode. No memo was sent.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Faculty Directory & Workload" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Faculty Directory & Academic Workload
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Staff directory and available profile fields. Workload, research and cabin details appear only when recorded in the institutional system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs">
            <span className="text-muted-foreground">Total Faculty: </span>
            <span className="font-bold text-foreground">{facultyList.length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search faculty name, subject or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs outline-none focus:border-primary"
          >
            <option value="All">All Departments</option>
            {departments.map((department) => <option key={department.id || department.code} value={department.name}>{department.name}</option>)}
          </select>
        </div>
      </div>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFaculty.map((f) => (
          <div
            key={f.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {f.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      {f.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {f.designation}
                    </p>
                  </div>
                </div>

                <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  {String(f.dept || "Unassigned").split(" ")[0]}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <BookOpen className="size-3.5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{f.subject || "Not recorded"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-muted-foreground/70 shrink-0" />
                  <span>{f.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-muted-foreground/70 shrink-0" />
                  <span>{f.cabin || "Not recorded"}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-border pt-3">
              <button
                onClick={() => setSelectedFaculty(f)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                <span>View Workload</span>
              </button>
              <button
                onClick={() => {
                  setSelectedFaculty(f);
                  setMessageSubject(`Academic Notice: ${f.subject || "Not recorded"}`);
                  setMessageBody("");
                  setMessageModalOpen(true);
                }}
                disabled={liveSession}
                title={liveSession ? "Messaging integration is not connected" : "Preview only"}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="size-3.5" />
                <span>{liveSession ? "Messaging unavailable" : "Message"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Workload Modal */}
      {selectedFaculty && !messageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {selectedFaculty.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedFaculty.designation} · {selectedFaculty.dept}
                </p>
              </div>
              <button
                onClick={() => setSelectedFaculty(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <span className="block text-muted-foreground">Theory Load</span>
                  <span className="font-display text-base font-bold text-foreground">
                    {liveSession ? "—" : "8 hrs / wk"}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <span className="block text-muted-foreground">Lab Load</span>
                  <span className="font-display text-base font-bold text-foreground">
                    {liveSession ? "—" : "12 hrs / wk"}
                  </span>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <span className="block text-primary font-medium">Total Workload</span>
                  <span className="font-display text-base font-bold text-primary">
                    {liveSession ? "—" : "20 hrs / wk"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Courses:</span>
                  <span className="font-semibold text-foreground">{selectedFaculty.subject || "Not recorded"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faculty Cabin:</span>
                  <span className="font-semibold text-foreground">{selectedFaculty.cabin || "Not recorded"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Official Email:</span>
                  <span className="font-semibold text-foreground">{selectedFaculty.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Research Publications:</span>
                  <span className="font-semibold text-foreground">{liveSession ? "Not recorded" : "4 Scopus / IEEE Papers (sample)"}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setSelectedFaculty(null)}
                  className="rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setMessageSubject(`Academic Notice: ${selectedFaculty.subject || "Not recorded"}`);
                    setMessageBody("");
                    setMessageModalOpen(true);
                  }}
                  disabled={liveSession}
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {liveSession ? "Messaging unavailable" : "Preview Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModalOpen && selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Send Academic Memo
                </h3>
                <p className="text-xs text-muted-foreground">
                  To: {selectedFaculty.name} ({selectedFaculty.email})
                </p>
              </div>
              <button
                onClick={() => setMessageModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Enter notice regarding syllabus submission, committee meeting or test schedules…"
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMessageModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3.5" />
                  <span>Send Memo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
