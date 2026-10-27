import React, { useState } from "react";
import { Settings, Bell, Lock, Shield, Smartphone, Save } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { usePortal } from "../context/PortalContext";

export function SettingsPage() {
  const { toast, activeProfile, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [attendanceWarnings, setAttendanceWarnings] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    toast({
      title: "Preferences not saved",
      description: liveSession
        ? "Notification preference persistence and delivery subscriptions are not connected to the institutional backend. Your selections were not saved."
        : "This preview keeps preferences in local component state only; nothing was saved to an account.",
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Settings & Portal Preferences"
        subtitle="Manage communication channels, attendance alerts and security credentials"
      />

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status">Notification preferences and delivery subscriptions are not persisted yet. {liveSession ? "Live account settings cannot be changed here." : "Demo changes are temporary and reset when the page reloads."}</div>

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
                  checked={emailAlerts}\n                  disabled={liveSession}
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
                  checked={smsAlerts}\n                  disabled={liveSession}
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
                  checked={attendanceWarnings}\n                  disabled={liveSession}
                  onChange={(e) => setAttendanceWarnings(e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Save className="size-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
