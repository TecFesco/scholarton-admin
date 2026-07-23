import { useQuery } from "@tanstack/react-query";
import { StudentService } from "@/Services/student.service";
import { MentorService } from "@/Services/mentor.service";
import { ProjectService } from "@/Services/project.service";
import type { Mentor } from "@/Types";

export const queryKeys = {
  students: ["students"] as const,
  mentors: ["mentors"] as const,
  projects: ["projects"] as const,
};

export function useStudents() {
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: StudentService.fetchAll,
  });
}

export function useMentors() {
  return useQuery({
    queryKey: queryKeys.mentors,
    queryFn: MentorService.fetchAll,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: ProjectService.fetchAll,
  });
}

/**
 * GET /project returns bare documents — unlike /project/published, the list
 * endpoint skips the repository's attachMentor step. The admin already holds
 * the full mentor list, so resolve the name on the client instead of paying
 * for N extra round-trips.
 */
export function mentorLookup(mentors: Mentor[] | undefined) {
  const byId = new Map<string, Mentor>();
  for (const mentor of mentors ?? []) {
    byId.set(mentor.mentor_id, mentor);
  }
  return byId;
}
