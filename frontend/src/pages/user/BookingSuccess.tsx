import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { appointmentService } from '../../services/appointmentService';
import { API_BASE_URL } from '../../utils/constants';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { CheckCircle2, CalendarDays, ArrowRight, Home } from 'lucide-react';
import type { PopulatedAppointment } from '../../types/appointment.types';

const BookingSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState<PopulatedAppointment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const appointmentId = sessionStorage.getItem('appointmentId');
        const appointmentData = sessionStorage.getItem('appointmentData');

        if (appointmentData) {
            try {
                setAppointment(JSON.parse(appointmentData));
            } catch (error) {
                console.error('Failed to parse appointment data', error);
            }
        }

        if (appointmentId && !appointmentData) {
            fetchAppointment(appointmentId);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchAppointment = async (appointmentId: string) => {
        try {
            const response = await appointmentService.getAppointmentById(appointmentId);
            if (response && response.success && response.data) {
                setAppointment(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch appointment', error);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        // Handle time string like "09:00 - 10:00" or just "09:00"
        if (timeString.includes(' - ')) {
            return timeString;
        }
        return timeString;
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A1B0]"></div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="bg-gray-50 min-h-screen font-sans flex flex-col">
                <NavBar />
                <div className="flex-grow flex items-center justify-center py-16 px-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <CardTitle className="text-[#002f33]">Appointment Not Found</CardTitle>
                            <CardDescription>
                                We couldn't load your booking details. Please go back to home.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end">
                            <Button onClick={() => navigate('/')}>
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <Footer />
            </div>
        );
    }

    const doctor = (appointment.doctor || appointment.doctorId) as {
        name?: string;
        speciality?: string;
        specialty?: string;
        image?: string;
        profileImage?: string;
        userId?: { name?: string; profileImage?: string };
    } | undefined;
    const doctorName = doctor?.name || doctor?.userId?.name || 'Dr. Unknown';
    const doctorSpeciality = doctor?.speciality || doctor?.specialty || 'Doctor';
    const doctorImage = doctor?.image || doctor?.userId?.profileImage || doctor?.profileImage;

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex flex-col">
            <NavBar />

            <div className="flex-grow flex items-center justify-center py-16 px-4">
                <Card className="w-full max-w-2xl overflow-hidden">
                    <div className="h-1.5 w-full bg-[#00A1B0]" />
                    <CardHeader className="items-center text-center">
                        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#00A1B0]/10">
                            <CheckCircle2 className="h-7 w-7 text-[#00A1B0]" />
                        </div>
                        <CardTitle className="text-2xl text-[#00A1B0]">Appointment booked successfully</CardTitle>
                        <CardDescription>
                            Your booking is confirmed. You can view it in your appointments.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                <img
                                    src={getImageUrl(doctorImage)}
                                    alt={doctorName}
                                    className="h-12 w-12 rounded-full object-cover border border-gray-200"
                                    onError={(e) => (e.target as HTMLImageElement).src = '/doctor.png'}
                                />
                                <div>
                                    <div className="font-semibold text-[#002f33]">{doctorName}</div>
                                    <div className="text-sm text-gray-500">{doctorSpeciality}</div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-start gap-3">
                                <CalendarDays className="mt-0.5 h-5 w-5 text-[#00A1B0]" />
                                <div>
                                    <div className="font-medium text-gray-800">{formatDate(appointment.appointmentDate)}</div>
                                    <div className="text-sm text-gray-500">{formatTime(appointment.appointmentTime)}</div>
                                    {appointment.appointmentType && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            {appointment.appointmentType === 'video' ? 'Video Consultation' : 'Chat Consultation'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Button
                                onClick={() => navigate('/patient/appointments')}
                                className="w-full"
                            >
                                View Appointments
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={() => navigate('/')}
                                variant="outline"
                                className="w-full"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    );
};

export default BookingSuccess;
