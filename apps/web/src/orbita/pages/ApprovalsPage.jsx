import React, { useState } from "react";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Plus,
  AlertCircle,
  X,
  Send,
  Building,
  User,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";

export function ApprovalsPage() {
  const {
    approvals,
    approveRequest,
    rejectRequest,
    addApprovalRequest,
    userRole,
    addSystemLog,
    toast,
  } = usePortal();

  const [activeTab, setActiveTab] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // New Request Form State
  const [reqType, setReqType] = useState("Faculty Medical Leave");
  const [reqDetails, setReqDetails] = useState("");
  const [reqUrgency, setReqUrgency] = useState("Medium");
  const [reqBudget, setReqBudget] = useState("");

  const filteredApprovals = approvals.filter((app) => {
    const matchesTab =
      activeTab === "All" || app.status === activeTab;

    const matchesUrgency =
      urgencyFilter === "All" || app.urgency === urgencyFilter;

    const matchesSearch =
      app.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.details.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesUrgency && matchesSearch;
  });

  const pendingCount = approvals.filter((a) => a.status === "Pending").length;
  const approvedCount = approvals.filter((a) => a.status === "Approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "Rejected").length;

  const handleApprove = async (app) => {
    try {
      await approveRequest(app.id);
      addSystemLog(`Approved Sanction Request ${app.id} (${app.type})`, "Success");
      toast({
        title: "Request Sanctioned & Approved",
        description: `Dispatched official authorization for ${app.applicant}.`,
        variant: "success",
      });
    } catch (error) {
      toast({ title: "Approval failed", description: error?.message || "The request could not be approved.", variant: "error" });
    }
  };

  const handleOpenReject = (app) => {
    setActiveRequest(app);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please specify why this sanction is being declined.",
        variant: "warning",
      });
      return;
    }

    try {
      await rejectRequest(activeRequest.id, rejectionReason);
      addSystemLog(`Rejected Request ${activeRequest.id}: ${rejectionReason}`, "Warning");
      setRejectModalOpen(false);
      toast({
        title: "Request Declined",
        description: `Formal rejection logged for ${activeRequest.id}. Reason: ${rejectionReason}`,
        variant: "warning",
      });
    } catch (error) {
      toast({ title: "Rejection failed", description: error?.message || "The request could not be rejected.", variant: "error" });
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqDetails.trim()) {
      toast({
        title: "Details Required",
        description: "Please describe the sanction or clearance requisition.",
        variant: "warning",
      });
      return;
    }

    try {
      const created = await addApprovalRequest({
        type: reqType,
        details: reqDetails,
        urgency: reqUrgency,
        budget: reqBudget ? `₹${reqBudget}` : null,
      });
      addSystemLog(`Created new sanction requisition #${created.id} (${reqType})`, "Info");
      setNewModalOpen(false);
      setReqDetails("");
      setReqBudget("");
      toast({
        title: "Requisition Submitted",
        description: `Request #${created.id} submitted for institutional sanction.`,
        variant: "success",
      });
    } catch (error) {
      toast({ title: "Submission failed", description: error?.message || "The request could not be submitted.", variant: "error" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Institutional Approvals & Clearances" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Approvals & Sanctions Desk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review faculty leave, department budget sanctions, event clearances, and student requisitions.
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs text-muted-foreground">Total Requisitions</span>
          <span className="mt-1 block font-display text-2xl font-bold text-foreground">
            {approvals.length}
          </span>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <span className="text-xs text-warning-foreground font-medium">Pending Sanction</span>
          <span className="mt-1 block font-display text-2xl font-bold text-warning-foreground">
            {pendingCount}
          </span>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4">
          <span className="text-xs text-success font-medium">Approved</span>
          <span className="mt-1 block font-display text-2xl font-bold text-success">
            {approvedCount}
          </span>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <span className="text-xs text-destructive font-medium">Rejected</span>
          <span className="mt-1 block font-display text-2xl font-bold text-destructive">
            {rejectedCount}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
          {["All", "Pending", "Approved", "Rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2.5">
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by applicant or requisition…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-2 text-xs outline-none focus:border-primary"
          >
            <option value="All">All Urgency</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3.5">
        {filteredApprovals.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No approval requests match the current filters.
          </div>
        ) : (
          filteredApprovals.map((app) => {
            const isPending = app.status === "Pending";
            const isApproved = app.status === "Approved";
            const isRejected = app.status === "Rejected";

            return (
              <div
                key={app.id}
                className={`flex flex-col justify-between gap-4 rounded-xl border p-5 transition-all bg-card shadow-sm ${
                  isPending
                    ? "border-warning/30 hover:border-warning/60"
                    : isApproved
                    ? "border-success/30 bg-success/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {app.id}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{app.date}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          app.urgency === "High"
                            ? "bg-destructive/15 text-destructive"
                            : app.urgency === "Medium"
                            ? "bg-warning/15 text-warning-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {app.urgency} Urgency
                      </span>
                    </div>

                    <h3 className="mt-1.5 font-display text-base font-bold text-foreground">
                      {app.type}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Applicant: <span className="font-semibold text-foreground">{app.applicant}</span> ({app.role}) · <span className="text-foreground">{app.department}</span>
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shrink-0 ${
                      isPending
                        ? "bg-warning/15 text-warning-foreground"
                        : isApproved
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {isPending && <Clock className="size-3.5" />}
                    {isApproved && <CheckCircle2 className="size-3.5" />}
                    {isRejected && <XCircle className="size-3.5" />}
                    <span>{app.status}</span>
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                  {app.details}
                </p>

                {app.budget && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <DollarSign className="size-3.5" />
                    <span>Estimated Budget Requisition: {app.budget}</span>
                  </div>
                )}

                {/* Audit notes if actioned */}
                {(app.approverNote || app.rejectionReason) && (
                  <div className="text-xs text-muted-foreground italic border-t border-border pt-2">
                    {app.approverNote && <span>✓ {app.approverNote}</span>}
                    {app.rejectionReason && <span className="text-destructive">✗ {app.rejectionReason}</span>}
                  </div>
                )}

                {/* Action Buttons */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2.5 border-t border-border pt-3">
                    <button
                      onClick={() => handleOpenReject(app)}
                      className="flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <XCircle className="size-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(app)}
                      className="flex items-center gap-1.5 rounded-lg bg-success px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-success/90 transition-colors"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Approve & Sanction</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Decline Sanction Requisition
                </h3>
                <p className="text-xs text-muted-foreground">
                  Requisition #{activeRequest.id} · {activeRequest.applicant}
                </p>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Reason for Decline / Remarks
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify insufficient documentation, clash with timetable, or budgetary constraints…"
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 font-semibold text-white hover:bg-destructive/90"
                >
                  <XCircle className="size-3.5" />
                  <span>Confirm Decline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Requisition Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Submit Institutional Requisition
                </h3>
                <p className="text-xs text-muted-foreground">
                  Request budget, leave clearance, or official campus sanctions
                </p>
              </div>
              <button
                onClick={() => setNewModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Requisition Type
                </label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  <option value="Faculty Medical Leave">Faculty Medical Leave</option>
                  <option value="Budget & Sponsorship Clearance">Budget & Sponsorship Clearance</option>
                  <option value="Industrial Visit Sanction">Industrial Visit Sanction</option>
                  <option value="Lab Hardware Requisition">Lab Hardware Requisition</option>
                  <option value="On-Duty (OD) Sports Leave">On-Duty (OD) Sports Leave</option>
                  <option value="Bonafide & Passport Clearance">Bonafide & Passport Clearance</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Urgency Level
                </label>
                <select
                  value={reqUrgency}
                  onChange={(e) => setReqUrgency(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  <option value="High">High Urgency</option>
                  <option value="Medium">Medium Urgency</option>
                  <option value="Low">Low Urgency</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Estimated Budget / Expense (Optional)
                </label>
                <input
                  type="text"
                  value={reqBudget}
                  onChange={(e) => setReqBudget(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Justification & Details
                </label>
                <textarea
                  rows={3}
                  value={reqDetails}
                  onChange={(e) => setReqDetails(e.target.value)}
                  placeholder="Provide complete breakdown, dates, and substitute arrangements…"
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3.5" />
                  <span>Submit Requisition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
