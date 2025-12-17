// src/components/Doctor/DoctorLayout.tsx
import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import DoctorSidebar from "./DoctorSidebar";

interface DoctorLayoutProps {
    children: React.ReactNode;
}

const DoctorLayout: React.FC<DoctorLayoutProps> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <main className="max-w-7xl mx-auto pt-8 pb-14 px-4 flex flex-col lg:flex-row gap-6">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#00A1B0] text-white rounded-full shadow-lg flex items-center justify-center z-30 hover:bg-[#008a97] transition-colors"
                aria-label="Open menu"
            >
                <FaBars className="w-5 h-5" />
            </button>

            {/* Sidebar - Hidden on mobile in static layout, shown via drawer */}
            <div className="w-full lg:w-[300px] flex-shrink-0">
                <DoctorSidebar
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

export default DoctorLayout;
