import React, { useState, useEffect, useRef } from "react";
import { ArrowUp, User, Bot, RefreshCcw, LoaderIcon, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { aiService } from "@/services/aiService";
import type { ChatMessage, AIChatResponse } from "@/services/aiService";
import { useNavigate } from "react-router-dom";

const AIDoctorMatcher: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const loadHistory = async () => {
        try {
            const history = await aiService.getHistory();
            if (history.length === 0) {
                setMessages([
                    {
                        role: "assistant",
                        content: "Hello! I'm MediMatch AI, your personal health assistant. I can help you find the most suitable doctors based on your symptoms and preferences. How can I help you today?",
                    },
                ]);
            } else {
                setMessages(history);
            }
        } catch (error) {
            console.error("Error loading history:", error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response: AIChatResponse = await aiService.sendMessage(userMessage.content);

            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: response.message,
                recommendations: response.recommendations
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        setIsLoading(true);
        try {
            await aiService.resetConversation();
            setMessages([
                {
                    role: "assistant",
                    content: "Conversation has been reset. How can I help you find the right doctor today?",
                },
            ]);
        } catch (error) {
            console.error("Error resetting conversation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[700px] max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-cyan-600 p-4 sm:p-5 flex justify-between items-center text-white border-b border-cyan-700">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2.5 rounded-lg">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-base sm:text-lg">MediMatch AI</h2>
                        <p className="text-[10px] sm:text-xs text-white/90 flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse"></span>
                            AI Health Assistant
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 transition-colors"
                    onClick={handleReset}
                    title="Reset Conversation"
                >
                    <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
            </div>

            {/* Chat Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white custom-scrollbar"
            >
                {messages.map((msg, index) => (
                    <div key={index} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Message Bubble */}
                        <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {/* AI Avatar on Left */}
                            {msg.role === "assistant" && (
                                <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                                    <AvatarFallback className="bg-teal-600 text-white">
                                        <Bot className="w-5 h-5" />
                                    </AvatarFallback>
                                </Avatar>
                            )}

                            {/* Message Content */}
                            <div className={`max-w-[75%] sm:max-w-[65%]`}>
                                <div className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-sm sm:text-base leading-relaxed ${msg.role === "user"
                                    ? "bg-gray-900 text-white rounded-br-sm"
                                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>

                            {/* User Avatar on Right */}
                            {msg.role === "user" && (
                                <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                                    <AvatarFallback className="bg-cyan-600 text-white">
                                        <User className="w-5 h-5" />
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>

                        {/* Doctor Recommendations */}
                        {msg.recommendations && msg.recommendations.doctorMatches.length > 0 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                <div className="flex items-center gap-3">
                                    <Separator className="flex-1" />
                                    <Badge variant="outline" className="text-xs sm:text-sm text-cyan-700 border-cyan-200 bg-cyan-50 px-3 py-1">
                                        Recommended Doctors
                                    </Badge>
                                    <Separator className="flex-1" />
                                </div>

                                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                    {msg.recommendations.doctorMatches.map((match, idx) => (
                                        <Card
                                            key={idx}
                                            className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-cyan-300"
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-gray-100 group-hover:border-cyan-200 transition-colors">
                                                        <AvatarImage src={match.profileImage} alt={match.name} />
                                                        <AvatarFallback className="bg-cyan-100 text-cyan-700 text-lg font-bold">
                                                            {match.name?.charAt(0) || "D"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm sm:text-base text-gray-900 truncate mb-1">
                                                            {match.name || "Doctor"}
                                                        </h4>
                                                        <p className="text-xs sm:text-sm text-cyan-600 font-medium mb-2">
                                                            {match.specialty}
                                                        </p>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] sm:text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200 border"
                                                        >
                                                            {match.matchScore}% Match
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="w-full text-xs sm:text-sm h-8 sm:h-9 bg-cyan-600 hover:bg-cyan-700 transition-colors"
                                                    onClick={() => navigate(`/doctors/${match.doctorId}`)}
                                                >
                                                    View Profile
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Emergency Alert */}
                                {msg.recommendations.emergencyFlag && (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 flex gap-3 text-red-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                        <div className="text-xs sm:text-sm">
                                            <p className="font-bold mb-1">⚠️ Emergency Detected</p>
                                            <p>Please seek immediate medical attention or call emergency services.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                            <AvatarFallback className="bg-teal-600 text-white">
                                <Bot className="w-5 h-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-2.5">
                            <LoaderIcon className="w-4 h-4 animate-spin text-gray-600" />
                            <span className="text-xs sm:text-sm text-gray-600">Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t bg-white">
                <div className="relative max-w-4xl mx-auto">
                    <Input
                        placeholder="Describe your symptoms (e.g., I have back pain...)"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !isLoading && input.trim() && handleSend()}
                        className="w-full bg-white border-2 border-gray-300 focus:border-cyan-500 focus:ring-0 text-sm sm:text-base h-12 sm:h-14 rounded-full pl-4 sm:pl-6 pr-14 sm:pr-16 transition-all shadow-sm"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 transition-colors rounded-full w-9 h-9 sm:w-11 sm:h-11 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {isLoading ? (
                            <LoaderIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
                        ) : (
                            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        )}
                    </Button>
                </div>
                <p className="text-[9px] sm:text-[10px] text-gray-500 text-center mt-3 uppercase tracking-wider font-medium">
                    AI recommendations are for guidance only. Always consult a qualified professional.
                </p>
            </div>
        </div>
    );
};

export default AIDoctorMatcher;
