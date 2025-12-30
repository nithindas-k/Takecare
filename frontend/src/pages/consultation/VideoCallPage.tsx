import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaMicrophone, FaMicrophoneSlash,
    FaVideo, FaVideoSlash,
    FaPhoneSlash, FaStickyNote,
    FaUser, FaTimes, FaPlus, FaSave, FaChevronLeft
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

const VideoCallPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [savedNotes, setSavedNotes] = useState([
        { id: 1, text: "Patient reported mild fatigue.", time: "2:15 PM" },
    ]);

    const handleSaveNote = () => {
        if (!noteText.trim()) return;
        setSavedNotes([{ id: Date.now(), text: noteText, time: "Just now" }, ...savedNotes]);
        setNoteText("");
    };

    return (
        <div className="h-screen w-screen bg-[#FDFDFD] overflow-hidden font-sans text-gray-800 flex flex-col">
            {/* Responsive Header */}
            <header className="px-4 md:px-8 py-3 md:py-4 flex justify-between items-center bg-white border-b border-gray-100 z-50">
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-50 rounded-full text-gray-400"
                    >
                        <FaChevronLeft size={16} />
                    </button>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#00A1B0]/10 flex items-center justify-center">
                        <FaUser className="text-[#00A1B0]" size={14} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 leading-tight">Sarah Jenkins</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">Ongoing Session • {id?.slice(0, 8) || "CON-8291"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="px-2 md:px-3 py-1 bg-red-50 text-red-500 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 md:gap-2 border border-red-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        Live
                    </div>
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className={`p-2 md:p-2.5 rounded-xl transition-all shadow-sm ${showNotes ? 'bg-[#00A1B0] text-white shadow-[#00A1B0]/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'
                            }`}
                        title="Toggle Notes"
                    >
                        <FaStickyNote size={16} />
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 relative flex flex-col lg:flex-row p-4 md:p-6 gap-4 md:gap-6 overflow-hidden">
                {/* Main Viewport */}
                <div className="flex-1 relative bg-gray-50 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner group">
                    <img
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1600"
                        className="w-full h-full object-cover"
                        alt="Patient"
                    />

                    {/* Floating Self View - Mobile Responsive Position */}
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 w-32 md:w-48 aspect-video md:aspect-video bg-gray-200 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 md:border-4 border-white transition-all">
                        {isCamOff ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                <FaVideoSlash size={20} />
                            </div>
                        ) : (
                            <img
                                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800"
                                className="w-full h-full object-cover"
                                alt="Self"
                            />
                        )}
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/30 backdrop-blur-md rounded-md text-[7px] md:text-[8px] font-bold text-white uppercase">
                            You
                        </div>
                    </div>

                    {/* Controls Bar - Mobile Responsive Layout */}
                    <div className="absolute bottom-6 md:bottom-10 left-0 right-0 px-4 flex justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-2xl px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-white flex items-center gap-4 md:gap-6 pointer-events-auto">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-50 text-red-500 shadow-inner' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
                            </button>

                            <button
                                onClick={() => navigate(-1)}
                                className="w-14 h-14 md:w-16 md:h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200 hover:bg-red-600 transition-all hover:scale-110 active:scale-95 border-4 border-white"
                            >
                                <FaPhoneSlash size={24} />
                            </button>

                            <button
                                onClick={() => setIsCamOff(!isCamOff)}
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isCamOff ? 'bg-red-50 text-red-500 shadow-inner' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {isCamOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Notes - Improved Mobile (Drawer style below) */}
                <AnimatePresence>
                    {showNotes && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0, scale: 0.95 }}
                            animate={{
                                width: window.innerWidth < 1024 ? '100%' : 380,
                                opacity: 1,
                                scale: 1
                            }}
                            exit={{ width: 0, opacity: 0, scale: 0.95 }}
                            className="h-full bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 flex flex-col shadow-sm relative overflow-hidden"
                        >
                            <div className="p-5 md:p-6 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                    <FaStickyNote className="text-[#00A1B0]" size={14} />
                                    Observations
                                </h3>
                                <button onClick={() => setShowNotes(false)} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-300 hover:text-red-500 transition-colors">
                                    <FaTimes size={12} />
                                </button>
                            </div>

                            <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-6 flex flex-col">
                                <div className="space-y-4">
                                    <textarea
                                        className="w-full bg-gray-50 rounded-xl md:rounded-2xl p-4 border border-gray-100 focus:ring-2 focus:ring-[#00A1B0]/20 focus:bg-white focus:border-[#00A1B0]/30 text-sm h-32 md:h-40 resize-none placeholder:text-gray-300 transition-all outline-none"
                                        placeholder="Record diagnosis, prescription, or clinical findings..."
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveNote}
                                            className="flex-1 bg-[#00A1B0] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#008f9c] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#00A1B0]/20"
                                        >
                                            <FaPlus /> Post Note
                                        </button>
                                        <button className="w-12 h-12 bg-white border border-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all">
                                            <FaSave size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-50 flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Session History</p>
                                    <div className="space-y-3">
                                        {savedNotes.length === 0 ? (
                                            <div className="text-center py-10">
                                                <p className="text-xs text-gray-300 italic">No entries yet</p>
                                            </div>
                                        ) : (
                                            savedNotes.map(note => (
                                                <div key={note.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 hover:bg-white hover:border-[#00A1B0]/10 transition-all group">
                                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{note.text}</p>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{note.time}</p>
                                                        <button className="text-[9px] text-[#00A1B0] font-bold opacity-0 group-hover:opacity-100 hover:underline transition-opacity">EDIT</button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default VideoCallPage;
