import React, { useEffect, useState } from 'react';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { FaUserMd, FaHeart, FaAward, FaGlobe, FaShieldAlt, FaHandshake, FaLightbulb, FaUsers } from 'react-icons/fa';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contactService } from '../../services/contactService';

gsap.registerPlugin(ScrollTrigger);

const About: React.FC = () => {
    const [stats, setStats] = useState([
        { icon: <FaUserMd className="w-8 h-8 text-[#00A1B0]" />, value: '150+', label: 'Expert Doctors' },
        { icon: <FaUsers className="w-8 h-8 text-[#00A1B0]" />, value: '1,000+', label: 'Happy Patients' },
        { icon: <FaAward className="w-8 h-8 text-[#00A1B0]" />, value: '15+', label: 'Years Experience' },
        { icon: <FaGlobe className="w-8 h-8 text-[#00A1B0]" />, value: '5,000+', label: 'Consultations Completed' },
    ]);

    useEffect(() => {
        // Fetch dynamic stats from backend
        const fetchStats = async () => {
            try {
                const response = await contactService.getStats();
                if (response.success && response.data) {
                    const { totalDoctors, totalPatients, totalAppointments, avgExperience } = response.data;

                    setStats([
                        {
                            icon: <FaUserMd className="w-8 h-8 text-[#00A1B0]" />,
                            value: totalDoctors > 0 ? `${totalDoctors}+` : '150+',
                            label: 'Expert Doctors'
                        },
                        {
                            icon: <FaUsers className="w-8 h-8 text-[#00A1B0]" />,
                            value: totalPatients > 0 ? `${totalPatients.toLocaleString()}+` : '1,000+',
                            label: 'Happy Patients'
                        },
                        {
                            icon: <FaAward className="w-8 h-8 text-[#00A1B0]" />,
                            value: avgExperience > 0 ? `${avgExperience}+` : '15+',
                            label: 'Years Experience'
                        },
                        {
                            icon: <FaGlobe className="w-8 h-8 text-[#00A1B0]" />,
                            value: totalAppointments > 0 ? `${totalAppointments.toLocaleString()}+` : '5,000+',
                            label: 'Consultations Completed'
                        },
                    ]);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                // Keep fallback values - they're already set in useState
            }
        };

        fetchStats();

        // Hero Animation
        gsap.fromTo('.about-hero',
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
        );

        // Stats Animation
        gsap.fromTo('.stat-card',
            { scale: 0.9, opacity: 0 },
            {
                scale: 1, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)',
                scrollTrigger: {
                    trigger: '.stats-section',
                    start: 'top 80%',
                }
            }
        );

        // Mission/Vision Cards
        gsap.fromTo('.mission-card',
            { y: 50, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.mission-section',
                    start: 'top 75%',
                }
            }
        );

        // Values Animation
        gsap.fromTo('.value-item',
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.values-section',
                    start: 'top 80%',
                }
            }
        );
    }, []);

    const values = [
        { icon: <FaHeart className="w-6 h-6" />, title: 'Patient First', desc: 'Your health and comfort are our top priorities' },
        { icon: <FaShieldAlt className="w-6 h-6" />, title: 'Trust & Security', desc: 'Secure, confidential, and HIPAA compliant' },
        { icon: <FaHandshake className="w-6 h-6" />, title: 'Integrity', desc: 'Honest, transparent healthcare services' },
        { icon: <FaLightbulb className="w-6 h-6" />, title: 'Innovation', desc: 'Cutting-edge telemedicine technology' },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#00A1B0] to-[#008f9c] py-20 lg:py-32 px-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl"></div>

                <div className="max-w-6xl mx-auto text-center relative z-10 about-hero">
                    <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-white/30">
                        About Takecare
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                        Revolutionizing Healthcare,<br />One Consultation at a Time
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                        Takecare is your trusted digital healthcare partner, connecting you with verified specialists for instant,
                        quality medical consultations from the comfort of your home.
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white stats-section">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 mx-auto mb-4 bg-[#00A1B0]/10 rounded-full flex items-center justify-center">
                                    {stat.icon}
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-2">{stat.value}</h3>
                                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Story</h2>
                        <div className="w-20 h-1 bg-[#00A1B0] mx-auto rounded-full"></div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                        <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                            Founded with a vision to make quality healthcare accessible to everyone, Takecare was born as a
                            <span className="font-bold text-[#00A1B0]"> 100% online platform</span>, understanding that distance, time, and convenience should never
                            be barriers to receiving expert medical advice.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                            Our platform connects patients with board-certified doctors across multiple specialties for
                            <span className="font-bold text-[#00A1B0]"> seamless video consultations</span>. We've eliminated the need for physical clinics,
                            bringing the hospital to your home through secure, instant technology.
                        </p>
                        <p className="text-gray-700 leading-relaxed text-lg">
                            Today, Takecare serves thousands of patients digitally, ensuring professional healthcare is just a click away.
                            We believe technology and compassion together can transform healthcare.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20 bg-white mission-section">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mission */}
                        <div className="mission-card bg-gradient-to-br from-[#00A1B0] to-[#008f9c] rounded-3xl p-10 text-white shadow-2xl">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <FaHeart className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl font-black mb-4">Our Mission</h3>
                            <p className="text-white/90 leading-relaxed text-lg">
                                To empower individuals with instant access to expert medical care, breaking down barriers
                                and ensuring every person receives the healthcare they deserve, when they need it most.
                            </p>
                        </div>

                        {/* Vision */}
                        <div className="mission-card bg-gray-900 rounded-3xl p-10 text-white shadow-2xl">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <FaLightbulb className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl font-black mb-4">Our Vision</h3>
                            <p className="text-white/80 leading-relaxed text-lg">
                                To become the most trusted digital healthcare platform, revolutionizing how people connect with
                                healthcare professionals and creating a future where superior care is always within reach.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20 bg-gray-50 values-section">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
                        <div className="w-20 h-1 bg-[#00A1B0] mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, index) => (
                            <div key={index} className="value-item bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all group">
                                <div className="w-14 h-14 bg-[#00A1B0]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#00A1B0] transition-all">
                                    <div className="text-[#00A1B0] group-hover:text-white transition-all">
                                        {value.icon}
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="bg-gradient-to-r from-[#00A1B0] to-[#008f9c] rounded-3xl p-12 md:p-16 shadow-2xl">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                            Join Thousands of Happy Patients
                        </h2>
                        <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                            Experience the future of healthcare. Book your first consultation today and discover expert care at your fingertips.
                        </p>
                        <button
                            onClick={() => window.location.href = '/doctors'}
                            className="px-8 py-4 bg-white text-[#00A1B0] rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
                        >
                            Get Started Now
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
