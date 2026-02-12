'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, MessageSquare, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    context: string;
    isOpen: boolean;
    onToggle: (isOpen: boolean) => void;
}

export default function ChatInterface({ context, isOpen, onToggle }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    chatHistory: newMessages.slice(0, -1), // Send history except the last message
                    context: context,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to get response');

            setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: "Error: " + (error.message || 'Something went wrong.') },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="flex flex-col h-[550px] w-[350px] sm:w-[420px] glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500 mb-6 bg-white/80 dark:bg-slate-900/80">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-primary/10 flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm tracking-tight">Mastery Assistant</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Insight Engine</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onToggle(false)}
                            className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30 dark:bg-slate-950/20"
                    >
                        {messages.length === 0 && !loading && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                                <div className="w-16 h-16 rounded-[2rem] bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
                                    <Bot className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-slate-900 dark:text-white text-sm font-black">Ready to expand your knowledge</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ask anything about this document</p>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary text-white rounded-tr-none font-bold'
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700 font-medium'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 max-w-[85%] items-center text-primary">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Assistant Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-5 bg-white/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 backdrop-blur-md">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Inquire about a concept..."
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white font-medium shadow-inner"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="w-12 h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary/20 flex-shrink-0"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => onToggle(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group ${isOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rotate-90' : 'bg-indigo-600 text-white'
                    }`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                    </div>
                )}
            </button>
        </div>
    );
}
