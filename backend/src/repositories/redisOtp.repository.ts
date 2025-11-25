// src/repositories/redisOtp.repository.ts
import redis from "../configs/redis"; // adjust path if needed
import { OTPUserData } from "../services/interfaces/IOtpService"; // keep types in sync

export type RedisOtpRecord = {
  otp: string;
  userData: OTPUserData;
  createdAt: string; // ISO
};

const KEY_PREFIX = "otp:";
const COOLDOWN_PREFIX = "otp_cd:"; // resend cooldown key

export class RedisOtpRepository {
  // store TTL in seconds
  async create(email: string, otp: string, userData: OTPUserData, ttlSeconds: number) {
    const key = KEY_PREFIX + email;
    const payload: RedisOtpRecord = { otp, userData, createdAt: new Date().toISOString() };
    // store JSON string with expiration
    await redis.set(key, JSON.stringify(payload), { EX: ttlSeconds });
    // set the resend cooldown key for 60s so front-end won't spam resend
    await redis.set(COOLDOWN_PREFIX + email, "1", { EX: 60 });
    return payload;
  }

  async get(email: string): Promise<RedisOtpRecord | null> {
    const key = KEY_PREFIX + email;
    const raw = await redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RedisOtpRecord;
    } catch {
      return null;
    }
  }

  async verifyAndDelete(email: string, otp: string): Promise<RedisOtpRecord | null> {
    const key = KEY_PREFIX + email;
    const rec = await this.get(email);
    if (!rec) return null;
    if (rec.otp !== otp) return null;
    // remove key after successful verification
    await redis.del(key);
    // remove cooldown key as well
    await redis.del(COOLDOWN_PREFIX + email);
    return rec;
  }

  async exists(email: string): Promise<boolean> {
    const key = KEY_PREFIX + email;
    const val = await redis.exists(key);
    return val === 1;
  }

  async delete(email: string): Promise<void> {
    await redis.del(KEY_PREFIX + email);
    await redis.del(COOLDOWN_PREFIX + email);
  }

  // returns cooldown seconds left (0 if none). Useful for frontend
  async getCooldownSeconds(email: string): Promise<number> {
    const key = COOLDOWN_PREFIX + email;
    const ttl = await redis.ttl(key); // -2 if key doesn't exist, -1 if no expire
    if (ttl < 0) return 0;
    return ttl;
  }

  // update OTP (for resend): sets new OTP and resets TTL and cooldown
  async updateOtp(email: string, otp: string, ttlSeconds: number) {
    return this.create(email, otp, (await this.get(email))?.userData || { name: "", email }, ttlSeconds);
  }
}
