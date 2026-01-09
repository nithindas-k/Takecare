export interface Specialty {
  _id: any;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SpecialtyListResponse {
  specialties: Specialty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSpecialtyDTO {
  name: string;
  description?: string;
}

export interface UpdateSpecialtyDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}
