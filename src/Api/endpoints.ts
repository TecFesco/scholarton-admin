const API_BASE_URL = import.meta.env.VITE_API_URL;

const endpoints = {
  student: {
    base: "student",
    byId: (id: string) => `student/${id}`,
    findByField: "student/find-by-field",
  },
  mentor: {
    base: "mentor",
    byId: (id: string) => `mentor/${id}`,
    findByField: "mentor/find-by-field",
  },
  project: {
    base: "project",
    published: "project/published",
    byId: (id: string) => `project/${id}`,
    byMentor: (mentorId: string) => `project/mentor/${mentorId}`,
    findByField: "project/find-by-field",
  },
} as const;

export { API_BASE_URL, endpoints };
