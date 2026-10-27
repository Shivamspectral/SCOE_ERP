import React, { useEffect, useState } from "react";
import { Settings, Bell, Lock, Shield, Smartphone, Save } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { usePortal } from "../context/PortalContext";
import { settingsApi } from "../lib/api";

export function SettingsPage() {
  const { toast, activeProfile, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [attendanceWarnings, setAttendanceWarnings] = useState(true);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [preferencesLoadFailed, setPreferencesLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!liveSession) {
      setPreferencesLoaded(false);
      setPreferencesLoadFailed(false);
      return;
    }
    let cancelled = false;
    setPreferencesLoading(true);
    setPreferencesLoaded(false);
    setPreferencesLoadFailed(false);
    settingsApi.preferences().then((preferences) => {
      if (cancelled) return;
      setEmailAlerts(preferences.emailAlerts ?? true);
      setSmsAlerts(preferences.smsAlerts ?? false);
      setAttendanceWarnings(preferences.attendanceWarnings ?? true);
      setPreferencesLoaded(true);
    }).catch((error) => {
      if (cancelled) return;
      setPreferencesLoadFailed(true);
      toast({ title: "Could not load preferences", description: error?.message || "Your existing settings could not be read.", variant: "error" });
    }).finally(() => { if (!cancelled) setPreferencesLoading(false); });
    return () => { cancelled = true; };
  }, [liveSession, session?.access_token]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!liveSession) {
      toast({ title: "Preview only", description: "These changes are temporary and were not saved to an account.", variant: "info" });
      return;
    }
    if (!preferencesLoaded || preferencesLoadFailed) {
      toast({ title: "Preferences not saved", description: "Load your existing preferences successfully before saving changes.", variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const saved = await settingsApi.savePreferences({
        emailAlerts,
        smsAlerts,
        attendanceWarnings,
      });
      setEmailAlerts(saved.emailAlerts);
      setSmsAlerts(saved.smsAlerts);
      setAttendanceWarnings(saved.attendanceWarnings);
      toast({
        title: "Preferences saved",
        description: "Your notification choices were saved to your staff account. Email and SMS delivery integrations are not connected, so no messages were sent.",
        variant: "success",
      });
    } catch (error) {
      toast({ title: "Could not save preferences", description: error?.message || "Your settings were not saved.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Settings & Portal Preferences"
        subtitle="Manage communication channels, attendance alerts and security credentials"
      />

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground" role="status">{liveSession ? "Notification preferences are saved to your staff account. Email/SMS delivery integrations are not connected, so saving preferences does not send messages." : "Demo changes are temporary and reset when the page reloads."}</div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <p className="text-xs text-muted-foreground">Configure how you receive circulars and academic alerts</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer">
                <div>
                  <p className="font-semibold text-foreground">Email Notifications</p>
                  <p className="text-muted-foreground text-[11px]">Receive exam schedules and circulars at {activeProfile.email || "your configured college email"}</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  disabled={liveSession && (preferencesLoading || preferencesLoadFailed || saving)}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer">
                <div>
                  <p className="font-semibold text-foreground">SMS Urgency Alerts</p>
                  <p className="text-muted-foreground text-[11px]">Receive emergency college notices on your configured mobile number</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  disabled={liveSession}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer">
                <div>
                  <p className="font-semibold text-foreground">Attendance Defaulter Warning</p>
                  <p className="text-muted-foreground text-[11px]">Alert me if any subject attendance drops below the 75% university requirement</p>
                </div>
                <input
                  type="checkbox"
                  checked={attendanceWarnings}
                  disabled={liveSession}
                  onChange={(e) => setAttendanceWarnings(e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || (liveSession && (preferencesLoading || preferencesLoadFailed || !preferencesLoaded))}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Save className="size-3.5" />
                <span>{saving ? "Saving…" : preferencesLoading ? "Loading…" : "Save Preferences"}</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
