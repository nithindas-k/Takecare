import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { FaStar, FaHeart, FaMapMarkerAlt, FaCircle, FaMoneyBillWave, FaSearch, FaFilter, FaStethoscope, FaBriefcase, FaTimes } from 'react-icons/fa';
import doctorService from '../../services/doctorService';
import userService from '../../services/userService';
import { API_BASE_URL } from '../../utils/constants';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from '../../components/ui/pagination';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";

const Doctors: React.FC = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [speciality, setSpeciality] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [experience, setExperience] = useState<string>('');
    const [rating, setRating] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDoctors, setTotalDoctors] = useState(0);
    const [favorites, setFavorites] = useState<string[]>([]);

    const fetchFavorites = useCallback(async () => {
        try {
            const response = await userService.getFavorites();
            if (response.success && Array.isArray(response.data)) {
                setFavorites(response.data.map((doc: any) => doc.id || doc._id));
            }
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        }
    }, []);

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await doctorService.getAllDoctors({
                page,
                limit: 8,
                query: searchQuery,
                specialty: speciality === 'All Specialities' || speciality === '' ? '' : speciality,
                sort: sortBy,
                experience: experience ? parseInt(experience) : undefined,
                rating: rating ? parseFloat(rating) : undefined
            });

            if (response && response.success && response.data) {
                const mappedDoctors = (response.data.doctors || []).map((doc: any) => ({
                    ...doc,
                    id: doc.id || doc._id
                }));
                setDoctors(mappedDoctors);
                setTotalPages(response.data.totalPages || 1);
                setTotalDoctors(response.data.total || 0);
            } else if (response && response.data) {
                const mappedDoctors = (response.data.doctors || []).map((doc: any) => ({
                    ...doc,
                    id: doc.id || doc._id
                }));
                setDoctors(mappedDoctors);
                setTotalPages(response.data.totalPages || 1);
                setTotalDoctors(response.data.total || 0);
            } else {
                setDoctors([]);
            }
        } catch (error) {
            console.error("Failed to fetch doctors", error);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, speciality, sortBy, experience, rating]);

    useEffect(() => {
        fetchDoctors();
        fetchFavorites();
    }, [fetchDoctors, fetchFavorites]);

    const handleToggleFavorite = async (e: React.MouseEvent, doctorId: string) => {
        e.stopPropagation();
        try {
            const response = await userService.toggleFavorite(doctorId);
            if (response.success) {
                setFavorites(prev =>
                    prev.includes(doctorId)
                        ? prev.filter(id => id !== doctorId)
                        : [...prev, doctorId]
                );
                toast.success(response.message);
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim() == "") {
            toast.error("Please enter a search query");
            return
        }
        setPage(1);
        if (page === 1) fetchDoctors();
    };

    const getPaginationItems = (current: number, total: number) => {
        if (total <= 1) return [] as Array<number | 'ellipsis'>;
        const items: Array<number | 'ellipsis'> = [];
        const addRange = (start: number, end: number) => {
            for (let i = start; i <= end; i++) items.push(i);
        };
        const showLeft = Math.max(2, current - 1);
        const showRight = Math.min(total - 1, current + 1);
        items.push(1);
        if (showLeft > 2) items.push('ellipsis');
        addRange(showLeft, showRight);
        if (showRight < total - 1) items.push('ellipsis');
        if (total > 1) items.push(total);
        return items;
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans overflow-x-hidden">
            <NavBar />

            <div className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 -z-20"></div>
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-100/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-600 text-[10px] font-black tracking-[0.2em] uppercase mb-8 border border-cyan-100/50 shadow-sm animate-fade-in">
                        <FaStethoscope className="w-3 h-3" />
                        Elite Medical Network
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
                        Expert Care, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-500">Simplified.</span>
                    </h1>

                    <p className="text-slate-500 max-w-xl mx-auto text-lg mb-12 font-medium leading-relaxed">
                        Find and book the best specialists in seconds.
                        Healthcare that moves at the speed of life.
                    </p>

                    <div className="max-w-xl mx-auto relative group">
                        <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-cyan-500 transition-colors z-10" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 text-slate-700 font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/5 transition-all text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-700 transition-all shadow-lg active:scale-95"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-16 pb-32 relative z-20">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-12">
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-3 md:gap-4 flex-1">
                        <div className="col-span-2 sm:col-span-1 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md h-[52px]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Results</span>
                            <div className="h-4 w-px bg-slate-100"></div>
                            <span className="text-xs font-black text-[#00A1B0] px-2 tracking-tighter whitespace-nowrap">{totalDoctors} Found</span>
                        </div>

                        <div className="flex items-center px-4 md:px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md h-[52px] min-w-[140px]">
                            <FaFilter className="text-[#00A1B0] w-3 h-3 shrink-0 mr-2" />
                            <Select value={speciality} onValueChange={(val) => setSpeciality(val === 'all' ? '' : val)}>
                                <SelectTrigger className="w-full bg-transparent border-none h-auto p-0 focus:ring-0 shadow-none text-[10px] md:text-[11px] font-black text-slate-800 uppercase tracking-widest gap-1">
                                    <SelectValue placeholder="SPEC" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Specs</SelectItem>
                                    <SelectItem value="Cardiologist">Cardio</SelectItem>
                                    <SelectItem value="Neurologist">Neuro</SelectItem>
                                    <SelectItem value="Dermatologist">Derma</SelectItem>
                                    <SelectItem value="Pediatrician">Pediat</SelectItem>
                                    <SelectItem value="Psychologist">Psych</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center px-4 md:px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md h-[52px] min-w-[140px]">
                            <FaBriefcase className="text-[#00A1B0] w-3 h-3 shrink-0 mr-2" />
                            <Select value={experience} onValueChange={(val) => setExperience(val === 'all' ? '' : val)}>
                                <SelectTrigger className="w-full bg-transparent border-none h-auto p-0 focus:ring-0 shadow-none text-[10px] md:text-[11px] font-black text-slate-800 uppercase tracking-widest gap-1">
                                    <SelectValue placeholder="EXP" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Exp</SelectItem>
                                    <SelectItem value="5">5+ Years</SelectItem>
                                    <SelectItem value="10">10+ Years</SelectItem>
                                    <SelectItem value="15">15+ Years</SelectItem>
                                    <SelectItem value="20">20+ Years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center px-4 md:px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md h-[52px] min-w-[140px]">
                            <FaStar className="text-[#00A1B0] w-3 h-3 shrink-0 mr-2" />
                            <Select value={rating} onValueChange={(val) => setRating(val === 'all' ? '' : val)}>
                                <SelectTrigger className="w-full bg-transparent border-none h-auto p-0 focus:ring-0 shadow-none text-[10px] md:text-[11px] font-black text-slate-800 uppercase tracking-widest gap-1">
                                    <SelectValue placeholder="STARS" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Rating</SelectItem>
                                    <SelectItem value="5">5 Stars</SelectItem>
                                    <SelectItem value="4">4+ Stars</SelectItem>
                                    <SelectItem value="3">3+ Stars</SelectItem>
                                    <SelectItem value="2">2+ Stars</SelectItem>
                                    <SelectItem value="1">1+ Stars</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>


                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 lg:flex-none transition-all hover:shadow-md h-[52px] min-w-[180px]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sort</span>
                            <div className="h-4 w-px bg-slate-100"></div>
                            <Select value={sortBy} onValueChange={(val) => setSortBy(val === 'all' ? '' : val)}>
                                <SelectTrigger className="w-full bg-transparent border-none h-auto p-0 focus:ring-0 shadow-none text-xs font-black text-slate-800 focus:outline-none">
                                    <SelectValue placeholder="Latest" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Latest</SelectItem>
                                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <button
                            onClick={() => { setSpeciality(''); setSearchQuery(''); setSortBy(''); setExperience(''); setRating(''); setPage(1); if (page === 1) fetchDoctors(); }}
                            className="p-4 bg-white text-slate-300 hover:text-red-500 rounded-2xl shadow-sm border border-slate-100 transition-all group h-[52px] flex items-center justify-center"
                            title="Clear All"
                        >
                            <FaTimes className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-3 md:p-4 space-y-4">
                                <Skeleton className="h-40 sm:h-64 w-full rounded-lg" />
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-3 w-1/3" />
                                        <Skeleton className="h-4 w-1/4 rounded-full" />
                                    </div>
                                    <Skeleton className="h-5 w-3/4" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-3 w-1/4" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <Skeleton className="h-2 w-8" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-8 w-24 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : doctors.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                        {doctors.map((doctor) => (
                            <div key={doctor.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                                <div className="relative h-40 sm:h-64 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => navigate(`/doctors/${doctor.id}`)}>
                                    <img
                                        src={getImageUrl(doctor.image)}
                                        alt={doctor.name}
                                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/doctor.png';
                                        }}
                                    />
                                    <div className="absolute top-3 left-3 bg-[#00A1B0] text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                        <FaStar className="text-yellow-300" /> {doctor.rating}
                                    </div>
                                    <button
                                        className={`absolute top-3 right-3 bg-white/80 p-2 rounded-full transition-colors ${favorites.includes(doctor.id) ? 'text-[#00A1B0] bg-white' : 'text-gray-400 hover:text-[#00A1B0] hover:bg-white'}`}
                                        onClick={(e) => handleToggleFavorite(e, doctor.id)}
                                    >
                                        <FaHeart />
                                    </button>
                                </div>

                                <div className="p-3 md:p-4">
                                    <div className="flex justify-between items-center mb-1.5 md:mb-2">
                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-blue-500 truncate mr-1">
                                            {doctor.speciality}
                                        </span>
                                        {doctor.available ? (
                                            <span className="text-[8px] md:text-[10px] font-bold text-green-600 bg-green-50 px-1.5 md:px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1 shrink-0">
                                                <FaCircle className="w-1 md:w-1.5 h-1 md:h-1.5" /> <span className="hidden xs:inline">Available</span>
                                            </span>
                                        ) : (
                                            <span className="text-[8px] md:text-[10px] font-bold text-red-500 bg-red-50 px-1.5 md:px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1 shrink-0">
                                                <FaCircle className="w-1 md:w-1.5 h-1 md:h-1.5" /> <span className="hidden xs:inline">Unavailable</span>
                                            </span>
                                        )}
                                    </div>

                                    <h3
                                        className="text-sm md:text-lg font-bold text-gray-800 mb-1.5 md:mb-2 group-hover:text-[#00A1B0] transition-colors cursor-pointer truncate"
                                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                                    >
                                        {doctor.name}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">
                                        <div className="flex items-center gap-1">
                                            <FaMapMarkerAlt className="text-gray-400 shrink-0" /> <span className="truncate max-w-[60px] md:max-w-none">{doctor.location || "Online"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FaMoneyBillWave className="text-gray-400 shrink-0" /> {doctor.experience} Yrs
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 gap-2">
                                        <div>
                                            <p className="text-[8px] md:text-xs text-gray-400">Fees</p>
                                            <p className="text-[#00A1B0] font-bold text-sm md:text-lg">₹{doctor.fees}</p>
                                        </div>
                                        <button
                                            className="border border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0] hover:text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-sm font-bold transition-all"
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
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No doctors found. Try adjusting your search criteria.</p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-12 flex flex-col items-center gap-4">
                        <div className="text-sm text-gray-500 font-semibold">
                            Page <span className="text-[#00A1B0]">{page}</span> of {totalPages}
                        </div>
                        <Pagination>
                            <PaginationContent className="gap-2">
                                <PaginationItem>
                                    <PaginationPrevious
                                        disabled={page <= 1}
                                        onClick={() => setPage((prev: number) => Math.max(1, prev - 1))}
                                    />
                                </PaginationItem>
                                {getPaginationItems(page, totalPages).map((item, idx) => (
                                    <PaginationItem key={`${item}-${idx}`}>
                                        {item === 'ellipsis' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                isActive={item === page}
                                                onClick={() => setPage(item as number)}
                                            >
                                                {item}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((prev: number) => Math.min(totalPages, prev + 1))}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
            <Footer />
        </div >
    );
};

export default Doctors;
