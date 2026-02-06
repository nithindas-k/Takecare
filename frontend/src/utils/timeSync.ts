import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Time synchronization utility
 * Calculates offset between client and server time
 */
class TimeSync {
    private offset: number = 0;
    private lastSyncTime: number = 0;
    private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

    /**
     * Sync with server time
     * Call this once when app loads and periodically
     */
    async sync(): Promise<void> {
        try {
            const clientRequestTime = Date.now();
            const response = await axios.get(`${API_BASE_URL}/api/time/server`);
            const clientReceiveTime = Date.now();

            const serverTime = response.data.data.timestamp;
            const roundTripTime = clientReceiveTime - clientRequestTime;
            const estimatedServerTime = serverTime + (roundTripTime / 2);

            // Calculate offset: positive means client is ahead, negative means behind
            this.offset = clientReceiveTime - estimatedServerTime;
            this.lastSyncTime = Date.now();

            console.log('[TimeSync] Synced with server', {
                offset: this.offset,
                offsetMinutes: (this.offset / 1000 / 60).toFixed(2),
                clientTime: new Date(clientReceiveTime).toLocaleString(),
                serverTime: new Date(estimatedServerTime).toLocaleString()
            });
        } catch (error) {
            console.error('[TimeSync] Failed to sync with server:', error);
        }
    }

    /**
     * Get current server time (adjusted for offset)
     */
    getServerTime(): Date {
        return new Date(Date.now() - this.offset);
    }

    /**
     * Get server timestamp
     */
    getServerTimestamp(): number {
        return Date.now() - this.offset;
    }

    /**
     * Check if sync is needed
     */
    needsSync(): boolean {
        return Date.now() - this.lastSyncTime > this.SYNC_INTERVAL;
    }

    /**
     * Get offset in milliseconds
     */
    getOffset(): number {
        return this.offset;
    }

    /**
     * Calculate minutes until appointment start (using server time)
     */
    getMinutesUntilAppointment(appointmentDate: string | Date, appointmentTime: string): number {
        const serverNow = this.getServerTime();

        // Parse appointment time (format: "14:00 - 14:30")
        const startTimeStr = appointmentTime.split('-')[0].trim();
        const [hours, minutes] = startTimeStr.split(':').map(Number);

        const appointmentDateTime = new Date(appointmentDate);
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        const diffMs = appointmentDateTime.getTime() - serverNow.getTime();
        return Math.floor(diffMs / 1000 / 60);
    }

    /**
     * Check if appointment is ready to join (within 0-2 minutes of start time)
     */
    isAppointmentReady(appointmentDate: string | Date, appointmentTime: string): boolean {
        const minutesUntil = this.getMinutesUntilAppointment(appointmentDate, appointmentTime);
        return minutesUntil <= 0 && minutesUntil >= -2;
    }

    /**
     * Check if 5-minute reminder should show
     */
    shouldShow5MinReminder(appointmentDate: string | Date, appointmentTime: string): boolean {
        const minutesUntil = this.getMinutesUntilAppointment(appointmentDate, appointmentTime);
        return minutesUntil > 4 && minutesUntil <= 6;
    }
}

// Export singleton instance
export const timeSync = new TimeSync();

// Auto-sync on import
timeSync.sync();

// Auto-sync every 5 minutes
setInterval(() => {
    if (timeSync.needsSync()) {
        timeSync.sync();
    }
}, 60000); // Check every minute
