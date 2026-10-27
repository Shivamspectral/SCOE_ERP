import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Shield,
  Download,
  CheckCircle2,
  Lock,
  QrCode,
  Edit3,
  Save,
  Building,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";
import { college } from "../data/portalData";

export function ProfilePage() {
  const { student, updateStudentProfile, changePassword, changeEmail, toast, serverProfile } = usePortal();

  const [activeTab, setActiveTab] = useState("overview");
  const [emailForm, setEmailForm] = useState({ registrationId: "", currentPassword: "", newEmail: "" });

  // Editable Form State
  const [formData, setFormData] = useState({
    phone: student.phone,
    personalEmail: student.personalEmail,
    address: student.address,
    emergencyContact: student.emergencyContact,
    github: "github.com/rahulpatil-dev",
    linkedin: "linkedin.com/in/rahul-patil-scoe",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Security password state
  const [passwords, setPasswords] = useState({
    newPass: "",
    confirmPass: "",
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateStudentProfile({
      phone: formData.phone,
      personalEmail: formData.personalEmail,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
    });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
      description: "Contact information and addresses updated successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirmPass) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }
    try {
      await changePassword({
        registration_id: serverProfile?.registration_id || student.id,
        email: serverProfile?.email || student.email,
        new_password: passwords.newPass,
      });
      setPasswords({ newPass: "", confirmPass: "" });
      toast({ title: "Password Changed", description: "Your password was updated.", variant: "success" });
    } catch (error) {
      toast({ title: "Password Change Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    try {
      await changeEmail({
        registration_id: emailForm.registrationId || serverProfile?.registration_id || student.id,
        email: serverProfile?.email || student.email,
        current_password: emailForm.currentPassword,
        new_email: emailForm.newEmail,
      });
      toast({ title: "Email Change Requested", description: "Check the new email address for confirmation.", variant: "success" });
      setEmailForm({ registrationId: "", currentPassword: "", newEmail: "" });
    } catch (error) {
      toast({ title: "Email Change Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDownloadIDCard = () => {
    toast({
      title: "Downloading Student ID Card",
      description: "High-resolution digital student identity card generated as PDF.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb Header */}
      <Breadcrumb
        title="Student Identity & Academic Profile"
        subtitle={`Official records and credentials for ${student.name} (${student.id})`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadIDCard}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Download className="size-3.5" />
              <span>Download Digital ID Card</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {[
          { id: "overview", label: "Student ID & Overview" },
          { id: "edit", label: "Edit Contact Information" },
          { id: "academics", label: "Academic Records & SGPA" },
          { id: "security", label: "Security & Credentials" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ID Card & Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Official College Student ID Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-cream/50 shadow-xl relative">
              {/* Card Top Ribbon */}
              <div className="bg-primary p-4 text-primary-foreground text-center relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: "url(/scoe-logo.png)",
                    backgroundSize: "180px",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                />
                <div className="flex items-center justify-center gap-3">
                  <div className="size-12 rounded-full bg-white p-0.5 shadow ring-2 ring-white/40 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src="/scoe-logo.png"
                      alt="Official College Logo"
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-display text-xs font-bold uppercase tracking-wider text-primary-foreground">
                      {college.group}
                    </p>
                    <p className="text-[11px] font-semibold text-primary-foreground/90 leading-tight">
                      {college.name}
                    </p>
                    <p className="text-[9px] text-primary-foreground/75 mt-0.5">
                      {college.trust} · {college.motto}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Photo & Details */}
              <div className="p-6 text-center space-y-4">
                <div className="relative mx-auto size-28 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-md ring-4 ring-muted bg-muted">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80"
                    alt={student.name}
                    className="size-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {student.name}
                  </h3>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    {student.branch} · {student.year}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Division {student.division} · Roll No: {student.rollNo}</p>
                </div>

                {/* Badges */}
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="default" className="text-[10px]">
                    Student ID: {student.id}
                  </Badge>
                  <Badge variant="accent" className="text-[10px]">
                    {student.councilRole}
                  </Badge>
                </div>

                {/* Key specs grid */}
                <div className="grid grid-cols-2 gap-2 text-left text-[11px] rounded-xl border border-border bg-muted/30 p-3">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Permanent PRN:</span>
                    <span className="font-mono font-semibold text-foreground">{student.prn}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Blood Group:</span>
                    <span className="font-semibold text-destructive">{student.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Academic Year:</span>
                    <span className="font-semibold text-foreground">{college.academicYear}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Valid Upto:</span>
                    <span className="font-semibold text-foreground">{student.validThru}</span>
                  </div>
                </div>

                {/* Barcode representation */}
                <div className="pt-2 border-t border-border flex flex-col items-center">
                  <div className="flex items-center justify-center gap-1 tracking-widest text-[10px] text-muted-foreground font-mono">
                    ||||| | |||| |||||| | ||||| |||| |||||
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono mt-1">
                    *{student.id}*
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional & Mentor Profile (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Academic & Personal Information</CardTitle>
                  <button
                    onClick={() => setActiveTab("edit")}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Edit Info</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Verified college records registered with Savitribai Phule Pune University
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Full Legal Name</span>
                    <p className="font-semibold text-foreground text-sm">{student.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">College Email</span>
                    <p className="font-semibold text-foreground font-mono">{student.email}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Personal Email</span>
                    <p className="font-semibold text-foreground">{formData.personalEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Contact Phone</span>
                    <p className="font-semibold text-foreground font-mono">{formData.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <p className="font-semibold text-foreground">{student.dob}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Emergency Contact</span>
                    <p className="font-semibold text-foreground">{formData.emergencyContact}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-muted-foreground">Current Residence Address</span>
                    <p className="font-semibold text-foreground">{formData.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mentor & Council Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  <CardTitle>Faculty Mentor & Council Role</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Assigned Faculty Mentor</span>
                    <p className="font-semibold text-foreground text-sm">{student.mentor}</p>
                    <p className="text-muted-foreground">{student.mentorEmail} · {student.mentorPhone}</p>
                  </div>
                  <button
                    onClick={() =>
                      toast({
                        title: "Mentor Message",
                        description: `Meeting request sent to ${student.mentor}.`,
                        variant: "info",
                      })
                    }
                    className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Request Meet
                  </button>
                </div>

                <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                  <div className="flex items-center gap-2 font-semibold text-accent-foreground text-sm">
                    <Sparkles className="size-4 text-accent" />
                    <span>Student Council: {student.councilRole}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Lead architect of ASTRA Developers Team. Oversees college portal features, campus Wi-Fi enhancements, and coordinates weekly competitive programming rounds.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Edit Contact Information */}
      {activeTab === "edit" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit Contact & Address Details</CardTitle>
            <p className="text-xs text-muted-foreground">
              Update your active mobile number, communication address and developer profiles
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Personal Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Current Residential Address
                </label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Emergency Contact (Parent / Guardian)
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    GitHub Profile
                  </label>
                  <input
                    type="text"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="text"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="size-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Academic Records & SGPA */}
      {activeTab === "academics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-muted-foreground">Cumulative CGPA</span>
                <p className="font-display text-2xl font-bold text-foreground mt-1">{student.cgpa}</p>
                <Badge variant="success" className="mt-2 text-[10px]">First Class Distinction</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-muted-foreground">Total Credits Earned</span>
                <p className="font-display text-2xl font-bold text-foreground mt-1">84 / 160</p>
                <span className="text-[11px] text-muted-foreground mt-2 block">100% Cleared</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-muted-foreground">Active Backlogs</span>
                <p className="font-display text-2xl font-bold text-success mt-1">0</p>
                <span className="text-[11px] text-success font-medium mt-2 block">Clean Academic Record</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-xs text-muted-foreground">Current Attendance</span>
                <p className="font-display text-2xl font-bold text-primary mt-1">{student.attendance}%</p>
                <span className="text-[11px] text-muted-foreground mt-2 block">Semester V Safe</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Semester-Wise Academic SGPA Transcript</CardTitle>
              <p className="text-xs text-muted-foreground">
                SPPU official marksheets and semester performance indexes
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="py-2.5 px-3">Semester</th>
                      <th className="py-2.5 px-3">Academic Session</th>
                      <th className="py-2.5 px-3 text-center">Credits</th>
                      <th className="py-2.5 px-3 text-center">SGPA</th>
                      <th className="py-2.5 px-3 text-center">Result Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {student.sgpaHistory.map((row) => (
                      <tr key={row.sem} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-foreground">{row.sem}</td>
                        <td className="py-3 px-3 text-muted-foreground">AY 2023-24 / 2024-25</td>
                        <td className="py-3 px-3 text-center font-medium">{row.credits}</td>
                        <td className="py-3 px-3 text-center font-display font-bold text-primary text-sm">
                          {row.sgpa}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="success">{row.status}</Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() =>
                              toast({
                                title: `Downloading ${row.sem} Marksheet`,
                                description: "Official SPPU ledger copy downloaded.",
                                variant: "success",
                              })
                            }
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Download Ledger
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: Security & Credentials */}
      {activeTab === "security" && (
        <Card className="max-w-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              <CardTitle>Account Security & Password</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage your student portal login password and active sessions
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwords.confirmPass}
                  onChange={(e) => setPasswords({ ...passwords, confirmPass: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Update Password
                </button>
              </div>
            </form>
            <form onSubmit={handleEmailChange} className="mt-6 space-y-4 border-t border-border pt-5 text-xs">
              <h4 className="font-semibold text-foreground">Change Email Address</h4>
              <input type="text" placeholder="Registration ID" value={emailForm.registrationId} onChange={(e) => setEmailForm({ ...emailForm, registrationId: e.target.value })} className="w-full h-9 rounded-lg border border-input bg-card px-2.5" required />
              <input type="password" placeholder="Current Password" value={emailForm.currentPassword} onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })} className="w-full h-9 rounded-lg border border-input bg-card px-2.5" required />
              <input type="email" placeholder="New Email Address" value={emailForm.newEmail} onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })} className="w-full h-9 rounded-lg border border-input bg-card px-2.5" required />
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Update Email</button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
