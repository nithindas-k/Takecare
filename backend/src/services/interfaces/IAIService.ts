export interface IAIService {
  generateDoctorAbout(profileData: {
    name?: string;
    specialty?: string;
    experienceYears?: number;
    qualifications?: string[];
    languages?: string[];
    licenseNumber?: string;
  }): Promise<string>;
}

