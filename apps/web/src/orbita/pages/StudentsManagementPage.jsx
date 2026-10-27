import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Award,
  ClipboardCheck,
  ChevronRight,
  Download,
  X,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";

export function StudentsManagementPage() {
  const { studentsList, toast } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch =
      branchFilter === "All" || s.branch.toLowerCase().includes(branchFilter.toLowerCase());

    const matchesYear =
      yearFilter === "All" || s.year === yearFilter;

    return matchesSearch && matchesBranch && matchesYear;
  });

  const handleExportList = () => {
    const headers = "PRN,Roll No,Name,Branch,Year,CGPA,Email\n";
    const rows = filteredStudents
      .map((s) => `"${s.id}","${s.rollNo}","${s.name}","${s.branch}","${s.year}","${s.cgpa}","${s.email}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Students_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Student Roll Exported",
      description: "Downloaded CSV records for filtered students.",
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Student Management Directory" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Student Management & Records
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search enrolled undergraduate students, verify academic eligibility, and view digital student dossiers.
          </p>
        </div>

        <button
          onClick={handleExportList}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          <Download className="size-4 text-muted-foreground" />
          <span>Export Student Roll</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student, PRN or roll no…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
            >
              <option value="All">All Branches</option>
              <option value="Computer">Computer</option>
              <option value="Information Technology">IT</option>
              <option value="ENTC">ENTC</option>
              <option value="AI & Data Science">AI & DS</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
            >
              <option value="All">All Years</option>
              <option value="FE">FE</option>
              <option value="SE">SE</option>
              <option value="TE">TE</option>
              <option value="BE">BE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">PRN</th>
                <th className="px-4 py-3">Branch & Year</th>
                <th className="px-4 py-3 text-center">CGPA</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No student records match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">
                      {s.rollNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {s.id}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium text-foreground">{s.branch}</span> ·{" "}
                      <span className="text-muted-foreground font-semibold">{s.year}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-foreground">
                      {s.cgpa}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                  {selectedStudent.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedStudent.rollNo} · PRN: {selectedStudent.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <span className="block text-muted-foreground">Cumulative CGPA</span>
                  <span className="font-display text-base font-bold text-foreground">
                    {selectedStudent.cgpa}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <span className="block text-muted-foreground">Class Standing</span>
                  <span className="font-display text-base font-bold text-foreground">
                    Top 5%
                  </span>
                </div>
                <div className="rounded-lg bg-success/10 p-2.5">
                  <span className="block text-success font-medium">Academic Status</span>
                  <span className="font-display text-base font-bold text-success">
                    Eligible
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-semibold text-foreground">{selectedStudent.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Level:</span>
                  <span className="font-semibold text-foreground">{selectedStudent.year} (Semester VI)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">College Email:</span>
                  <span className="font-semibold text-foreground font-mono">{selectedStudent.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mentor:</span>
                  <span className="font-semibold text-foreground">Prof. R. Kale (Computer)</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast({
                      title: "Parent Communication Dispatched",
                      description: `Progress card dispatched to registered guardian of ${selectedStudent.name}.`,
                      variant: "info",
                    });
                  }}
                  className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Dispatch Progress Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
