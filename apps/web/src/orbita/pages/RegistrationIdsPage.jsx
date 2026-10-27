import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Plus,
  Search,
  ShieldAlert,
  Ban,
  LoaderCircle,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Badge } from "../components/Badge";
import { registrationIdsApi } from "../lib/api";
import { allowedIdTypes } from "../lib/roles";

const STATUS_VARIANT = {
  GENERATED: "warning",
  ASSIGNED: "default",
  ACTIVATED: "success",
  DISABLED: "destructive",
};

const TYPE_LABEL = {
  STUDENT: "Student ID",
  FACULTY: "Faculty ID",
  HOD: "HOD ID",
};

/**
 * Registration ID administration (README §8).
 *
 * Every rule shown here is also enforced by the backend. The UI only hides what
 * the signed-in role may not do — it is not the security boundary (README §26).
 */
export function RegistrationIdsPage() {
  const { userRole, backendConfigured, toast, addSystemLog } = usePortal();

  const permittedTypes = useMemo(() => allowedIdTypes(userRole), [userRole]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [copiedId, setCopiedId] = useState(null);

  // Generate form
  const [idType, setIdType] = useState(permittedTypes[0] || "STUDENT");
  const [departmentCode, setDepartmentCode] = useState("");
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!backendConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const result = await registrationIdsApi.list({
        status: statusFilter === "All" ? undefined : statusFilter,
        search: search || undefined,
        limit: 50,
      });
      setRows(Array.isArray(result) ? result : result?.items || []);
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [backendConfigured, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!permittedTypes.includes(idType)) {
      toast({
        title: "Not permitted",
        description: `Your role cannot issue ${TYPE_LABEL[idType] || idType}s.`,
        variant: "warning",
      });
      return;
    }
    if (!backendConfigured) {
      toast({
        title: "Backend required",
        description: "Registration IDs are issued server-side. Connect the backend to generate them.",
        variant: "warning",
      });
      return;
    }

    setGenerating(true);
    try {
      const created = await registrationIdsApi.generate({
        id_type: idType,
        department_code: departmentCode.trim().toUpperCase() || undefined,
        count: Number(count) || 1,
      });
      const issued = Array.isArray(created) ? created : [created];
      toast({
        title: "Registration IDs issued",
        description: `${issued.length} ${TYPE_LABEL[idType]}${issued.length > 1 ? "s" : ""} generated.`,
        variant: "success",
      });
      addSystemLog?.(`Generated ${issued.length} ${idType} registration ID(s)`, "Success");
      await load();
    } catch (e) {
      toast({ title: "Generation failed", description: e.message, variant: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDisable = async (row) => {
    try {
      await registrationIdsApi.disable(row.id);
      toast({
        title: "Registration ID disabled",
        description: `${row.registration_id} can no longer be used to activate an account.`,
        variant: "success",
      });
      addSystemLog?.(`Disabled registration ID ${row.registration_id}`, "Warning");
      await load();
    } catch (e) {
      toast({ title: "Could not disable", description: e.message, variant: "error" });
    }
  };

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(value);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!permittedTypes.length) {
    return (
      <>
        <Breadcrumb
          title="Registration IDs"
          subtitle="Institutional identity issuance"
          items={[{ label: "Registration IDs" }]}
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ShieldAlert className="size-8 text-muted-foreground" />
            <p className="font-display text-base font-semibold text-foreground">
              Your role cannot issue registration IDs
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Registration IDs are issued by Super Admin, Principal, Vice-Principal, HOD and Faculty
              within their own scope. Contact your department office if you need one.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        title="Registration IDs"
        subtitle="Generate, track and disable institutional IDs"
        items={[{ label: "Registration IDs" }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Generate panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              Issue new IDs
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              IDs are unique, immutable and never reused. The server builds the final ID.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="id-type" className="mb-1.5 block text-xs font-medium text-foreground">
                  ID type
                </label>
                <select
                  id="id-type"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
                >
                  {permittedTypes.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t] || t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dept-code" className="mb-1.5 block text-xs font-medium text-foreground">
                  Department code
                </label>
                <input
                  id="dept-code"
                  type="text"
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                  placeholder="CSE"
                  className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm uppercase text-foreground outline-none focus:border-primary"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Leave blank to use your own department scope.
                </p>
              </div>

              <div>
                <label htmlFor="id-count" className="mb-1.5 block text-xs font-medium text-foreground">
                  How many
                </label>
                <input
                  id="id-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
              >
                {generating ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                <span>Generate IDs</span>
              </button>
            </form>

            <div className="mt-5 rounded-lg bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
              Lifecycle: GENERATED → ASSIGNED → ACTIVATED. Disabling an ID stops activation without
              deleting its history.
            </div>
          </CardContent>
        </Card>

        {/* Issued IDs */}
        <Card className="lg:col-span-2">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Issued IDs</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ID"
                    className="h-9 w-44 rounded-lg border border-input bg-card pl-8 pr-3 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-card px-2 text-xs text-foreground outline-none focus:border-primary"
                  aria-label="Filter by status"
                >
                  {["All", "GENERATED", "ASSIGNED", "ACTIVATED", "DISABLED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!backendConfigured && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Connect the backend to view issued registration IDs.
              </div>
            )}

            {backendConfigured && loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading registration IDs…
              </div>
            )}

            {backendConfigured && !loading && error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
            )}

            {backendConfigured && !loading && !error && rows.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No registration IDs match this view yet.
              </div>
            )}

            {backendConfigured && !loading && !error && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3 font-medium">Registration ID</th>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Generated</th>
                      <th className="py-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 pr-3">
                          <button
                            type="button"
                            onClick={() => copy(row.registration_id)}
                            className="inline-flex items-center gap-1.5 font-mono font-medium text-foreground hover:text-primary"
                            title="Copy to clipboard"
                          >
                            {row.registration_id}
                            {copiedId === row.registration_id ? (
                              <CheckCircle2 className="size-3.5 text-success" />
                            ) : (
                              <Copy className="size-3 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">
                          {TYPE_LABEL[row.id_type] || row.id_type}
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge variant={STATUS_VARIANT[row.status] || "muted"}>{row.status}</Badge>
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">
                          {row.generated_at ? new Date(row.generated_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-2.5 text-right">
                          {row.status !== "DISABLED" && row.status !== "ACTIVATED" ? (
                            <button
                              type="button"
                              onClick={() => handleDisable(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-medium text-destructive hover:bg-destructive/10"
                            >
                              <Ban className="size-3" />
                              Disable
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
