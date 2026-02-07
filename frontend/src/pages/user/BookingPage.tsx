import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import doctorService from '../../services/doctorService';
import { toast } from 'sonner';
import type { DoctorResponseDTO } from '../../types/doctor.types';
import { SpinnerCustom } from '../../components/ui/spinner';

interface AvailableSlot {
    startTime: string;
    endTime: string;
    available: boolean;
    isAvailable?: boolean;
    bookedCount?: number;
    maxPatients?: number;
    slotId?: string;
    booked: boolean;
    customId?: string;
    _id?: string;
    id?: string;
}

const getSlotKey = (slot: AvailableSlot) => {
    return slot.slotId ?? `${slot.startTime}-${slot.endTime}`;
};

const BookingPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: doctorId } = useParams<{ id: string }>();
    const [startDate, setStartDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [doctor, setDoctor] = useState<DoctorResponseDTO | null>(null);

    const fetchDoctorDetails = useCallback(async () => {
        if (!doctorId) return;
        try {
            const response = await doctorService.getDoctorById(doctorId);
            if (response && response.success && response.data) {
                setDoctor(response.data);
            }
        } catch (e: unknown) {
            const error = e as { message?: string };
            console.error('Failed to fetch doctor details', error);
        }
    }, [doctorId]);

    const fetchAvailableSlots = useCallback(async () => {
        if (!doctorId || !selectedDay) return;
        setLoading(true);
        try {
            const year = selectedDay.getFullYear();
            const month = String(selectedDay.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDay.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const response = await doctorService.getAvailableSlots(doctorId, dateStr);
            if (response && response.success && response.data) {
                let normalizedSlots: AvailableSlot[] = Array.isArray(response.data)
                    ? response.data.map((slot: AvailableSlot) => ({
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        available: typeof slot.available === 'boolean'
                            ? slot.available
                            : Boolean(slot.isAvailable),
                        isAvailable: slot.isAvailable,
                        bookedCount: slot.bookedCount || 0,
                        maxPatients: slot.maxPatients || 1,
                        slotId: slot.slotId || slot.customId || slot._id || slot.id || `${slot.startTime}-${slot.endTime}`,
                        booked: slot.booked
                    }))
                    : [];

                const now = new Date();
                const isToday = selectedDay.toDateString() === now.toDateString();

                if (isToday) {
                    normalizedSlots = normalizedSlots.filter((slot) => {
                        const [hours, minutes] = slot.startTime.split(':').map(Number);
                        const slotDate = new Date();
                        slotDate.setHours(hours, minutes, 0, 0);
                        return slotDate > now;
                    });
                }

                setAvailableSlots(normalizedSlots);
            } else {
                setAvailableSlots([]);
            }
        } catch (e: unknown) {
            const error = e as { message?: string };
            console.error('Failed to fetch available slots', error);
            setAvailableSlots([]);
            toast.error(error.message || 'Failed to load available slots');
        } finally {
            setLoading(false);
        }
    }, [doctorId, selectedDay]);

    useEffect(() => {

        sessionStorage.removeItem('appointmentId');
        sessionStorage.removeItem('bookingData');
        sessionStorage.removeItem('tempAppointmentId');
        sessionStorage.removeItem('appointmentData');
    }, []);

    useEffect(() => {
        if (doctorId) {
            fetchDoctorDetails();
        }
    }, [doctorId, fetchDoctorDetails]);

    useEffect(() => {
        if (doctorId && selectedDay) {
            fetchAvailableSlots();
        }
    }, [doctorId, selectedDay, fetchAvailableSlots]);



    const formatDate = (date: Date) => {
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'long' }),
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: date
        };
    };


    const generateDays = (start: Date) => {
        const daysArr = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            daysArr.push(formatDate(d));
        }
        return daysArr;
    };

    const formatTimeTo12h = (timeStr: string) => {
        if (!timeStr) return 'N/A';
        return timeStr.split('-').map(part => {
            const [hours, minutes] = part.trim().split(':');
            let h = parseInt(hours);
            const m = minutes || '00';
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m} ${ampm}`;
        }).join(' - ');
    };

    const days = generateDays(startDate);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        if (!isNaN(newDate.getTime())) {
            setStartDate(newDate);
            setSelectedDay(newDate);
        }
    };

    const handleDaySelect = (day: Date) => {
        setSelectedDay(day);
        setSelectedSlot(null);
    };

    const handleSlotSelect = (slot: AvailableSlot) => {
        if (!slot.available) return;
        setSelectedSlot(slot);
    };

    const handleNext = () => {
        if (!selectedDay || !selectedSlot || !doctorId) {
            toast.error('Please select a date and time slot');
            return;
        }


        const bookingData = {
            doctorId,
            appointmentDate: selectedDay.toISOString(),
            appointmentTime: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
            slotId: selectedSlot.slotId,
            doctor: doctor,
        };
        sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
        navigate('/patient-details');
    };

    const groupSlotsByTime = (slots: AvailableSlot[]) => {
        const grouped: { [key: string]: AvailableSlot[] } = {};
        slots.forEach(slot => {
            const hour = parseInt(slot.startTime.split(':')[0]);
            let period = 'Evening';
            if (hour < 12) period = 'Morning';
            else if (hour < 17) period = 'Afternoon';

            if (!grouped[period]) grouped[period] = [];
            grouped[period].push(slot);
        });
        return grouped;
    };

    const groupedSlots = groupSlotsByTime(availableSlots);

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <NavBar />

            {/* Breadcrumb Section */}
            <div className="relative bg-gradient-to-r from-[#e0f7fa] to-[#f0f9ff] py-16">
                <div className="container mx-auto px-4 text-center relative z-10">
                    <nav className="flex justify-center items-center text-sm font-medium text-gray-500 mb-2">
                        <a href="/" className="hover:text-[#00A1B0]">Home</a>
                        <span className="mx-2">/</span>
                        <span className="text-[#00A1B0]">Doctors</span>
                    </nav>
                    <h1 className="text-4xl font-bold text-[#002f33]">Select Time Slot</h1>
                </div>
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-10 -left-10 w-64 h-64 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute top-10 right-10 w-96 h-96 bg-[#00A1B0]/5 rounded-full blur-3xl"></div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#00A1B0] transition-colors font-medium text-sm"
                    >
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Slot Selection */}
                    <div className="lg:col-span-2">
                        <h2 className="text-[#00A1B0] text-lg font-medium mb-6">Select Available Slots</h2>

                        {/* Date Picker */}
                        <div className="flex items-center gap-4 mb-8">
                            <label className="text-gray-400 text-sm">Choose Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="bg-white border border-gray-200 px-4 py-2 rounded-md text-gray-600 shadow-sm text-sm focus:outline-none focus:border-[#00A1B0] transition-colors cursor-pointer w-64 font-medium"
                                    onChange={handleDateChange}
                                    value={startDate.toISOString().split('T')[0]}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            {/* Days Header */}
                            <div className="border-b border-gray-100 pb-4 mb-6">
                                <div className="grid grid-cols-7 gap-2">
                                    {days.map((item, index) => {
                                        const isSelected = selectedDay?.toDateString() === item.fullDate.toDateString();
                                        return (
                                            <div
                                                key={index}
                                                className="cursor-pointer group text-center"
                                                onClick={() => handleDaySelect(item.fullDate)}
                                            >
                                                <h4 className={`font-bold text-sm mb-1 transition-colors ${isSelected ? 'text-[#00A1B0]' : 'text-gray-800 group-hover:text-[#00A1B0]'}`}>
                                                    {item.day.slice(0, 3)}
                                                </h4>
                                                <p className={`text-xs transition-colors ${isSelected ? 'text-[#00A1B0]' : 'text-gray-400 group-hover:text-[#00A1B0]'}`}>
                                                    {item.date}
                                                </p>
                                                <div className={`h-0.5 mx-auto mt-2 transition-all duration-300 ${isSelected ? 'w-8 bg-[#00A1B0]' : 'w-0 bg-[#00A1B0] group-hover:w-8'}`}></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Slots Grid */}
                            <div className="px-4">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <SpinnerCustom text="Finding best slots for you..." />
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No available slots for this date</p>
                                    </div>
                                ) : (
                                    Object.entries(groupedSlots).map(([period, slots]) => (
                                        <div key={period} className="mb-8 border-b border-gray-50 pb-6 last:border-0 last:pb-0 last:mb-0">
                                            <h4 className="text-[#002f33] font-semibold text-sm mb-4">{period}</h4>
                                            <div className="flex flex-wrap gap-4">
                                                {slots.map((slot) => {
                                                    const isSelected =
                                                        !!selectedSlot && getSlotKey(selectedSlot) === getSlotKey(slot);
                                                    const isFullyBooked = !slot?.available;

                                                    return (
                                                        <div key={getSlotKey(slot)} className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSlotSelect(slot)}
                                                                disabled={isFullyBooked}
                                                                className={`px-6 py-3 rounded-md text-xs font-medium transition-all w-32 ${isSelected
                                                                    ? 'bg-[#00A1B0] text-white shadow-md'
                                                                    : isFullyBooked
                                                                        ? 'bg-red-500 bg-opacity-30 text-red-600 cursor-not-allowed border border-red-300'
                                                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                                                                    }`}
                                                            >
                                                                {formatTimeTo12h(slot.startTime)} - {formatTimeTo12h(slot.endTime)}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Next Button */}
                        <div className="mt-6">
                            <button
                                onClick={handleNext}
                                disabled={!selectedDay || !selectedSlot}
                                className={`px-10 py-3 rounded-md font-bold text-sm shadow-md transition-transform transform active:scale-95 ${selectedDay && selectedSlot ? 'bg-[#00A1B0] hover:bg-[#008f9c] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Booking Summary */}
                    <div className="lg:col-span-1">
                        <h2 className="text-[#002f33] text-lg font-bold mb-6">Booking Summary</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            {doctor ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={doctor.image || '/doctor.png'}
                                            alt={doctor.name}
                                            className="w-12 h-12 rounded-full object-cover border border-gray-100"
                                            onError={(e) => (e.target as HTMLImageElement).src = '/doctor.png'}
                                        />
                                        <div>
                                            <h3 className="text-gray-800 font-bold text-sm">{doctor.name}</h3>
                                            <p className="text-gray-400 text-xs">{doctor.speciality || 'Doctor'}</p>
                                        </div>
                                    </div>
                                    <FaCheckCircle className="text-[#00A1B0] w-5 h-5" />
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Loading...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default BookingPage;
