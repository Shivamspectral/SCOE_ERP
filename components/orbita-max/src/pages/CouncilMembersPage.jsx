import React, { useState } from "react";
import {
  Landmark,
  Mail,
  Phone,
  Search,
  Filter,
  Award,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Shield,
  FileText,
  Users,
  ChevronRight,
  Send,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { councilMembers as initialMembers, college } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

export function CouncilMembersPage() {
  const { toast } = usePortal();
  const [selectedCommittee, setSelectedCommittee] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMemberModal, setActiveMemberModal] = useState(null);
  const [contactModalMember, setContactModalMember] = useState(null);
  const [contactMessage, setContactMessage] = useState("");

  const committees = [
    "All",
    "Executive Council",
    "Technical Committee",
    "Cultural Committee",
    "Sports Committee",
    "Welfare Committee",
    "Advisory Board",
  ];

  const filteredMembers = initialMembers.filter((m) => {
    const matchComm = selectedCommittee === "All" || m.committee === selectedCommittee;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.branch.toLowerCase().includes(searchQuery.toLowerCase());
    return matchComm && matchSearch;
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    setContactModalMember(null);
    setContactMessage("");
    toast({
      title: "Message Delivered to Council",
      description: `Your communication has been forwarded directly to ${contactModalMember.name} (${contactModalMember.role}).`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb Header */}
      <Breadcrumb
        title="Student Council 2025-26"
        subtitle={`Official Student Council body of Siddhant College of Engineering · Constituted under SPPU & Maharashtra Public Universities Act`}
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/20">
              AY 2025-26 Tenure
            </span>
          </div>
        }
      />

      {/* Council Executive Summary Banner */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-white p-1 shadow-md ring-2 ring-primary/30 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/scoe-logo.png"
                alt="SCOE crest"
                className="size-full object-contain"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Democracy · Service · Leadership
              </span>
              <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl mt-0.5">
                Siddhant Student Council
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Serving over 2,100 students across 6 departments. Bridging student aspirations with college governance, orchestrating campus events, academic initiatives, and rapid grievance redressal.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-xs">
              <span className="block font-bold text-primary font-display text-base">9</span>
              <span className="text-muted-foreground text-[10px]">Elected Officers</span>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-xs">
              <span className="block font-bold text-accent font-display text-base">14</span>
              <span className="text-muted-foreground text-[10px]">Resolutions Passed</span>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-xs">
              <span className="block font-bold text-success font-display text-base">98%</span>
              <span className="text-muted-foreground text-[10px]">Grievance Resolution</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Committee Pills */}
        <div className="scrollbar-thin flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {committees.map((comm) => (
            <button
              key={comm}
              onClick={() => setSelectedCommittee(comm)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCommittee === comm
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {comm}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member, role, dept…"
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Council Members Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <Card
            key={member.id}
            className={`flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group ${
              member.isCurrentUser ? "ring-2 ring-primary/40 border-primary/30" : ""
            }`}
          >
            {/* Member Card Header */}
            <div className="relative p-5 pb-0 flex items-start gap-4">
              <div className="relative size-16 shrink-0 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-border bg-muted">
                <img
                  src={member.image}
                  alt={member.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant={member.isCurrentUser ? "default" : "accent"} className="text-[10px]">
                    {member.role}
                  </Badge>
                  {member.isCurrentUser && (
                    <span className="rounded bg-accent px-1.5 py-0.2 text-[9px] font-bold text-accent-foreground">
                      YOU
                    </span>
                  )}
                </div>

                <h3 className="font-display text-base font-bold text-foreground mt-1.5 group-hover:text-primary transition-colors truncate">
                  {member.name}
                </h3>

                <p className="text-xs text-muted-foreground truncate">
                  {member.branch} · {member.year}
                </p>
              </div>
            </div>

            {/* Member Details */}
            <CardContent className="flex flex-1 flex-col p-5 pt-3">
              {/* Quote */}
              <p className="italic text-xs text-muted-foreground/90 border-l-2 border-primary/30 pl-2.5 my-2 line-clamp-2">
                "{member.quote}"
              </p>

              {/* Responsibilities */}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                {member.responsibilities}
              </p>

              {/* Key Initiatives Badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {member.initiatives.map((init, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
                  >
                    • {init}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-3">
                <button
                  onClick={() => setActiveMemberModal(member)}
                  className="flex-1 rounded-lg bg-primary/10 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors text-center"
                >
                  View Profile & Manifesto
                </button>
                <button
                  onClick={() => setContactModalMember(member)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={`Contact ${member.name}`}
                >
                  <MessageSquare className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Council Key Resolutions Tracker */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            <CardTitle>Recent Council Resolutions & Actions</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Official decisions approved in Council-Management meetings
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                title: "Central Library Extended Reading Hall Timings Approved",
                by: "Proposed by Omkar Shinde (GS) & Tanmay Patil (President)",
                date: "Passed 14 Sep 2026",
                status: "Implemented",
                desc: "Library will operate till 9:00 PM during exam months with night transport shuttle service.",
              },
              {
                title: "ASTRA Campus Portal v2.0 Rollout & Free Wi-Fi 6 Upgrade",
                by: "Spearheaded by Rahul Patil (Technical Secretary)",
                date: "Passed 28 Aug 2026",
                status: "Active",
                desc: "1 Gbps high-speed optical fiber backbone deployed across all department blocks and laboratories.",
              },
              {
                title: "₹50,000 Prize Pool Sanction for Innovatia 2026 Hackathon",
                by: "Joint proposal by Technical & Cultural Committees",
                date: "Passed 05 Sep 2026",
                status: "Approved",
                desc: "Sponsored by industry partners in MIDC Chakan and Talegaon engineering associations.",
              },
            ].map((res, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground text-sm">{res.title}</p>
                  <Badge variant="success">{res.status}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 leading-relaxed">{res.desc}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground/80 border-t border-border/50 pt-1.5">
                  <span>{res.by}</span>
                  <span>{res.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Member Details Modal */}
      {activeMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-16 rounded-full overflow-hidden border-2 border-primary/30 ring-2 ring-border">
                  <img
                    src={activeMemberModal.image}
                    alt={activeMemberModal.name}
                    className="size-full object-cover"
                  />
                </div>
                <div>
                  <Badge variant="accent">{activeMemberModal.role}</Badge>
                  <h3 className="font-display text-xl font-bold text-foreground mt-1">
                    {activeMemberModal.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeMemberModal.branch} · {activeMemberModal.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveMemberModal(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs italic text-muted-foreground border-l-2 border-primary">
              "{activeMemberModal.quote}"
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Key Responsibilities</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {activeMemberModal.responsibilities}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">Major Council Initiatives</h4>
                <ul className="space-y-1">
                  {activeMemberModal.initiatives.map((ini, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                      <span>{ini}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">Honors & Achievements</h4>
                <ul className="space-y-1">
                  {activeMemberModal.achievements.map((ach, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-muted-foreground">
                      <Award className="size-3.5 text-accent shrink-0" />
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-1.5 bg-card">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5 text-primary" />
                  <a href={`mailto:${activeMemberModal.email}`} className="text-primary hover:underline">
                    {activeMemberModal.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5 text-accent" />
                  <span>{activeMemberModal.phone}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-3">
              <button
                onClick={() => setActiveMemberModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setContactModalMember(activeMemberModal);
                  setActiveMemberModal(null);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Message Modal */}
      {contactModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground">
              Contact {contactModalMember.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send a query or proposal to the {contactModalMember.role}
            </p>

            <form onSubmit={handleSendMessage} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Your Name & ID</label>
                <input
                  type="text"
                  disabled
                  value="Rahul Patil (SCOE2023CE042)"
                  className="w-full h-9 rounded-lg border border-input bg-muted px-2.5 text-muted-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Message / Proposal</label>
                <textarea
                  rows="4"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Type your message, suggestion, or initiative query…"
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContactModalMember(null)}
                  className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3.5" />
                  <span>Send Communication</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
