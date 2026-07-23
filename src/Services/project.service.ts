import axiosInstance from "@/Api/axiosInstance";
import { endpoints } from "@/Api/endpoints";
import type { ApiEnvelope, Project } from "@/Types";

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

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(endpoints.project.byId(id));
  },
};
