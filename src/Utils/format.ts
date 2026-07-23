import type { Mentor, Student } from "@/Types";

/**
 * Firestore timestamps reach the client in several shapes depending on whether
 * they were written by the Admin SDK ({_seconds}), the client SDK ({seconds}),
 * or stored as an ISO string. Normalise all of them to a Date.
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (typeof value === "object") {
    const ts = value as { seconds?: number; _seconds?: number };
    const seconds = ts.seconds ?? ts._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/** "12 Mar 2026", or an em dash when the field is missing. */
export function formatDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Local calendar day as YYYY-MM-DD — used as the bucket key for the signups
 *  chart. Deliberately not toISOString(), which shifts to UTC and can push a
 *  late-evening signup into the next day. */
export function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fullName(person: Partial<Student & Mentor>): string {
  const name = [person.first_name, person.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || (person.email as string) || "Unnamed";
}

/**
 * Enrolled-student count per project, keyed by project_id.
 *
 * The API only stamps `enrolled_count` in fetchByMentor — `GET /project` skips
 * it — but `GET /student` already joins each student's student_projects, so the
 * count is exact and costs no extra requests.
 */
export function enrolmentCounts(
  students: Student[] | undefined
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const student of students ?? []) {
    // One student can hold several enrolments; count each project once per
    // student so a re-enrolment can't inflate the number.
    const seen = new Set<string>();
    for (const enrolment of student.student_Project ?? []) {
      const projectId = enrolment?.project_id;
      if (!projectId || seen.has(projectId)) continue;
      seen.add(projectId);
      counts.set(projectId, (counts.get(projectId) ?? 0) + 1);
    }
  }

  return counts;
}

export function initials(person: Partial<Student & Mentor>): string {
  const first = person.first_name?.[0] ?? "";
  const last = person.last_name?.[0] ?? "";
  const combined = `${first}${last}`.trim();
  if (combined) return combined.toUpperCase();
  return (person.email as string)?.[0]?.toUpperCase() ?? "?";
}
