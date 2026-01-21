/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
    FaCheckCircle,
    FaStar,
    FaArrowRight,
    FaCheck,
    FaVideo,
    FaShieldAlt,
    FaClock,
    FaComments
} from 'react-icons/fa';
import { Skeleton } from '../components/ui/skeleton';
import LandingNavbar from '../components/common/LandingNavbar';
import doctorService from '../services/doctorService';
import { API_BASE_URL } from '../utils/constants';


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

        if (nodeRef.current) {
            observer.observe(nodeRef.current);
        }

        return () => observer.disconnect();
    }, [end, duration]);

    return <span ref={nodeRef}>{count.toFixed(decimals)}{suffix}</span>;
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        doctors: 0,
        patients: 0,
        appointments: 0
    });
    const [featuredDoctors, setFeaturedDoctors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            const result = await doctorService.getAllDoctors({ page: 1, limit: 3 });
            const list = result?.data?.doctors ?? result?.doctors ?? [];

            setFeaturedDoctors(Array.isArray(list) ? list : []);
        } catch (err) {
            console.warn('Failed to load data', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
                                    onClick={() => navigate('/patient/register')}
                                    className="group px-6 py-3 bg-[#00A1B0] text-white rounded-lg font-medium hover:bg-[#008f9c] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00A1B0]/20"
                                >
                                    <span>Book Consultation</span>
                                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate('/doctors')}
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

            {/* Doctors - Ultra Premium Cards */}
            <section className="py-12 md:py-16 px-4 md:px-6 bg-gray-50 fade-in">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Featured Doctors</h2>
                        <p className="text-gray-500">Meet our verified specialists</p>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-3xl p-8 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : featuredDoctors.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center">
                            <p className="text-gray-400">No doctors available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {featuredDoctors.slice(0, 3).map((doctor) => {
                                const id = (doctor as any)?.id || (doctor as any)?._id || (doctor as any)?.customId;
                                const rating = Math.round(doctor?.rating ?? doctor?.ratingAvg ?? 0);
                                const reviews = doctor?.reviews ?? doctor?.ratingCount ?? 0;
                                const fees = doctor?.fees ?? doctor?.VideoFees ?? doctor?.videoFees ?? 0;
                                const experience = doctor?.experience ?? doctor?.experienceYears ?? 0;

                                return (
                                    <div
                                        key={id || doctor?.name}
                                        className="group bg-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 border border-gray-100"
                                    >
                                        {/* Header with Avatar */}
                                        <div className="flex items-start gap-4 mb-8">
                                            {/* Circular Avatar */}
                                            <div className="relative shrink-0">
                                                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-[#00A1B0] transition-all duration-500">
                                                    <img
                                                        src={getImageUrl(doctor?.image)}
                                                        alt={doctor?.name}
                                                        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                                                        onError={(e) => ((e.target as HTMLImageElement).src = "/doctor.png")}
                                                    />
                                                </div>
                                                {/* Verified Mini Badge */}
                                                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#00A1B0] rounded-full flex items-center justify-center shadow-lg">
                                                    <FaCheckCircle className="text-white w-3.5 h-3.5" />
                                                </div>
                                            </div>

                                            {/* Name and Specialty */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{doctor?.name}</h3>
                                                <p className="text-sm text-gray-500 mb-2 truncate">
                                                    {doctor?.speciality || doctor?.specialty || 'Specialist'}
                                                </p>

                                                {/* Rating - Compact */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FaStar
                                                                key={i}
                                                                className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-400">({reviews})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-gray-100">
                                            {/* Experience */}
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <p className="text-xs text-gray-500 mb-1">Experience</p>
                                                <p className="text-lg font-bold text-gray-900">{experience} yrs</p>
                                            </div>

                                            {/* Consultation Fee */}
                                            <div className="bg-[#00A1B0]/5 rounded-xl p-4">
                                                <p className="text-xs text-gray-500 mb-1">Fee</p>
                                                <p className="text-lg font-bold text-[#00A1B0]">₹{fees}</p>
                                            </div>
                                        </div>

                                        {/* CTA Button - Landing Page */}
                                        <button
                                            onClick={() => navigate('/patient/register')}
                                            className="w-full px-5 py-3 bg-[#00A1B0] text-white rounded-xl font-medium hover:bg-[#008f9c] transition-all shadow-lg shadow-[#00A1B0]/20 hover:shadow-xl hover:shadow-[#00A1B0]/30"
                                        >
                                            Get Started
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="text-center mt-8">
                        <button
                            onClick={() => navigate('/patient/register')}
                            className="px-6 py-2.5 text-[#00A1B0] font-medium hover:text-[#008f9c] transition-colors inline-flex items-center gap-2"
                        >
                            <span>Sign Up to View All Doctors</span>
                            <FaArrowRight className="w-4 h-4" />
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
        </div>
    );
};

export default LandingPage;
