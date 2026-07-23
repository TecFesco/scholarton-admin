import { useMemo } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useMentors, useStudents } from "@/hooks/useAdminData";
import { fullName } from "@/Utils/format";

/** "pelumi.aniyajuwon.1011" → "Pelumi Aniyajuwon" — last resort when no profile
 *  record carries a real name. Digit-only segments are numbering, not names. */
function nameFromEmail(email: string | null | undefined): string {
  const local = email?.split("@")[0];
  if (!local) return "there";

  const words = local
    .split(/[._-]+/)
    .filter((part) => part && !/^\d+$/.test(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  return words.length ? words.join(" ") : "there";
}

/**
 * The admin's display name. Firebase only carries displayName when a profile
 * was set at sign-up, so fall back to the Scholarton record matching this uid
 * (admins are typically also a mentor) before deriving one from the email.
 */
export function useAdminName(): string {
  const { user } = useAuth();
  const mentors = useMentors();
  const students = useStudents();

  return useMemo(() => {
    if (!user) return "there";
    if (user.displayName?.trim()) return user.displayName.trim();

    const mentor = mentors.data?.find((m) => m.mentor_id === user.uid);
    if (mentor?.first_name || mentor?.last_name) return fullName(mentor);

    const student = students.data?.find((s) => s.student_id === user.uid);
    if (student?.first_name || student?.last_name) return fullName(student);

    return nameFromEmail(user.email);
  }, [user, mentors.data, students.data]);
}
