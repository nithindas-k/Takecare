import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import gsap from 'gsap';
import {
    FaStar,
    FaArrowRight,
    FaCheck,
    FaVideo,
    FaShieldAlt,
    FaClock,
    FaComments,
    FaSearch,
} from 'react-icons/fa';
import { Skeleton } from '../components/ui/skeleton';
import LandingNavbar from '../components/common/LandingNavbar';
import doctorService from '../services/doctorService';
import { API_BASE_URL } from '../utils/constants';
import { selectCurrentUser } from '../redux/user/userSlice';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../components/ui/dialog";

const CountUp = ({ end, duration = 2, decimals = 0, suffix = '' }: { end: number, duration?: number, decimals?: number, suffix?: string }) => {
    const [count, setCount] = useState(0);
    const nodeRef = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    let startTime: number;
                    let animationFrame: number;

                    const animate = (timestamp: number) => {
                        if (!startTime) startTime = timestamp;
                        const progress = timestamp - startTime;
                        const percentage = Math.min(progress / (duration * 1000), 1);
                        const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
                        setCount(end * ease);
                        if (percentage < 1) {
                            animationFrame = requestAnimationFrame(animate);
                        }
                    };

                    animationFrame = requestAnimationFrame(animate);
                    return () => cancelAnimationFrame(animationFrame);
                }
            },
            { threshold: 0.1 }
        );

        if (nodeRef.current) observer.observe(nodeRef.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return <span ref={nodeRef}>{count.toFixed(decimals)}{suffix}</span>;
};

interface Review {
    _id: string;
    patientId: {
        _id: string;
        name: string;
        profileImage: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

interface Doctor {
    id: string;
    _id?: string;
    name: string;
    image?: string;
    speciality: string;
    rating?: number;
    ratingAvg?: number;
    reviews?: number;
    ratingCount?: number;
    fees?: number;
    videoFees?: number;
    VideoFees?: number;
    experience?: number;
    experienceYears?: number;
    about?: string;
    qualifications?: string[];
}

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);
    const [stats, setStats] = useState({
        doctors: 0,
        patients: 0,
        appointments: 0
    });
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [speciality, setSpeciality] = useState('');
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'services'>('about');
    const [doctorReviews, setDoctorReviews] = useState<Review[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchDoctorReviews = useCallback(async (doctorId: string) => {
        setIsLoadingReviews(true);
        try {
            const res = await doctorService.getReviews(doctorId);
            if (res.success) {
                setDoctorReviews(res.data || []);
            }
        } catch (err) {
            console.warn("Failed to fetch reviews", err);
        } finally {
            setIsLoadingReviews(false);
        }
    }, []);

    useEffect(() => {
        if (showDetailsModal && selectedDoctor) {
            const doctorId = selectedDoctor.id || selectedDoctor._id;
            if (doctorId) {
                fetchDoctorReviews(doctorId);
            }
        }
    }, [showDetailsModal, selectedDoctor, fetchDoctorReviews]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const statsResult = await doctorService.getLandingStats();
            if (statsResult?.success && statsResult?.data) {
                setStats({
                    doctors: statsResult.data.doctors || 0,
                    patients: statsResult.data.patients || 0,
                    appointments: statsResult.data.appointments || 0
                });
            }

            const result = await doctorService.getAllDoctors({
                page: 1,
                limit: 6,
                query: debouncedSearch,
                specialty: speciality === 'all' ? '' : speciality
            });
            const list = result?.data?.doctors ?? result?.doctors ?? [];
            setDoctors(Array.isArray(list) ? list : []);
        } catch (err) {
            console.warn('Failed to load data', err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, speciality]);

    useEffect(() => {
        fetchData();

        gsap.fromTo('.fade-in',
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1 }
        );
    }, [fetchData]);

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    const handleBookNow = (doctorId: string) => {
        if (!currentUser) {
            setShowLoginDialog(true);
        } else {
            navigate(`/doctors/${doctorId}`);
        }
    };

