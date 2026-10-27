import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Trash2,
  Edit,
  X,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";

export function UsersManagementPage() {
  const {
    usersList,
    addUser,
    deleteUser,
    updateUserRole,
    addSystemLog,
    toast,
    departments,
  } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Add User Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Faculty");
  const [newDept, setNewDept] = useState("Computer Engineering");

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "All" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast({
        title: "All fields required",
        description: "Please provide a name and college email address.",
        variant: "warning",
      });
      return;
    }

    const department = Array.isArray(departments)
      ? departments.find((item) => item.name === newDept)
      : null;
    try {
      const created = await addUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        dept: newDept,
        departmentId: department ? department.id : undefined,
        title: newRole,
      });
      addSystemLog(`Recorded staff access request for ${created?.name || newName}`, "Success");
      setAddModalOpen(false);
      setNewName("");
      setNewEmail("");
      toast({
        title: "Staff access request recorded",
        description: "The account must complete email confirmation and receive institutional approval before access is granted.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Could not record request",
        description: error?.message || "Check your permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (u) => {
    try {
      await deleteUser(u.id);
      addSystemLog(`Revoked user access for ${u.name} (${u.id})`, "Warning");
      toast({
        title: "User Access Revoked",
        description: `Removed account ${u.id} (${u.name}).`,
        variant: "info",
      });
    } catch (error) {
      toast({ title: "Access revocation failed", description: error?.message || "The account could not be suspended.", variant: "destructive" });
    }
  };

  const handleRoleChange = async (u, role) => {
    try {
      await updateUserRole(u.id, role);
      addSystemLog(`Updated role of ${u.name} to ${role}`, "Security");
      toast({
        title: "User Role Updated",
        description: `${u.name} is now designated as ${role}.`,
        variant: "success",
      });
    } catch (error) {
      toast({ title: "Role update failed", description: error?.message || "The role could not be changed.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "User Accounts & Role Permissions" },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Identity & Access Management (IAM)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage authenticated accounts across Student, Faculty, HOD, Principal, and Admin roles.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="size-4" />
          <span>Provision New Account</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[220px] max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search account by name, email or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs outline-none focus:border-primary"
          >
            <option value="All">All Roles</option>
            <option value="Staff">Staff</option>
            <option value="Faculty">Faculty</option>
            <option value="HOD">HOD</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Vice-Principal">Vice-Principal</option>
            <option value="Principal">Principal</option>
            <option value="Super Admin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Account Holder</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-muted-foreground">
                    {u.id}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">
                    {u.dept}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className="rounded border border-input bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    >
                        <option value="Faculty">Faculty</option>
                      <option value="HOD">HOD</option>
                      <option value="Coordinator">Coordinator</option>
                      <option value="Vice-Principal">Vice-Principal</option>
                      <option value="Staff">Staff</option>
                      <option value="Principal" disabled>Principal (system-controlled)</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${["active", "Active"].includes(u.status) ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Revoke access"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Provision Portal Identity
                </h3>
                <p className="text-xs text-muted-foreground">
                  Create institutional credentials and assign security clearance
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Prof. Sandeep Shinde"
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Official College Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. s.shinde@siddhantcoe.edu.in"
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Role Clearance
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Faculty">Faculty</option>
                    <option value="HOD">HOD</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Vice-Principal">Vice-Principal</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Department
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  {departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <UserPlus className="size-3.5" />
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
