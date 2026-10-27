/**
 * Canonical V1 roles (README §5) and the display labels used by the portal UI.
 *
 * The backend always speaks the canonical enum. The UI keeps the human labels it
 * was designed around, so this module is the single translation point.
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  PRINCIPAL: "PRINCIPAL",
  VICE_PRINCIPAL: "VICE_PRINCIPAL",
  HOD: "HOD",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
};

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  PRINCIPAL: "Principal",
  VICE_PRINCIPAL: "Vice-Principal",
  HOD: "HOD",
  FACULTY: "Faculty",
  STUDENT: "Student",
};

const LABEL_TO_ROLE = Object.entries(ROLE_LABELS).reduce((acc, [role, label]) => {
  acc[label.toLowerCase()] = role;
  return acc;
}, {});

/** Canonical enum -> label shown in the UI. */
export function roleLabel(role) {
  if (!role) return "Student";
  return ROLE_LABELS[role] || LABEL_TO_ROLE[String(role).toLowerCase()]
    ? ROLE_LABELS[role] || ROLE_LABELS[LABEL_TO_ROLE[String(role).toLowerCase()]]
    : String(role);
}

/** UI label (or any casing of it) -> canonical enum. */
export function roleEnum(label) {
  if (!label) return ROLES.STUDENT;
  const key = String(label).trim();
  if (ROLE_LABELS[key]) return key;
  return LABEL_TO_ROLE[key.toLowerCase()] || ROLES.STUDENT;
}

/** Principal and Vice-Principal share the V1 dashboard and access (README §5). */
export const COLLEGE_WIDE_ROLES = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL];

export function isCollegeWide(role) {
  return COLLEGE_WIDE_ROLES.includes(roleEnum(role));
}

/**
 * Which registration ID types a role may generate (README §8).
 * This mirrors the backend rule; it is a UX hint only, never a security control.
 */
export const REGISTRATION_ID_RIGHTS = {
  SUPER_ADMIN: ["STUDENT", "FACULTY", "HOD"],
  PRINCIPAL: ["STUDENT", "FACULTY", "HOD"],
  VICE_PRINCIPAL: ["STUDENT", "FACULTY", "HOD"],
  HOD: ["STUDENT", "FACULTY"],
  FACULTY: ["STUDENT"],
  STUDENT: [],
};

export function allowedIdTypes(role) {
  return REGISTRATION_ID_RIGHTS[roleEnum(role)] || [];
}
