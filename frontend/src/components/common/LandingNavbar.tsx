import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingNavbarProps {
    showActions?: boolean;
}

const LandingNavbar: React.FC<LandingNavbarProps> = ({ showActions = true }) => {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                <div className="flex justify-between items-center h-20">
                    <div
                        className="flex flex-col cursor-pointer group select-none transition-all duration-300 transform group-hover:scale-[1.02]"
                        onClick={() => navigate('/')}
                    >
                        <div className="flex items-baseline leading-none">
                            <span className="text-2xl font-bold text-[#0f172a] tracking-tight transition-colors duration-300">
                                Take
                            </span>
                            <span className="text-2xl font-bold text-[#00A1B0] tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(0,161,176,0.4)]">
                                Care
                            </span>
                        </div>
                        <span className="text-[9px] font-medium text-gray-500 tracking-[0.2em] uppercase mt-0.5 ml-0.5 transition-all duration-300 group-hover:text-[#00A1B0] group-hover:tracking-[0.22em]">
                            Healthcare Platform
                        </span>
                    </div>

                    {showActions && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/patient/login')}
                                className="px-4 py-2 text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors"
                            >
                                Sign in
                            </button>
                            <button
                                onClick={() => navigate('/patient/register')}
                                className="px-5 py-2 bg-[#00A1B0] text-white text-sm rounded-lg font-medium hover:bg-[#008f9c] transition-all shadow-sm"
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default LandingNavbar;
