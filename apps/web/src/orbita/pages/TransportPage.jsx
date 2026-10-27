import React, { useState } from "react";
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  X,
  Send,
  Ticket,
  Navigation,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";

export function TransportPage() {
  const { toast, addApprovalRequest, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  const [searchQuery, setSearchQuery] = useState("");
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [trackRouteModal, setTrackRouteModal] = useState(null);

  // Form
  const [selectedRouteNo, setSelectedRouteNo] = useState("Route 01");
  const [boardingStop, setBoardingStop] = useState("Chinchwad Station");

  const routes = [
    {
      no: "Route 01",
      path: "Nigdi — Akurdi — Chinchwad — Talegaon — SCOE Campus",
      time: "07:30 AM",
      bus: "MH-14-BT-4122",
      driver: "Mr. Ramesh Shinde",
      phone: "+91 98225 10101",
      stops: ["Nigdi Pradhikaran (07:15 AM)", "Akurdi Railway Stn (07:25 AM)", "Chinchwad Station (07:35 AM)", "Dehu Road (07:50 AM)", "Talegaon Dabhade (08:05 AM)", "SCOE Sudumbare (08:25 AM)"],
      currentStop: "Dehu Road (Approaching)",
    },
    {
      no: "Route 02",
      path: "Bhosari — Moshi — Alandi Road — Chakan — SCOE Campus",
      time: "07:20 AM",
      bus: "MH-14-BT-4123",
      driver: "Mr. Suresh More",
      phone: "+91 98225 10102",
      stops: ["Bhosari Landewadi (07:20 AM)", "Moshi Toll Plaza (07:35 AM)", "Alandi Phata (07:45 AM)", "Chakan Ambethan (08:00 AM)", "SCOE Sudumbare (08:25 AM)"],
      currentStop: "Chakan Ambethan (On time)",
    },
    {
      no: "Route 03",
      path: "Kothrud — Shivaji Nagar — Dapodi — Dehu Road — SCOE Campus",
      time: "07:15 AM",
      bus: "MH-14-BT-4124",
      driver: "Mr. Anil Pawar",
      phone: "+91 98225 10103",
      stops: ["Kothrud Stand (07:15 AM)", "Shivaji Nagar (07:30 AM)", "Dapodi Mega Mart (07:45 AM)", "Nigdi Bypass (08:00 AM)", "SCOE Sudumbare (08:25 AM)"],
      currentStop: "Nigdi Bypass (On time)",
    },
    {
      no: "Route 04",
      path: "Talegaon Station — Somatne Phata — Sudumbare Campus",
      time: "08:15 AM",
      bus: "MH-14-BT-4125",
      driver: "Mr. Balu Jadhav",
      phone: "+91 98225 10104",
      stops: ["Talegaon Station (08:15 AM)", "Somatne Phata (08:25 AM)", "Sudumbare Village (08:35 AM)", "SCOE Sudumbare (08:40 AM)"],
      currentStop: "Talegaon Station (Boarding)",
    },
  ];

  const filteredRoutes = (liveSession ? [] : routes).filter((r) =>
    r.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.driver.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyPass = (e) => {
    e.preventDefault();
    if (liveSession) { toast({ title: "Transport service unavailable", description: "Routes and vehicle details are sample data; the transport service is not connected. No pass request was submitted.", variant: "info" }); return; }
    addApprovalRequest({
      type: "College Bus Pass Subscription",
      details: `Application for ${selectedRouteNo} from boarding stop: ${boardingStop}. Fee: ₹14,000 / semester.`,
      urgency: "Medium",
    });

    setPassModalOpen(false);
    toast({
      title: "Bus-pass request submitted",
      description: `Your request for ${selectedRouteNo} from ${boardingStop} was sent for approval. No pass was issued.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="College Bus Fleet & Transport Service"
        subtitle="Daily commuter buses connecting Pune, Pimpri-Chinchwad, Talegaon and Chakan with Siddhant Campus"
        actions={
          <button
            onClick={() => setPassModalOpen(true)} disabled={liveSession}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Ticket className="size-3.5" />
            <span>Apply for Bus Pass</span>
          </button>
        }
      />

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status"><strong>Transport preview data only.</strong> Routes, drivers, vehicle numbers, timings and stop status are sample values, not live GPS or verified fleet information. Live pass requests and tracking are disabled.</div>

      {/* Search Bar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search route, stop or location (e.g. Nigdi, Chinchwad, Kothrud)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      {liveSession && <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No verified institutional routes are available. Sample routes are hidden in live sessions until the transport service is connected.</p>}
      {!liveSession && <>
      <div className="grid gap-5 md:grid-cols-2">
        {filteredRoutes.map((r) => (
          <Card key={r.no} className="hover:border-primary/40 transition-colors flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{r.no}</span>
                <Badge variant="accent">
                  <Clock className="size-3" /> Departure {r.time}
                </Badge>
              </div>
              <CardTitle className="text-sm mt-1">{r.path}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-3">
              <div className="rounded-lg bg-muted/40 p-2.5 space-y-1">
                <p>Bus Number: <strong className="text-foreground">{r.bus}</strong></p>
                <p>Driver / In-charge: <strong className="text-foreground">{r.driver}</strong></p>
                <p className="text-[11px] text-primary flex items-center gap-1 font-medium pt-0.5">
                  <Navigation className="size-3" /> Live GPS Status: {r.currentStop}
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setTrackRouteModal(r)}
                  className="flex-1 rounded-lg bg-primary/10 py-1.5 text-center font-semibold text-primary hover:bg-primary/20 transition-colors text-xs flex items-center justify-center gap-1.5"
                >
                  <Navigation className="size-3.5" />
                  <span>View All Stops & Timings</span>
                </button>
                <button
                  onClick={() =>
                    toast({
                      title: "Contact details are sample data",
                      description: "This preview does not initiate a phone call. Verify the official transport contact before calling.",
                      variant: "info",
                    })
                  }
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
                  title="Call Driver"
                >
                  <Phone className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      </>}
      {/* Track Route Modal */}
      {trackRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{trackRouteModal.no}</span>
                <h3 className="font-display text-lg font-bold text-foreground mt-0.5">
                  Route Stops & Live Schedule
                </h3>
                <p className="text-xs text-muted-foreground">
                  Bus: {trackRouteModal.bus} · Driver: {trackRouteModal.driver}
                </p>
              </div>
              <button
                onClick={() => setTrackRouteModal(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <p className="font-semibold text-foreground">Scheduled Pick-up Stops:</p>
              <ul className="space-y-1.5 border-l-2 border-primary/30 pl-3">
                {trackRouteModal.stops.map((stop, i) => (
                  <li key={i} className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="text-foreground font-medium">{stop}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
              <button
                onClick={() => setTrackRouteModal(null)}
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bus Pass Modal */}
      {passModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Apply for College Bus Pass
                </h3>
                <p className="text-xs text-muted-foreground">
                  Semester bus pass subscription with designated boarding seat
                </p>
              </div>
              <button
                onClick={() => setPassModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleApplyPass} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Select Bus Route
                </label>
                <select
                  value={selectedRouteNo}
                  onChange={(e) => setSelectedRouteNo(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  <option value="Route 01">Route 01 (Nigdi - Chinchwad - Talegaon)</option>
                  <option value="Route 02">Route 02 (Bhosari - Moshi - Chakan)</option>
                  <option value="Route 03">Route 03 (Kothrud - Shivaji Nagar - Dapodi)</option>
                  <option value="Route 04">Route 04 (Talegaon Station - Somatne)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Designated Boarding Stop
                </label>
                <input
                  type="text"
                  value={boardingStop}
                  onChange={(e) => setBoardingStop(e.target.value)}
                  placeholder="e.g. Chinchwad Station (Near Big Bazaar)"
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-2.5 text-muted-foreground leading-relaxed">
                Semester Transport Fee: ₹14,000. Fee will be added to the student fee ledger or can be paid at the Accounts Counter.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPassModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-3.5" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
