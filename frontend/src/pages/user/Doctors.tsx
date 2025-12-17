import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { FaStar, FaHeart, FaMapMarkerAlt, FaCircle, FaMoneyBillWave, FaSearch } from 'react-icons/fa';
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

const Doctors: React.FC = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [speciality, setSpeciality] = useState('');
    const [sortBy, setSortBy] = useState('');
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
                sort: sortBy
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
    }, [page, speciality, sortBy]);
    const handleSearch = () => {
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

            {/* Breadcrumb & Search Section */}
            <div className="relative bg-gradient-to-br from-[#e0f7fa] via-[#e6fffa] to-[#f0f9ff] pb-32 pt-20 rounded-b-[60px] shadow-sm mb-20">
                <div className="absolute inset-0 overflow-hidden rounded-b-[60px] pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#00A1B0]/5 rounded-full blur-3xl mix-blend-multiply"></div>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#4fd1c5]/10 rounded-full blur-3xl mix-blend-multiply"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <nav className="flex justify-center items-center text-sm font-medium text-gray-500 mb-4 gap-2">
                        <a href="/" className="hover:text-[#00A1B0] transition-colors hover:underline">Home</a>
                        <span>/</span>
                        <span className="text-[#00A1B0] font-semibold">Doctors</span>
                    </nav>
                    <h1 className="text-4xl md:text-6xl font-black text-[#002f33] mb-6 tracking-tight">
                        Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A1B0] to-[#007b86]">Specialist</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-8 font-light">
                        Book appointments with the best doctors and specialists in your area.
                    </p>
                </div>

                {/* Floating Search Bar */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-4 z-30">
                    <div className="bg-white rounded-3xl md:rounded-full shadow-xl p-4 md:p-2 flex flex-col md:flex-row items-center border border-gray-50 backdrop-blur-xl gap-3 md:gap-0">
                        <div className="flex-[2] w-full flex items-center px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50/80 rounded-2xl md:rounded-full transition-colors group cursor-text border md:border-none border-gray-100">
                            <div className="p-3 bg-teal-50 text-[#00A1B0] rounded-full mr-4 group-hover:bg-[#00A1B0] group-hover:text-white transition-all duration-300">
                                <FaSearch className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-start w-full">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Doctor Name & Speciality</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dr. Smith"
                                    className="w-full bg-transparent border-none p-0 text-gray-700 font-bold placeholder-gray-300 focus:outline-none focus:ring-0 text-base leading-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                />
                            </div>
                        </div>

                        <div className="hidden md:block w-px h-12 bg-gray-100 mx-2"></div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="w-full md:w-auto bg-[#002f33] hover:bg-[#00A1B0] text-white px-10 py-4 md:py-5 rounded-2xl md:rounded-full font-bold transition-all shadow-lg hover:shadow-[#00A1B0]/30 flex items-center justify-center gap-2 transform active:scale-95 ml-0 md:ml-2">
                            <FaSearch className="w-5 h-5" />
                            <span className="md:hidden">Search Doctors</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-48 md:mt-24 pb-20">

                {/* Top Info Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Showing <span className="text-[#00A1B0]">{totalDoctors}</span> Doctors For You</h2>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-medium">Sort By</span>
                            <select
                                className="border-none bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="">Default</option>
                                {/* <option>Rating</option> */}
                                <option value="price_asc">Price (Low to High)</option>
                                <option value="price_desc">Price (High to Low)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-4 flex-1">
                        <select
                            className="px-4 py-2 bg-white border border-[#00A1B0] rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#00A1B0] w-full md:w-auto cursor-pointer"
                            value={speciality}
                            onChange={(e) => setSpeciality(e.target.value)}
                        >
                            <option value="">All Specialities</option>
                            <option value="Cardiologist">Cardiologist</option>
                            <option value="Neurologist">Neurologist</option>
                            <option value="Dermatologist">Dermatologist</option>
                            <option value="Pediatrician">Pediatrician</option>
                            <option value="Psychologist">Psychologist</option>
                            <option value="Gastroenterology">Gastroenterology</option>
                        </select>
                    </div>
                    <button
                        onClick={() => { setSpeciality(''); setSearchQuery(''); setSortBy(''); setPage(1); if (page === 1) fetchDoctors(); }}
                        className="text-[#00A1B0] font-semibold hover:underline text-sm flex items-center gap-1">
                        Clear All
                    </button>
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
