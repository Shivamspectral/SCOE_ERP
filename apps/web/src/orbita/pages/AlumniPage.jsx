import React, { useState } from "react";
import {
  Network,
  Award,
  Building,
  Mail,
  ExternalLink,
  MessageSquare,
  Search,
  Filter,
  X,
  Send,
  Plus,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";

export function AlumniPage() {
  const { toast } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [mentorModalAlumni, setMentorModalAlumni] = useState(null);
  const [mentorshipTopic, setMentorshipTopic] = useState("DSA & System Design Guidance");
  const [mentorshipMessage, setMentorshipMessage] = useState("");

  const alumni = [
    {
      name: "Prashant Kadam",
      batch: "Batch of 2018 (Computer)",
      role: "Staff Software Engineer @ Google (Bengaluru)",
      desc: "Mentors SCOE students on distributed systems and DSA interview preparation.",
      email: "prashant.kadam@alumni.siddhantcoe.edu.in",
      linkedin: "linkedin.com/in/prashant-kadam",
    },
    {
      name: "Snehal Deshpande",
      batch: "Batch of 2019 (IT)",
      role: "Product Manager @ Microsoft (Hyderabad)",
      desc: "Founder of Women Who Code Pune chapter and annual campus scholarship sponsor.",
      email: "snehal.d@alumni.siddhantcoe.edu.in",
      linkedin: "linkedin.com/in/snehal-deshpande",
    },
    {
      name: "Vikram Rathod",
      batch: "Batch of 2017 (Mechanical)",
      role: "Founder & CEO, AutoVayu Tech (Pune)",
      desc: "Built smart EV powertrain startup incubated at Pune, employs 40+ engineers.",
      email: "vikram.r@alumni.siddhantcoe.edu.in",
      linkedin: "linkedin.com/in/vikram-rathod-ev",
    },
    {
      name: "Aniket Joshi",
      batch: "Batch of 2020 (ENTC)",
      role: "Cloud Solutions Architect @ AWS (London)",
      desc: "Delivers guest lectures on cloud practitioner and devops certifications.",
      email: "aniket.joshi@alumni.siddhantcoe.edu.in",
      linkedin: "linkedin.com/in/aniket-joshi-aws",
    },
  ];

  const filteredAlumni = alumni.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMentorshipRequest = (e) => {
    e.preventDefault();
    setMentorModalAlumni(null);
    toast({
      title: "Mentorship Request Dispatched",
      description: `Request sent to ${mentorModalAlumni.name}. They will reach out via your registered college email.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="SCOE Alumni Association & Global Network"
        subtitle="Connecting 12,000+ alumni leaders across technology, management and civil services worldwide"
        actions={
          <button
            onClick={() =>
              toast({
                title: "Alumni Directory Registration",
                description: "Digital alumni registration form dispatched to your email.",
                variant: "info",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Network className="size-3.5" />
            <span>Join Alumni Network</span>
          </button>
        }
      />

      {/* Search */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search alumni by name, company, batch…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {filteredAlumni.map((a, i) => (
          <Card key={i} className="hover:border-primary/40 transition-colors flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="default">{a.batch}</Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Verified Alum</span>
              </div>
              <CardTitle className="text-base mt-2">{a.name}</CardTitle>
              <p className="text-xs font-semibold text-primary">{a.role}</p>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-3">
              <p className="leading-relaxed">{a.desc}</p>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setMentorModalAlumni(a);
                    setMentorshipMessage("");
                  }}
                  className="flex-1 rounded-lg bg-primary/10 py-1.5 text-center font-semibold text-primary hover:bg-primary/20 transition-colors text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Request Mentorship</span>
                </button>
                <button
                  onClick={() =>
                    toast({
                      title: "LinkedIn Profile",
                      description: `Opening ${a.linkedin}…`,
                      variant: "info",
                    })
                  }
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
                  title="Connect on LinkedIn"
                >
                  <ExternalLink className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mentorship Request Modal */}
      {mentorModalAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Request Alumni Mentorship
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connect with {mentorModalAlumni.name} ({mentorModalAlumni.role})
                </p>
              </div>
              <button
                onClick={() => setMentorModalAlumni(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSendMentorshipRequest} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Mentorship Track
                </label>
                <select
                  value={mentorshipTopic}
                  onChange={(e) => setMentorshipTopic(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  <option value="DSA & System Design Guidance">DSA & System Design Guidance</option>
                  <option value="Resume & Portfolio Review">Resume & Portfolio Review</option>
                  <option value="Higher Studies & MS Abroad Prep">Higher Studies & MS Abroad Prep</option>
                  <option value="Startup Mentorship & Pitching">Startup Mentorship & Pitching</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Introduction & Goals
                </label>
                <textarea
                  rows={3}
                  value={mentorshipMessage}
                  onChange={(e) => setMentorshipMessage(e.target.value)}
                  placeholder="Introduce your current year, branch and specific questions you would like advice on…"
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMentorModalAlumni(null)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
