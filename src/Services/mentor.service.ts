import axiosInstance from "@/Api/axiosInstance";
import { endpoints } from "@/Api/endpoints";
import type { ApiEnvelope, Mentor, MentorDeletion } from "@/Types";

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

  // Admin add-mentor: provisions a Firebase Auth login + profile.
  provision: async (
    payload: Partial<Mentor> & { email: string; password: string }
  ): Promise<Mentor> => {
    const res = await axiosInstance.post<ApiEnvelope<Mentor>>(
      endpoints.mentor.provision,
      payload
    );
    return res.data.data;
  },

  // Admin edits any mentor (the API's update guard is owner-OR-admin).
  update: async (id: string, patch: Partial<Mentor>): Promise<Mentor> => {
    const res = await axiosInstance.put<ApiEnvelope<Mentor>>(
      endpoints.mentor.byId(id),
      patch
    );
    return res.data.data;
  },

  // Approve or revoke a mentor. `approved` is admin-only server-side, so this
  // only takes effect for an admin caller.
  setApproved: async (id: string, approved: boolean): Promise<Mentor> => {
    const res = await axiosInstance.put<ApiEnvelope<Mentor>>(
      endpoints.mentor.byId(id),
      { approved }
    );
    return res.data.data;
  },

  remove: async (id: string): Promise<MentorDeletion> => {
    const res = await axiosInstance.delete<ApiEnvelope<MentorDeletion>>(
      endpoints.mentor.byId(id)
    );
    return res.data.data;
  },
};
