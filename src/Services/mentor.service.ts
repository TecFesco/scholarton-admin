import axiosInstance from "@/Api/axiosInstance";
import { endpoints } from "@/Api/endpoints";
import type { ApiEnvelope, Mentor } from "@/Types";

export const MentorService = {
  fetchAll: async (): Promise<Mentor[]> => {
    const res = await axiosInstance.get<ApiEnvelope<Mentor[]>>(
      endpoints.mentor.base
    );
    return res.data.data ?? [];
  },

  fetchById: async (id: string): Promise<Mentor | null> => {
    const res = await axiosInstance.get<ApiEnvelope<Mentor>>(
      endpoints.mentor.byId(id)
    );
    return res.data.data ?? null;
  },

  create: async (payload: Partial<Mentor>): Promise<Mentor> => {
    const res = await axiosInstance.post<ApiEnvelope<Mentor>>(
      endpoints.mentor.base,
      payload
    );
    return res.data.data;
  },

  // Same ownership guard as students — MentorService.updateOne requires
  // mentor_id === the caller's uid. See README "Known API gaps".
  update: async (id: string, patch: Partial<Mentor>): Promise<Mentor> => {
    const res = await axiosInstance.put<ApiEnvelope<Mentor>>(
      endpoints.mentor.byId(id),
      patch
    );
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(endpoints.mentor.byId(id));
  },
};
