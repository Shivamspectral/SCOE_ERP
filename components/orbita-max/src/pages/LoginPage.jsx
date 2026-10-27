"use client";
import React, { useState } from "react";
import {
  Lock,
  ArrowRight,
  LoaderCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Send,
  X,
  KeyRound,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { college } from "../data/portalData";
import { demoAccounts } from "../../../../lib/demo/accounts";

/**
 * Authentication screen.
 *
 * Security notes (README §9, §25):
 *  - No role selector. The role is issued by the backend from the signed-in
 *    identity; letting the client choose one would be meaningless and misleading.
 *  - No credentials are pre-filled or bundled.
 *  - Passwords are handled by Supabase Auth; the app never stores or checks them.
 *  - Account activation goes through an institutional registration ID, verified
 *    server-side before any account is created.
 */
export function LoginPage() {
  const { signIn, activateAccount, requestPasswordReset, previewSignIn, backendConfigured, toast } =
    usePortal();

  const [mode, setMode] = useState("signin"); // "signin" | "activate"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Activation (registration ID) fields
  const [registrationId, setRegistrationId] = useState("");
  const [fullName, setFullName] = useState("");

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const describeError = (error) => error?.message || "Please check your details and try again.";

  const handleDemoAccount = async (account) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/demo-login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ email: account.email, password: account.password }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Demo sign-in failed.");
      const roleMap = { Principal: "Principal", Administrator: "Super Admin", Coordinator: "Vice-Principal", "HOD (Computer Eng.)": "HOD", Faculty: "Faculty", Staff: "Faculty", "New member (pending)": "Student" };
      previewSignIn(roleMap[account.label] || "Student");
    } catch (error) {
      toast({ title: "Demo sign-in failed", description: error?.message || "Please try again.", variant: "error" });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Enter your college email address to continue.",
        variant: "warning",
      });
      return;
    }
    if (!password) {
      toast({
        title: "Password required",
        description: "Enter your portal password to continue.",
        variant: "warning",
      });
      return;
    }
    if (!registrationId.trim()) {
      toast({
        title: "Registration ID required",
        description: "Enter the institutional ID issued to you, e.g. STU-CSE-2026-00421.",
        variant: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!backendConfigured) {
        // UI preview only — no backend deployed. Grants no server access.
        previewSignIn("Student");
        toast({
          title: "Preview mode",
          description:
            "No backend is configured, so the portal is showing sample data. Set VITE_API_BASE_URL to connect.",
          variant: "info",
        });
        return;
      }

      if (mode === "activate") {
        await activateAccount({
          registrationId: registrationId.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          password,
          name: fullName.trim(),
        });
        toast({
          title: "Account activated",
          description: "Your institutional ID is now linked to this account.",
          variant: "success",
        });
      } else {
        await signIn({ email: email.trim().toLowerCase(), password, registrationId: registrationId.trim().toUpperCase() });
        toast({
          title: "Signed in",
          description: "Welcome back to the Smart Campus portal.",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: mode === "activate" ? "Activation failed" : "Sign in failed",
        description: describeError(error),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotSent(true);
    try {
      await requestPasswordReset(forgotEmail.trim().toLowerCase());
    } catch {
      // Never disclose whether an address exists.
    } finally {
      setForgotSent(false);
      setForgotModalOpen(false);
      toast({
        title: "Reset link sent",
        description:
          "If that address belongs to a registered account, reset instructions are on their way.",
        variant: "info",
      });
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-cream p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:grid-cols-2">
        {/* Left Branding Panel */}
        <div className="relative flex flex-col justify-center gap-6 bg-primary p-8 text-primary-foreground sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "url(/scoe-logo.png)",
              backgroundSize: "340px",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "bottom -60px right -60px",
            }}
          />

          <div className="relative flex flex-col items-start gap-5">
            <div className="size-24 rounded-full bg-white/95 p-1 shadow-md ring-2 ring-white/30 flex items-center justify-center overflow-hidden">
              <img
                src="/scoe-logo.png"
                alt="Siddhant College of Engineering crest"
                width={96}
                height={96}
                className="size-full object-contain"
              />
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold leading-tight text-primary-foreground">
                {college.name}
              </h1>
              <p className="mt-1 text-base font-medium text-primary-foreground/90">
                {college.system}
              </p>
            </div>

            <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/75">
              One secure platform for admissions, academics, attendance, examinations and
              administration — built for the SCOE campus community.
            </p>

            <span className="h-1 w-20 rounded-full bg-accent" />

            <ul className="mt-2 space-y-2 text-sm text-primary-foreground/80">
              {["Academics & Attendance", "Examinations & Results", "Placements & Campus Life"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-accent shrink-0" />
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex flex-col justify-center p-8 sm:p-10 bg-card relative">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {mode === "activate" ? "Activate your account" : "Sign in to your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "activate"
              ? "Enter the institutional ID issued to you by your college."
              : "Use your college-issued credentials to continue."}
          </p>

          {/* Mode switch */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1">
            {[
              { key: "signin", label: "Sign in" },
              { key: "activate", label: "Activate with ID" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === "activate" && (
              <>
                <div>
                  <label
                    htmlFor="registration-id"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Registration ID
                  </label>
                  <input
                    id="registration-id"
                    type="text"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    placeholder="STU-CSE-2026-00421"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm uppercase outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="full-name"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Full name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="As printed on your college record"
                    className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@siddhantcoe.edu.in"
                autoComplete="username"
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                required
              />
            </div>

            <div>
              <label htmlFor="login-registration-id" className="block text-sm font-medium">Registration ID</label>
          <input id="login-registration-id" value={registrationId} onChange={(e) => setRegistrationId(e.target.value)} placeholder="Your registration ID" className="w-full rounded-lg border border-input bg-card px-3 py-2" required />

          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                {mode === "activate" ? "Create a password" : "Password"}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "activate" ? "At least 8 characters" : "Enter your password"}
                  autoComplete={mode === "activate" ? "new-password" : "current-password"}
                  minLength={mode === "activate" ? 8 : undefined}
                  className="h-11 w-full rounded-lg border border-input bg-card px-3 pr-11 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {mode === "signin" && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-input accent-primary cursor-pointer"
                  />
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotModalOpen(true);
                  }}
                  className="text-sm font-medium text-[#c05621] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#922526] text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[#7e1f20] disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  <span>{mode === "activate" ? "Activating…" : "Signing in…"}</span>
                </>
              ) : (
                <>
                  {mode === "activate" ? <KeyRound className="size-4" /> : <Lock className="size-4" />}
                  <span>{mode === "activate" ? "Activate account" : "Login"}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-dashed border-primary/35 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Quick demo access</p><span className="text-[11px] text-muted-foreground">Password: Demo@1234</span></div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => <button key={account.id} type="button" disabled={isLoading} onClick={() => handleDemoAccount(account)} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:opacity-60"><span className="min-w-0"><span className="block text-sm font-semibold text-foreground">{account.label}</span><span className="block truncate text-xs text-muted-foreground">{account.email}</span></span><ArrowRight className="size-4 shrink-0 text-primary" /></button>)}
            </div>
          </div>

          {!backendConfigured && (
            <p className="mt-4 rounded-lg bg-muted/60 p-3 text-center text-[11px] leading-relaxed text-muted-foreground">
              Running without a backend. Set <span className="font-semibold">VITE_API_BASE_URL</span>{" "}
              and the Supabase variables in <span className="font-semibold">.env</span> to enable
              real authentication.
            </p>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Developed by {college.developer}
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="size-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Password recovery
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Reset access to your Smart Campus account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Registered college email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.name@siddhantcoe.edu.in"
                  className="w-full h-10 rounded-lg border border-input bg-card px-3 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-muted-foreground leading-relaxed">
                A reset link is sent to your registered college email. If you have lost access to
                that inbox, visit IT Infrastructure (Lab 1) with your physical College ID card.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotSent}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                >
                  <Send className="size-3.5" />
                  <span>Send reset link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
