import axiosInstance from "../api/axiosInstance";

export const specialtyService = {
  getAllSpecialties: async (page = 1, limit = 10, search?: string) => {
    const params: any = { page, limit };
    if (search) params.search = search;

    const response = await axiosInstance.get("/specialties", {
      params
    });
    return response.data;
  },

  getActiveSpecialties: async () => {
    const response = await axiosInstance.get("/specialties/active");
    return response.data;
  },

  getSpecialtyById: async (id: string) => {
    const response = await axiosInstance.get(`/specialties/${id}`);
    return response.data;
  },

  createSpecialty: async (data: { name: string; description?: string }) => {
    const response = await axiosInstance.post("/specialties", data);
    return response.data;
  },

  updateSpecialty: async (id: string, data: { name?: string; description?: string; isActive?: boolean }) => {
    const response = await axiosInstance.put(`/specialties/${id}`, data);
    return response.data;
  },

  deleteSpecialty: async (id: string) => {
    const response = await axiosInstance.delete(`/specialties/${id}`);
    return response.data;
  },

  toggleSpecialtyStatus: async (id: string) => {
    const response = await axiosInstance.patch(`/specialties/${id}/toggle`);
    return response.data;
  }
};
