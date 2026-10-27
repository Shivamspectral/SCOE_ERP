import React, { useState } from "react";
import { Library, BookOpen, Search, CheckCircle2, Bookmark, Download, ExternalLink } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { books as initialBooks, college } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

export function LibraryPage() {
  const { reservedBooks, reserveBook, toast, backendConfigured, isAuthenticated, session } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", "Algorithms", "Operating Systems", "Databases", "Networks", "Programming", "AI/ML"];

  const filteredBooks = initialBooks.filter((b) => {
    const matchCat = categoryFilter === "All" || b.category === categoryFilter;
    const matchSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const handleReserve = (book) => {
    if (liveSession) {
      toast({ title: "Reservation unavailable", description: "The library catalogue and reservation service are not connected to the institutional backend. No book was reserved.", variant: "info" });
      return;
    }
    reserveBook(book.id);
    toast({
      title: `Book Reserved: ${book.title}`,
      description: `Collect from the Central Library Circulation Counter within 48 hours using ID SCOE2023CE042.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="SCOE Central Library & E-Resources"
        subtitle="Access 45,000+ technical volumes, national journals, IEEE Xplore digital library and DELNET consortium"
      />

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status"><strong>Preview data only.</strong> Catalogue entries, borrower details, loan counts and due dates are sample values. Live reservations are disabled until the library service is connected.</div>

      {/* Library Pass Info */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Library className="size-6 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">Library Borrower Card: SCOE2023CE042</p>
            <p className="text-muted-foreground">Borrow limit: 4 books · Active loans: 1 book (OS Concepts due 22 Sep)</p>
          </div>
        </div>
        <Badge variant="success">Card Active (Valid 2027)</Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
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
            placeholder="Search book title, author, ISBN…"
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Book Catalog Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredBooks.map((book) => {
          const isReserved = reservedBooks.has(book.id);

          return (
            <Card key={book.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <Badge variant="muted" className="text-[10px]">
                      {book.category}
                    </Badge>
                    <Badge variant={book.available > 0 ? "success" : "warning"} className="text-[10px]">
                      {book.available > 0 ? `${book.available} Available` : "Checked Out"}
                    </Badge>
                  </div>

                  <h4 className="font-display text-sm font-bold text-foreground leading-snug line-clamp-2">
                    {book.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
                  <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">ISBN: {book.isbn}</p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Copies: <strong>{book.copies}</strong>
                  </span>

                  <button
                    onClick={() => handleReserve(book)}
                    disabled={isReserved || book.available === 0}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isReserved
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : book.available === 0
                        ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isReserved ? "Reserved" : book.available === 0 ? "Unavailable" : "Reserve Book"}
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
