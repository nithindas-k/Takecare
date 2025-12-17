import { LoggerService } from "./logger.service";
import type { IAIService } from "./interfaces/IAIService";

export class AIService implements IAIService {
  private readonly logger: LoggerService;

  constructor() {
    this.logger = new LoggerService("AIService");
  }

  async generateDoctorAbout(profileData: {
    name?: string;
    specialty?: string;
    experienceYears?: number;
    qualifications?: string[];
    languages?: string[];
    licenseNumber?: string;
  }): Promise<string> {
    this.logger.debug("AI generation disabled; using local template", {
      hasName: Boolean(profileData.name),
      hasSpecialty: Boolean(profileData.specialty),
    });

    return this.generateDefaultAbout(profileData);
  }

  private generateDefaultAbout(profileData: {
    name?: string;
    specialty?: string;
    experienceYears?: number;
    qualifications?: string[];
    languages?: string[];
  }): string {
    const parts: string[] = [];

    if (profileData.name) {
      parts.push(`${profileData.name}`);
    }

    if (profileData.specialty) {
      parts.push(`specialized in ${profileData.specialty}`);
    }

    if (profileData.experienceYears) {
      parts.push(`with ${profileData.experienceYears} years of experience`);
    }

    if (profileData.qualifications && profileData.qualifications.length > 0) {
      parts.push(`holding ${profileData.qualifications.join(", ")}`);
    }

    if (profileData.languages && profileData.languages.length > 0) {
      parts.push(`fluent in ${profileData.languages.join(", ")}`);
    }

    const baseText = parts.length > 0
      ? `Dedicated medical professional ${parts.join(", ")}. Committed to providing compassionate and high-quality patient care.`
      : "Dedicated medical professional committed to providing compassionate and high-quality patient care.";

    return baseText;
  }
}

