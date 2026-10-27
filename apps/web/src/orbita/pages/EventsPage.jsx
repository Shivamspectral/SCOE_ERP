import React, { useState } from "react";
import {
  CalendarHeart,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  CheckCircle2,
  CalendarPlus,
  Share2,
  Ticket,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Info
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { events as initialEvents } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

export function EventsPage() {
  const { registeredEvents, toggleEvent, toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalEvent, setActiveModalEvent] = useState(null);

  const categories = ["All", "Technical", "Cultural", "Sports", "Workshop", "Academics", "Networking"];

  const filteredEvents = initialEvents.filter((ev) => {
    const matchCategory = selectedCategory === "All" || ev.category === selectedCategory;
    const matchSearch =
      ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleRegistrationToggle = (ev) => {
    if (liveSession) {
      toast({ title: "Registration unavailable", description: "Event listings and registration are not connected to the institutional backend. No registration was created or cancelled.", variant: "info" });
      return;
    }
    const isCurrentlyReg = registeredEvents.has(ev.id);
    toggleEvent(ev.id);

    if (!isCurrentlyReg) {

      toast({
        title: `Registered for ${ev.name}!`,
        description: `Your entry pass has been confirmed for ${ev.date} at ${ev.venue}.`,
        variant: "success",
      });
    } else {
      toast({
        title: `Registration Cancelled`,
        description: `You have unregistered from ${ev.name}.`,
        variant: "info",
      });
    }
  };

  const handleAddToCalendar = (ev) => {
    if (liveSession) {
      toast({ title: "Calendar export unavailable", description: "These events are sample previews and are not connected to the institutional event calendar.", variant: "info" });
      return;
    }
    const start = new Date(`${ev.date} ${ev.time}`);
    if (Number.isNaN(start.getTime())) {
      toast({ title: "Calendar export unavailable", description: "The sample event date/time could not be parsed.", variant: "info" });
      return;
    }
    const toIcsDate = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\\.\\d{3}Z$/, "Z");
    const escapeIcs = (value) => String(value || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Astra Campus//Event Preview//EN", "BEGIN:VEVENT", `UID:${ev.id}@astra-campus.local`, `DTSTAMP:${toIcsDate(new Date())}`, `DTSTART:${toIcsDate(start)}`, `DTEND:${toIcsDate(end)}`, `SUMMARY:${escapeIcs(ev.name)}`, `LOCATION:${escapeIcs(ev.venue)}`, `DESCRIPTION:${escapeIcs(ev.description)}`, "END:VEVENT", "END:VCALENDAR"];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${String(ev.name || "event").replace(/[^a-z0-9-_]+/gi, "-")}.ics`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    toast({ title: "Calendar file exported", description: "An .ics file was downloaded. The event itself is sample preview data.", variant: "info" });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb Header */}
      <Breadcrumb
        title="Campus Events & Activities"
        subtitle="Flagship symposiums, hackathons, sports tournaments and cultural celebrations at Siddhant"
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent-foreground border border-accent/20">
              {registeredEvents.size} Events Registered
            </span>
          </div>
        }
      />

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status"><strong>Preview data only.</strong> These event listings and registration counts are sample content, not confirmed college events. Registration and cancellation are unavailable until an institutional events service is connected.</div>

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

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, workshops, fests…"
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((ev) => {
          const isRegistered = registeredEvents.has(ev.id);
          const capacityPercent = Math.round((ev.participants / ev.maxCapacity) * 100);

          return (
            <Card
              key={ev.id}
              className="flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group"
            >
              {/* Event Image Banner */}
              <div className="relative h-44 overflow-hidden bg-muted">
                <img
                  src={ev.image}
                  alt={ev.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  <Badge variant="accent" className="shadow-sm">
                    {ev.category}
                  </Badge>
                  {isRegistered && (
                    <Badge variant="success" className="shadow-sm">
                      <CheckCircle2 className="size-3" /> Registered
                    </Badge>
                  )}
                </div>
                <div className="absolute right-3 top-3">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white">
                    {ev.entryFee}
                  </span>
                </div>
              </div>

              {/* Event Body */}
              <CardContent className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                  {ev.name}
                </h3>

                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {ev.description}
                </p>

                {/* Event Metadata */}
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground border-y border-border/60 py-3">
                  <div className="flex items-center gap-2">
                    <CalendarHeart className="size-3.5 text-accent shrink-0" />
                    <span className="font-medium text-foreground">{ev.date}</span>
                    <span>·</span>
                    <span>{ev.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span className="truncate">{ev.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 text-chart-5 shrink-0" />
                    <span>Organizer: {ev.organizer}</span>
                  </div>
                </div>

                {/* Capacity Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Registrations:</span>
                    <span className="font-semibold text-foreground">
                      {ev.participants} / {ev.maxCapacity} seats ({capacityPercent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        capacityPercent > 80 ? "bg-warning" : "bg-primary"
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleRegistrationToggle(ev)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold shadow-sm transition-all text-center ${
                      isRegistered
                        ? "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isRegistered ? "Unregister" : "Register Now"}
                  </button>
                  <button
                    onClick={() => setActiveModalEvent(ev)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    title="View full schedule & timeline"
                  >
                    Details
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No events found matching "{searchQuery}" in category "{selectedCategory}".
        </div>
      )}

      {/* Detailed Event Modal with Schedule Timeline */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="accent">{activeModalEvent.category}</Badge>
                <h2 className="font-display text-2xl font-bold text-foreground mt-2">
                  {activeModalEvent.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organized by {activeModalEvent.organizer}
                </p>
              </div>
              <button
                onClick={() => setActiveModalEvent(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl overflow-hidden h-44 bg-muted">
              <img
                src={activeModalEvent.image}
                alt={activeModalEvent.name}
                className="size-full object-cover"
              />
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {activeModalEvent.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Date & Time</span>
                <span className="font-semibold text-foreground">
                  {activeModalEvent.date} · {activeModalEvent.time}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Venue</span>
                <span className="font-semibold text-foreground">{activeModalEvent.venue}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Entry / Registration</span>
                <span className="font-semibold text-foreground">{activeModalEvent.entryFee}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Coordinator</span>
                <span className="font-semibold text-foreground">{activeModalEvent.coordinator}</span>
              </div>
            </div>

            {/* Event Schedule Timeline */}
            <div className="mt-5">
              <h4 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Clock className="size-4 text-primary" /> Event Schedule & Program Flow
              </h4>
              <div className="space-y-2 border-l-2 border-primary/30 pl-4 text-xs">
                {activeModalEvent.schedule.map((item, idx) => (
                  <div key={idx} className="relative pb-2">
                    <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-primary" />
                    <span className="font-semibold text-primary">{item.time}</span>
                    <p className="text-foreground mt-0.5">{item.activity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <button
                onClick={() => handleAddToCalendar(activeModalEvent)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <CalendarPlus className="size-3.5 text-accent" />
                <span>Add to Calendar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleRegistrationToggle(activeModalEvent);
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors ${
                    registeredEvents.has(activeModalEvent.id)
                      ? "bg-destructive hover:bg-destructive/90"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {registeredEvents.has(activeModalEvent.id)
                    ? "Unregister"
                    : "Confirm Registration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
