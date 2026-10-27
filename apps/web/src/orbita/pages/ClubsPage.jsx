import React, { useState } from "react";
import { Users, Award, CheckCircle2, PlusCircle, Search, Sparkles } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { clubs as initialClubs } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

export function ClubsPage() {
  const { joinedClubs, toggleClub, toast } = usePortal();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filteredClubs = initialClubs.filter((c) => {
    const matchCategory = categoryFilter === "All" || c.category === categoryFilter;
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleClubToggle = (club) => {
    const isJoined = joinedClubs.has(club.id);
    toggleClub(club.id);
    if (!isJoined) {
      toast({
        title: `Joined ${club.name}`,
        description: `You are now a registered member! Meeting invites will be sent to your student email.`,
        variant: "success",
      });
    } else {
      toast({
        title: `Left ${club.name}`,
        description: `Membership cancelled.`,
        variant: "info",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Student Clubs & Technical Communities"
        subtitle="Co-curricular tech teams, cultural societies, robotics fleets and startup incubation cells"
        actions={
          <button
            onClick={() =>
              toast({
                title: "Propose a New Club",
                description: "Club Charter guidelines forwarded to Student Council General Secretary.",
                variant: "info",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="size-3.5" />
            <span>Charter New Club</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Technical", "Cultural", "Sports", "Business"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs & communities…"
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClubs.map((club) => {
          const isJoined = joinedClubs.has(club.id);

          return (
            <Card key={club.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="accent">{club.category}</Badge>
                  {isJoined && (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3" /> Member
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-2 leading-snug">{club.name}</CardTitle>
                <p className="text-xs text-muted-foreground">Faculty Mentor: {club.coordinator}</p>
              </CardHeader>

              <CardContent className="space-y-3.5 text-xs">
                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                  {club.description}
                </p>

                {/* Achievements */}
                <div>
                  <span className="font-semibold text-foreground text-[11px] block mb-1">
                    Key Highlights:
                  </span>
                  <ul className="space-y-1">
                    {club.achievements.map((ach, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Award className="size-3 text-accent shrink-0" />
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Bar: Member count & Join button */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="size-3.5 text-primary" />
                    <strong>{club.members + (isJoined ? 1 : 0)}</strong> active members
                  </span>

                  <button
                    onClick={() => handleClubToggle(club)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isJoined
                        ? "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isJoined ? "Leave Club" : "Join Club"}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
