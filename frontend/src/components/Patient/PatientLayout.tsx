import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import PatientSidebar from "./PatientSidebar";

interface PatientLayoutProps {
    children: React.ReactNode;
}

const PatientLayout: React.FC<PatientLayoutProps> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <main className="max-w-7xl mx-auto pt-8 pb-14 px-4 flex flex-col lg:flex-row gap-8">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#00A1B0] text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-[#008a97] transition-all active:scale-95"
                aria-label="Open menu"
            >
                <FaBars className="w-5 h-5" />
            </button>

            {/* Sidebar Container */}
            <div className="w-full lg:w-[280px] flex-shrink-0">
                <PatientSidebar
                    isMobileMenuOpen={isMobileMenuOpen}
                    onMobileMenuClose={() => setIsMobileMenuOpen(false)}
                />
            </div>

            {/* Main Content */}
            <section className="flex-1 min-w-0">
                {children}
            </section>
        </main>
    );
};

export default PatientLayout;
