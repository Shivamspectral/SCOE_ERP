import React, { useState } from "react";
import {
  BedDouble,
  Utensils,
  Shield,
  Phone,
  Calendar,
  CheckCircle2,
  X,
  Send,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";

export function HostelPage() {
  const { toast, addApprovalRequest, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);

  // Modals
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);

  // Form states
  const [roomType, setRoomType] = useState("2-Seater Furnished");
  const [hostelBlock, setHostelBlock] = useState("Boys Hostel Block A");
  const [emergencyReason, setEmergencyReason] = useState("");

  const [passPurpose, setPassPurpose] = useState("Weekend Home Visit");
  const [passOutDate, setPassOutDate] = useState("18 Sep 2026, 6:00 PM");
  const [passInDate, setPassInDate] = useState("21 Sep 2026, 7:00 PM");
  const [parentContact, setParentContact] = useState("+91 98224 88990");

  const handleApplyHostel = (e) => {
    e.preventDefault();
    if (liveSession) { toast({ title: "Hostel service unavailable", description: "Room inventory is sample data and the hostel service is not connected. No room request was submitted.", variant: "info" }); return; }
    addApprovalRequest({
      type: "Hostel Room Allocation",
      details: `Request for ${roomType} in ${hostelBlock}. Justification: ${emergencyReason}`,
      urgency: "Medium",
    });

    setApplyModalOpen(false);
    toast({
      title: "Hostel Application Submitted",
      description: `Requisition for ${roomType} lodged with Chief Rector Office.`,
      variant: "success",
    });
  };

  const handleApplyPass = (e) => {
    e.preventDefault();
    if (liveSession) { toast({ title: "Hostel service unavailable", description: "Pass rules and resident records are not connected to the institutional backend. No pass request was submitted.", variant: "info" }); return; }
    addApprovalRequest({
      type: "Hostel Outing Night Pass",
      details: `Night pass: ${passPurpose}. From ${passOutDate} to ${passInDate}. Parent contact verified.`,
      urgency: "High",
    });

    setPassModalOpen(false);
    toast({
      title: "Night-pass request submitted",
      description: "Your request was sent to the approval workflow. No gate pass was issued and no parent SMS was sent.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Hostel & Residential Facilities"
        subtitle="On-campus hostel accommodations, dining hall mess menus, and resident rules"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Utensils className="size-3.5 text-primary" />
              <span>Weekly Mess Menu</span>
            </button>
            <button
              onClick={() => setPassModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Clock className="size-3.5 text-warning-foreground" />
              <span>Request Night Pass</span>
            </button>
            <button
              onClick={() => setApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              <span>Apply for Room</span>
            </button>
          </div>
        }
      />

      {liveSession && <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status"><strong>Hostel preview data only.</strong> Room availability, capacities, contacts, menus and pass status are sample values. Live hostel applications and gate passes are unavailable.</div>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status"><strong>Hostel preview data only.</strong> Room availability, capacities, contacts, menus and live pass status are sample values. The form can submit an approval request, but it does not reserve a room or issue a gate pass.</div>

      {/* Block A */}
        <Card className="hover:border-primary/40 transition-colors flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BedDouble className="size-4 text-primary" />
                <CardTitle>Boys Hostel Block A & B</CardTitle>
              </div>
              <Badge variant="accent">Available</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Capacity: 450 students · Wi-Fi enabled</p>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-3">
            <p className="leading-relaxed">
              2-seater & 3-seater furnished rooms with attached study desks, solar hot water, 24/7 security guard post, and gym access.
            </p>
            <div className="rounded-lg bg-muted/40 p-2.5">
              <p className="font-semibold text-foreground">Chief Rector: Prof. V. Patil</p>
              <p className="font-mono text-[11px] text-muted-foreground">+91 98224 11223 · Cabin: Hostel Office</p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setHostelBlock("Boys Hostel Block A");
                  setApplyModalOpen(true);
                }}
                className="flex-1 rounded-lg bg-primary/10 py-1.5 text-center font-semibold text-primary hover:bg-primary/20 transition-colors text-xs"
              >
                Book Bed
              </button>
              <button
                onClick={() =>
                  toast({
                    title: "Contact details are sample data",
                    description: "This preview does not initiate a phone call. Verify the official hostel contact before calling.",
                    variant: "info",
                  })
                }
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
                title="Call Rector"
              >
                <Phone className="size-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Girls Hostel */}
        <Card className="hover:border-primary/40 transition-colors flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-accent" />
                <CardTitle>Girls Hostel Block</CardTitle>
              </div>
              <Badge variant="accent">Biometric Entry</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Capacity: 350 students · Biometric entry</p>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-3">
            <p className="leading-relaxed">
              Dedicated female warden, round-the-clock CCTV surveillance, recreation hall, indoor games, sanitary dispensaries, and doctor on call.
            </p>
            <div className="rounded-lg bg-muted/40 p-2.5">
              <p className="font-semibold text-foreground">Hostel Warden: Mrs. S. Kadam</p>
              <p className="font-mono text-[11px] text-muted-foreground">+91 98231 66778 · Cabin: Girls Wing</p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setHostelBlock("Girls Hostel Block");
                  setApplyModalOpen(true);
                }}
                className="flex-1 rounded-lg bg-primary/10 py-1.5 text-center font-semibold text-primary hover:bg-primary/20 transition-colors text-xs"
              >
                Book Bed
              </button>
              <button
                onClick={() =>
                  toast({
                    title: "Connecting to Warden Office",
                    description: "Dialing +91 98231 66778…",
                    variant: "info",
                  })
                }
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
                title="Call Warden"
              >
                <Phone className="size-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Central Mess */}
        <Card className="hover:border-primary/40 transition-colors flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="size-4 text-success" />
                <CardTitle>Campus Central Mess</CardTitle>
              </div>
              <Badge variant="success">FSSAI Certified</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Hygienic vegetarian dining</p>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-3">
            <p className="leading-relaxed">
              Breakfast: 07:30 - 09:00 AM · Lunch: 12:30 - 02:00 PM · Dinner: 07:30 - 09:30 PM. Weekly special Maharashtrian & North Indian menus.
            </p>
            <div className="rounded-lg bg-muted/40 p-2.5">
              <p className="font-semibold text-foreground">Mess Secretary: Omkar Jadhav</p>
              <p className="font-mono text-[11px] text-muted-foreground">Student Council Food & Hygiene Committee</p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setMenuModalOpen(true)}
                className="w-full rounded-lg bg-primary/10 py-1.5 text-center font-semibold text-primary hover:bg-primary/20 transition-colors text-xs"
              >
                View 7-Day Nutrition Menu
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Modal */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Campus Central Mess — Weekly Menu
                </h3>
                <p className="text-xs text-muted-foreground">
                  FSSAI License #11521038000124 · 100% Pure Vegetarian
                </p>
              </div>
              <button
                onClick={() => setMenuModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
              {[
                { day: "Monday", b: "Poha, Tea / Milk, Boiled Sprouts", l: "Dal Tadka, Jeera Rice, Paneer Masala, Chapati, Salad", d: "Aloo Gobhi, Tawa Roti, Dal Fry, Steamed Rice, Gulab Jamun" },
                { day: "Tuesday (Today)", b: "Upma, Chutney, Tea / Milk, Banana", l: "Chole Bhature / Rice, Green Salad, Chaas, Curd", d: "Methi Malai Matar, Chapati, Dal Khichdi, Papad, Kheer" },
                { day: "Wednesday", b: "Idli Sambar, Chutney, Tea / Coffee", l: "Rajma Masala, Steamed Basmati Rice, Phulka, Boondi Raita", d: "Sev Bhaji, Jowar Bhakri, Thecha, Dal Rice" },
                { day: "Thursday", b: "Misal Pav, Farsan, Tea / Milk", l: "Veg Pulao, Kadhi, Paneer Butter Masala, Chapati", d: "Mix Veg Handi, Roti, Dal Fry, Rice, Fruit Custard" },
                { day: "Friday", b: "Aloo Paratha, Butter, Dahi, Tea", l: "Dal Makhani, Jeera Rice, Bhindi Do Pyaza, Chapati", d: "Veg Biryani, Mirchi Ka Salan, Raita, Rasgulla" },
                { day: "Saturday", b: "Uttapam, Sambar, Coconut Chutney", l: "Pithla Bhakri, Mirchi Thecha, Varan Bhat, Ghee", d: "Pav Bhaji, Pulao, Roasted Papad, Sweet Sheera" },
                { day: "Sunday", b: "Club Sandwich / Poha, Juice / Tea", l: "Special Feast: Shahi Paneer, Puri, Pulav, Jalebi", d: "Khichdi Kadhi, Masala Aloo, Butter Milk" },
              ].map((m) => (
                <div key={m.day} className="rounded-lg border border-border p-2.5">
                  <span className="font-bold text-primary block">{m.day}</span>
                  <p className="text-muted-foreground mt-0.5"><strong>Breakfast:</strong> {m.b}</p>
                  <p className="text-muted-foreground mt-0.5"><strong>Lunch:</strong> {m.l}</p>
                  <p className="text-muted-foreground mt-0.5"><strong>Dinner:</strong> {m.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setMenuModalOpen(false)}
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground text-xs"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Hostel Admission & Bed Requisition
                </h3>
                <p className="text-xs text-muted-foreground">
                  Apply for campus accommodation for Academic Year 2025-26
                </p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleApplyHostel} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Preferred Hostel Block
                </label>
                <select
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  <option value="Boys Hostel Block A">Boys Hostel Block A</option>
                  <option value="Boys Hostel Block B">Boys Hostel Block B</option>
                  <option value="Girls Hostel Block">Girls Hostel Block</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Room Configuration
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  <option value="2-Seater Furnished">2-Seater (₹65,000 / yr with Mess)</option>
                  <option value="3-Seater Standard">3-Seater (₹52,000 / yr with Mess)</option>
                  <option value="Single Occupancy (Final Year)">Single (₹80,000 / yr with Mess)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Home Town / Distance from Campus
                </label>
                <textarea
                  rows={2}
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  placeholder="e.g. Permanent residence in Kolhapur (~240 km). Seeking campus hostel for Term I."
                  className="w-full rounded-lg border border-input bg-card p-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
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

      {/* Night Pass Modal */}
      {passModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Hostel Night Outing Pass
                </h3>
                <p className="text-xs text-muted-foreground">
                  Automated gate clearance with guardian verification SMS
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
                  Reason for Night Outing
                </label>
                <select
                  value={passPurpose}
                  onChange={(e) => setPassPurpose(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  <option value="Weekend Home Visit">Weekend Home Visit</option>
                  <option value="Family Function / Emergency">Family Function / Emergency</option>
                  <option value="Hackathon / External Tech Competition">Hackathon / External Tech Competition</option>
                  <option value="Medical Consultation">Medical Consultation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Exit Date & Time
                  </label>
                  <input
                    type="text"
                    value={passOutDate}
                    onChange={(e) => setPassOutDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Return Date & Time
                  </label>
                  <input
                    type="text"
                    value={passInDate}
                    onChange={(e) => setPassInDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Parent / Guardian Contact Phone
                </label>
                <input
                  type="text"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                  required
                />
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
                  <span>Issue Gate Pass</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
