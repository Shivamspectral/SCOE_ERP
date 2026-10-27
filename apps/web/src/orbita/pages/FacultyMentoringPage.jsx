import React, { useState } from "react";
import {
  Users,
  Calendar,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  X,
  Send,
  MessageSquare,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";

export function FacultyMentoringPage() {
  const { mentees, logMentoringMeeting, addSystemLog, toast } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingActionPlan, setMeetingActionPlan] = useState("");

  const filteredMentees = mentees.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenLogModal = (mentee) => {
    setSelectedMentee(mentee);
    setMeetingNotes("");
    setMeetingActionPlan("");
    setMeetingModalOpen(true);
  };

  const handleSaveMeeting = (e) => {
    e.preventDefault();
    if (!meetingNotes.trim()) {
      toast({
        title: "Meeting Notes Required",
        description: "Please summarize the counselling discussion.",
        variant: "warning",
      });
      return;
    }

    logMentoringMeeting(
      selectedMentee.id,
      `${meetingNotes}${meetingActionPlan ? " | Action Plan: " + meetingActionPlan : ""}`
    );
    addSystemLog(`Logged mentoring counselling for ${selectedMentee.name} (${selectedMentee.id})`, "Info");
    setMeetingModalOpen(false);
    toast({
      title: "Mentoring Record Saved",
      description: `Official counselling log recorded for ${selectedMentee.name}.`,
      variant: "success",
    });
  };

  const handleQuickContact = (mentee, type) => {
    if (type === "phone") {
      toast({
        title: "Initiating Voice Call",
        description: `Calling registered contact: ${mentee.phone}`,
        variant: "info",
      });
    } else {
      toast({
        title: "Dispatched Direct Reminder",
        description: `Sent attendance & remedial notification to ${mentee.name}.`,
        variant: "success",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teacher-Guardian & Mentoring" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Mentor-Mentee Scheme (TG)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor academic progress, attendance defaulters, career counselling, and student welfare.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs">
            <span className="text-muted-foreground">Assigned Mentees: </span>
            <span className="font-bold text-foreground">{mentees.length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search mentee name or roll no…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            {["All", "Good Standing", "Needs Monitoring", "Critical Defaulter"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mentees Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMentees.map((m) => {
          const isCritical = m.status === "Critical Defaulter";
          const isWarning = m.status === "Needs Monitoring";

          return (
            <div
              key={m.id}
              className={`flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all bg-card ${
                isCritical
                  ? "border-destructive/40 ring-1 ring-destructive/20"
                  : isWarning
                  ? "border-warning/40 ring-1 ring-warning/20"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {m.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">
                        {m.name}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        {m.rollNo} · {m.id}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isCritical
                        ? "bg-destructive/15 text-destructive"
                        : isWarning
                        ? "bg-warning/15 text-warning-foreground"
                        : "bg-success/15 text-success"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border py-2.5 text-center text-xs">
                  <div>
                    <span className="block text-muted-foreground">Attendance</span>
                    <span
                      className={`font-display text-sm font-bold ${
                        parseInt(m.attendance) < 75 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {m.attendance}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Standing</span>
                    <span className="font-display text-sm font-bold text-foreground">
                      {m.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Last Meeting</span>
                    <span className="font-display text-sm font-bold text-foreground">
                      {m.lastMeeting}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-muted-foreground/70" />
                    <span>Last Meeting: {m.lastMeeting}</span>
                  </p>
                  <p className="line-clamp-2 italic text-muted-foreground/90">
                    "{m.concerns}"
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-border pt-3">
                <button
                  onClick={() => handleOpenLogModal(m)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <FileText className="size-3.5" />
                  <span>Log Meeting</span>
                </button>
                <button
                  onClick={() => handleQuickContact(m, "phone")}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title={`Call ${m.phone}`}
                >
                  <Phone className="size-4" />
                </button>
                <button
                  onClick={() => handleQuickContact(m, "message")}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Send Academic Notice"
                >
                  <MessageSquare className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Meeting Modal */}
      {meetingModalOpen && selectedMentee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Record Mentoring Session
                </h3>
                <p className="text-xs text-muted-foreground">
                  Mentee: {selectedMentee.name} ({selectedMentee.rollNo})
                </p>
              </div>
              <button
                onClick={() => setMeetingModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Discussion Summary & Observations
                </label>
                <textarea
                  rows={3}
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Discussed attendance improvement plan, unit test remedial sessions, career goals…"
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Action Plan & Next Review Date
                </label>
                <input
                  type="text"
                  value={meetingActionPlan}
                  onChange={(e) => setMeetingActionPlan(e.target.value)}
                  placeholder="Mandatory attendance in TOC remedial lectures; next review on 25 Sep"
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMeetingModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3.5" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
