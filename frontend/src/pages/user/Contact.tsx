import React, { useState, useEffect } from 'react';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaPaperPlane } from 'react-icons/fa';
import { toast } from 'sonner';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contactService } from '../../services/contactService';

gsap.registerPlugin(ScrollTrigger);

const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Hero Animation
        gsap.fromTo('.contact-hero',
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
        );

        // Contact Cards
        gsap.fromTo('.contact-card',
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.contact-info-section',
                    start: 'top 80%',
                }
            }
        );

        // Form Animation
        gsap.fromTo('.contact-form',
            { x: -30, opacity: 0 },
            {
                x: 0, opacity: 1, duration: 1, ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.form-section',
                    start: 'top 75%',
                }
            }
        );
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await contactService.submitContactForm(formData);

            if (response.success) {
                toast.success(response.message || 'Message sent successfully! We\'ll get back to you soon.');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: ''
                });
            } else {
                toast.error(response.message || 'Failed to send message. Please try again.');
            }
        } catch (error: any) {
            console.error('Error submitting contact form:', error);
            toast.error(error.response?.data?.message || 'An error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactInfo = [
        {
            icon: <FaPhone className="w-6 h-6" />,
            title: 'Phone',
            details: ['+91 9876543210', '+91 9876543211'],
            action: 'Call us anytime'
        },
        {
            icon: <FaEnvelope className="w-6 h-6" />,
            title: 'Email',
            details: ['support@takecare.com', 'info@takecare.com'],
            action: 'Drop us a line'
        },
        {
            icon: <FaClock className="w-6 h-6" />,
            title: '24/7 Availability',
            details: ['Round-the-clock support', 'Consult anytime, anywhere'],
            action: 'Always here for you'
        },
        {
            icon: <FaMapMarkerAlt className="w-6 h-6" />,
            title: 'Service Coverage',
            details: ['Available across India', 'No travel required!'],
            action: '100% Online Platform'
        },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavBar />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#00A1B0] to-[#008f9c] py-20 lg:py-28 px-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl"></div>

                <div className="max-w-6xl mx-auto text-center relative z-10 contact-hero">
                    <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-white/30">
                        Get In Touch
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                        We're Here to Help
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                        Have questions about our services? Need help with a consultation?
                        Our dedicated support team is ready to assist you.
                    </p>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-16 bg-white contact-info-section">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {contactInfo.map((info, index) => (
                            <div key={index} className="contact-card bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all group">
                                <div className="w-14 h-14 bg-[#00A1B0]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#00A1B0] transition-all">
                                    <div className="text-[#00A1B0] group-hover:text-white transition-all">
                                        {info.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{info.title}</h3>
                                {info.details.map((detail, idx) => (
                                    <p key={idx} className="text-sm text-gray-600 mb-1">{detail}</p>
                                ))}
                                <p className="text-xs text-[#00A1B0] font-semibold mt-3">{info.action}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-20 bg-gray-50 form-section">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Left: Info */}
                        <div className="contact-form">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                                Fill out the form below and our team will get back to you within 24 hours.
                                We value your feedback and are committed to providing you with the best support possible.
                            </p>

                            <div className="bg-gradient-to-br from-[#00A1B0] to-[#008f9c] rounded-2xl p-8 text-white shadow-xl">
                                <h3 className="text-2xl font-bold mb-4">Quick Support</h3>
                                <p className="text-white/90 mb-6">
                                    For urgent medical concerns, please contact emergency services or visit your nearest hospital.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <FaPhone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-white/70">24/7 Helpline</p>
                                            <p className="font-bold">1800-XXX-XXXX</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <FaEnvelope className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-white/70">Priority Support</p>
                                            <p className="font-bold">urgent@takecare.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Form */}
                        <div className="contact-form bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00A1B0] focus:ring-2 focus:ring-[#00A1B0]/20 outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00A1B0] focus:ring-2 focus:ring-[#00A1B0]/20 outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00A1B0] focus:ring-2 focus:ring-[#00A1B0]/20 outline-none transition-all"
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-bold text-gray-700 mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00A1B0] focus:ring-2 focus:ring-[#00A1B0]/20 outline-none transition-all"
                                        placeholder="How can we help you?"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00A1B0] focus:ring-2 focus:ring-[#00A1B0]/20 outline-none transition-all resize-none"
                                        placeholder="Tell us more about your inquiry..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-[#00A1B0] to-[#008f9c] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane className="w-4 h-4" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Online Platform Features */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
                        <div className="w-20 h-1 bg-[#00A1B0] mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gradient-to-br from-[#00A1B0] to-[#008f9c] rounded-2xl p-8 text-white text-center shadow-xl">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                                <FaClock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Available 24/7</h3>
                            <p className="text-white/90">Access healthcare anytime, anywhere. No appointments needed for urgent consultations.</p>
                        </div>
                        <div className="bg-gray-900 rounded-2xl p-8 text-white text-center shadow-xl">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                                <FaMapMarkerAlt className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Nationwide Coverage</h3>
                            <p className="text-white/80">Connect with verified doctors across India from the comfort of your home.</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-8 text-white text-center shadow-xl">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                                <FaEnvelope className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Instant Support</h3>
                            <p className="text-white/80">Our support team responds within hours. Emergency? We're just a call away.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Contact;
