import axiosInstance from "@/Api/axiosInstance";
import { endpoints } from "@/Api/endpoints";
import type { ApiEnvelope, Student, StudentDeletion } from "@/Types";

export const StudentService = {
  fetchAll: async (): Promise<Student[]> => {
    const res = await axiosInstance.get<ApiEnvelope<Student[]>>(
      endpoints.student.base
    );
    return res.data.data ?? [];
  },

  fetchById: async (id: string): Promise<Student | null> => {
    const res = await axiosInstance.get<ApiEnvelope<Student>>(
      endpoints.student.byId(id)
    );
    return res.data.data ?? null;
  },

  create: async (payload: Partial<Student>): Promise<Student> => {
    const res = await axiosInstance.post<ApiEnvelope<Student>>(
      endpoints.student.base,
      payload
    );
    return res.data.data;
  },

  // Heads-up: StudentService.updateOne on the API rejects unless
  // student_id === the caller's uid, so this 401s for an admin editing
  // somebody else. Wired up so it works the moment that guard is relaxed.
  update: async (id: string, patch: Partial<Student>): Promise<Student> => {
    const res = await axiosInstance.put<ApiEnvelope<Student>>(
      endpoints.student.byId(id),
      patch
    );
    return res.data.data;
  },

  remove: async (id: string): Promise<StudentDeletion> => {
    const res = await axiosInstance.delete<ApiEnvelope<StudentDeletion>>(
      endpoints.student.byId(id)
    );
    return res.data.data;
  },
};
