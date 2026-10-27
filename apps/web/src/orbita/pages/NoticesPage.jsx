import React, { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Pin,
  Download,
  FileText,
  Calendar,
  Building,
  Share2,
  CheckCircle,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { notices as initialNotices, noticeCategoryColor, college } from "../data/portalData";
import { usePortal } from "../context/PortalContext";
import { noticesApi } from "../lib/api";

export function NoticesPage() {
  const { toast, backendConfigured, isAuthenticated, session } = usePortal();
  const [notices, setNotices] = useState(null);
  const realSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const displayedNotices = realSession ? (notices ?? []) : initialNotices;

  useEffect(() => {
    if (!backendConfigured || !isAuthenticated || !session?.access_token) return;
    let cancelled = false;
    setNotices(null);
    noticesApi.list({ status: "published" }).then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      setNotices(rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.content || "",
        category: row.category === "event" ? "Events" : row.category === "operations" ? "Council" : "Academics",
        issuedBy: "Institutional Administration",
        date: row.publish_at || row.created_at ? new Date(row.publish_at || row.created_at).toLocaleDateString("en-IN") : "",
        pinned: row.category === "urgent",
        attachment: null,
      })));
    }).catch((error) => {
      console.warn("[circulars] unable to load published notices", error);
      if (!cancelled) {
        setNotices([]);
        toast({ title: "Could not load published circulars", description: error?.message || "The institutional notice service is unavailable.", variant: "error" });
      }
    });
    return () => { cancelled = true; };
  }, [backendConfigured, isAuthenticated, session?.access_token]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [activeNoticeModal, setActiveNoticeModal] = useState(null);

  const categories = ["All", "Academics", "Council", "Events", "Accounts", "Placements", "Library"];

  const filteredNotices = displayedNotices.filter((n) => {
    const matchCategory = selectedCategory === "All" || n.category === selectedCategory;
    const matchPinned = !pinnedOnly || n.pinned;
    const matchSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.issuedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchPinned && matchSearch;
  });

  const pinnedNotices = displayedNotices.filter((n) => n.pinned);

  const handleDownloadAttachment = (notice) => {
    toast({
      title: "Downloading Circular",
      description: `${notice.attachment || "Circular.pdf"} saved to your downloads.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb Header */}
      <Breadcrumb
        title="Official Notices & Circulars"
        subtitle="Institutional orders, university notifications, student council announcements and examination timetables"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                toast({
                  title: "Alert subscriptions are not enabled",
                  description: "This portal does not yet have a notification-subscription workflow connected. No alert subscription was created.",
                  variant: "info",
                });
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Bell className="size-3.5" />
              <span>Subscribe to Alerts</span>
            </button>
          </div>
        }
      />

      {/* Pinned / Urgent Notice Carousel at top */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Pin className="size-3.5" />
          <span>Important & Pinned Announcements</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pinnedNotices.map((pn) => (
            <div
              key={pn.id}
              onClick={() => setActiveNoticeModal(pn)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-primary/30 bg-card p-5 shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <span className="absolute top-0 left-0 h-full w-1.5 bg-primary" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                      noticeCategoryColor[pn.category] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {pn.category}
                  </span>
                  <Badge variant="default" className="text-[10px]">
                    <Pin className="size-3" /> Pinned
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">{pn.date}</span>
              </div>

              <h3 className="font-display text-base font-bold text-foreground mt-2 group-hover:text-primary transition-colors line-clamp-2">
                {pn.title}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {pn.description}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground/80 border-t border-border/60 pt-2">
                <span className="truncate">Issued by: {pn.issuedBy}</span>
                <span className="text-primary font-medium group-hover:underline">Read Circular →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Category Pills */}
        <div className="scrollbar-thin flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Pinned toggle & Search */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPinnedOnly(!pinnedOnly)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              pinnedOnly
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Pin className="size-3" />
            <span>Pinned Only</span>
          </button>

          <div className="relative w-full md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, notifications…"
              className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {filteredNotices.map((n) => (
          <div
            key={n.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-muted/30 group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                    noticeCategoryColor[n.category] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {n.category}
                </span>
                {n.pinned && (
                  <Badge variant="default" className="text-[10px]">
                    <Pin className="size-3" /> Pinned
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground">{n.date}</span>
              </div>

              <h3
                onClick={() => setActiveNoticeModal(n)}
                className="font-display text-base font-semibold text-foreground mt-1.5 group-hover:text-primary transition-colors cursor-pointer"
              >
                {n.title}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {n.description}
              </p>

              <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building className="size-3 text-primary" /> {n.issuedBy}
                </span>
                {n.attachment && (
                  <span className="flex items-center gap-1 text-accent font-medium">
                    <FileText className="size-3" /> {n.attachment} ({n.attachmentSize})
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {n.attachment && (
                <button
                  onClick={() => handleDownloadAttachment(n)}
                  className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  title="Download attached circular"
                >
                  <Download className="size-3.5 text-primary" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              )}
              <button
                onClick={() => setActiveNoticeModal(n)}
                className="rounded-lg bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredNotices.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No circulars found matching your search.
        </div>
      )}

      {/* Notice Reader Modal */}
      {activeNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {/* Header with College Crest */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-border flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src="/scoe-logo.png"
                    alt="SCOE crest"
                    className="size-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-display text-xs font-bold text-foreground uppercase tracking-wider">
                    {college.group}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{college.name} · Pune</p>
                  <p className="text-[10px] text-muted-foreground/80">Ref: SCOE/ADMIN/NOTICES/2026</p>
                </div>
              </div>
              <button
                onClick={() => setActiveNoticeModal(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  noticeCategoryColor[activeNoticeModal.category] || "bg-muted text-muted-foreground"
                }`}
              >
                {activeNoticeModal.category}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Published: {activeNoticeModal.date}
              </span>
            </div>

            <h2 className="font-display text-xl font-bold text-foreground mt-3 leading-snug">
              {activeNoticeModal.title}
            </h2>

            <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-xs leading-relaxed text-foreground space-y-3 font-sans">
              <p>{activeNoticeModal.description}</p>
              <p>
                All concerned heads of departments, faculty members, and students are requested to make note of the above and adhere to the published instructions. For any queries, students may reach out to the respective administrative department or contact the Student Council Grievance Cell.
              </p>
            </div>

            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Issued by:</p>
                <p>{activeNoticeModal.issuedBy}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-success font-semibold text-[11px]">
                  <CheckCircle className="size-3.5" /> Digitally Verified
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              {activeNoticeModal.attachment ? (
                <button
                  onClick={() => handleDownloadAttachment(activeNoticeModal)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="size-3.5" />
                  <span>Download {activeNoticeModal.attachment}</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setActiveNoticeModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
