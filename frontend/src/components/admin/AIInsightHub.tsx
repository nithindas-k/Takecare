import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { aiService } from '../../services/aiService';
import type { AdminQueryResponse } from '../../services/aiService';
import {
    Sparkles,
    TrendingUp,
    Users,
    BarChart3,
    Send,
    Bot,
    User as UserIcon,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    data?: AdminQueryResponse;
}

export const AIInsightHub: React.FC = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            type: 'ai',
            content: "👋 Hi! I'm your TakeCare AI Business Analyst. I have access to your entire platform database and can help you with insights about revenue, doctors, patients, appointments, and trends. What would you like to know?",
            timestamp: new Date(),
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const quickPrompts = [
        { icon: TrendingUp, label: 'Top Doctors', query: 'Who are the top performing doctors?' },
        { icon: Users, label: 'User Stats', query: 'How many active users do we have?' },
        { icon: BarChart3, label: 'Appointments', query: 'What are the appointment booking trends?' },
        { icon: Sparkles, label: 'Platform Health', query: 'Give me an overview of platform performance' }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (queryText?: string) => {
        const messageText = queryText || input.trim();

        if (!messageText) {
            toast.error('Please enter a message');
            return;
        }

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Always send to real AI - no local responses
            const aiResponse = await aiService.analyzeAdminQuery(messageText);
            const aiContent = aiResponse.answer;

            // Add AI response
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: aiContent,
                timestamp: new Date(),
                data: aiResponse
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            console.error('AI Query Error:', error);

            // Add error message
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question.",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
            toast.error(error.response?.data?.message || 'Failed to get AI response');
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[900px]">
            {/* Quick Prompts */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {quickPrompts.map((prompt, idx) => (
                    <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(prompt.query)}
                        className="flex-shrink-0 hover:bg-[#00A1B0]/5 hover:border-[#00A1B0] transition-all group"
                    >
                        <prompt.icon className="w-4 h-4 mr-2 text-[#00A1B0]" />
                        <span className="text-xs font-medium">{prompt.label}</span>
                    </Button>
                ))}
            </div>

            {/* Chat Messages */}
            <Card className="flex-1 flex flex-col border-[#00A1B0]/20 overflow-hidden bg-white shadow-xl">
                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scrollbar-thin">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 sm:gap-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform hover:scale-105 ${message.type === 'ai'
                                ? 'bg-gradient-to-br from-[#00A1B0] to-cyan-600'
                                : 'bg-slate-800'
                                }`}>
                                {message.type === 'ai' ? (
                                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                ) : (
                                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                )}
                            </div>

                            {/* Message Content */}
                            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[65%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.type === 'ai'
                                    ? 'bg-slate-50 text-slate-800 border border-slate-100/50 rounded-tl-none'
                                    : 'bg-[#00A1B0] text-white shadow-lg shadow-[#00A1B0]/10 rounded-tr-none'
                                    }`}>
                                    <p className="text-xs sm:text-[14.5px] font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                </div>

                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 px-1 uppercase tracking-widest opacity-60">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex gap-3 sm:gap-4">
                            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#00A1B0] to-cyan-600 flex items-center justify-center shadow-sm">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm">
                                <div className="flex gap-1.5 items-center h-full">
                                    <div className="w-2 h-2 bg-[#00A1B0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-[#00A1B0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-[#00A1B0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </CardContent>

                {/* Input Area */}
                <div className="border-t border-slate-100 p-4 sm:p-6 bg-white">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        textarea::-webkit-resizer {
                            display: none;
                        }
                    `}} />
                    <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4 items-center">
                        <div className="flex-1 relative flex items-center">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Inquire about business metrics..."
                                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/30 px-5 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#00A1B0]/20 focus:border-[#00A1B0] focus:bg-white text-sm transition-all duration-300"
                                rows={1}
                                style={{
                                    minHeight: '52px',
                                    maxHeight: '160px',
                                    height: 'auto',
                                    scrollbarWidth: 'none'
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                }}
                            />
                            <div className="absolute right-4 text-[#00A1B0]/30 pointer-events-none group-hover:text-[#00A1B0]/60 transition-colors">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                        <Button
                            onClick={() => handleSend()}
                            disabled={isTyping || !input.trim()}
                            className="bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-2xl w-12 h-12 sm:w-20 transition-all shadow-xl shadow-[#00A1B0]/20 flex-shrink-0 active:scale-90"
                        >
                            {isTyping ? (
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                            ) : (
                                <Send className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
                            )}
                        </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
                        <div className="h-[1px] w-8 bg-slate-200"></div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em]">
                            TakeCare Intelligence Hub
                        </p>
                        <div className="h-[1px] w-8 bg-slate-200"></div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
