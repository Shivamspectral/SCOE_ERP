import React, { useCallback, useEffect, useState } from "react";
import { Wallet, RefreshCw, Plus, IndianRupee, ReceiptText } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Badge } from "../components/Badge";
import { Card, CardContent } from "../components/Card";
import { usePortal } from "../context/PortalContext";
import { financeApi, studentsApi } from "../lib/api";

const blankInvoice = { studentId: "", invoiceNumber: "", description: "", amountDue: "", dueAt: "", notes: "" };
const money = (value, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(Number(value || 0));

export function FinancePage() {
  const { backendConfigured, isAuthenticated, session, userRole, toast } = usePortal();
  const liveSession = Boolean(backendConfigured && isAuthenticated && session?.access_token);
  const canManage = ["Principal", "Super Admin", "Coordinator"].includes(userRole);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(blankInvoice);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "bank_transfer", reference: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!liveSession) return;
    setLoading(true); setError("");
    try {
      const [invoiceResult, studentResult] = await Promise.all([
        financeApi.invoices({ status: status === "open" ? undefined : status, search }),
        studentsApi.list({ status: "active", limit: 200 }),
      ]);
      const rows = Array.isArray(invoiceResult) ? invoiceResult : invoiceResult?.data || [];
      setInvoices(status === "open" ? rows.filter(i => ["unpaid","partially_paid"].includes(i.status)) : rows);
      setStudents(Array.isArray(studentResult) ? studentResult : studentResult?.data || []);
    } catch (e) { setError(e?.message || "Finance records could not be loaded."); }
    finally { setLoading(false); }
  }, [liveSession, status, search]);

  useEffect(() => { refresh(); }, [refresh]);

  const createInvoice = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      await financeApi.createInvoice({ ...invoiceForm, amountDue: Number(invoiceForm.amountDue), dueAt: new Date(invoiceForm.dueAt).toISOString() });
      setInvoiceForm(blankInvoice); setCreateOpen(false);
      toast({ title: "Invoice created", description: "The fee invoice was saved to the institutional ledger.", variant: "success" });
      await refresh();
    } catch (e) { toast({ title: "Invoice not created", description: e?.message || "Check the fields and your permissions.", variant: "error" }); }
    finally { setSaving(false); }
  };

  const recordPayment = async (event) => {
    event.preventDefault(); if (!paymentInvoice) return; setSaving(true);
    try {
      await financeApi.recordPayment(paymentInvoice.id, { ...paymentForm, amount: Number(paymentForm.amount) });
      setPaymentInvoice(null); setPaymentForm({ amount: "", method: "bank_transfer", reference: "", notes: "" });
      toast({ title: "Payment recorded", description: "The payment ledger and invoice balance were updated. This records an offline payment; it does not process money.", variant: "success" });
      await refresh();
    } catch (e) { toast({ title: "Payment not recorded", description: e?.message || "Check outstanding balance and permissions.", variant: "error" }); }
    finally { setSaving(false); }
  };

  const openAmount = invoices.reduce((sum, i) => sum + Math.max(0, Number(i.amount_due) - Number(i.amount_paid)), 0);
  const paidAmount = invoices.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);

  return <div className="space-y-6 animate-fade-in-up">
    <Breadcrumb title="Finance & Fee Management" subtitle="Staff-operated fee invoices, outstanding balances and payment ledger" />
    {!liveSession ? <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm"><strong>Demo preview only.</strong> Live finance records require an authenticated institutional staff session. No payment or invoice will be recorded in this preview.</div> : <>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Internal finance ledger only. Recording a payment documents a payment received outside this system; no payment gateway or student/parent portal is connected.</div>
      {error && <div role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Invoices in current view</p><p className="mt-1 text-2xl font-bold">{invoices.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding in current view</p><p className="mt-1 text-2xl font-bold">{money(openAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Paid amount on listed invoices</p><p className="mt-1 text-2xl font-bold">{money(paidAmount)}</p></CardContent></Card>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canManage && <button onClick={() => setCreateOpen(v => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="size-4" /> Create invoice</button>}
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>
      {createOpen && canManage && <form onSubmit={createInvoice} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-semibold sm:col-span-2 lg:col-span-3">Create staff-managed fee invoice</h2>
        <select required value={invoiceForm.studentId} onChange={e => setInvoiceForm(v => ({...v,studentId:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Select internal student record</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.roll_number}{s.registration_number ? ` / ${s.registration_number}` : ""}</option>)}</select>
        <input required maxLength={64} placeholder="Invoice number" value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm(v => ({...v,invoiceNumber:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input required maxLength={240} placeholder="Fee description" value={invoiceForm.description} onChange={e => setInvoiceForm(v => ({...v,description:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <label className="text-xs text-muted-foreground">Amount due (INR)<input required type="number" min="0.01" step="0.01" value={invoiceForm.amountDue} onChange={e => setInvoiceForm(v => ({...v,amountDue:e.target.value}))} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" /></label>
        <label className="text-xs text-muted-foreground">Due date<input required type="date" value={invoiceForm.dueAt} onChange={e => setInvoiceForm(v => ({...v,dueAt:e.target.value}))} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" /></label>
        <input maxLength={1000} placeholder="Internal notes (optional)" value={invoiceForm.notes} onChange={e => setInvoiceForm(v => ({...v,notes:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save invoice"}</button><button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div>
      </form>}
      {paymentInvoice && canManage && <form onSubmit={recordPayment} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="font-semibold sm:col-span-2 lg:col-span-4">Record offline payment — {paymentInvoice.invoice_number} ({money(Number(paymentInvoice.amount_due)-Number(paymentInvoice.amount_paid), paymentInvoice.currency)} outstanding)</h2>
        <label className="text-xs text-muted-foreground">Amount<input required type="number" min="0.01" max={Number(paymentInvoice.amount_due)-Number(paymentInvoice.amount_paid)} step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(v => ({...v,amount:e.target.value}))} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" /></label>
        <select value={paymentForm.method} onChange={e => setPaymentForm(v => ({...v,method:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="upi_reference">UPI reference</option><option value="cheque">Cheque</option><option value="other">Other</option></select>
        <input maxLength={120} placeholder="Receipt / reference no." value={paymentForm.reference} onChange={e => setPaymentForm(v => ({...v,reference:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input maxLength={1000} placeholder="Internal notes (optional)" value={paymentForm.notes} onChange={e => setPaymentForm(v => ({...v,notes:e.target.value}))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Record payment"}</button><button type="button" onClick={() => setPaymentInvoice(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div>
      </form>}
      <div className="flex flex-col gap-3 sm:flex-row"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice number or description…" className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm" /><select value={status} onChange={e => setStatus(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="open">Open invoices</option><option value="unpaid">Unpaid</option><option value="partially_paid">Partially paid</option><option value="paid">Paid</option><option value="all">All statuses</option></select></div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-3">Invoice / student</th><th className="p-3">Amount</th><th className="p-3">Due date</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y divide-border">{invoices.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{loading ? "Loading fee ledger…" : "No invoices found in this view."}</td></tr> : invoices.map(i => <tr key={i.id}><td className="p-3"><div className="font-medium">{i.invoice_number} · {i.description}</div><div className="text-xs text-muted-foreground">{i.academic_students?.full_name || "Student record"} · {i.academic_students?.roll_number || i.academic_students?.registration_number || ""}</div></td><td className="p-3"><div>{money(i.amount_due,i.currency)}</div><div className="text-xs text-muted-foreground">Paid {money(i.amount_paid,i.currency)} · Due {money(Number(i.amount_due)-Number(i.amount_paid),i.currency)}</div></td><td className="p-3 text-xs">{new Date(i.due_at).toLocaleDateString()}</td><td className="p-3"><Badge variant={i.status === "paid" ? "success" : i.status === "unpaid" ? "warning" : "muted"}>{i.status}</Badge></td><td className="p-3">{canManage && ["unpaid","partially_paid"].includes(i.status) && <button onClick={() => {setPaymentInvoice(i);setPaymentForm(v => ({...v,amount:String(Number(i.amount_due)-Number(i.amount_paid))}));}} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"><IndianRupee className="size-3" /> Record payment</button>}</td></tr>)}</tbody></table></div>
    </>}
  </div>;
}
