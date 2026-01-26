import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import userService from '../../services/userService';
import { toast } from 'sonner';

const PatientDetails: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        phone: '',
        email: '',
        symptoms: '',
        reason: ''
    });
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState<any>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('bookingData');
        if (stored) {
            setBookingData(JSON.parse(stored));
        }

        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await userService.getProfile();
            if (response && response.success && response.data) {
                const user = response.data;
                setFormData({
                    firstName: user.name || '',
                    phone: user.phone || '',
                    email: user.email || '',
                    symptoms: '',
                    reason: ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch user profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNext = () => {
        if (!formData.firstName || !formData.phone || !formData.email || !formData.reason) {
            toast.error('Please fill in all required fields including Reason for Visit');
            return;
        }

        // Update booking data with patient details
        const updatedBooking = {
            ...bookingData,
            patientDetails: formData
        };
        sessionStorage.setItem('bookingData', JSON.stringify(updatedBooking));
        navigate('/consultation-type');
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A1B0]"></div>
            </div>
        );
    }

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
                    <h1 className="text-4xl font-bold text-[#002f33]">Patient Details</h1>
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
                        className="flex items-center gap-2 text-gray-400 hover:text-[#00A1B0] transition-colors text-sm"
                    >
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Patient Details Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <form>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* First Name */}
                                    <div>
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">First Name *</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:border-[#008f9c] focus:ring-1 focus:ring-[#008f9c] transition-colors bg-white hover:border-gray-400"
                                            required
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:border-[#008f9c] focus:ring-1 focus:ring-[#008f9c] transition-colors bg-white hover:border-gray-400"
                                            required
                                        />
                                    </div>

                                    {/* Email Address */}
                                    <div>
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:border-[#008f9c] focus:ring-1 focus:ring-[#008f9c] transition-colors bg-white hover:border-gray-400"
                                            required
                                        />
                                    </div>

                                    {/* Symptoms */}
                                    <div>
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Symptoms</label>
                                        <input
                                            type="text"
                                            name="symptoms"
                                            value={formData.symptoms}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:border-[#008f9c] focus:ring-1 focus:ring-[#008f9c] transition-colors bg-white hover:border-gray-400"
                                        />
                                    </div>
                                </div>

                                {/* Reason for Visit */}
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Reason for Visit *</label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:border-[#008f9c] focus:ring-1 focus:ring-[#008f9c] transition-colors bg-white hover:border-gray-400 resize-none"
                                        required
                                    ></textarea>
                                </div>
                            </form>
                        </div>

                        {/* Next Button */}
                        <div className="mt-6">
                            <button
                                onClick={handleNext}
                                className="bg-[#008f9c] hover:bg-[#007f8c] text-white px-8 py-3 rounded-md font-medium text-sm transition-colors shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Booking Summary */}
                    <div className="lg:col-span-1">
                        <h2 className="text-[#002f33] text-lg font-bold mb-4">Booking Summary</h2>

                        {/* Doctor Card */}
                        {bookingData?.doctor && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100">
                                            <img
                                                src={bookingData.doctor.image || '/doctor.png'}
                                                alt={bookingData.doctor.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.target as HTMLImageElement).src = '/doctor.png'}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-gray-800 font-bold text-sm">{bookingData.doctor.name}</h3>
                                            <p className="text-gray-500 text-xs">{bookingData.doctor.speciality || 'Doctor'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-teal-50 rounded-full p-1">
                                        <FaCheckCircle className="text-[#008f9c] w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Date & Time Card */}
                        {bookingData && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Booking Date:</span>
                                        <span className="text-gray-500">
                                            {new Date(bookingData.appointmentDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Booking Time:</span>
                                        <span className="text-gray-500">{bookingData.appointmentTime}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PatientDetails;
