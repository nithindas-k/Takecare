import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { FaStar, FaHeart, FaMapMarkerAlt, FaCircle, FaStethoscope, FaArrowLeft, FaTrash } from 'react-icons/fa';
import userService from '../../services/userService';
import { API_BASE_URL } from '../../utils/constants';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';

const FavoriteDoctors: React.FC = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const response = await userService.getFavorites();
            if (response.success && Array.isArray(response.data)) {
                // Map the populated favorites
                const mappedDoctors = response.data.map((fav: any) => ({
                    id: fav._id || fav.id,
                    name: fav.userId?.name || "Unknown Doctor",
                    image: fav.userId?.profileImage || null,
                    speciality: fav.speciality || fav.specialty || "Specialist",
                    rating: fav.ratingAvg || fav.rating || 0,
                    experience: fav.experienceYears || fav.experience || 0,
                    location: fav.location || "Online",
                    fees: fav.VideoFees || fav.videoFees || fav.fees || 0,
                    available: fav.isActive || fav.available || false
                }));
                setDoctors(mappedDoctors);
            } else {
                setDoctors([]);
            }
        } catch (error) {
            console.error("Failed to fetch favorites", error);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const handleToggleFavorite = async (e: React.MouseEvent, doctorId: string) => {
        e.stopPropagation();
        try {
            const response = await userService.toggleFavorite(doctorId);
            if (response.success) {
                setDoctors(prev => prev.filter(doc => doc.id !== doctorId));
                toast.success("Removed from favorites");
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const getImageUrl = (imagePath: string | null) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans overflow-x-hidden">
            <NavBar />

            <div className="relative pt-32 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 -z-20"></div>
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-100/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-500 text-xs font-bold hover:text-cyan-600 transition-all border border-slate-100 shadow-sm mb-8 group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
                    </button>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-600 text-[10px] font-black tracking-[0.2em] uppercase mb-6 border border-cyan-100 shadow-sm">
                        <FaHeart className="w-3 h-3 text-cyan-500" />
                        Preferred Care
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
                        Your Favorite <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-500">Specialists.</span>
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-32">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-3 md:p-4 space-y-4">
                                <Skeleton className="h-40 md:h-64 w-full rounded-lg" />
                                <div className="space-y-3">
                                    <Skeleton className="h-3 w-1/3" />
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : doctors.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {doctors.map((doctor) => (
                            <div key={doctor.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group relative">
                                <div className="relative h-40 md:h-64 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => navigate(`/doctors/${doctor.id}`)}>
                                    <img
                                        src={getImageUrl(doctor.image)}
                                        alt={doctor.name}
                                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/doctor.png';
                                        }}
                                    />
                                    <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#00A1B0] text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg flex items-center gap-1 shadow-sm backdrop-blur-sm bg-opacity-90">
                                        <FaStar className="text-yellow-300" /> {doctor.rating}
                                    </div>
                                    <button
                                        className="absolute top-2 right-2 md:top-3 md:right-3 bg-white text-slate-400 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                        onClick={(e) => handleToggleFavorite(e, doctor.id)}
                                        title="Remove from favorites"
                                    >
                                        <FaTrash className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" />
                                    </button>
                                </div>

                                <div className="p-3 md:p-5">
                                    <div className="flex justify-between items-center mb-1 md:mb-2">
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-cyan-600 bg-cyan-50 px-1.5 md:px-2 py-0.5 rounded-md">
                                            {doctor.speciality}
                                        </span>
                                        {doctor.available ? (
                                            <span className="text-[8px] md:text-[9px] font-bold text-green-600 bg-green-50 px-1.5 md:px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1 md:gap-1.5">
                                                <FaCircle className="w-1 md:w-1.5 h-1 md:h-1.5 animate-pulse" /> <span className="hidden xs:inline">Available</span>
                                            </span>
                                        ) : (
                                            <span className="text-[8px] md:text-[9px] font-bold text-red-500 bg-red-50 px-1.5 md:px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1 md:gap-1.5">
                                                <FaCircle className="w-1 md:w-1.5 h-1 md:h-1.5" /> <span className="hidden xs:inline">Offline</span>
                                            </span>
                                        )}
                                    </div>

                                    <h3
                                        className="text-xs md:text-lg font-bold text-slate-800 mb-1 md:mb-2 group-hover:text-cyan-600 transition-colors cursor-pointer truncate"
                                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                                    >
                                        {doctor.name}
                                    </h3>

                                    <div className="flex items-center gap-2 md:gap-4 text-[9px] md:text-xs text-slate-500 mb-3 md:mb-6">
                                        <div className="flex items-center gap-1 md:gap-1.5 font-medium truncate">
                                            <FaMapMarkerAlt className="text-slate-300 shrink-0" /> {doctor.location}
                                        </div>
                                        <div className="flex items-center gap-1 md:gap-1.5 font-medium shrink-0">
                                            <FaStethoscope className="text-slate-300 shrink-0" /> {doctor.experience} Yrs
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 md:pt-4 border-t border-slate-50 gap-2 md:gap-0">
                                        <div>
                                            <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0 md:mb-0.5">Fees</p>
                                            <p className="text-cyan-600 font-black text-sm md:text-xl tracking-tighter">₹{doctor.fees}</p>
                                        </div>
                                        <button
                                            className="bg-slate-900 text-white hover:bg-cyan-600 px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all shadow-lg shadow-slate-200 active:scale-95"
                                            onClick={() => navigate(`/doctors/${doctor.id}`)}
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] p-20 text-center shadow-2xl shadow-slate-200/50 border border-slate-100 max-w-2xl mx-auto">
                        <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <FaHeart className="w-12 h-12 text-cyan-200" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4">No Favorites Yet</h2>
                        <p className="text-slate-500 mb-10 text-lg font-medium leading-relaxed">
                            Discover top-rated doctors and save them <br />
                            to your favorites for quick access.
                        </p>
                        <button
                            onClick={() => navigate('/doctors')}
                            className="bg-cyan-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-700 transition-all active:scale-95"
                        >
                            Explore Doctors
                        </button>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default FavoriteDoctors;
