# Master College ERP Module Roadmap

**Scope:** Staff-only ERP for an Indian engineering college. This is the target product inventory and delivery plan, not a claim that every listed module is implemented. Existing UI screens may still be preview-only; each module becomes production-ready only after its API, database/RLS policies, workflow, tests and deployment are verified.

**Explicit exclusion:** No student or parent accounts, routes, portals, or credentials. Authorized staff may maintain student records internally where required for academic and administrative operations.

## Product principles

- One institutional source of truth; shared identifiers across academic, HR, finance and campus operations.
- Staff-only identity with least-privilege, institution/department-scoped access and separation of duties.
- Every consequential action is state-validated server-side and audited.
- Demo fixtures are clearly labelled, local-only and never grant backend access.
- University, programme, academic year, semester, grading and policy rules are configurable rather than hard-coded.
- Imports support dry-run, row validation, duplicate detection and a reviewable error report.
- Exports are permission-checked; sensitive documents use private storage and expiring access.
- Integrations are labelled as configured/unconfigured. Never claim an email, SMS, payment, university submission or PDF was delivered unless its provider confirms it.
- Accessibility, responsive desktop/mobile use, backups, observability, migration safety and recovery are release requirements.

## Target module catalogue

### A. Governance, identity and institutional setup
1. **Institution & campus setup** — institution profile, campuses, departments, programmes, academic years, terms, sections, rooms, labs, configurable calendars and policy settings.
2. **Identity, staff directory & access control** — staff lifecycle, invitations, role assignments, department scopes, account suspension, permission matrix and access reviews.
3. **Workflow & approvals engine** — configurable request types, approval chains, delegation, return/resubmit, cancellation, SLAs, attachments and immutable decision history.
4. **Notifications & communications** — in-app inbox, circulars, announcements, acknowledgements, templates, preferences, delivery status and retry handling.
5. **Document & records management** — metadata, private files, versioning, retention, access history, document expiry reminders and controlled sharing.
6. **Audit, security & platform operations** — searchable audit trails, health/readiness, security events, backup/restore runbooks, data retention, incident response and configuration management.

### B. Admissions and academic lifecycle (staff-operated)
7. **Enquiry, applications & admissions** — enquiry pipeline, application intake, eligibility checks, merit/rank lists, document verification, seat/intake tracking, approval and conversion to enrolled student record.
8. **Student information records (internal only)** — institutional identifiers, enrollment, programme/semester history, status changes, document checklist, academic progression and controlled record corrections. No student/parent login.
9. **Curriculum, courses & credit structure** — curriculum versions, course catalogue, credit schemes, electives, prerequisites, course registration and curriculum mapping for applicable NEP/CBCS rules.
10. **Teaching allocation & workload** — faculty-to-course/class assignment, workload rules, substitutions, workload approval and utilization reporting.
11. **Timetable, rooms & academic calendar** — timetable builder, room/lab capacity, conflict detection, academic events, rescheduling and change notifications.
12. **Syllabus & course delivery** — lesson plans, syllabus coverage, course files, faculty diary, practical/lab plans and delayed-coverage escalation.
13. **Attendance & eligibility** — session/period marking, bulk roster capture, correction requests, review, attendance percentage by course, shortage thresholds, condonation workflow and examination eligibility. Thresholds are configurable institutional policy, not hard-coded assumptions.
14. **Assignments, LMS & learning resources** — course materials, assignment briefs, submissions managed by authorized staff, rubrics, quizzes, question banks, due dates and learning activity reporting. Student-facing access is out of scope.
15. **Mentoring & student support records (staff only)** — mentor allocation, meeting notes, referrals, follow-up tasks and tightly restricted sensitive notes.

### C. Assessment and examinations
16. **Internal assessment & marks** — assessment components/weights, marks entry, validation, draft/submit/return/approve/publish workflow, change history and role-scoped exports.
17. **Examination cell / Controller of Examinations** — exam calendar, registration/eligibility checks, seating plans, hall tickets for institutional processing, invigilation allocation, room plans, attendance sheets and incident records.
18. **Question paper & evaluation operations** — question bank, paper-setting workflow, confidential access, moderation, valuation allocation, practical/oral evaluation and controlled release.
19. **Results, grading & transcripts** — configurable grading rules, SGPA/CGPA calculations, moderation/grace rules only when institutionally authorized, result approval/publication, revaluation, backlog/supplementary exams and transcript generation.
20. **Certificates & verification** — bonafide, leaving/transfer and other approved certificates, issuance register, authorized templates, QR/verification code and revocation/correction trail.

