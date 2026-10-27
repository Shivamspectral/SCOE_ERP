import React from "react";
import { Briefcase, Building, MapPin, Calendar, CheckCircle2, Award, Download } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { companies, placementStats, student } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

export function PlacementsPage() {
  const { appliedCompanies, applyCompany, toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  const displayedCompanies = liveSession ? [] : companies;

  const handleApply = (comp) => {
    if (liveSession) {
      toast({ title: "Application unavailable", description: "Placement drives and applications are not connected to the institutional backend. No application was submitted.", variant: "info" });
      return;
    }
    applyCompany(comp.id);
    toast({
      title: `Application Submitted: ${comp.name}`,
      description: `Your profile (CGPA ${student.cgpa}) has been submitted for ${comp.role}. Online test link will arrive via email.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Training & Placement Cell (T&P)"
        subtitle="Campus recruitment drives, internships, corporate recruitment guidelines and salary packages"
      />

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status"><strong>Preview data only.</strong> Placement statistics, company drives, eligibility and packages are sample values, not verified institutional placement records. Applying is disabled until the placement service is connected.</div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Highest Package</span>
            <p className="font-display text-2xl font-bold text-success mt-1">{liveSession ? "—" : placementStats.highestPackage}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Amazon AWS India</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Average Package</span>
            <p className="font-display text-2xl font-bold text-foreground mt-1">{liveSession ? "—" : placementStats.averagePackage}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Across Tech Streams</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Students Placed</span>
            <p className="font-display text-2xl font-bold text-foreground mt-1">{liveSession ? "—" : placementStats.placedStudents}</p>
            <span className="text-[10px] text-success font-medium mt-1 block">65% Batch Placed</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Recruiting Partners</span>
            <p className="font-display text-2xl font-bold text-foreground mt-1">{liveSession ? "—" : `${placementStats.companies}+`}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">MNCs & Unicorn Startups</span>
          </CardContent>
        </Card>
      </div>

      {/* Active Recruitment Drives */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-bold text-foreground">
          Active & Upcoming Campus Recruitment Drives
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {displayedCompanies.map((comp) => {
            const isApplied = appliedCompanies.has(comp.id);

            return (
              <Card key={comp.id} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-display text-lg font-bold text-foreground">{comp.name}</span>
                      <p className="text-xs font-semibold text-primary mt-0.5">{comp.role}</p>
                    </div>
                    <Badge variant={comp.status === "Open" ? "success" : "muted"}>
                      {comp.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <p className="text-muted-foreground leading-relaxed">
                    {comp.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Compensation</span>
                      <span className="font-bold text-foreground text-sm">{comp.package}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Drive Date</span>
                      <span className="font-semibold text-foreground">{comp.driveDate}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-[10px] block">Eligibility Criteria</span>
                      <span className="font-medium text-foreground">{comp.eligibility}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-success font-medium flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Eligible (CGPA: {student.cgpa})
                    </span>

                    <button
                      onClick={() => handleApply(comp)}
                      disabled={isApplied || comp.status === "Closed"}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                        isApplied
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : comp.status === "Closed"
                          ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isApplied ? "Applied ✓" : comp.status === "Closed" ? "Drive Closed" : "Apply Now"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {liveSession && <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No institutional placement records are available. Sample drives and statistics are hidden in live sessions until the placement service is connected.</p>}
      </div>
    </div>
  );
}
