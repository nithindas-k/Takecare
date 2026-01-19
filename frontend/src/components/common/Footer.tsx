import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Mail,
    Phone,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Heart,
    ShieldCheck,
    Stethoscope,
    ArrowRight
} from "lucide-react";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1, y: 0,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <footer className="w-full bg-[#002f33] text-white pt-20 pb-8 border-t border-white/5 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00A1B0]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>

            <motion.div
                className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 relative z-10"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                {/* Brand & Mission */}
                <motion.div className="space-y-6" variants={itemVariants}>
                    <div
                        className="flex items-center gap-2.5 cursor-pointer group"
                        onClick={() => handleNavigate('/')}
                    >
                        <motion.div
                            className="bg-[#00A1B0] p-2 rounded-xl shadow-lg shadow-[#00A1B0]/20"
                            whileHover={{ rotate: 15, scale: 1.1 }}
                        >
                            <Stethoscope className="h-6 w-6 text-white" />
                        </motion.div>
                        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent group-hover:to-[#00A1B0] transition-all duration-500">
                            Takecare
                        </span>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                        Connecting you with world-class healthcare professionals instantly. Our mission is to make quality healthcare accessible and affordable for everyone.
                    </p>

                    <div className="flex items-center gap-4">
                        {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                            <motion.a
                                key={i}
                                href="#"
                                className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 transition-all duration-300 relative group overflow-hidden"
                                whileHover={{ y: -5, borderColor: 'rgba(0, 161, 176, 0.5)' }}
                            >
                                <div className="absolute inset-0 bg-[#00A1B0] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <Icon className="w-4.5 h-4.5 relative z-10 group-hover:text-white transition-colors" />
                            </motion.a>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Services */}
                <motion.div variants={itemVariants}>
                    <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <span className="w-1 h-1 bg-[#00A1B0] rounded-full"></span>
                        Quick Links
                    </h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        {[
                            { name: 'Find a Doctor', path: '/doctors' },
                            { name: 'About TakeCare', path: '/about' },
                            { name: 'Contact Us', path: '/contact' },
                            { name: 'Home', path: '/' }
                        ].map((link) => (
                            <li key={link.name}>
                                <button
                                    onClick={() => handleNavigate(link.path)}
                                    className="hover:text-[#00A1B0] flex items-center gap-2 group transition-all duration-300"
                                >
                                    <ArrowRight className="w-0 h-3 group-hover:w-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-[#00A1B0]" />
                                    <span>{link.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Support & Legal */}
                <motion.div variants={itemVariants}>
                    <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <span className="w-1 h-1 bg-[#00A1B0] rounded-full"></span>
                        Account
                    </h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        {[
                            { name: 'My Dashboard', path: '/patient/dashboard' },
                            { name: 'My Appointments', path: '/patient/appointments' },
                            { name: 'My Wallet', path: '/patient/wallet' },
                            { name: 'Profile Settings', path: '/patient/profile-settings' }
                        ].map((link) => (
                            <li key={link.name}>
                                <button
                                    onClick={() => handleNavigate(link.path)}
                                    className="hover:text-[#00A1B0] flex items-center gap-2 group transition-all duration-300 text-left"
                                >
                                    <ArrowRight className="w-0 h-3 group-hover:w-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-[#00A1B0]" />
                                    <span>{link.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Contact Info */}
                <motion.div className="space-y-8" variants={itemVariants}>
                    <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <span className="w-1 h-1 bg-[#00A1B0] rounded-full"></span>
                        Contact
                    </h4>

                    <div className="flex items-start gap-4 group">
                        <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:border-[#00A1B0]/30 group-hover:bg-[#00A1B0]/5 transition-all duration-500">
                            <Mail className="h-5 w-5 text-[#00A1B0]" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Email Us</p>
                            <p className="text-sm text-gray-200 font-medium">support@takecare.com</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                        <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:border-[#00A1B0]/30 group-hover:bg-[#00A1B0]/5 transition-all duration-500">
                            <Phone className="h-5 w-5 text-[#00A1B0]" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">24/7 Helpline</p>
                            <p className="text-sm text-gray-200 font-medium">+91 98765 43210</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Bottom Bar */}
            <motion.div
                className="max-w-7xl mx-auto px-4 pt-10 border-t border-white/5"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                viewport={{ once: true }}
            >
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-2">
                        <span>© {currentYear} TakeCare Healthcare.</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <span>Made with</span>
                            <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
                            <span>for you.</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#00A1B0]/10 rounded-lg border border-[#00A1B0]/20">
                            <ShieldCheck className="h-4 w-4 text-[#00A1B0]" />
                            <span className="text-[#00A1B0] font-bold text-[10px] uppercase tracking-wider">Secure platform</span>
                        </div>
                   
                    </div>
                </div>
            </motion.div>
        </footer>
    );
};

export default Footer;
