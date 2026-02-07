
import axiosInstance from "../api/axiosInstance";
import { SPECIALTY_API_ROUTES } from "../utils/constants";

export const specialtyService = {
  getAllSpecialties: async (page = 1, limit = 10, search?: string) => {
    const params: Record<string, unknown> = { page, limit };
    if (search) params.search = search;

    const response = await axiosInstance.get(SPECIALTY_API_ROUTES.LIST, {
      params
    });
    return response.data;
  },

  getActiveSpecialties: async () => {
    const response = await axiosInstance.get(SPECIALTY_API_ROUTES.ACTIVE);
    return response.data;
  },

  getSpecialtyById: async (id: string) => {
    const response = await axiosInstance.get(SPECIALTY_API_ROUTES.GET_BY_ID(id));
    return response.data;
  },

  createSpecialty: async (data: { name: string; description?: string }) => {
    const response = await axiosInstance.post(SPECIALTY_API_ROUTES.CREATE, data);
    return response.data;
  },

  updateSpecialty: async (id: string, data: { name?: string; description?: string; isActive?: boolean }) => {
    const response = await axiosInstance.put(SPECIALTY_API_ROUTES.UPDATE(id), data);
    return response.data;
  },

  deleteSpecialty: async (id: string) => {
    const response = await axiosInstance.delete(SPECIALTY_API_ROUTES.DELETE(id));
    return response.data;
  },

  toggleSpecialtyStatus: async (id: string) => {
    const response = await axiosInstance.patch(SPECIALTY_API_ROUTES.TOGGLE(id));
    return response.data;
  }
};

