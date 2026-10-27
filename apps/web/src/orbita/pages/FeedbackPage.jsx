import React, { useState } from "react";
import {
  LifeBuoy,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Paperclip,
  Check,
  Shield,
  Building,
  User,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";
import { college } from "../data/portalData";

export function FeedbackPage() {
  const { feedbackList, addFeedbackTicket, toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Infrastructure & Labs",
    urgency: "Medium",
    location: "",
    description: "",
    anonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search state
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  const categories = [
    "Infrastructure & Labs",
    "Academics & Teaching",
    "Hostel & Canteen",
    "Student Council & Events",
    "Examinations & Marks",
    "Central Library",
    "Campus Transport",
    "General Administration",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (liveSession) {
      toast({ title: "Grievance submission unavailable", description: "The grievance service is not connected to the institutional backend. Your message was not submitted or stored.", variant: "info" });
      return;
    }
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Incomplete Form",
        description: "Please enter both a title and description for your grievance.",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newTicket = addFeedbackTicket(formData);
      setIsSubmitting(false);
      setFormData({
        title: "",
        category: "Infrastructure & Labs",
        urgency: "Medium",
        location: "",
        description: "",
        anonymous: false,
      });

      toast({
        title: `Grievance Lodged #${newTicket.id}`,
        description: `Your complaint has been assigned to the Student Council Welfare Cell. Tracking active.`,
        variant: "success",
      });
    }, 700);
  };

  const displayedTickets = liveSession ? [] : feedbackList;
  const filteredTickets = displayedTickets.filter((ticket) => {
    const matchStatus = statusFilter === "All" || ticket.status === statusFilter;
    const matchSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusVariants = {
    "Under Review": "warning",
    "In Progress": "accent",
    Resolved: "success",
    Closed: "muted",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb Header */}
      <Breadcrumb
        title="Student Grievance & Feedback Cell"
        subtitle="Submit academic, facility or campus complaints with guaranteed council tracking and time-bound resolution"
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success border border-success/20">
              Guaranteed Response in 48 Hrs
            </span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Form: Submit Grievance / Feedback (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-t-4 border-t-primary shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="size-4 text-primary" />
                <CardTitle>Lodge New Complaint / Suggestion</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                All tickets are reviewed by the Student Welfare Committee and Dean Academics.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {/* Category Selection */}
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urgency Selection */}
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Priority / Urgency Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["Low", "Medium", "High", "Critical"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, urgency: lvl })}
                        className={`rounded-lg py-1.5 text-[11px] font-medium transition-all ${
                          formData.urgency === lvl
                            ? lvl === "Critical"
                              ? "bg-destructive text-white font-semibold"
                              : lvl === "High"
                              ? "bg-warning text-white font-semibold"
                              : "bg-primary text-primary-foreground font-semibold"
                            : "border border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject / Title */}
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Grievance Subject <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief summary of the issue…"
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs"
                  />
                </div>

                {/* Location / Room */}
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Facility / Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Lab 3, Boys Hostel Block B, Central Library…"
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs"
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Detailed Explanation <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows="4"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide specific details, dates, equipment numbers or impacted students…"
                    className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs leading-relaxed"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-2.5 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground text-[11px]">Submit Anonymously</p>
                      <p className="text-[10px] text-muted-foreground">
                        Your identity will be withheld from department staff.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.anonymous}
                    onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                    className="size-4 rounded border-input accent-primary"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? (
                    <span>Submitting ticket…</span>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>Register Grievance Ticket</span>
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* SLA Notice Card */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" />
              Council Resolution Guarantee
            </p>
            <p className="text-[11px] leading-relaxed">
              Every complaint is logged with an immutable ticket ID. If unresolved within 5 working days, it automatically escalates to the Principal & Management Committee.
            </p>
          </div>
        </div>

        {/* Right Section: Status Tracking & Ticket History (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
              <div>
                <CardTitle>Active Grievances & Status Tracking</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Track real-time progress, investigation updates and resolution notes
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                {["All", "Under Review", "In Progress", "Resolved"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket ID, subject or category…"
                  className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              {/* Tickets List */}
              <div className="space-y-2.5">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{t.id}</span>
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {t.category}
                        </span>
                      </div>
                      <Badge variant={statusVariants[t.status] || "muted"}>{t.status}</Badge>
                    </div>

                    <h4 className="font-semibold text-foreground text-sm mt-2 group-hover:text-primary transition-colors">
                      {t.title}
                    </h4>

                    <p className="text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span>Filed: {t.date}</span>
                        {t.location && <span>• {t.location}</span>}
                      </div>
                      <span className="text-primary font-medium flex items-center gap-1 group-hover:underline">
                        <Eye className="size-3" /> View Timeline
                      </span>
                    </div>
                  </div>
                ))}

                {filteredTickets.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    No tickets found matching your filter criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Timeline & Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">{selectedTicket.id}</span>
                  <Badge variant={statusVariants[selectedTicket.status] || "muted"}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mt-2">
                  {selectedTicket.title}
                </h3>
                <p className="text-xs text-muted-foreground">{selectedTicket.category}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
              {selectedTicket.description}
            </div>

            {/* Timeline */}
            <div className="mt-5">
              <h4 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Clock className="size-4 text-primary" /> Resolution Timeline & Updates
              </h4>
              <div className="space-y-3 border-l-2 border-primary/30 pl-4 text-xs">
                {selectedTicket.timeline.map((step, idx) => (
                  <div key={idx} className="relative pb-1">
                    <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-primary" />
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      {step.date}
                    </span>
                    <p className="text-foreground mt-0.5">{step.event}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Resolution Note */}
            {selectedTicket.resolutionNote && (
              <div className="mt-5 rounded-lg border border-success/30 bg-success/10 p-3.5 text-xs">
                <p className="font-semibold text-success flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="size-3.5" /> Authority Resolution Statement
                </p>
                <p className="text-foreground leading-relaxed">
                  {selectedTicket.resolutionNote}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Assigned cell: {selectedTicket.assignedTo}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-3">
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
