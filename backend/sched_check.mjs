import { config } from "dotenv";
config();
import mongoose from "mongoose";
import { writeFileSync } from "fs";

const uri = process.env.MONGODB_URI || "";
await mongoose.connect(uri);
const db = mongoose.connection.db;

// Get all approved+active doctors
const doctors = await db.collection("doctors").find(
    { verificationStatus: "approved", isActive: true },
    { projection: { _id: 1, specialty: 1 } }
).toArray();

const lines = [];
lines.push(`Found ${doctors.length} approved+active doctors\n`);

for (const doc of doctors) {
    const sched = await db.collection("doctorschedules").findOne({ doctorId: doc._id });
    if (!sched) {
        lines.push(`[${doc.specialty}] _id:${doc._id}  → NO SCHEDULE`);
        continue;
    }
    const ws = sched.weeklySchedule || [];
    const freeSlots = [];
    for (const day of ws) {
        if (!day.enabled) continue;
        for (const slot of (day.slots || [])) {
            if (slot.enabled && !slot.booked) {
                freeSlots.push(`${day.day} ${slot.startTime}`);
            }
        }
    }
    lines.push(`[${doc.specialty}] _id:${doc._id}  schedActive:${sched.isActive}  freeSlots(${freeSlots.length}): ${freeSlots.slice(0, 3).join(', ') || 'NONE'}`);
}

await mongoose.disconnect();
writeFileSync("sched_check.log", lines.join("\n"), "utf8");
console.log("Done");
