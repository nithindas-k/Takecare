import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { FaStar, FaHeart, FaMapMarkerAlt, FaCircle, FaMoneyBillWave, FaSearch, FaFilter, FaStethoscope, FaBriefcase, FaTimes } from 'react-icons/fa';
import doctorService from '../../services/doctorService';
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

    const fetchDoctors = async () => {
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


            console.log('Doctors API Response:', response);

            if (response && response.success && response.data) {
                setDoctors(response.data.doctors || []);
                setTotalPages(response.data.totalPages || 1);
                setTotalDoctors(response.data.total || 0);
            } else if (response && response.data) {

                setDoctors(response.data.doctors || []);
                setTotalPages(response.data.totalPages || 1);
                setTotalDoctors(response.data.total || 0);
            } else {
                console.error("Invalid response structure:", response);
                setDoctors([]);
            }
        } catch (error) {
            console.error("Failed to fetch doctors", error);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchDoctors();
    }, [page, speciality, sortBy, experience, rating]);
    const handleSearch = () => {
          
        if(searchQuery.trim() == ""){
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
        <div className="bg-gray-50 min-h-screen font-sans">
            <NavBar />

            {/* Enhanced Hero & Minimal Search Section */}
            <div className="relative pt-32 pb-24 overflow-hidden">
                {/* Dynamic Background Elements */}
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

                    {/* Minimalist Search */}
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
                {/* Minimal Filter Toolbar - Light Theme */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Results</span>
                            <div className="h-4 w-px bg-slate-100"></div>
                            <span className="text-xs font-black text-cyan-600 px-2 tracking-tighter">{totalDoctors} Found</span>
                        </div>

                        <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <FaFilter className="text-cyan-500 w-3 h-3" />
                            <select
                                className="bg-transparent border-none text-[11px] font-black text-slate-800 uppercase tracking-widest focus:ring-0 focus:outline-none cursor-pointer appearance-none pr-8"
                                value={speciality}
                                onChange={(e) => setSpeciality(e.target.value)}
                            >
                                <option value="">Speciality</option>
                                <option value="Cardiologist">Cardiology</option>
                                <option value="Neurologist">Neurology</option>
                                <option value="Dermatologist">Dermatology</option>
                                <option value="Pediatrician">Pediatrics</option>
                                <option value="Psychologist">Psychology</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <FaBriefcase className="text-cyan-500 w-3 h-3" />
                            <select
                                className="bg-transparent border-none text-[11px] font-black text-slate-800 uppercase tracking-widest focus:ring-0 focus:outline-none cursor-pointer appearance-none pr-8"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                            >
                                <option value="">Experience</option>
                                <option value="5">5+ Years</option>
                                <option value="10">10+ Years</option>
                                <option value="20">20+ Years</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <FaStar className="text-cyan-500 w-3 h-3" />
                            <select
                                className="bg-transparent border-none text-[11px] font-black text-slate-800 uppercase tracking-widest focus:ring-0 focus:outline-none cursor-pointer appearance-none pr-8"
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                            >
                                <option value="">Rating</option>
                                <option value="4">4.0+ Stars</option>
                                <option value="3">3.0+ Stars</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 lg:flex-none">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Sort</span>
                            <div className="h-4 w-px bg-slate-100"></div>
                            <select
                                className="bg-transparent border-none text-xs font-black text-slate-800 focus:ring-0 focus:outline-none cursor-pointer pr-10"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="">Recommended</option>
                                <option value="price_asc">Price: Low - High</option>
                                <option value="price_desc">Price: High - Low</option>
                            </select>
                        </div>

                        <button
                            onClick={() => { setSpeciality(''); setSearchQuery(''); setSortBy(''); setExperience(''); setRating(''); setPage(1); if (page === 1) fetchDoctors(); }}
                            className="p-4 text-slate-300 hover:text-red-500 hover:bg-white rounded-2xl shadow-sm border border-slate-100 transition-all group"
                            title="Clear All"
                        >
                            <FaTimes className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Doctors Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A1B0]"></div>
                    </div>
                ) : doctors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {doctors.map((doctor) => (
                            <div key={doctor.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                                {/* Card Image */}
                                <div className="relative h-64 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => navigate(`/doctors/${doctor.id}`)}>
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
                                    <button className="absolute top-3 right-3 bg-white/80 p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <FaHeart />
                                    </button>
                                </div>

                                {/* Card Body */}
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                                            {doctor.speciality}
                                        </span>

                                        {doctor.available ? (
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                                                <FaCircle className="w-1.5 h-1.5" /> Available
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                                                <FaCircle className="w-1.5 h-1.5" /> Unavailable
                                            </span>
                                        )}
                                    </div>

                                    <h3
                                        className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#00A1B0] transition-colors cursor-pointer"
                                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                                    >
                                        {doctor.name}
                                    </h3>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                        <div className="flex items-center gap-1">
                                            <FaMapMarkerAlt className="text-gray-400" /> {doctor.location || "Online"}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FaMoneyBillWave className="text-gray-400" /> {doctor.experience} Yrs Exp.
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-400">Consultation Fees</p>
                                            <p className="text-[#00A1B0] font-bold text-lg">₹{doctor.fees}</p>
                                        </div>
                                        <button
                                            className="border border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0] hover:text-white px-4 py-2 rounded-full text-sm font-bold transition-all"
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

                {/* Pagination */}
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
                                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                    />
                                </PaginationItem>

                                {getPaginationItems(page, totalPages).map((item, idx) => (
                                    <PaginationItem key={`${item}-${idx}`}>
                                        {item === 'ellipsis' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                isActive={item === page}
                                                onClick={() => setPage(item)}
                                            >
                                                {item}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Doctors;
