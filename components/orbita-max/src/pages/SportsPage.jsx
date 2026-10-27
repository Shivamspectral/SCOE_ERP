import React, { useState } from "react";
import {
  Trophy,
  Calendar,
  Users,
  Award,
  Download,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  Send,
} from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { usePortal } from "../context/PortalContext";

export function SportsPage() {
  const { toast } = usePortal();

  const [bookingModalSport, setBookingModalSport] = useState(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState("06:00 AM - 07:00 AM");
  const [slotDate, setSlotDate] = useState("Tomorrow, 17 Sep 2026");

  const sportsFacilities = [
    { name: "Cricket Turf Stadium", coach: "Mr. D. Gaikwad", tim: "06:00 AM - 07:00 PM", status: "Open", spec: "Full size turf pitch, nets & night floodlights", slots: ["06:00 AM - 07:30 AM", "04:30 PM - 06:00 PM", "06:00 PM - 07:30 PM"] },
    { name: "Indoor Badminton & TT Courts", coach: "Prof. S. More", tim: "06:00 AM - 08:30 PM", status: "Open", spec: "4 wooden courts, Yonex mats, LED illumination", slots: ["06:00 AM - 07:00 AM", "05:00 PM - 06:00 PM", "07:00 PM - 08:00 PM"] },
    { name: "Olympic Gymnasium", coach: "Mr. K. Patil", tim: "05:30 AM - 09:00 PM", status: "Open", spec: "Cardio zone, weightlifting, certified trainers", slots: ["06:00 AM - 07:30 AM", "05:30 PM - 07:00 PM", "07:00 PM - 08:30 PM"] },
    { name: "Football & Athletics Track", coach: "Mr. D. Gaikwad", tim: "06:00 AM - 06:30 PM", status: "Open", spec: "400m 6-lane track & natural grass football field", slots: ["06:00 AM - 07:30 AM", "04:30 PM - 06:00 PM"] },
    { name: "Basketball & Volleyball Court", coach: "Prof. P. Shinde", tim: "06:30 AM - 07:00 PM", status: "Open", spec: "All-weather synthetic courts with spectator stands", slots: ["06:30 AM - 07:30 AM", "05:00 PM - 06:30 PM"] },
    { name: "Chess & Carrom Hall", coach: "Sports Council", tim: "08:00 AM - 06:00 PM", status: "Open", spec: "Tournament standard boards & rapid clocks", slots: ["12:00 PM - 01:00 PM", "04:00 PM - 05:00 PM"] },
  ];

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setBookingModalSport(null);
    toast({
      title: "Practice Slot Reserved",
      description: `Slot booked for ${bookingModalSport.name} (${selectedSlotTime}) on ${slotDate}. Digital pass generated.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Sports & Athletics Complex"
        subtitle="Inter-collegiate sports championships, Olympic gym, cricket stadium and fitness programs"
        actions={
          <button
            onClick={() =>
              toast({
                title: "Annual Sports Pass Active",
                description: "Gymnasium & Badminton court access verified for Academic Year 2025-26.",
                variant: "success",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Trophy className="size-3.5" />
            <span>View Sports Facility Pass</span>
          </button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sportsFacilities.map((fac, idx) => (
          <Card key={idx} className="hover:border-primary/40 transition-colors flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="accent">{fac.status}</Badge>
                <span className="text-[11px] text-muted-foreground">{fac.tim}</span>
              </div>
              <CardTitle className="text-base mt-2">{fac.name}</CardTitle>
              <p className="text-xs text-muted-foreground">In-charge: {fac.coach}</p>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-3">
              <p className="leading-relaxed">{fac.spec}</p>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setBookingModalSport(fac)}
                  className="flex-1 rounded-lg bg-primary/10 py-1.5 text-center font-semibold text-primary hover:bg-primary/20 transition-colors text-xs"
                >
                  Book Slot
                </button>
                <button
                  onClick={() =>
                    toast({
                      title: "Squad Trials Registration",
                      description: `Registered for inter-collegiate squad selections in ${fac.name}.`,
                      variant: "info",
                    })
                  }
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Join Trials
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingModalSport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Reserve Sports Facility
                </h3>
                <p className="text-xs text-muted-foreground">
                  {bookingModalSport.name} · Coach: {bookingModalSport.coach}
                </p>
              </div>
              <button
                onClick={() => setBookingModalSport(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Select Time Slot
                </label>
                <select
                  value={selectedSlotTime}
                  onChange={(e) => setSelectedSlotTime(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 outline-none focus:border-primary text-xs"
                >
                  {bookingModalSport.slots.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Booking Date
                </label>
                <input
                  type="text"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2.5 outline-none focus:border-primary text-xs"
                  required
                />
              </div>

              <div className="rounded-lg bg-muted/40 p-2.5 text-muted-foreground">
                Sports shoes & standard equipment compulsory. Report to ground in-charge 5 mins prior to slot time.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setBookingModalSport(null)}
                  className="rounded-lg border border-border px-3.5 py-1.5 font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Trophy className="size-3.5" />
                  <span>Confirm Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
