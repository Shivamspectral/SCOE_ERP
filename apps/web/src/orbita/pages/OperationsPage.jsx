import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, RefreshCw, Search, X, Save, BriefcaseBusiness, BookOpen, Building2, CalendarDays, ClipboardList, GraduationCap, LibraryBig, Truck, Users, Wrench } from "lucide-react";
import { operationsApi, isBackendConfigured } from "../lib/api";
import { usePortal } from "../context/PortalContext";

const MODULES = {
  "/hr": { key:"employees", title:"Human Resources", description:"Staff directory, appointments, qualifications and employment status.", icon:Users, fields:[["employee_code","Employee code","text",true],["full_name","Full name","text",true],["department_id","Department ID","text"],["designation","Designation","text"],["employment_type","Employment type","select",false,["full_time","part_time","contract","visiting","temporary"]],["joining_date","Joining date","date"],["employment_status","Employment status","select",false,["active","on_leave","notice_period","separated"]],["work_email","Work email","email"],["phone","Phone","tel"]] },
  "/leave": { key:"leave", title:"Leave Management", description:"Submit and review staff leave requests with dates, leave type and decision notes.", icon:CalendarDays, fields:[["employee_id","Employee ID","text",true],["leave_type","Leave type","text",true],["starts_on","Start date","date",true],["ends_on","End date","date",true],["days","Number of days","number",true],["reason","Reason","textarea"]] },
  "/procurement": { key:"procurement", title:"Procurement & Requisitions", description:"Track departmental purchases, estimated costs, priorities and approvals.", icon:ClipboardList, fields:[["request_number","Request number","text",true],["title","Request title","text",true],["department_id","Department ID","text"],["description","Description","textarea"],["vendor_name","Vendor","text"],["estimated_amount","Estimated amount (₹)","number",true],["priority","Priority","select",false,["low","normal","high","urgent"]],["status","Status","select",false,["draft","submitted","approved","rejected","ordered","received","cancelled"]]] },
  "/catalogue": { key:"catalogue", title:"Library Catalogue", description:"Manage bibliographic records, accession numbers, copy counts and shelf locations.", icon:LibraryBig, fields:[["accession_number","Accession number","text",true],["title","Book / item title","text",true],["isbn","ISBN","text"],["authors","Authors (comma separated)","text"],["publisher","Publisher","text"],["publication_year","Publication year","number"],["category","Category","text"],["shelf_location","Shelf location","text"],["total_copies","Total copies","number",true],["available_copies","Available copies","number",true],["item_type","Item type","select",false,["book","journal","thesis","media","digital"]]] },
  "/work-orders": { key:"workOrders", title:"Facilities & Work Orders", description:"Log campus repairs, assign technicians, prioritise incidents and record resolution.", icon:Wrench, fields:[["ticket_number","Ticket number","text",true],["category","Category","select",true,["facility","electrical","plumbing","network","lab_equipment","safety","cleaning","other"]],["location","Location","text",true],["title","Issue title","text",true],["description","Description","textarea"],["priority","Priority","select",false,["low","normal","high","critical"]],["status","Status","select",false,["open","assigned","in_progress","blocked","resolved","closed","cancelled"]],["due_at","Due date","datetime-local"],["resolution_note","Resolution note","textarea"]] },
  "/assets": { key:"assets", title:"Asset Register", description:"Track institutional equipment, warranties, costs, conditions and ownership.", icon:Building2, fields:[["asset_tag","Asset tag","text",true],["name","Asset name","text",true],["category","Category","text",true],["department_id","Department ID","text"],["location","Location","text"],["serial_number","Serial number","text"],["purchase_date","Purchase date","date"],["purchase_cost","Purchase cost (₹)","number"],["warranty_until","Warranty until","date"],["condition","Condition","select",false,["new","good","fair","poor","retired"]],["status","Status","select",false,["active","under_maintenance","lost","disposed"]]] },
  "/hostel-rooms": { key:"hostelRooms", title:"Hostel Room Inventory", description:"Maintain hostel buildings, room capacity, occupancy and maintenance status.", icon:Building2, fields:[["building","Building","text",true],["room_number","Room number","text",true],["floor_label","Floor","text"],["capacity","Bed capacity","number",true],["occupied_beds","Occupied beds","number",true],["room_type","Room type","text"],["status","Status","select",false,["available","full","maintenance","inactive"]],["notes","Notes","textarea"]] },
  "/vehicles": { key:"vehicles", title:"Transport Fleet", description:"Maintain vehicle registrations, capacity, driver contacts, permits and servicing dates.", icon:Truck, fields:[["vehicle_code","Vehicle code","text",true],["registration_number","Registration number","text",true],["vehicle_type","Vehicle type","text"],["capacity","Capacity","number",true],["driver_name","Driver name","text"],["driver_phone","Driver phone","tel"],["permit_expires_on","Permit expiry","date"],["insurance_expires_on","Insurance expiry","date"],["last_service_on","Last service","date"],["next_service_on","Next service","date"],["status","Status","select",false,["active","maintenance","retired"]]] },
  "/employers": { key:"employers", title:"Employer Relations", description:"Maintain recruiter contacts and employer relationship status.", icon:BriefcaseBusiness, fields:[["name","Employer name","text",true],["industry","Industry","text"],["website","Website","url"],["contact_name","Contact person","text"],["contact_email","Contact email","email"],["contact_phone","Contact phone","tel"],["relationship_status","Relationship","select",false,["prospect","active","inactive","blacklisted"]],["notes","Notes","textarea"]] },
  "/drives": { key:"drives", title:"Placement Drives", description:"Plan recruitment drives, eligibility, deadlines, vacancies and package bands.", icon:GraduationCap, fields:[["employer_id","Employer ID","text",true],["title","Drive title","text",true],["job_role","Job role","text"],["eligible_programmes","Eligible programmes (comma separated)","text"],["minimum_cgpa","Minimum CGPA","number"],["package_min_lpa","Minimum package (LPA)","number"],["package_max_lpa","Maximum package (LPA)","number"],["drive_date","Drive date","date"],["registration_deadline","Registration deadline","datetime-local"],["vacancies","Vacancies","number"],["status","Status","select",false,["planned","open","in_progress","completed","cancelled"]]] },
  "/research": { key:"research", title:"Research & Grants", description:"Track funded projects, principal investigators, timelines, outputs and status.", icon:BookOpen, fields:[["project_code","Project code","text",true],["title","Project title","text",true],["department_id","Department ID","text"],["principal_investigator","Principal investigator user ID","text"],["funding_agency","Funding agency","text"],["grant_amount","Grant amount","number"],["starts_on","Start date","date"],["ends_on","End date","date"],["status","Status","select",false,["proposed","submitted","active","completed","on_hold","rejected"]]] },
  "/accreditation": { key:"evidence", title:"Accreditation & Quality Assurance", description:"Organise NAAC, NBA, IQAC, NIRF and regulatory evidence by criterion and reporting period.", icon:ClipboardList, fields:[["framework","Framework","select",true,["NAAC","NBA","IQAC","NIRF","AISHE","AICTE","UGC","OTHER"]],["cycle_label","Cycle / year","text"],["criterion_code","Criterion code","text",true],["title","Evidence title","text",true],["description","Description","textarea"],["owner_department_id","Owner department ID","text"],["reporting_period","Reporting period","text"],["status","Status","select",false,["draft","in_progress","submitted_for_review","approved","needs_revision","archived"]]] },
  "/institution-events": { key:"events", title:"Institutional Events", description:"Coordinate official events, venues, schedules, organisers and capacity.", icon:CalendarDays, fields:[["title","Event title","text",true],["event_type","Event type","text"],["description","Description","textarea"],["venue","Venue","text"],["starts_at","Starts at","datetime-local",true],["ends_at","Ends at","datetime-local",true],["organizer_department_id","Organiser department ID","text"],["coordinator_id","Coordinator user ID","text"],["capacity","Capacity","number"],["status","Status","select",false,["draft","planned","published","completed","cancelled"]]] },
};

