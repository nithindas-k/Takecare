import { randomInt } from 'crypto';

/**
 * Generates unique IDs with specific prefixes
 * - Doctors: DOCXXXXXX (6 digits)
 * - Patients: PATXXXXXX (6 digits)
 * - Slots: SLOXXXXXX (6 digits)
 * - Appointments: APPXXXXXX (6 digits)
 */

export enum IDPrefix {
  DOCTOR = 'DOC',
  PATIENT = 'PAT',
  SLOT = 'SLO',
  APPOINTMENT = 'APP'
}

export class IDGenerator {
  /**
   * Generate a 6-digit random number
   */
  private static generateSixDigitNumber(): string {
    return randomInt(100000, 999999).toString();
  }

  /**
   * Generate a unique doctor ID: DOCXXXXXX
   */
  static generateDoctorId(): string {
    return `${IDPrefix.DOCTOR}${this.generateSixDigitNumber()}`;
  }

  /**
   * Generate a unique patient ID: PATXXXXXX
   */
  static generatePatientId(): string {
    return `${IDPrefix.PATIENT}${this.generateSixDigitNumber()}`;
  }

  /**
   * Generate a unique slot ID: SLOXXXXXX
   */
  static generateSlotId(): string {
    return `${IDPrefix.SLOT}${this.generateSixDigitNumber()}`;
  }

  /**
   * Generate a unique appointment ID: APPXXXXXX
   */
  static generateAppointmentId(): string {
    return `${IDPrefix.APPOINTMENT}${this.generateSixDigitNumber()}`;
  }

  /**
   * Validate if an ID matches the expected format
   */
  static validateId(id: string, prefix: IDPrefix): boolean {
    const pattern = new RegExp(`^${prefix}\\d{6}$`);
    return pattern.test(id);
  }

  /**
   * Extract prefix from an ID
   */
  static extractPrefix(id: string): IDPrefix | null {
    if (id.startsWith(IDPrefix.DOCTOR)) return IDPrefix.DOCTOR;
    if (id.startsWith(IDPrefix.PATIENT)) return IDPrefix.PATIENT;
    if (id.startsWith(IDPrefix.SLOT)) return IDPrefix.SLOT;
    if (id.startsWith(IDPrefix.APPOINTMENT)) return IDPrefix.APPOINTMENT;
    return null;
  }
}
