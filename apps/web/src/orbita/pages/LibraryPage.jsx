import React, { useCallback, useEffect, useState } from "react";
import { Library, Search, RefreshCw, Plus, BookOpenCheck, RotateCcw } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { books as initialBooks } from "../data/portalData";
import { usePortal } from "../context/PortalContext";
import { libraryApi, studentsApi } from "../lib/api";

const blankBook = { title: "", author: "", isbn: "", category: "General", totalCopies: "1", shelfLocation: "" };

export function LibraryPage() {
  const { reservedBooks, reserveBook, toast, backendConfigured, isAuthenticated, session, userRole } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const canManage = ["Principal", "Super Admin", "Coordinator"].includes(userRole);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [bookForm, setBookForm] = useState(blankBook);
  const [loanForm, setLoanForm] = useState({ bookId: "", studentId: "", dueAt: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [loanView, setLoanView] = useState("issued");

  const refresh = useCallback(async () => {
    if (!liveSession) return;
    setLoading(true);
    setError("");
    try {
      const [bookResult, loanResult, studentResult] = await Promise.all([
        libraryApi.books({ search: searchQuery, category: categoryFilter === "All" ? undefined : categoryFilter }),
        libraryApi.loans({ status: loanView === "all" ? undefined : loanView }),
        studentsApi.list({ status: "active", limit: 200 }),
      ]);
      setBooks(Array.isArray(bookResult) ? bookResult : bookResult?.data || []);
      setLoans(Array.isArray(loanResult) ? loanResult : loanResult?.data || []);
      setStudents(Array.isArray(studentResult) ? studentResult : studentResult?.data || []);
    } catch (e) {
      setError(e?.message || "Library service could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [liveSession, searchQuery, categoryFilter, loanView]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveBook = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await libraryApi.createBook({ ...bookForm, totalCopies: Number(bookForm.totalCopies) });
      setBookForm(blankBook); setShowAdd(false);
      toast({ title: "Book added", description: "The catalogue has been saved to the institutional database.", variant: "success" });
      await refresh();
    } catch (e) {
      toast({ title: "Could not add book", description: e?.message || "Please check permissions and fields.", variant: "error" });
    } finally { setSaving(false); }
  };

  const issueLoan = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await libraryApi.issue({ ...loanForm, dueAt: new Date(loanForm.dueAt).toISOString() });
      setLoanForm({ bookId: "", studentId: "", dueAt: "", notes: "" }); setShowIssue(false);
      toast({ title: "Book issued", description: "The circulation record and available-copy count were updated.", variant: "success" });
      await refresh();
    } catch (e) {
      toast({ title: "Could not issue book", description: e?.message || "Please check the selected student, book, and permissions.", variant: "error" });
    } finally { setSaving(false); }
  };

  const returnLoan = async (loan) => {
    try {
      await libraryApi.returnLoan(loan.id);
      toast({ title: "Book returned", description: "The loan was closed and inventory availability updated.", variant: "success" });
      await refresh();
    } catch (e) {
      toast({ title: "Could not return book", description: e?.message || "Please refresh and try again.", variant: "error" });
    }
  };

  const categories = ["All", ...new Set((liveSession ? books : initialBooks).map((b) => b.category).filter(Boolean))];
  const filteredBooks = (liveSession ? books : initialBooks).filter((b) => {
    const matchCat = categoryFilter === "All" || b.category === categoryFilter;
    const matchSearch = [b.title, b.author, b.isbn].some((v) => String(v || "").toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const demoReserve = (book) => {
    reserveBook(book.id);
    toast({ title: `Preview reservation: ${book.title}`, description: "This is a demo-only interaction. No institutional record was created.", variant: "info" });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb title="SCOE Central Library" subtitle="Staff-operated catalogue, inventory and circulation management" />
      {liveSession ? (
        <>
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Live institutional data. Only authorized library managers can add catalogue items or issue/return books. Student access is staff-managed; no student or parent portal is enabled.
          </div>
          {error && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">{error}</div>}
          <div className="flex flex-wrap items-center gap-2">
            {canManage && <button onClick={() => setShowAdd((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="size-4" /> Add book</button>}
            {canManage && <button onClick={() => setShowIssue((v) => !v)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold"><BookOpenCheck className="size-4" /> Issue book</button>}
            <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
          </div>
          {showAdd && canManage && <form onSubmit={saveBook} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
            <h3 className="font-semibold sm:col-span-2 lg:col-span-3">Add catalogue item</h3>
            <input required maxLength={240} placeholder="Book title" value={bookForm.title} onChange={e => setBookForm(v => ({...v,title:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input required maxLength={180} placeholder="Author" value={bookForm.author} onChange={e => setBookForm(v => ({...v,author:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input maxLength={32} placeholder="ISBN (optional)" value={bookForm.isbn} onChange={e => setBookForm(v => ({...v,isbn:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input maxLength={80} placeholder="Category" value={bookForm.category} onChange={e => setBookForm(v => ({...v,category:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input required type="number" min="0" max="100000" placeholder="Total copies" value={bookForm.totalCopies} onChange={e => setBookForm(v => ({...v,totalCopies:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input maxLength={80} placeholder="Shelf location" value={bookForm.shelfLocation} onChange={e => setBookForm(v => ({...v,shelfLocation:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save book"}</button><button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div>
          </form>}
          {showIssue && canManage && <form onSubmit={issueLoan} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <h3 className="font-semibold sm:col-span-2 lg:col-span-4">Issue book to an internal student record</h3>
            <select required value={loanForm.bookId} onChange={e => setLoanForm(v => ({...v,bookId:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Select available book</option>{books.filter(b => b.status === "active" && b.available_copies > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>)}</select>
            <select required value={loanForm.studentId} onChange={e => setLoanForm(v => ({...v,studentId:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Select student record</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.roll_number}{s.registration_number ? ` / ${s.registration_number}` : ""}</option>)}</select>
            <label className="text-xs text-muted-foreground">Due date<input required type="datetime-local" min={new Date().toISOString().slice(0,16)} value={loanForm.dueAt} onChange={e => setLoanForm(v => ({...v,dueAt:e.target.value}))} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" /></label>
            <input maxLength={1000} placeholder="Notes (optional)" value={loanForm.notes} onChange={e => setLoanForm(v => ({...v,notes:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Confirm issue"}</button><button type="button" onClick={() => setShowIssue(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div>
          </form>}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search title, author, ISBN…" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm" /></div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">{categories.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <section className="space-y-3"><h2 className="text-lg font-semibold">Catalogue <span className="text-sm font-normal text-muted-foreground">({filteredBooks.length})</span></h2>
            {loading && books.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Loading institutional catalogue…</p> : filteredBooks.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No catalogue records found. Authorized staff can add the first item.</p> :
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredBooks.map(book => <Card key={book.id}><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><Badge variant="muted">{book.category}</Badge><Badge variant={book.available_copies > 0 ? "success" : "warning"}>{book.available_copies} available</Badge></div><h3 className="font-semibold">{book.title}</h3><p className="text-sm text-muted-foreground">{book.author}</p><p className="text-xs text-muted-foreground">{book.isbn ? `ISBN: ${book.isbn} · ` : ""}Total copies: {book.total_copies}{book.shelf_location ? ` · Shelf: ${book.shelf_location}` : ""}</p>{canManage && book.status === "active" && <button onClick={async () => { try { await libraryApi.updateBook(book.id,{status:"archived"}); toast({title:"Book archived",description:"The item is hidden from active circulation.",variant:"success"}); await refresh(); } catch(e) { toast({title:"Archive failed",description:e.message,variant:"error"}); } }} className="text-xs text-muted-foreground underline">Archive item</button>}</CardContent></Card>)}</div>}
          </section>
          <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Circulation</h2><select value={loanView} onChange={e => setLoanView(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="issued">Currently issued</option><option value="returned">Returned</option><option value="all">All loans</option></select></div>
            {loans.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No circulation records in this view.</p> : <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3">Book</th><th className="p-3">Student record</th><th className="p-3">Issued / due</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y divide-border">{loans.map(loan => <tr key={loan.id}><td className="p-3"><div className="font-medium">{loan.library_books?.title || "Book"}</div><div className="text-xs text-muted-foreground">{loan.library_books?.isbn || ""}</div></td><td className="p-3">{loan.academic_students?.full_name || "Student"}<div className="text-xs text-muted-foreground">{loan.academic_students?.roll_number || loan.academic_students?.registration_number || ""}</div></td><td className="p-3 text-xs">{new Date(loan.issued_at).toLocaleDateString()}<div className={new Date(loan.due_at) < new Date() && loan.status === "issued" ? "font-semibold text-destructive" : "text-muted-foreground"}>Due {new Date(loan.due_at).toLocaleDateString()}</div></td><td className="p-3"><Badge variant={loan.status === "issued" ? "warning" : "success"}>{loan.status}</Badge></td><td className="p-3">{canManage && loan.status === "issued" && <button onClick={() => returnLoan(loan)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"><RotateCcw className="size-3" /> Return</button>}</td></tr>)}</tbody></table></div>}
          </section>
        </>
      ) : (
        <>
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground" role="status"><strong>Demo preview only.</strong> Catalogue, availability, and reservations below are sample data. Actions do not create institutional records.</div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Library className="size-5 text-primary" /><span className="text-sm font-medium">Preview catalogue</span></div><div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search title, author, ISBN…" className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm" /></div></div>
          <div className="flex flex-wrap gap-2">{categories.map(cat => <button key={cat} onClick={() => setCategoryFilter(cat)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{cat}</button>)}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filteredBooks.map(book => { const isReserved = reservedBooks.has(book.id); return <Card key={book.id}><CardContent className="flex h-full flex-col justify-between space-y-4 p-4"><div><div className="mb-2 flex items-start justify-between gap-1"><Badge variant="muted">{book.category}</Badge><Badge variant={book.available > 0 ? "success" : "warning"}>{book.available > 0 ? `${book.available} Available` : "Checked Out"}</Badge></div><h3 className="font-semibold">{book.title}</h3><p className="mt-1 text-sm text-muted-foreground">{book.author}</p><p className="mt-1 text-xs text-muted-foreground">ISBN: {book.isbn}</p></div><div className="flex items-center justify-between border-t border-border pt-3"><span className="text-xs text-muted-foreground">Copies: {book.copies}</span><button onClick={() => demoReserve(book)} disabled={isReserved || book.available === 0} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40">{isReserved ? "Reserved" : book.available === 0 ? "Unavailable" : "Preview reserve"}</button></div></CardContent></Card>; })}</div>
        </>
      )}
    </div>
  );
}