### D. Finance, fees and procurement
21. **Fee structures & student fee ledgers (staff only)** — programme/category/term fee plans, invoices, receipts, dues, concessions, scholarships, refunds, waivers and reconciliation.
22. **Accounting & financial controls** — chart of accounts, journals, ledgers, receivables/payables, bank reconciliation, budgets, cost centres, financial periods and close controls.
23. **Payments & reconciliation** — payment gateway integration, idempotent callbacks, receipt generation, failed-payment handling and reconciliation. No real payment flow until credentials and test/live verification exist.
24. **Procurement & vendors** — requisitions, approvals, quotations, vendor records, purchase orders, goods receipt, invoice matching and purchase audit.
25. **Budget, grants & expenditure** — annual/departments budgets, grant allocation, utilization tracking, approvals and variance reporting.

### E. HR and workforce
26. **HRMS & employee records** — employment details, qualifications, service history, contracts, joining/exit, designations and restricted personnel documents.
27. **Recruitment & onboarding** — requisition, applicant tracking, interview stages, offer approvals, joining checklist and conversion to employee record.
28. **Leave, attendance & duty management** — leave policies, balances, holidays, attendance/biometric integration, duty permissions, substitutions and approval history.
29. **Payroll & statutory records** — configurable earnings/deductions, payslips, payroll approvals, payroll period locking, exports and statutory reports reviewed by finance/HR. Never infer statutory calculations without confirmed policy.
30. **Faculty appraisal & professional development** — workload, FDP, training, qualifications, appraisal evidence, publications and promotion/eligibility tracking.
31. **Substitute and workload planning** — substitute faculty, workload balancing, timetable impact and approval.

### F. Campus and operational services
32. **Library & digital repository** — catalogue, acquisition, barcodes, circulation, renewals, reservations, overdue rules, fines, digital-resource licensing and stock verification.
33. **Hostel & accommodation operations** — blocks/rooms/beds, occupancy, allotment, maintenance, leave/out-pass workflow and wardens. Staff-managed only.
34. **Transport & fleet** — routes/stops, vehicle and driver records, capacity, permits/insurance expiry, maintenance, route assignments and transport billing.
35. **Facilities, labs & maintenance** — work orders, equipment registers, preventive maintenance, safety checks, lab schedules and incident follow-up.
36. **Inventory, stores & asset lifecycle** — stock, issue/return, transfers, purchase links, asset tags, depreciation policy integration, maintenance, verification and write-off approval.
37. **Campus events, clubs, sports & venues** — event proposals, venue booking, approvals, budgets, equipment, attendance registers, outcomes and evidence.
38. **Visitor, security & safety operations** — visitor log, contractor access, emergency contacts, incident reporting, committee actions and restricted case records.
39. **IT service desk** — ticket categories, assignment, SLA, escalation, knowledge base, asset linkage and resolution history.
40. **Health, counselling & welfare administration** — appointment/service capacity and restricted staff-record workflows only where policy and law permit; collect minimum necessary sensitive data and apply explicit access controls.

### G. Careers, research and institutional partnerships
41. **Placement & career services (staff-managed)** — employer CRM, MoUs, eligibility criteria, job drives, shortlist/interview stages, offers, internship tracking and outcome reporting. No student login.
42. **Alumni & industry relations** — alumni directory maintained by authorized staff, events, mentorship/industry links, donations where applicable and verified employment outcomes.
43. **Research, consultancy & IPR** — projects, grants, ethics approvals where applicable, publications, patents, consultancy, equipment use and deliverables.
44. **Innovation, incubation & entrepreneurship** — ideas, projects, startup incubation, competitions, intellectual property and institutional outcome evidence.
45. **MoU & partnership management** — partner directory, agreement versions, approvals, expiry reminders, activities, owners and measurable outcomes.

