import React, { useState } from "react";
import {
  Building2,
  Users,
  GraduationCap,
  FlaskConical,
  Award,
  Search,
  ChevronRight,
  TrendingUp,
  FileCheck,
  X,
  BookOpen,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";

export function DepartmentsPage() {
  const { departments, navigate } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);

  const filteredDepts = departments.filter((d) =>
    String(d.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(d.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(d.hod || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Departments & Academic Units" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Departments & Centres of Excellence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Institutional overview of engineering branches, faculty strength, student strength, and research labs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs">
            <span className="text-muted-foreground">Active Departments: </span>
            <span className="font-bold text-foreground">{departments.length}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status">Department records show only fields currently supplied by the backend. HOD names and establishment years may be unavailable until those fields are maintained in the institutional database.</div>

      {/* Search Bar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search department, HOD or branch code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredDepts.map((d) => (
          <div
            key={d.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                  {d.code}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {d.established ? `Est. ${d.established}` : "Establishment year unavailable"}
                </span>
              </div>

              <h3 className="mt-2.5 font-display text-lg font-bold text-foreground">
                {d.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Head of Department: <span className="font-semibold text-foreground">{d.hod || "Not assigned / unavailable"}</span>
              </p>

              <p className="mt-3 text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                {d.description}
              </p>

              {/* Stats Grid */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="block text-[11px] text-muted-foreground">Students</span>
                  <span className="font-display font-bold text-foreground">{d.studentCount}</span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="block text-[11px] text-muted-foreground">Faculty</span>
                  <span className="font-display font-bold text-foreground">{d.facultyCount}</span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="block text-[11px] text-muted-foreground">Labs</span>
                  <span className="font-display font-bold text-foreground">{d.labsCount}</span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="mt-3.5 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>Avg Attendance</span>
                    <span className="font-semibold text-foreground">{d.avgAttendance}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full"
                      style={{ width: `${d.avgAttendance}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>Placement Rate</span>
                    <span className="font-semibold text-foreground">{d.avgPlacement}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${d.avgPlacement}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
              <span className="text-[11px] font-medium text-primary">
                {d.accreditation}
              </span>
              <button
                onClick={() => setSelectedDept(d)}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>View Details</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Department Details Modal */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                  {selectedDept.code}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-foreground">
                  {selectedDept.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Head of Department: {selectedDept.hod}
                </p>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg bg-muted/40 p-3 leading-relaxed text-muted-foreground">
                {selectedDept.description}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border p-2.5 text-center">
                  <span className="block text-muted-foreground">Approved Intake</span>
                  <span className="font-display text-base font-bold text-foreground">
                    {selectedDept.intake} / yr
                  </span>
                </div>
                <div className="rounded-lg border border-border p-2.5 text-center">
                  <span className="block text-muted-foreground">Active Strength</span>
                  <span className="font-display text-base font-bold text-foreground">
                    {selectedDept.studentCount}
                  </span>
                </div>
                <div className="rounded-lg border border-border p-2.5 text-center">
                  <span className="block text-muted-foreground">Teaching Faculty</span>
                  <span className="font-display text-base font-bold text-foreground">
                    {selectedDept.facultyCount}
                  </span>
                </div>
                <div className="rounded-lg border border-border p-2.5 text-center">
                  <span className="block text-muted-foreground">Dedicated Labs</span>
                  <span className="font-display text-base font-bold text-foreground">
                    {selectedDept.labsCount}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Accreditation Status</span>
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 font-semibold text-success">
                    {selectedDept.accreditation}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Average Term Attendance</span>
                  <span className="font-semibold text-foreground">
                    {selectedDept.avgAttendance}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Overall Placement Track</span>
                  <span className="font-semibold text-foreground">
                    {selectedDept.avgPlacement}%
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setSelectedDept(null);
                    navigate("/faculty");
                  }}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  View Faculty
                </button>
                <button
                  onClick={() => {
                    setSelectedDept(null);
                    navigate("/students");
                  }}
                  className="rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  View Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
