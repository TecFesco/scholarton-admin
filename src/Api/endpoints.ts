const API_BASE_URL = import.meta.env.VITE_API_URL;

const endpoints = {
  student: {
    base: "student",
    byId: (id: string) => `student/${id}`,
    findByField: "student/find-by-field",
    // Admin-only: creates a real Firebase Auth login + profile (vs. base, which
    // only writes a profile for self-signup).
    provision: "student/provision",
  },
  mentor: {
    base: "mentor",
    byId: (id: string) => `mentor/${id}`,
    findByField: "mentor/find-by-field",
    provision: "mentor/provision",
  },
  project: {
    base: "project",
    published: "project/published",
    byId: (id: string) => `project/${id}`,
    byMentor: (mentorId: string) => `project/mentor/${mentorId}`,
    // A specific student's enrolments (each with the project + phase_states) —
    // the API doesn't ownership-check this, so an admin can read any student's.
    enrolledByStudent: (studentId: string) =>
      `project/student/${studentId}/enrolled`,
    findByField: "project/find-by-field",
  },
} as const;

export { API_BASE_URL, endpoints };
