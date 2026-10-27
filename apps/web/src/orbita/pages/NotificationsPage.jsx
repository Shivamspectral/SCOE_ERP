import React from "react";
import { Bell, CheckCircle2, TriangleAlert, BookOpen, Briefcase, CalendarHeart, Check } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";

export function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount, navigate } = usePortal();

  const notificationIcons = {
    warning: { icon: TriangleAlert, tone: "bg-warning/15 text-warning-foreground" },
    academic: { icon: BookOpen, tone: "bg-primary/10 text-primary" },
    placement: { icon: Briefcase, tone: "bg-chart-5/10 text-chart-5" },
    event: { icon: CalendarHeart, tone: "bg-accent/15 text-accent-foreground" },
    success: { icon: CheckCircle2, tone: "bg-success/15 text-success" },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Notifications & System Alerts"
        subtitle="Real-time academic warnings, exam schedules, placement drives and council updates"
        actions={
          unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Check className="size-3.5" />
              <span>Mark all as read</span>
            </button>
          )
        }
      />

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {notifications.map((n) => {
            const conf = notificationIcons[n.type] || notificationIcons.academic;
            const Icon = conf.icon;

            return (
              <div
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  navigate(n.href);
                }}
                className={`flex items-start gap-4 p-4 text-xs cursor-pointer transition-colors hover:bg-muted/50 ${
                  n.unread ? "bg-primary/[0.03]" : ""
                }`}
              >
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${conf.tone}`}>
                  <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${n.unread ? "font-bold text-foreground" : "font-semibold text-foreground/80"}`}>
                      {n.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">{n.description}</p>
                </div>

                {n.unread && <span className="size-2 rounded-full bg-primary shrink-0 self-center" />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
