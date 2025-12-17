import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft, FaCheck, FaVideo, FaComments } from 'react-icons/fa';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';

const ConsultationType: React.FC = () => {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState<'video' | 'chat'>('video');
    const [bookingData, setBookingData] = useState<any>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('bookingData');
        if (stored) {
            setBookingData(JSON.parse(stored));
        } else {
            // If no booking data, redirect to home
            navigate('/');
        }
    }, [navigate]);

    const handleNext = () => {
        if (!bookingData) {
            navigate('/');
            return;
        }

        // Update booking data with consultation type
        const updatedBooking = {
            ...bookingData,
            appointmentType: selectedType
        };
        sessionStorage.setItem('bookingData', JSON.stringify(updatedBooking));
        navigate('/payment');
    };

    if (!bookingData) {
        return null;
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
                    <h1 className="text-4xl font-bold text-[#002f33]">Type of Consultation</h1>
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
                    {/* Left Column - Consultation Options */}
                    <div className="lg:col-span-2">
                        <h2 className="text-[#002f33] text-2xl font-bold mb-6">Type of Consultation</h2>

                        <div className="mb-8">
                            <h3 className="text-gray-800 font-medium mb-4">Online Consultation</h3>

                            <div className="space-y-4 max-w-md">
                                {/* Video Consulting Option */}
                                <div
                                    className={`relative flex items-center justify-between p-4 rounded-md border cursor-pointer transition-all ${selectedType === 'video' ? 'bg-white border-[#00A1B0] shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => setSelectedType('video')}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${selectedType === 'video' ? 'bg-[#e0f7fa] text-[#00A1B0]' : 'bg-gray-100 text-gray-500'}`}>
                                            <FaVideo className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${selectedType === 'video' ? 'text-[#00A1B0]' : 'text-gray-600'}`}>
                                                Video Consulting
                                            </span>
                                            {bookingData?.doctor && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    ₹{bookingData.doctor.videoFees || bookingData.doctor.fees || 0}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {selectedType === 'video' && (
                                        <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                                            <div className="bg-[#00A1B0] rounded-full p-1">
                                                <FaCheck className="text-white w-3 h-3" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Chat Consulting Option */}
                                <div
                                    className={`relative flex items-center justify-between p-4 rounded-md border cursor-pointer transition-all ${selectedType === 'chat' ? 'bg-white border-[#00A1B0] shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => setSelectedType('chat')}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${selectedType === 'chat' ? 'bg-[#e0f7fa] text-[#00A1B0]' : 'bg-gray-100 text-gray-500'}`}>
                                            <FaComments className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${selectedType === 'chat' ? 'text-[#00A1B0]' : 'text-gray-600'}`}>
                                                Chat Consulting
                                            </span>
                                            {bookingData?.doctor && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    ₹{bookingData.doctor.chatFees || bookingData.doctor.fees || 0}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {selectedType === 'chat' && (
                                        <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                                            <div className="bg-[#00A1B0] rounded-full p-1">
                                                <FaCheck className="text-white w-3 h-3" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Next Button */}
                        <div className="mt-8">
                            <button
                                onClick={handleNext}
                                className="bg-[#00A1B0] hover:bg-[#008f9c] text-white px-10 py-3 rounded-md font-bold text-sm shadow-md transition-transform transform active:scale-95"
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

export default ConsultationType;
