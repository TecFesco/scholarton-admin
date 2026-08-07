import axiosInstance from "@/Api/axiosInstance";
import { endpoints } from "@/Api/endpoints";
import type { ApiEnvelope, Project, StudentProject } from "@/Types";

export const ProjectService = {
  fetchAll: async (): Promise<Project[]> => {
    const res = await axiosInstance.get<ApiEnvelope<Project[]>>(
      endpoints.project.base
    );
    return res.data.data ?? [];
  },

  fetchById: async (id: string): Promise<Project | null> => {
    const res = await axiosInstance.get<ApiEnvelope<Project>>(
      endpoints.project.byId(id)
    );
    return res.data.data ?? null;
  },

  create: async (payload: Partial<Project>): Promise<Project> => {
    const res = await axiosInstance.post<ApiEnvelope<Project>>(
      endpoints.project.base,
      payload
    );
    return res.data.data;
  },

  update: async (id: string, patch: Partial<Project>): Promise<Project> => {
    const res = await axiosInstance.put<ApiEnvelope<Project>>(
      endpoints.project.byId(id),
      patch
    );
    return res.data.data;
  },

  // Publish / unpublish shortcut. Admin bypasses the mentor-approval gate.
  setPublish: async (id: string, publish: boolean): Promise<Project> => {
    const res = await axiosInstance.put<ApiEnvelope<Project>>(
      endpoints.project.byId(id),
      { publish }
    );
    return res.data.data;
  },

  // A student's enrolments (each carries the project + phase_states) — used by
  // the admin's student-POV view to show one student's progress on a project.
  fetchEnrolledByStudent: async (
    studentId: string
  ): Promise<StudentProject[]> => {
    const res = await axiosInstance.get<ApiEnvelope<StudentProject[]>>(
      endpoints.project.enrolledByStudent(studentId)
    );
    return res.data.data ?? [];
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(endpoints.project.byId(id));
  },
};
