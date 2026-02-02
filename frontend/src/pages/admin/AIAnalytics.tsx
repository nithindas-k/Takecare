import { useState } from "react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { motion, AnimatePresence } from "framer-motion";
import { AIInsightHub } from "../../components/admin/AIInsightHub";

const AIAnalytics = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50 no-scrollbar">
            <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
                <Sidebar />
            </div>

            <AnimatePresence>
                {sidebarOpen && (
                    <div className="fixed inset-0 z-[60] lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: -256 }}
                            animate={{ x: 0 }}
                            exit={{ x: -256 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl"
                        >
                            <Sidebar onMobileClose={() => setSidebarOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
                <TopNav onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
                    <div className="w-full max-w-7xl mx-auto">
                        <div className="bg-gradient-to-r from-[#00A1B0]/10 via-cyan-50 to-teal-50 rounded-lg py-6 sm:py-8 md:py-10 mb-6 text-center border border-[#00A1B0]/20">
                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#00A1B0] to-cyan-600 bg-clip-text text-transparent">
                                AI Business Analytics
                            </h1>
                            <p className="text-gray-600 mt-2 text-sm sm:text-base">
                                Intelligent insights powered by AI
                            </p>
                        </div>

                        <AIInsightHub />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AIAnalytics;
