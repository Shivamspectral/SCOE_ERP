import React, { useMemo, useState } from "react";
import { Download, FileSpreadsheet, ShieldCheck, UploadCloud, AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { supabase } from "../lib/supabase";

const TEMPLATE = "full_name,email,registration_id,role,department_code,employee_code,password\n";

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const headers = rows.shift().map((h) => h.trim().replace(/^\uFEFF/, "").toLowerCase());
  const required = ["full_name", "email", "role"];
  const missing = required.filter((key) => !headers.includes(key));
  if (missing.length) throw new Error("Missing required CSV columns: " + missing.join(", "));
  return rows.map((values) => Object.fromEntries(headers.map((key, index) => [key, (values[index] ?? "").trim()])))
    .filter((item) => item.full_name || item.email);
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const keys = ["status", "full_name", "email", "password", "registration_id", "role", "department_code", "employee_code", "error"];
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => csvCell(row[key])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "scoe-staff-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function BulkAccountsPage() {
  const { session, userRole, isDemoPreview } = usePortal();
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [running, setRunning] = useState(false);

  const isAllowedRole = ["Principal", "Super Admin"].includes(userRole);
  const preview = useMemo(() => rows.slice(0, 8), [rows]);
  const createdCount = results.filter((row) => row.status === "created").length;
  const failedCount = results.filter((row) => row.status === "failed").length;

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setResults([]);
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length > 600) throw new Error("Import is limited to 600 staff accounts per run. Split larger files.");
      setRows(parsed);
      setFileName(file.name);
    } catch (err) {
      setRows([]);
      setFileName("");
      setError(err instanceof Error ? err.message : "Could not read this CSV file.");
    }
    event.target.value = "";
  };

  const runImport = async () => {
    if (!session?.access_token || isDemoPreview) {
      setError("Sign in to the live ERP with an active Principal or Administrator account first.");
      return;
    }
    if (!rows.length) {
      setError("Choose a CSV file with staff records first.");
      return;
    }
    const invalid = rows.findIndex((row) => !row.full_name || !row.email || !row.role);
    if (invalid >= 0) {
      setError("Row " + (invalid + 2) + " needs full_name, email and role.");
      return;
    }
    if (!window.confirm("Create accounts for " + rows.length + " staff records? Existing emails will be skipped, and generated passwords will be shown only once in the results export.")) return;

    setRunning(true);
    setError("");
    setResults([]);
    const allResults = [];
    try {
      const totalBatches = Math.ceil(rows.length / 100);
      for (let offset = 0; offset < rows.length; offset += 100) {
        const batchNo = Math.floor(offset / 100) + 1;
        setProgress("Processing batch " + batchNo + " of " + totalBatches + "…");
        const { data, error: invokeError } = await supabase.functions.invoke("bulk-staff-provision", {
          body: { rows: rows.slice(offset, offset + 100) },
        });
        if (invokeError || !data || !Array.isArray(data.results)) {
          throw new Error((invokeError?.message ? invokeError.message + " " : "") + "Batch " + batchNo + " could not be confirmed. Stop here and inspect Supabase function logs before retrying, because the server may have completed some operations.");
        }
        allResults.push(...data.results);
        setResults([...allResults]);
      }
      setProgress("Finished. " + allResults.filter((row) => row.status === "created").length + " created; " + allResults.filter((row) => row.status === "failed").length + " failed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk import stopped unexpectedly.");
      setProgress("Import stopped. Export the results already received before leaving this page.");
    } finally {
      setRunning(false);
    }
  };

  if (!isAllowedRole) {
    return <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8">
      <ShieldCheck className="mb-4 h-8 w-8 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Bulk staff account provisioning</h1>
      <p className="mt-3 text-sm text-muted-foreground">This tool is restricted to the Principal and Super Admin roles. The server independently checks your real Supabase session and role before creating any account.</p>
    </section>;
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Identity & access</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Bulk staff accounts</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create real Supabase Auth accounts, registration IDs, profile links and role assignments from one CSV. Staff only—no student or parent account creation.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Loaded rows</p><p className="mt-1 text-2xl font-semibold">{rows.length}</p></div>
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Created</p><p className="mt-1 text-2xl font-semibold text-emerald-600">{createdCount}</p></div>
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Failed / skipped</p><p className="mt-1 text-2xl font-semibold text-amber-600">{failedCount}</p></div>
    </section>

    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3"><FileSpreadsheet className="h-5 w-5 text-primary" /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">1. Prepare the CSV</h2>
          <p className="mt-1 text-sm text-muted-foreground">Required headers: <code>full_name,email,role</code>. Optional: <code>registration_id,department_code,employee_code,password</code>. Leave password blank to generate a unique random password. Supported role values: <code>principal</code>, <code>administrator</code>, <code>coordinator</code>, <code>hod</code>, <code>faculty</code>, <code>staff</code>.</p>
          <div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">Department codes must match active ERP departments (Computer Engineering currently uses <code>COMP</code>). HOD requires a department; Principal is institution-wide. If employee_code is provided, it must match an existing HR record.</div>
          <button onClick={downloadTemplate} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Download className="h-4 w-4" /> Download blank CSV template</button>
        </div>
      </div>
      <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-5 py-8 text-center hover:bg-muted/40">
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <span className="mt-3 font-semibold">{fileName || "Choose staff CSV"}</span>
        <span className="mt-1 text-sm text-muted-foreground">CSV only · up to 600 staff rows · passwords optional</span>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" disabled={running} />
      </label>
    </section>

    {rows.length > 0 && <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div><h2 className="font-semibold">2. Review import</h2><p className="mt-1 text-sm text-muted-foreground">{rows.length} rows loaded. Showing first {preview.length}.</p></div>
        <button disabled={running} onClick={runImport} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
          {running ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {running ? "Creating accounts…" : "Create staff accounts"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Login email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Registration ID</th></tr></thead>
          <tbody>{preview.map((row, index) => <tr key={index} className="border-t border-border"><td className="px-4 py-3 font-medium">{row.full_name || "—"}</td><td className="px-4 py-3">{row.email || "—"}</td><td className="px-4 py-3">{row.role || "—"}</td><td className="px-4 py-3">{row.department_code || "—"}</td><td className="px-4 py-3">{row.registration_id || "Auto-generated"}</td></tr>)}</tbody>
        </table>
      </div>
    </section>}

    {(progress || error) && <section className="rounded-xl border border-border bg-card p-4">
      {progress && <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{progress}</p>}
      {error && <p className="mt-1 flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
    </section>}

    {results.length > 0 && <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold">3. Export credentials and report</h2><p className="mt-1 text-sm text-muted-foreground">Passwords are shown only in this response and are not stored in a database table by this tool.</p></div>
        <button onClick={() => downloadCsv("scoe-staff-accounts-" + new Date().toISOString().slice(0, 10) + ".csv", results)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Download className="h-4 w-4" /> Export results CSV</button>
      </div>
      <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Status</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Registration ID</th><th className="px-3 py-2">Details</th></tr></thead>
          <tbody>{results.map((row, index) => <tr key={index} className="border-t border-border"><td className="px-3 py-2">{row.status}</td><td className="px-3 py-2">{row.email || "—"}</td><td className="px-3 py-2">{row.registration_id || "—"}</td><td className="px-3 py-2">{row.error || (row.password ? "Password generated" : "Created")}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"><AlertTriangle className="h-4 w-4 shrink-0" />Store the exported credentials securely, share each person's credentials privately, and delete extra copies after onboarding. Anyone with this file can sign in as those users.</p>
    </section>}
  </div>;
}