const humanize = (key) => key.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase());
const displayValue = (value) => Array.isArray(value) ? value.join(", ") : value && typeof value === "object" ? JSON.stringify(value) : value == null || value === "" ? "—" : String(value);

export function OperationsPage({ route }) {
  const config = MODULES[route] || MODULES["/hr"];
  const { isDemoPreview } = usePortal();
  const [records,setRecords] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [search,setSearch] = useState("");
  const [status,setStatus] = useState("");
  const [modal,setModal] = useState(false);
  const [saving,setSaving] = useState(false);
  const [form,setForm] = useState({});
  const [notice,setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    if (isDemoPreview || !isBackendConfigured) {
      setRecords([]);
      setLoading(false);
      return;
    }
    try {
      const result = await operationsApi.list(config.key, {search: search || undefined, status: status || undefined});
      setRecords(Array.isArray(result) ? result : result?.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load records.");
      setRecords([]);
    } finally { setLoading(false); }
  },[config.key,isDemoPreview,search,status]);

  useEffect(()=>{ void load(); },[load]);

  const columns = useMemo(() => {
    if (!records.length) return config.fields.filter((f)=>["text","email","date","select","number"].includes(f[2])).slice(0,5).map((f)=>f[0]);
    const preferred = config.fields.map((f)=>f[0]).filter((k)=>records.some((r)=>r[k] !== undefined));
    return preferred.slice(0,6);
  },[records,config.fields]);

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    if (isDemoPreview || !isBackendConfigured) {
      setNotice("Demo preview is read-only. Connect an authenticated backend to save institutional records.");
      setSaving(false); return;
    }
    const payload = {};
    for (const field of config.fields) {
      const [key,,type] = field;
      const value = form[key];
      if (value === undefined || value === "") continue;
      if (type === "number") payload[key] = Number(value);
      else if (key === "authors" || key === "eligible_programmes") payload[key] = value.split(",").map((s)=>s.trim()).filter(Boolean);
      else payload[key] = value;
    }
    try {
      await operationsApi.create(config.key,payload);
      setModal(false); setForm({}); setNotice("Record created successfully."); await load();
    } catch(e) { setError(e instanceof Error ? e.message : "Could not create record."); }
    finally { setSaving(false); }
  };

  const update = async (record, key, value) => {
    if (isDemoPreview || !isBackendConfigured) return;
    try { await operationsApi.update(config.key,record.id,{[key]:value}); setNotice("Record updated."); await load(); }
    catch(e) { setError(e instanceof Error ? e.message : "Update failed."); }
  };

  const Icon = config.icon;
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-primary"><Icon className="size-6"/></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Campus operations</p><h1 className="mt-1 font-display text-2xl font-bold text-foreground">{config.title}</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{config.description}</p></div>
      </div>
      <button onClick={()=>{setForm({});setModal(true);setError("");}} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="size-4"/> New record</button>
    </div>
    {(isDemoPreview || !isBackendConfigured) && <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600"/><div><p className="font-semibold">Preview mode</p><p className="mt-1 text-muted-foreground">This module is ready to connect to institutional records. Live data and saving require the authenticated API and database migration to be deployed. Demo mode never writes real records.</p></div></div>}
    {notice && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">{notice}</div>}
    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"><AlertCircle className="mt-0.5 size-4 shrink-0"/><span>{error}</span><button className="ml-auto" onClick={()=>setError("")} aria-label="Dismiss error"><X className="size-4"/></button></div>}
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={"Search " + config.title.toLowerCase() + "..."} className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"/></div>
        {config.fields.some((f)=>f[0]==="status") && <select value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"><option value="">All statuses</option>{config.fields.find((f)=>f[0]==="status")?.[4]?.map((s)=><option key={s} value={s}>{humanize(s)}</option>)}</select>}
        <button onClick={()=>void load()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"><RefreshCw className="size-4"/> Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr>{columns.map((c)=><th key={c} className="whitespace-nowrap px-4 py-3 font-semibold">{humanize(c)}</th>)}<th className="px-4 py-3 font-semibold">Update status</th></tr></thead>
        <tbody className="divide-y divide-border">
          {loading ? <tr><td colSpan={columns.length+1} className="px-4 py-12 text-center text-muted-foreground"><RefreshCw className="mx-auto mb-2 size-5 animate-spin"/>Loading records…</td></tr> :
          records.length ? records.map((record)=><tr key={record.id} className="hover:bg-muted/30">{columns.map((c)=><td key={c} className="max-w-64 px-4 py-3 text-foreground"><span className="block truncate" title={displayValue(record[c])}>{displayValue(record[c])}</span></td>)}<td className="px-4 py-3">{config.fields.some((f)=>f[0]==="status") ? <select aria-label={"Update status for "+(record.title||record.full_name||record.name||record.id)} value={record.status||""} onChange={(e)=>void update(record,"status",e.target.value)} className="max-w-44 rounded-md border border-input bg-background px-2 py-1.5 text-xs">{config.fields.find((f)=>f[0]==="status")?.[4]?.map((s)=><option key={s} value={s}>{humanize(s)}</option>)}</select> : <span className="text-muted-foreground">—</span>}</td></tr>) :
          <tr><td colSpan={columns.length+1} className="px-4 py-14 text-center"><div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-muted"><Icon className="size-5 text-muted-foreground"/></div><p className="font-semibold text-foreground">{isDemoPreview || !isBackendConfigured ? "Ready for institutional data" : "No records found"}</p><p className="mt-1 text-sm text-muted-foreground">{isDemoPreview || !isBackendConfigured ? "Connect the backend to load and manage records." : "Create a record or adjust your search."}</p></td></tr>}
        </tbody></table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground"><span>{records.length} record{records.length===1?"":"s"} shown (up to 250)</span><span>Institution-scoped workspace</span></div>
    </section>
    {modal && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setModal(false);}}><section role="dialog" aria-modal="true" aria-labelledby="operation-form-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4"><div><h2 id="operation-form-title" className="font-display text-lg font-bold">Create {config.title.toLowerCase()} record</h2><p className="mt-1 text-xs text-muted-foreground">Required fields are marked with an asterisk.</p></div><button onClick={()=>setModal(false)} className="rounded-lg p-2 hover:bg-muted" aria-label="Close form"><X className="size-5"/></button></div>
      <form onSubmit={submit} className="space-y-5 p-5"><div className="grid gap-4 sm:grid-cols-2">{config.fields.map(([key,label,type,required,options])=><label key={key} className={"block space-y-1.5 "+(type==="textarea"?"sm:col-span-2":"")}><span className="text-sm font-medium text-foreground">{label}{required&&<span className="text-destructive"> *</span>}</span>{type==="select"?<select required={Boolean(required)} value={form[key]||""} onChange={(e)=>setForm((p)=>({...p,[key]:e.target.value}))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"><option value="">Select…</option>{(options||[]).map((o)=><option key={o} value={o}>{humanize(o)}</option>)}</select>:type==="textarea"?<textarea rows={3} value={form[key]||""} onChange={(e)=>setForm((p)=>({...p,[key]:e.target.value}))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" placeholder={"Enter "+label.toLowerCase()}/>:<input required={Boolean(required)} type={type==="number"?"number":type} min={type==="number"?0:undefined} step={type==="number"?"any":undefined} value={form[key]||""} onChange={(e)=>setForm((p)=>({...p,[key]:e.target.value}))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" placeholder={type==="number"?"0": "Enter "+label.toLowerCase()}/>}</label>)}</div>
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={()=>setModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">Cancel</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4"/>{saving?"Saving…":"Create record"}</button></div></form></section></div>}
  </div>;
}
