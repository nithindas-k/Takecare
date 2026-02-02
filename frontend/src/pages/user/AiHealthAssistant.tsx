import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, RefreshCcw, Stethoscope, User, Sparkles, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { aiService } from "../../services/aiService";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import NavBar from "../../components/common/NavBar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { Separator } from "../../components/ui/separator";
import { API_BASE_URL } from "../../utils/constants";

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
    specialty?: string;
    questions?: string[];
    recommendedDoctors?: Array<{
        id: string;
        name: string;
        specialty: string;
        image?: string;
        matchReason: string;
    }>;
    timestamp: Date;
}

const AiHealthAssistant: React.FC = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            sender: "ai",
            text: "Welcome to the TakeCare Health Assistant. Please describe your symptoms or health concerns in detail. I will analyze your input and help guide you to the appropriate medical specialist.",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const getImageUrl = (imagePath?: string | null) => {
        if (!imagePath) return "/doctor.png";
        if (imagePath.startsWith("http")) return imagePath;
        return `${API_BASE_URL}/${imagePath.replace(/\\/g, "/")}`;
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (textOverride?: string) => {
        const messageText = textOverride || inputValue;
        if (!messageText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: messageText,
            timestamp: new Date(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputValue("");
        setIsTyping(true);

        try {
            // Convert messages to history format for AI
            const history = newMessages.map(m => ({
                role: m.sender,
                text: m.text
            }));

            const result = await aiService.checkSymptoms(userMsg.text, history);

            if (!result || !result.reply) {
                throw new Error("Invalid AI response");
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: result.reply,
                specialty: result.specialty,
                questions: result.questions,
                recommendedDoctors: result.recommendedDoctors,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Chat Error:", error);
            toast.error("Systems are currently busy. Please try describing your symptoms again.");
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#00A1B0]/10">
            <NavBar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar section */}
                    <div className="w-full lg:w-[280px] flex-shrink-0">
                        <PatientSidebar />
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1 flex flex-col h-[600px] lg:h-[calc(100vh-160px)]">
                        <Card className="flex-1 flex flex-col shadow-sm border-slate-200 rounded-xl overflow-hidden bg-white">
                            {/* Professional Header */}
                            <CardHeader className="border-b border-slate-100 bg-white px-4 sm:px-6 py-4 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#00A1B0] flex items-center justify-center text-white shrink-0">
                                        <Bot size={20} className="sm:hidden" />
                                        <Bot size={24} strokeWidth={2.5} className="hidden sm:block" />
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 truncate">
                                            Health AI
                                            <span className="inline-flex items-center rounded-md bg-[#00A1B0]/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-[#00A1B0] border border-[#00A1B0]/20">
                                                Active
                                            </span>
                                        </CardTitle>
                                        <CardDescription className="text-[10px] font-medium text-slate-500 uppercase tracking-widest truncate">
                                            Medical Guidance
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setMessages([messages[0]])}
                                                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <RefreshCcw size={16} className="sm:hidden" />
                                                    <RefreshCcw size={18} className="hidden sm:block" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Reset conversation</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <Separator orientation="vertical" className="mx-1 h-6 hidden sm:block" />

                                    <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 rounded-lg border-slate-200 text-slate-600 font-semibold h-9">
                                        <Info size={14} /> Help
                                    </Button>
                                </div>
                            </CardHeader>

                            {/* Chat Workspace */}
                            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/20">
                                <div className="h-full overflow-y-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 scrollbar-thin overflow-x-hidden">
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                <div className={`flex items-start gap-2.5 sm:gap-4 max-w-[95%] sm:max-w-[80%] lg:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>

                                                    {/* Clean Avatars */}
                                                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center flex-shrink-0 border shadow-sm ${msg.sender === 'user'
                                                        ? 'bg-slate-800 border-slate-700 text-white'
                                                        : 'bg-white border-slate-200 text-[#00A1B0]'
                                                        }`}>
                                                        {msg.sender === 'user' ? <User size={15} className="sm:size-[18px]" /> : <Bot size={17} className="sm:size-[20px]" />}
                                                    </div>

                                                    {/* Clean Message Bubbles */}
                                                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                                        <div className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-[13.5px] sm:text-[14.5px] leading-relaxed border break-words overflow-hidden ${msg.sender === "user"
                                                            ? "bg-slate-800 border-slate-700 text-slate-50 rounded-tr-none"
                                                            : "bg-white border-slate-200 text-slate-700 shadow-sm rounded-tl-none"
                                                            }`}>
                                                            {msg.text}

                                                            {/* AI Clarifying Questions */}
                                                            {msg.questions && msg.questions.length > 0 && (
                                                                <div className="mt-3 flex flex-col gap-2">
                                                                    {msg.questions.map((q, i) => (
                                                                        <Button
                                                                            key={i}
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleSendMessage(q)}
                                                                            className="text-[12px] sm:text-[13px] bg-slate-50 border-slate-200 hover:bg-white hover:border-[#00A1B0] hover:text-[#00A1B0] transition-all rounded-xl min-h-[32px] h-auto py-2 px-3 text-left justify-start whitespace-normal leading-tight"
                                                                        >
                                                                            {q}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Clinical Recommendation Cards */}
                                                            {msg.recommendedDoctors && msg.recommendedDoctors.length > 0 && (
                                                                <div className="mt-4 space-y-3">
                                                                    {msg.recommendedDoctors.map((doc, i) => (
                                                                        <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-[#00A1B0]/50 transition-colors">
                                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#00A1B0] overflow-hidden">
                                                                                        {doc.image ? (
                                                                                            <img
                                                                                                src={getImageUrl(doc.image)}
                                                                                                alt={doc.name}
                                                                                                className="w-full h-full object-cover"
                                                                                                onError={(e) => { e.currentTarget.src = "/doctor.png"; }}
                                                                                            />
                                                                                        ) : (
                                                                                            <Stethoscope size={24} />
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                                                            Specialist Match Found
                                                                                        </p>
                                                                                        <p className="font-bold text-slate-900 text-[14px]">
                                                                                            Dr. {doc.name}
                                                                                        </p>
                                                                                        <p className="text-xs text-slate-500 font-medium">
                                                                                            {doc.specialty}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <Button
                                                                                    onClick={() => navigate(`/doctors/${doc.id}`)}
                                                                                    className="w-full sm:w-auto bg-[#00A1B0] hover:bg-[#008f9c] text-white font-bold h-9 px-4 rounded-lg transition-all"
                                                                                >
                                                                                    View Profile
                                                                                </Button>
                                                                            </div>
                                                                            <p className="mt-3 text-[11px] text-slate-500 italic bg-white/50 p-2 rounded border border-slate-100">
                                                                                "{doc.matchReason}"
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Specialty Fallback */}
                                                            {msg.specialty && (!msg.recommendedDoctors || msg.recommendedDoctors.length === 0) && (
                                                                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#00A1B0]">
                                                                                <Stethoscope size={20} />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                                                    Recommended Specialty
                                                                                </p>
                                                                                <p className="font-bold text-slate-900 text-[14px]">
                                                                                    {msg.specialty}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            onClick={() => navigate(`/doctors?specialty=${msg.specialty}`)}
                                                                            className="w-full sm:w-auto bg-[#00A1B0] hover:bg-[#008f9c] text-white font-bold h-9 px-4 rounded-lg transition-all"
                                                                        >
                                                                            View Doctors
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {msg.sender === 'ai' && <Sparkles size={10} className="text-[#00A1B0]/50" />}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {isTyping && (
                                        <div className="flex items-start gap-2.5 animate-in fade-in duration-300">
                                            <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[#00A1B0] shadow-sm">
                                                <Bot size={17} />
                                            </div>
                                            <div className="bg-white border border-slate-200 p-2.5 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center h-9 px-4">
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </CardContent>

                            {/* Precise Input Area */}
                            <CardFooter className="p-2 sm:p-4 border-t border-slate-100 flex-col gap-2 sm:gap-3 bg-white">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                    className="w-full flex items-center gap-2"
                                >
                                    <Input
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="How can I help you today?"
                                        className="flex-1 bg-slate-50 border-slate-200 h-10 sm:h-11 px-3 sm:px-4 text-[14px] sm:text-[14.5px] text-slate-700 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00A1B0] transition-all rounded-xl"
                                        autoFocus
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!inputValue.trim() || isTyping}
                                        className="h-10 w-10 sm:h-11 sm:w-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl flex-shrink-0 flex items-center justify-center p-0 shadow-sm transition-all active:scale-95"
                                    >
                                        <Send size={18} />
                                    </Button>
                                </form>

                                <div className="flex items-center gap-2 px-2.5 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 border-dashed rounded-lg w-full">
                                    <AlertCircle className="h-3.5 w-3.5 text-[#00A1B0]" />
                                    <p className="text-[9px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-tight leading-none">
                                        Independent AI Analysis | Not for Emergencies
                                    </p>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiHealthAssistant;
