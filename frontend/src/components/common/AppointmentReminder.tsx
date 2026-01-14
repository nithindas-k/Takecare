/* eslint-disable @typescript-eslint/no-explicit-any */

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
    const [reminderData, setReminderData] = useState<{ title: string; message: string; customId: string; id: string } | null>(null);

    const [nextAppointment, setNextAppointment] = useState<any>(null);


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

                        const today = new Date();
                        const todayStr = today.toDateString();

                        const todayAppointments = res.data.appointments.filter((appt: any) => {
                            const apptDate = new Date(appt.appointmentDate);
                            return apptDate.toDateString() === todayStr;
                        });

                        if (todayAppointments.length > 0) {
                            const now = new Date();


                            const parseTime = (timeStr: string) => {
                                const d = new Date(now);
                                const parts = timeStr.match(/(\d+):(\d+)\s?(AM|PM)?/i);
                                if (parts) {
                                    const [, hours, minutes, period] = parts;
                                    let h = parseInt(hours);
                                    const m = parseInt(minutes);
                                    if (period) {
                                        if (period.toUpperCase() === 'PM' && h < 12) h += 12;
                                        if (period.toUpperCase() === 'AM' && h === 12) h = 0;
                                    }
                                    d.setHours(h, m, 0, 0);
                                    return d;
                                }
                                return d;
                            };


                            todayAppointments.sort((a: any, b: any) => {
                                return parseTime(a.appointmentTime).getTime() - parseTime(b.appointmentTime).getTime();
                            });


                            const upcoming = todayAppointments.find((appt: any) => {
                                const start = parseTime(appt.appointmentTime);

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
        const interval = setInterval(fetchNextAppointment, 60000 * 5);
        return () => clearInterval(interval);

    }, [user]);


    const [reminderStatus, setReminderStatus] = useState({ early: false, started: false });


    useEffect(() => {
        if (!nextAppointment) return;

        const checkTime = () => {
            const { appointmentDate, appointmentTime, customId } = nextAppointment;

            console.log("Next Appointment Debug:", { appointmentDate, appointmentTime, customId });

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
                const [, hoursStr, minutesStr, period] = timeParts;
                let hours = parseInt(hoursStr);
                const minutes = parseInt(minutesStr);

                if (period) {
                    if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
                    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
                }

                const apptTime = new Date(now);
                apptTime.setHours(hours, minutes, 0, 0);

                const diffMs = now.getTime() - apptTime.getTime();
                const diffMins = diffMs / 60000;

                console.log("Time Check:", { now, apptTime, diffMins, reminderStatus });


                const earlyKey = `reminder_early_${nextAppointment.id || nextAppointment._id}`;
                const startedKey = `reminder_started_${nextAppointment.id || nextAppointment._id}`;

                if (diffMins >= -5 && diffMins < 0 && !reminderStatus.early) {
                    if (!sessionStorage.getItem(earlyKey)) {
                        console.log("Triggering Early Reminder");
                        setReminderData({
                            title: "Upcoming Appointment",
                            message: `Your appointment with ${otherPartyName} starts in ${Math.ceil(Math.abs(diffMins))} minutes.`,
                            customId,
                            id: nextAppointment.id || nextAppointment._id
                        });
                        setShowReminder(true);
                        setReminderStatus(prev => ({ ...prev, early: true }));
                        sessionStorage.setItem(earlyKey, 'true');
                    }
                }

                if (diffMins >= 0 && diffMins < 15 && !reminderStatus.started) {
                    if (!sessionStorage.getItem(startedKey)) {
                        console.log("Triggering Started Reminder");
                        setReminderData({
                            title: "Session Started",
                            message: `The scheduled time has been reached. Please join the consultation with ${otherPartyName} now.`,
                            customId,
                            id: nextAppointment.id || nextAppointment._id
                        });
                        setShowReminder(true);
                        setReminderStatus(prev => ({ ...prev, started: true }));
                        sessionStorage.setItem(startedKey, 'true');
                    }
                }
            } else {
                console.log("Time format regex failed for:", appointmentTime);
            }
        };

        const timer = setInterval(checkTime, 5000);
        checkTime();

        return () => clearInterval(timer);
    }, [nextAppointment, reminderStatus, user]);

    const handleJoin = () => {
        setShowReminder(false);
        if (reminderData?.id) {
            const baseUrl = user?.role === 'doctor' ? '/doctor/appointments' : '/patient/appointments';
            navigate(`${baseUrl}/${reminderData.id}`);
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

