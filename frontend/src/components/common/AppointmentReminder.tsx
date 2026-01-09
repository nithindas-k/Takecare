
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../redux/user/userSlice';
import doctorService from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import ReminderModal from './ReminderModal';
import { startOfDay, endOfDay } from 'date-fns';

const AppointmentReminder: React.FC = () => {
    const user = useSelector(selectCurrentUser);
    const navigate = useNavigate();
    const [showReminder, setShowReminder] = useState(false);
    const [reminderData, setReminderData] = useState<{ title: string; message: string; customId: string } | null>(null);

    const [nextAppointment, setNextAppointment] = useState<any>(null);

    // Fetch next appointment logic
    useEffect(() => {
        if (!user || user.role === 'admin') return;

        const fetchNextAppointment = async () => {
            try {
                if (user.role === 'doctor') {
                    const today = new Date();
                    const start = startOfDay(today).toISOString();
                    const end = endOfDay(today).toISOString();
                    const res = await doctorService.getDashboardStats(start, end);
                    if (res?.success && res?.data?.nextAppointment) {
                        setNextAppointment(res.data.nextAppointment);
                    }
                } else if (user.role === 'patient') {
                    const res = await appointmentService.getMyAppointments('scheduled', 1, 20);
                    if (res?.data?.appointments) {
                        // Find the closest upcoming appointment for today
                        const today = new Date();
                        const todayStr = today.toDateString();

                        // Filter for today's appointments
                        const todayAppointments = res.data.appointments.filter((appt: any) => {
                            const apptDate = new Date(appt.appointmentDate);
                            return apptDate.toDateString() === todayStr;
                        });

                        if (todayAppointments.length > 0) {
                            const now = new Date();

                            // Helper to parse time string to Date object for today
                            const parseTime = (timeStr: string) => {
                                const d = new Date(now);
                                const parts = timeStr.match(/(\d+):(\d+)\s?(AM|PM)?/i);
                                if (parts) {
                                    let [_, hours, minutes, period] = parts;
                                    let h = parseInt(hours);
                                    let m = parseInt(minutes);
                                    if (period) {
                                        if (period.toUpperCase() === 'PM' && h < 12) h += 12;
                                        if (period.toUpperCase() === 'AM' && h === 12) h = 0;
                                    }
                                    d.setHours(h, m, 0, 0);
                                    return d;
                                }
                                return d; // Fallback
                            };

                            // Sort by time
                            todayAppointments.sort((a: any, b: any) => {
                                return parseTime(a.appointmentTime).getTime() - parseTime(b.appointmentTime).getTime();
                            });

                            // Find the first appointment that hasn't "finished" (start time + 15 mins > now)
                            // We want to trigger if we are in the window or before it.
                            const upcoming = todayAppointments.find((appt: any) => {
                                const start = parseTime(appt.appointmentTime);
                                // If now is before start (diff negative) -> valid upcoming
                                // If now is just after start (within 15 mins) -> valid active
                                // If now is > 15 mins after start -> passed, skip.
                                const diffMs = now.getTime() - start.getTime();
                                const diffMins = diffMs / 60000;
                                return diffMins < 15;
                            });

                            if (upcoming) {
                                console.log("Selected upcoming appointment:", upcoming);
                                setNextAppointment(upcoming);
                            } else {
                                console.log("No upcoming appointments found for today (all passed).");
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch next appointment for reminder", error);
            }
        };

        fetchNextAppointment();
        // Poll every minute for new appointments? Or just once on mount/user change.
        // Once is probably fine for "next appointment" usually.
        // But if I want to catch one scheduled *now*, polling is better.
        const interval = setInterval(fetchNextAppointment, 60000 * 5); // Every 5 mins
        return () => clearInterval(interval);

    }, [user]);


    const [reminderStatus, setReminderStatus] = useState({ early: false, started: false });

    // Check time logic
    useEffect(() => {
        if (!nextAppointment) return;

        const checkTime = () => {
            const { appointmentDate, appointmentTime, customId } = nextAppointment;

            console.log("Next Appointment Debug:", { appointmentDate, appointmentTime, customId });

            // Determine the name to show
            let otherPartyName = 'Patient';
            if (user?.role === 'patient') {
                otherPartyName = nextAppointment.doctorId?.name || 'Doctor';
            } else {
                otherPartyName = nextAppointment.patientId?.name || 'Patient';
            }

            const now = new Date();
            const apptDate = new Date(appointmentDate);

            console.log("Date Check:", { now: now.toDateString(), appt: apptDate.toDateString() });

            if (now.toDateString() !== apptDate.toDateString()) return;

            const timeParts = appointmentTime.match(/(\d+):(\d+)\s?(AM|PM)?/i);
            if (timeParts) {
                let [_, hours, minutes, period] = timeParts;
                hours = parseInt(hours);
                minutes = parseInt(minutes);

                if (period) {
                    if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
                    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
                }

                const apptTime = new Date(now);
                apptTime.setHours(hours, minutes, 0, 0);

                // Trigger if time is reached
                const diffMs = now.getTime() - apptTime.getTime();
                const diffMins = diffMs / 60000;

                console.log("Time Check:", { now, apptTime, diffMins, reminderStatus });

                // Phase 1: Early Reminder (-5 to 0 mins)
                if (diffMins >= -5 && diffMins < 0 && !reminderStatus.early) {
                    console.log("Triggering Early Reminder");
                    setReminderData({
                        title: "Upcoming Appointment",
                        message: `Your appointment with ${otherPartyName} starts in ${Math.ceil(Math.abs(diffMins))} minutes.`,
                        customId
                    });
                    setShowReminder(true);
                    setReminderStatus(prev => ({ ...prev, early: true }));
                }

                // Phase 2: Started Reminder (0 to 15 mins)
                // We check !reminderStatus.started to ensure we trigger this phase once the time flips to 0 or greater.
                // This will trigger even if 'early' was true, essentially "updating" the modal or re-opening it.
                if (diffMins >= 0 && diffMins < 15 && !reminderStatus.started) {
                    console.log("Triggering Started Reminder");
                    setReminderData({
                        title: "Session Started",
                        message: `The scheduled time has been reached. Please join the consultation with ${otherPartyName} now.`,
                        customId
                    });
                    setShowReminder(true);
                    setReminderStatus(prev => ({ ...prev, started: true }));
                }
            } else {
                console.log("Time format regex failed for:", appointmentTime);
            }
        };

        const timer = setInterval(checkTime, 5000); // Check every 5 seconds for better real-time feel
        checkTime();

        return () => clearInterval(timer);
    }, [nextAppointment, reminderStatus, user]);

    // Handle Join Action
    const handleJoin = () => {
        setShowReminder(false);
        if (reminderData?.customId) {
            // Determine URL based on role
            // Doctor: /doctor/consultation/video/:id
            // Patient: /patient/call/:id   (from App.tsx: <Route path="call/:id" element={<VideoCallPage />} />)

            const baseUrl = user?.role === 'doctor' ? '/doctor/consultation/video' : '/patient/call';
            navigate(`${baseUrl}/${reminderData.customId}`);
        }
    };

    if (!showReminder) return null;

    return (
        <ReminderModal
            isOpen={showReminder}
            onClose={() => setShowReminder(false)}
            data={reminderData}
            onAction={handleJoin}
        />
    );
};

export default AppointmentReminder;
