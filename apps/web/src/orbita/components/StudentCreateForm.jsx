import React, { useState } from "react";
import { studentsApi } from "../lib/api";

export function StudentCreateForm({ departments = [], defaultDepartmentId = "", liveMode, onCreated, onClose, toast }) {
  const [form, setForm] = useState({ fullName: "", rollNumber: "", registrationNumber: "", email: "", departmentId: defaultDepartmentId });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.rollNumber.trim() || !form.departmentId) {
      toast({ title: "Required fields missing", description: "Enter the student name, roll number and department.", variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const record = liveMode
        ? await studentsApi.create({
            fullName: form.fullName.trim(),
            rollNumber: form.rollNumber.trim(),
            registrationNumber: form.registrationNumber.trim() || undefined,
            email: form.email.trim() || undefined,
            departmentId: form.departmentId,
          })
        : {
            id: "preview-student-" + Date.now(),
            full_name: form.fullName.trim(),
            roll_number: form.rollNumber.trim(),
            registration_number: form.registrationNumber.trim(),
            email: form.email.trim(),
            department_id: form.departmentId,
            status: "active",
          };
      const departmentName = departments.find((department) => department.id === record.department_id)?.name || "";
      const name = record.full_name || form.fullName.trim();
      onCreated({
        id: record.id,
        name,
        full_name: name,
        rollNo: record.roll_number || form.rollNumber.trim(),
        roll_number: record.roll_number || form.rollNumber.trim(),
        registrationId: record.registration_number || "",
        registration_number: record.registration_number || "",
        email: record.email || "",
        branch: departmentName,
        year: "—",
        cgpa: null,
        status: record.status || "active",
        avatar: name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      });
      toast({
        title: liveMode ? "Student record created" : "Preview record created",
        description: liveMode ? "The student record was saved to the institutional database." : "This record exists only in the current preview session.",
        variant: liveMode ? "success" : "info",
      });
      onClose();
    } catch (error) {
      toast({ title: "Could not create student", description: error?.message || "Check your role and the student details.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Add Student Record</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close form">×</button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-medium text-foreground">Student full name *
          <input required maxLength={120} value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-foreground">Roll number *
          <input required maxLength={40} value={form.rollNumber} onChange={(event) => setForm((prev) => ({ ...prev, rollNumber: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-foreground">Registration / PRN
          <input maxLength={80} value={form.registrationNumber} onChange={(event) => setForm((prev) => ({ ...prev, registrationNumber: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-foreground">College email
          <input type="email" maxLength={254} value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
        </label>
        <label className="text-xs font-medium text-foreground">Department *
          <select required value={form.departmentId} onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Choose department…</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={saving} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : "Save Student"}</button>
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground">Cancel</button>
        </div>
      </form>
    </div>
  );
}
