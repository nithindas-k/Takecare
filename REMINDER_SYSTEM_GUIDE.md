# Server-Driven Appointment Reminders - Implementation Guide

## Problem Solved
Device time differences between doctor and patient caused reminder modals and join buttons to appear at different times or not at all. This solution uses **server-driven events** via Socket.io to bypass device clocks entirely.

---

## How It Works

### Backend (Already Implemented)
1. **CRON Job** runs every minute checking appointments
2. When it detects **5 minutes before** appointment → Emits `appointment-reminder-5min` socket event
3. When it detects **appointment start time** → Emits `appointment-ready` socket event
4. Both events are sent directly to patient and doctor via their user IDs

### Frontend (Use These)
1. **useAppointmentReminders** hook listens for socket events
2. **ReminderModal** component shows when triggered by server
3. **timeSync** utility provides server-synced time for countdowns

---

## Usage Example

### In Your Appointment List Page (Doctor/Patient Dashboard)

```typescript
import React from 'react';
import { useAppointmentReminders } from '../hooks/useAppointmentReminders';
import { ReminderModal } from '../components/ReminderModal';

export const AppointmentDashboard = () => {
    const { 
        show5MinReminder, 
        showJoinButton, 
        reminderData, 
        dismiss5MinReminder 
    } = useAppointmentReminders();

    return (
        <div>
            {/* Your existing appointment list */}
            <AppointmentList />

            {/* Reminder Modal - Shows automatically when server triggers */}
            {show5MinReminder && reminderData && (
                <ReminderModal
                    isOpen={show5MinReminder}
                    onClose={dismiss5MinReminder}
                    appointmentId={reminderData.appointmentId}
                    customId={reminderData.customId}
                    appointmentTime={reminderData.appointmentTime}
                    appointmentType={reminderData.appointmentType}
                    minutesUntilStart={reminderData.minutesUntilStart}
                />
            )}

            {/* Join Button - Shows when server says appointment is ready */}
            {showJoinButton && reminderData && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button 
                        onClick={() => navigate(`/consultation/${reminderData.appointmentType}/${reminderData.appointmentId}`)}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse"
                    >
                        🎯 Join Appointment #{reminderData.customId} Now!
                    </button>
                </div>
            )}
        </div>
    );
};
```

---

## Using Time Sync for Countdowns

If you want to show a countdown timer that's synced with server time:

```typescript
import { timeSync } from '../utils/timeSync';
import { useState, useEffect } from 'react';

export const AppointmentCard = ({ appointment }) => {
    const [minutesUntil, setMinutesUntil] = useState(0);

    useEffect(() => {
        const updateCountdown = () => {
            const mins = timeSync.getMinutesUntilAppointment(
                appointment.appointmentDate,
                appointment.appointmentTime
            );
            setMinutesUntil(mins);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [appointment]);

    return (
        <div>
            <h3>Appointment #{appointment.customId}</h3>
            <p>Starts in: {minutesUntil} minutes</p>
            
            {/* This countdown is perfectly synced with server time */}
        </div>
    );
};
```

---

## Key Benefits

✅ **No Device Time Issues**: Server controls when modals appear  
✅ **Synchronized Experience**: Doctor and patient see reminders at the exact same time  
✅ **Reliable**: Works even if device clock is wrong  
✅ **Real-time**: Uses Socket.io for instant delivery  
✅ **Persistent**: If user refreshes, `startNotificationSent` flag in DB keeps join button visible  

---

## Testing

1. **Create an appointment** 6 minutes in the future
2. **Wait for 5-minute mark** → Both users should see reminder modal instantly
3. **Wait for start time** → Both users should see "Join Now" button instantly
4. **Change device time** → Reminders still work correctly (server-driven)

---

## API Endpoints Added

### GET /api/time/server
Returns current server time for synchronization

**Response:**
```json
{
  "success": true,
  "data": {
    "serverTime": "2026-02-06T07:11:43.000Z",
    "timestamp": 1770299503000,
    "timezone": "Asia/Kolkata"
  }
}
```

---

## Socket Events

### Listening (Frontend)
- `appointment-reminder-5min` - Triggered 5 minutes before appointment
- `appointment-ready` - Triggered when appointment starts

### Payload Structure
```typescript
{
    appointmentId: string;
    customId: string;
    appointmentTime: string;
    appointmentDate: string;
    minutesUntilStart?: number;
    type: '5min_reminder' | 'appointment_ready';
    appointmentType?: 'video' | 'chat';
    isLive?: boolean;
}
```

---

## Files Created

### Backend
- `controllers/time.controller.ts` - Server time API
- `routers/time.router.ts` - Time endpoint route
- Updated `appointmentReminder.service.ts` - Added socket emissions

### Frontend
- `utils/timeSync.ts` - Time synchronization utility
- `hooks/useAppointmentReminders.ts` - Reminder hook
- `components/ReminderModal.tsx` - Reminder modal UI

---

## Next Steps

1. Import `useAppointmentReminders` in your appointment dashboard pages
2. Add `<ReminderModal>` component to show reminders
3. Optionally use `timeSync` for countdown timers
4. Test with appointments at different times

**That's it! Your reminder system is now server-driven and device-time-proof!** 🎉