    return (
        <div className="bg-white min-h-screen font-sans antialiased overflow-x-hidden">
            {/* Navigation */}
            {/* Navigation */}
            <LandingNavbar />

            {/* Hero Section - Proper spacing from navbar */}
            <section className="pt-24 pb-12 px-4 md:pt-32 md:pb-20 md:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Content */}
                        <div className="text-center lg:text-left fade-in">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full mb-6">
                                <div className="w-1.5 h-1.5 bg-[#00A1B0] rounded-full"></div>
                                <span className="text-gray-600 font-medium text-xs">Modern Healthcare</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                                Healthcare
                                <br />
                                <span className="text-[#00A1B0]">Simplified</span>
                            </h1>

                            <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                                Connect with verified doctors instantly. Book consultations from home.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                                <button
                                    onClick={() => document.getElementById('doctors-search')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="group px-6 py-3 bg-[#00A1B0] text-white rounded-lg font-medium hover:bg-[#008f9c] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00A1B0]/20"
                                >
                                    <span>Book Consultation</span>
                                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                                <button
                                    onClick={() => document.getElementById('doctors-search')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-6 py-3 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-all"
                                >
                                    Browse Doctors
                                </button>
                            </div>

                            {/* Trust Indicators */}
                            <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <FaCheck className="text-gray-400 w-3.5 h-3.5" />
                                    <span className="text-gray-500">HIPAA Compliant</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaCheck className="text-gray-400 w-3.5 h-3.5" />
                                    <span className="text-gray-500">Verified Doctors</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaCheck className="text-gray-400 w-3.5 h-3.5" />
                                    <span className="text-gray-500">24/7 Support</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Image Section - Clean & Minimal */}
                        <div className="relative fade-in max-w-md mx-auto lg:mx-0 lg:max-w-none">
                            <div className="relative aspect-square lg:aspect-auto h-full min-h-[500px] flex items-end justify-center">

                                {/* Main Image */}
                                <img
                                    src="/doctor.png"
                                    alt="Healthcare Professional"
                                    className="relative z-10 w-full h-full object-contain object-bottom"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar - Animated & Dynamic */}
            <section className="py-12 bg-gray-50 fade-in">
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                                {isLoading ? '—' : <CountUp end={stats.doctors} suffix="+" />}
                            </div>
                            <p className="text-sm text-gray-500">Doctors</p>
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                                {isLoading ? '—' : <CountUp end={stats.patients} suffix="+" />}
                            </div>
                            <p className="text-sm text-gray-500">Patients</p>
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                                {isLoading ? '—' : <CountUp end={stats.appointments} suffix="+" />}
                            </div>
                            <p className="text-sm text-gray-500">Appointments</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features - Minimal */}
            <section className="py-12 md:py-16 px-4 md:px-6 fade-in">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose Takecare</h2>
                        <p className="text-gray-500">Professional healthcare, simplified</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-[#00A1B0]/10 rounded-lg flex items-center justify-center text-[#00A1B0] mb-4">
                                <FaVideo className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Video Consultations</h3>
                            <p className="text-sm text-gray-500">High-quality video calls with specialists</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-[#00A1B0]/10 rounded-lg flex items-center justify-center text-[#00A1B0] mb-4">
                                <FaComments className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Chat Consultations</h3>
                            <p className="text-sm text-gray-500">Secure text-based medical consultations</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-[#00A1B0]/10 rounded-lg flex items-center justify-center text-[#00A1B0] mb-4">
                                <FaClock className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">24/7 Available</h3>
                            <p className="text-sm text-gray-500">Round-the-clock access to care</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-[#00A1B0]/10 rounded-lg flex items-center justify-center text-[#00A1B0] mb-4">
                                <FaShieldAlt className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Secure & Private</h3>
                            <p className="text-sm text-gray-500">Your data is encrypted and protected</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Find Your Doctor - Professional Search and Filter */}
            <section id="doctors-search" className="py-24 px-4 md:px-6 bg-[#f8fafb] border-y border-gray-100 fade-in">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">Expert Specialists</h2>
                            <p className="text-gray-600 font-medium text-lg">Access India's top-rated doctors across all specialties. Instant booking, verified profiles, and secure consultations.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-[350px]">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-[#008f9c] focus:ring-0 transition-all outline-none font-semibold text-gray-700 text-sm shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-56">
                                <Select value={speciality} onValueChange={setSpeciality}>
                                    <SelectTrigger className="w-full py-6 bg-white border-gray-200 rounded-xl focus:ring-0 focus:border-[#008f9c] font-bold text-gray-700 shadow-sm uppercase tracking-wider text-[10px]">
                                        <SelectValue placeholder="All Specialities" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white z-[100] rounded-2xl border-gray-100 shadow-2xl">
                                        <SelectItem value="all">All Specialities</SelectItem>
                                        <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                                        <SelectItem value="Neurologist">Neurologist</SelectItem>
                                        <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                                        <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                                        <SelectItem value="Psychologist">Psychologist</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="bg-white rounded-2xl p-4 space-y-3 border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-14 w-14 rounded-xl" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-4 w-3/4 rounded" />
                                            <Skeleton className="h-3 w-1/2 rounded" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Skeleton className="h-12 rounded-xl" />
                                        <Skeleton className="h-12 rounded-xl" />
                                    </div>
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : doctors.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaSearch className="w-5 h-5 text-gray-300" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">No doctors found</h3>
                            <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                            {doctors.map((doctor) => {
                                const id = doctor._id || doctor.id;
                                const ratingValue = doctor.ratingAvg || doctor.rating || 4.5;
                                const reviews = doctor.ratingCount || doctor.reviews || 0;
                                const experience = doctor.experienceYears || doctor.experience || 5;
                                const fees = doctor.videoFees || doctor.VideoFees || doctor.fees || 500;

                                return (
                                    <div
                                        key={id}
                                        className="group relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#008f9c]/30 hover:shadow-md transition-all duration-300 flex flex-col"
                                    >
                                        {/* compact Status Badge */}
                                        <div className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded-full border border-green-100/50">
                                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                            <span className="text-[8px] font-bold text-green-600 uppercase">Live</span>
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="relative shrink-0">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border-2 border-white ring-1 ring-gray-100">
                                                    <img
                                                        src={getImageUrl(doctor?.image)}
                                                        alt={doctor?.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => ((e.target as HTMLImageElement).src = "/doctor.png")}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-gray-900 truncate tracking-tight mb-0.5">{doctor?.name}</h3>
                                                <p className="text-[#00A1B0] text-[9px] font-black uppercase tracking-wider mb-1">{doctor?.speciality || 'Specialist'}</p>

                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-0.5 bg-yellow-50 px-1 py-0.5 rounded border border-yellow-100/50">
                                                        <FaStar className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                                                        <span className="text-[10px] font-black text-yellow-700">{ratingValue}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-gray-400">{reviews} reviews</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="px-3 py-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                                <p className="text-[7px] text-gray-400 font-bold uppercase mb-0.5">Exp.</p>
                                                <p className="text-xs font-black text-gray-900">{experience} Yrs</p>
                                            </div>
                                            <div className="px-3 py-2 bg-[#00A1B0]/[0.02] rounded-xl border border-[#00A1B0]/10">
                                                <p className="text-[7px] text-[#00A1B0]/60 font-bold uppercase mb-0.5">Fee</p>
                                                <p className="text-xs font-black text-[#00A1B0]">₹{fees}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex flex-col gap-1.5">
                                            <button
                                                onClick={() => handleBookNow(id)}
                                                className="w-full py-2.5 bg-[#00A1B0] text-white rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-[#008f9c] transition-colors active:scale-[0.98]"
                                            >
                                                Book Now
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedDoctor(doctor);
                                                    setActiveTab('about');
                                                    setShowDetailsModal(true);
                                                }}
                                                className="w-full py-1.5 text-gray-400 font-bold hover:text-[#00A1B0] transition-colors text-[9px] uppercase tracking-wider rounded-lg hover:bg-gray-50"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="text-center mt-12">
                        <button
                            onClick={() => navigate('/doctors')}
                            className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl border border-gray-200 hover:border-[#00A1B0] hover:text-[#00A1B0] transition-all inline-flex items-center gap-2 group shadow-sm"
                        >
                            <span>Explore All Doctors</span>
                            <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA - Compact */}
            <section className="py-12 md:py-16 px-4 md:px-6 fade-in">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-[#00A1B0] to-[#008f9c] rounded-2xl p-6 md:p-12 text-center">
                        <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
                        <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
                            Join thousands who trust Takecare for their healthcare
                        </p>

                        <button
                            onClick={() => navigate('/patient/register')}
                            className="px-8 py-3.5 bg-white text-[#00A1B0] rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-xl inline-flex items-center gap-2"
                        >
                            <span>Get Started Free</span>
                            <FaArrowRight className="w-4 h-4" />
                        </button>

                        <div className="mt-6 flex flex-wrap justify-center gap-6 text-white/70 text-sm">
                            <span>• No credit card</span>
                            <span>• Cancel anytime</span>
                            <span>• HIPAA compliant</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - Minimal */}
            <footer className="bg-gray-900 text-gray-400 py-8 md:py-12 px-4 md:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex flex-col mb-4 select-none">
                                <div className="flex items-baseline leading-none">
                                    <span className="text-2xl font-bold text-white tracking-tight">
                                        Take
                                    </span>
                                    <span className="text-2xl font-bold text-[#00A1B0] tracking-tight">
                                        Care
                                    </span>
                                </div>
                                <span className="text-[9px] font-medium text-gray-500 tracking-[0.2em] uppercase mt-0.5 ml-0.5">
                                    Healthcare Platform
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-white text-sm mb-3">Product</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/doctors" className="hover:text-white transition-colors">Doctors</a></li>
                                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-white text-sm mb-3">For Doctors</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/doctor/register" className="hover:text-white transition-colors">Join Platform</a></li>
                                <li><a href="/doctor/login" className="hover:text-white transition-colors">Login</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-white text-sm mb-3">Support</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6 text-center">
                        <p className="text-sm">&copy; 2026 Takecare. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Login Required Dialog - Minimal & Elegant */}
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="sm:max-w-[400px] bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FaShieldAlt className="w-6 h-6 text-gray-400" />
                        </div>

                        <DialogHeader className="mb-8">
                            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                                Sign in Required
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">
                                Please sign in to your account to continue with your doctor consultation.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setShowLoginDialog(false);
                                    navigate('/patient/login');
                                }}
                                className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all text-sm"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setShowLoginDialog(false)}
                                className="w-full py-3 text-gray-500 font-bold hover:text-gray-900 transition-all text-sm"
                            >
                                Back to Page
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Doctor Details Modal - Premium Design */}
            {/* Doctor Details Modal - Minimal & Professional Responsive */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="w-[92vw] sm:max-w-[440px] bg-white border-0 shadow-2xl rounded-[28px] sm:rounded-[32px] p-0 overflow-hidden outline-none">
                    {selectedDoctor && (() => {
                        const doctor = selectedDoctor;
                        const ratingValue = doctor.ratingAvg || doctor.rating || 4.5;
                        const experience = doctor.experienceYears || doctor.experience || 5;
                        const fees = doctor.videoFees || doctor.VideoFees || doctor.fees || 500;
                        const id = doctor._id || doctor.id;

                        return (
                            <div className="flex flex-col">
                                {/* Minimal Profile Header - Responsive */}
                                <div className="p-5 sm:p-8 pb-4 sm:pb-6 flex items-center gap-4 sm:gap-6">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-50 border-2 border-white ring-1 ring-gray-100 shrink-0">
                                        <img
                                            src={getImageUrl(doctor.image)}
                                            alt={doctor.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => ((e.target as HTMLImageElement).src = "/doctor.png")}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1 truncate">{doctor.name}</h2>
                                        <p className="text-[#00A1B0] text-[8px] sm:text-[10px] font-black uppercase tracking-widest leading-none">
                                            {doctor.speciality || 'Specialist'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        <span className="text-xs">✕</span>
                                    </button>
                                </div>

                                {/* Minimal Stats Bar - Responsive */}
                                <div className="px-5 sm:px-8 pb-4 sm:pb-6 grid grid-cols-3 gap-3 sm:gap-4 border-b border-gray-100">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Rating</p>
                                        <div className="flex items-center gap-1">
                                            <FaStar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500 fill-current" />
                                            <span className="text-xs sm:text-sm font-black text-gray-900">{ratingValue}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Exp</p>
                                        <p className="text-xs sm:text-sm font-black text-gray-900">{experience} Yrs</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] sm:text-[9px] text-[#00A1B0]/60 font-bold uppercase tracking-wider">Fee</p>
                                        <p className="text-xs sm:text-sm font-black text-[#00A1B0]">₹{fees}</p>
                                    </div>
                                </div>

                                {/* Minimal Tabs - Responsive */}
                                <div className="px-5 sm:px-8 flex items-center gap-4 sm:gap-6 border-b border-gray-100">
                                    {['about', 'reviews', 'services'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab
                                                ? 'border-[#008f9c] text-gray-900'
                                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content Container - Responsive */}
                                <div className="p-5 sm:p-8 h-[180px] sm:h-[220px] overflow-y-auto scrollbar-hide">
                                    {activeTab === 'about' && (
                                        <div className="space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                                {doctor.about ||
                                                    `Highly skilled ${doctor.speciality || 'Specialist'} with over ${experience} years of experience in providing comprehensive patient care. Committed to utilizing advanced clinical methods to ensure optimal health outcomes.`
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {activeTab === 'reviews' && (
                                        <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {isLoadingReviews ? (
                                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                                    <div className="w-6 h-6 border-2 border-gray-200 border-t-[#00A1B0] rounded-full animate-spin" />
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Loading reviews...</p>
                                                </div>
                                            ) : doctorReviews.length === 0 ? (
                                                <div className="text-center py-4">
                                                    <p className="text-[10px] sm:text-xs text-gray-400">No reviews yet for this doctor.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {doctorReviews.map((review) => (
                                                        <div key={review._id} className="p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                                                                    {review.patientId?.profileImage ? (
                                                                        <img src={review.patientId.profileImage} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">P</div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-[10px] font-black text-gray-900 truncate">{review.patientId?.name || "Patient"}</p>
                                                                        <div className="flex items-center gap-0.5">
                                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                                <FaStar key={s} className={`w-1.5 h-1.5 ${s <= review.rating ? "text-yellow-500 fill-current" : "text-gray-200"}`} />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[8px] text-gray-400 font-bold">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'services' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {doctor.qualifications && doctor.qualifications.length > 0 ? (
                                                doctor.qualifications.map((q, idx) => (
                                                    <div key={idx} className="px-3 py-2 bg-[#00A1B0]/[0.02] border border-[#00A1B0]/5 rounded-lg text-[10px] font-bold text-gray-600 uppercase flex items-center gap-2">
                                                        <div className="w-1 h-1 bg-[#00A1B0] rounded-full shrink-0" />
                                                        <span className="truncate">{q}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                ['General Consultation', 'Specialized Care', 'Video Consultation', 'Emergency Care'].map(s => (
                                                    <div key={s} className="px-3 py-2 bg-[#00A1B0]/[0.02] border border-[#00A1B0]/5 rounded-lg text-[10px] font-bold text-gray-600 uppercase flex items-center gap-2">
                                                        <div className="w-1 h-1 bg-[#00A1B0] rounded-full shrink-0" />
                                                        <span className="truncate">{s}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer Action - Responsive */}
                                <div className="px-5 sm:px-8 pb-5 sm:pb-8 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            handleBookNow(id);
                                        }}
                                        className="w-full py-3.5 sm:py-4 bg-gray-900 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg shadow-black/5"
                                    >
                                        Book Consultation
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default LandingPage;