### H. Quality, accreditation and compliance
46. **OBE / NBA** — programme outcomes (POs), programme-specific outcomes (PSOs), course outcomes (COs), CO-PO/PSO mapping, assessment evidence, direct/indirect attainment and approved attainment calculations.
47. **IQAC / NAAC** — criteria-wise evidence, metric ownership, supporting documents, meeting minutes, action-taken reports, AQAR/SSR preparation and data validation.
48. **NIRF, AISHE, AICTE & university reporting** — annual data collection, field-level provenance, reconciliation, versioned submissions, evidence attachments and export templates. Reporting formats must follow the relevant current authority's instructions.
49. **Committees & statutory compliance** — committee constitution, meeting schedules/minutes, action items, expiry/renewal tracking and restricted grievance/anti-ragging/sexual-harassment case handling with legally appropriate confidentiality.
50. **Grievances, feedback & quality improvement** — staff-submitted complaints/feedback, assignment, conflict-of-interest-aware access, response SLA, escalation, anonymized trends and closure evidence.
51. **Policy & compliance register** — policies, owners, review cycles, mandatory disclosures, compliance tasks, risks and evidence of completion.

### I. Analytics, integrations and advanced capabilities
52. **Executive dashboards & reporting** — role-scoped KPIs, trends, drill-down, data freshness indicators and auditable CSV/XLSX/PDF exports.
53. **Data import/export & migration** — dry-run, mapping, validation, deduplication, rollback/reconciliation report and approval before commit.
54. **Integration hub** — university systems, payment gateway, email/SMS, biometric devices, accounting systems and approved government reporting portals through documented adapters and monitored sync jobs.
55. **Automation & scheduled jobs** — reminders, overdue escalations, expiry notices and recurring reports using durable queues, retries, idempotency and delivery logs.
56. **AI-assisted institutional insights (later phase)** — anomaly detection, workload suggestions, policy/document search and accreditation evidence assistance. AI output is advisory, sourced, permission-filtered and requires human approval; no autonomous high-impact student/staff decisions.
57. **Multi-campus and tenant management (optional)** — institution isolation, campus-level settings, centralized governance and carefully scoped consolidated reporting.

## Recommended implementation order

### Phase 0 — Make existing foundations dependable
- Inventory every current route and label it **production-backed**, **partial**, **preview-only**, or **unavailable**.
- Complete authentication/role scope, database RLS, audit, notifications, document storage, error/loading states and CI.
- Add shared pagination/filter patterns, typed DTO validation, idempotency for retried mutations and integration tests.
- Keep demo previews visibly synthetic and isolated from live data.
- Verify production deployment and smoke tests before calling any feature live.

### Phase 1 — Core college operations
Institution setup; staff and role administration; departments/programmes/classes/subjects; academic calendar; timetable; teaching assignments; attendance; internal marks; syllabus progress; workflow/approvals; circulars/documents; notifications; baseline dashboards and exports.

### Phase 2 — Academic administration and institutional data
Admissions; internal student records/imports; curriculum and credits; exam cell; results and certificates; fees and receipts; HR/leave; library; placements; mentoring; grievance/feedback; inventory/assets.

### Phase 3 — Finance and campus operations
Accounting/budgeting; procurement; payroll; hostel; transport; facilities/maintenance; IT service desk; events/venues; research and partnerships.

### Phase 4 — Quality and advanced institutional systems
OBE/NBA; IQAC/NAAC; NIRF/AISHE/AICTE reporting; committee/compliance register; advanced analytics; integration hub; durable automation; optional multi-campus and AI-assisted insights.

Priorities may change after the institution confirms autonomy/affiliation, university exam interfaces, policies, budget and compliance responsibilities.

## Production acceptance gate (required for every module)

1. The UI is connected to a real API and persistent schema; no silent fallback to fixtures in authenticated mode.
2. Server-side authorization and RLS cover institution, department, record ownership and role. Hiding a button is not authorization.
3. DTO validation, state-transition guards, concurrency handling and idempotent retry behaviour are tested.
4. Mutations generate an attributable audit trail without logging secrets or unnecessary sensitive data.
5. Lists have stable sorting, pagination and relevant filters; exports respect the same permissions.
6. Loading, empty, error, success, offline and permission-denied states are implemented.
7. Automated tests cover permitted and forbidden roles, cross-department/institution access, invalid transitions and malformed input.
8. Migration tests, typecheck, frontend build, API tests and security checks pass.
9. Operational integrations are verified end-to-end in a sandbox before live use.
10. Documentation covers ownership, configuration, support, backup/recovery and manual exception handling.

## Decisions required before high-risk modules go live

Confirm the college's affiliated university/autonomous status, academic regulations and grading formula, attendance/condonation policy, fee schedule and refund rules, payroll/statutory requirements, approved roles and committee confidentiality, document retention, reporting templates, and which external systems have APIs. Use institution-approved policy; do not assume defaults are official.
