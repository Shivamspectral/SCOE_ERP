import React, { useState } from "react";
import { Settings, Bell, Lock, Shield, Smartphone, Save } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { usePortal } from "../context/PortalContext";

export function SettingsPage() {
  const { toast } = usePortal();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [attendanceWarnings, setAttendanceWarnings] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    toast({
      title: "Settings Saved",
      description: "Portal preferences and notification subscriptions updated.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Settings & Portal Preferences"
        subtitle="Manage communication channels, attendance alerts and security credentials"
      />

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
                  <p className="text-muted-foreground text-[11px]">Receive exam schedules and circulars at rahul.patil@siddhantcoe.edu.in</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer">
                <div>
                  <p className="font-semibold text-foreground">SMS Urgency Alerts</p>
                  <p className="text-muted-foreground text-[11px]">Receive emergency college notices on registered mobile (+91 98220 41042)</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
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
