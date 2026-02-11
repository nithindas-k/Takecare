import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { FaHeart, FaMapMarkerAlt, FaStethoscope, FaTrash } from 'react-icons/fa';
import userService from '../../services/userService';
import { API_BASE_URL } from '../../utils/constants';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PatientLayout from '../../components/Patient/PatientLayout';

interface FavoriteSummary {
    id: string;
    name: string;
    image: string | null;
    speciality: string;
    rating: number;
    experience: number;
    location: string;
    fees: number;
    available: boolean;
}

const FavoriteDoctors: React.FC = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState<FavoriteSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const response = await userService.getFavorites();
            if (response.success && Array.isArray(response.data)) {
                // Map the populated favorites
                const mappedDoctors = response.data.map((fav: any): FavoriteSummary => ({
                    id: fav.id || fav._id || '',
                    name: fav.name || "Unknown Doctor",
                    image: fav.image || fav.profileImage || null,
                    speciality: fav.speciality || fav.specialty || "Specialist",
                    rating: fav.rating || fav.ratingAvg || 0,
                    experience: fav.experience || fav.experienceYears || 0,
                    location: fav.location || "Online",
                    fees: fav.fees || fav.videoFees || fav.VideoFees || 0,
                    available: fav.available || fav.isActive || false
                }));
                setDoctors(mappedDoctors);
            } else {
                setDoctors([]);
            }
        } catch (error: unknown) {
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
        } catch {
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
        <div className="bg-white min-h-screen font-sans">
            <NavBar />

            <div className="pt-28 pb-6 bg-white border-b border-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <FaHeart className="text-[#00A1B0] text-xl" />
                                Favorite Specialists
                            </h1>
                            <p className="text-sm text-gray-500 mt-1 font-medium">
                                Manage your trusted healthcare providers
                            </p>
                        </div>
                        <Badge variant="outline" className="bg-[#00A1B0]/5 text-[#00A1B0] border-[#00A1B0]/20 px-3 py-1 font-bold">
                            {doctors.length} Saved
                        </Badge>
                    </div>
                </div>
            </div>

            <PatientLayout>
                <div className="max-w-4xl mx-auto py-8">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                                    <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/6" />
                                    </div>
                                    <Skeleton className="h-9 w-24 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : doctors.length > 0 ? (
                        <div className="space-y-3">
                            {doctors.map((doctor) => (
                                <Card key={doctor.id} className="group border-gray-100 hover:border-[#00A1B0]/30 shadow-none hover:shadow-md transition-all duration-300">
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center gap-4">
                                            {/* Minimal Doctor Info */}
                                            <div className="relative shrink-0">
                                                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border border-gray-100">
                                                    <AvatarImage src={getImageUrl(doctor.image)} alt={doctor.name} className="object-top" />
                                                    <AvatarFallback className="bg-[#00A1B0]/10 text-[#00A1B0] font-bold">
                                                        {doctor.name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {doctor.available && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3
                                                        className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#00A1B0] transition-colors cursor-pointer truncate"
                                                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                                                    >
                                                        {doctor.name}
                                                    </h3>
                                                    <Badge className="bg-yellow-400/10 text-yellow-600 border-none px-1.5 py-0 h-4 text-[10px] font-bold">
                                                        ★ {doctor.rating}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-[#00A1B0] font-medium uppercase tracking-wider">
                                                    {doctor.speciality}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5 text-[10px] sm:text-xs text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <FaStethoscope size={10} /> {doctor.experience} Yrs
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FaMapMarkerAlt size={10} /> {doctor.location}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                                <div className="hidden sm:block text-right mr-2">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fees</p>
                                                    <p className="text-gray-900 font-bold">₹{doctor.fees}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                    onClick={(e) => handleToggleFavorite(e, doctor.id)}
                                                >
                                                    <FaTrash size={12} />
                                                </Button>
                                                <Button
                                                    onClick={() => navigate(`/doctors/${doctor.id}`)}
                                                    className="bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-lg h-9 px-4 text-xs font-bold shadow-sm"
                                                >
                                                    Book
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 px-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaHeart className="w-8 h-8 text-gray-200" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">No Favorites Yet</h2>
                            <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
                                Save the doctors you trust most for quick and easy access.
                            </p>
                            <Button
                                onClick={() => navigate('/doctors')}
                                className="bg-[#00A1B0] hover:bg-[#008f9c] text-white px-8 rounded-xl font-bold h-11"
                            >
                                Browse Specialists
                            </Button>
                        </div>
                    )}
                </div>
            </PatientLayout>
            <Footer />
        </div>
    );
};

export default FavoriteDoctors;
