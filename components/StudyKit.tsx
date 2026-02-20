'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Copy, Check, ChevronDown, BookOpen, Brain, HelpCircle,
    Network, Trophy, XCircle, CheckCircle, Layout, Layers,
    Tag, Download, FileText, Loader2, Sparkles, Volume2,
    VolumeX, Share2, Printer, Eye, EyeOff, Play, Pause, Search, Lightbulb,
    Edit3, Send, MessageSquare, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Flashcards from './Flashcards';
import MermaidChart from './MermaidChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface QuizQuestion {
    question: string;
    options: string[];
    correctOptionIndex: number;
    // SRS Data
    srsBox?: number; // 1-5 (Leitner System)
    nextReviewDate?: number; // Timestamp
    lastReviewed?: number; // Timestamp
}

export interface StudyKitData {
    id?: string;
    summary: string;
    analogies: string[];
    keyTerms: { term: string; definition: string }[];
    mnemonics: { concept: string; mnemonic: string; type: string }[];
    reflectionQuestions: string[];
    sources: string[];
    quiz: QuizQuestion[];
    mindMap: string;
}

interface StudyKitProps {
    data: StudyKitData;
    context?: string;
    onExplore?: (term: string) => void;
    onUpdate?: (data: StudyKitData) => void;
}

interface Section {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
    color: string;
}

export default function StudyKit({ data, context, onExplore, onUpdate }: StudyKitProps) {
    const [viewMode, setViewMode] = useState<'quiz' | 'flashcards'>('quiz');
    const [activeTab, setActiveTab] = useState('summary');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingTextId, setSpeakingTextId] = useState<string | null>(null);
    const [charIndex, setCharIndex] = useState(0);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [focusedSection, setFocusedSection] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: "Hi! I'm your study assistant. Ask me anything about this material!" }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);

    if (!data) return null;

    // Stop all audio on unmount
    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, []);

    const handleSpeech = (text: string, id: string = 'summary') => {

        if (isSpeaking && speakingTextId === id) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setSpeakingTextId(null);
            setCharIndex(0);
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
        }

        // Strip some common markdown for cleaner speech
        const cleanText = text.replace(/[*_#>`~]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                setCharIndex(event.charIndex);
            }
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setSpeakingTextId(null);
            setCharIndex(0);
        };

        speechRef.current = utterance;
        setIsSpeaking(true);
        setSpeakingTextId(id);
        window.speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    chatHistory: chatMessages.slice(-5),
                    context: context || data.summary
                })
            });
            const chatData = await res.json();
            setChatMessages(prev => [...prev, { role: 'assistant', content: chatData.response }]);
        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the AI. Please try again." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleExportMarkdown = () => {
        let md = `# Study Kit: ${data.summary.substring(0, 50)}...\n\n`;
        md += `## Summary\n${data.summary}\n\n`;

        md += `## Key Terms\n`;
        data.keyTerms?.forEach(tk => {
            md += `- **${tk.term}**: ${tk.definition}\n`;
        });
        md += `\n`;

        md += `## Mnemonics\n`;
        data.mnemonics?.forEach(m => {
            md += `- **${m.concept}** (${m.type}): ${m.mnemonic}\n`;
        });
        md += `\n`;

        md += `## Reflection Questions\n`;
        data.reflectionQuestions?.forEach(q => {
            md += `- ${q}\n`;
        });
        md += `\n`;

        md += `## Sources\n`;
        data.sources?.forEach(s => md += `- ${s}\n`);
        md += `\n`;

        md += `## Analogies\n`;
        data.analogies.forEach(a => md += `- ${a}\n`);
        md += `\n`;

        md += `## Quiz\n`;
        data.quiz.forEach((q, i) => {
            md += `${i + 1}. ${q.question}\n`;
            q.options.forEach((o, oi) => md += `   - ${o}${oi === q.correctOptionIndex ? ' (Correct)' : ''}\n`);
            md += `\n`;
        });

        md += `## Mind Map\n${data.mindMap}\n`;

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `StudyKit-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = async () => {
        const element = document.getElementById('study-kit-content');
        if (!element) return;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: null
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`StudyKit-${Date.now()}.pdf`);
    };

    const handleExportAnki = () => {
        let csv = "Question,Answer\n";
        data.quiz.forEach(q => {
            const question = `"${q.question.replace(/"/g, '""')}"`;
            const answer = `"${q.options[q.correctOptionIndex].replace(/"/g, '""')}"`;
            csv += `${question},${answer}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Anki-Flashcards-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const sections: Section[] = [
        {
            id: 'summary',
            title: 'Summary',
            color: 'blue',
            icon: <BookOpen className="w-4 h-4" />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Executive Summary</h3>
                        </div>
                        <button
                            onClick={() => handleSpeech(data.summary, 'summary')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all uppercase tracking-[0.15em] border ${speakingTextId === 'summary' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-800/20 hover:bg-blue-100'}`}
                        >
                            {speakingTextId === 'summary' ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            {speakingTextId === 'summary' ? 'Stop Audio' : 'Play Briefing'}
                        </button>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-lg font-medium selection:bg-blue-100 dark:selection:bg-blue-900/30">
                        {speakingTextId === 'summary' ? (
                            <SpeechHighlighter text={data.summary} charIndex={charIndex} />
                        ) : (
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {data.summary}
                            </ReactMarkdown>
                        )}
                    </div>
                </motion.div>
            )
        },
        {
            id: 'terms',
            title: 'Concepts',
            color: 'teal',
            icon: <Tag className="w-4 h-4" />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    {data.keyTerms.map((term, i) => (
                        <div key={i} className="p-6 glass-panel rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 transition-all group/term bg-white/40 dark:bg-slate-900/40 shadow-sm relative">
                            <div className="flex justify-between items-start mb-3">
                                <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    <div className="p-1.5 bg-teal-500/10 rounded-lg">
                                        <Tag className="w-3 h-3 text-teal-600" />
                                    </div>
                                    <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {term.term}
                                    </ReactMarkdown>
                                </div>
                                <button
                                    onClick={() => handleSpeech(term.definition, `term-${i}`)}
                                    className={`p-2 rounded-lg transition-all ${speakingTextId === `term-${i}` ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'}`}
                                >
                                    {speakingTextId === `term-${i}` ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {term.definition}
                                </ReactMarkdown>

                                {onExplore && (
                                    <button
                                        onClick={() => onExplore(term.term)}
                                        className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors group/btn opacity-60 hover:opacity-100"
                                        title="Generate new study kit for this concept"
                                    >
                                        <Search className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                                        Deep Dive
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )
        },
        {
            id: 'mnemonics',
            title: 'Mnemonics',
            color: 'amber',
            icon: <Lightbulb className="w-4 h-4" />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {data.mnemonics?.map((m, i) => (
                        <div key={i} className="group relative p-8 glass-panel rounded-[2.5rem] border border-amber-100 dark:border-amber-900/20 bg-amber-50/30 dark:bg-amber-900/5 hover:bg-amber-100/50 dark:hover:bg-amber-900/10 transition-all overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-500/10 rounded-xl">
                                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">{m.type}</span>
                            </div>

                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{m.concept}</h4>
                            <div className="text-lg text-slate-700 dark:text-slate-300 font-bold leading-relaxed italic border-l-4 border-amber-500 pl-4 py-1">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {m.mnemonic}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )
        },
        {
            id: 'analogies',
            title: 'Analogies',
            color: 'purple',
            icon: <Brain className="w-4 h-4" />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                >
                    {data.analogies.map((analogy, i) => (
                        <div key={i} className="flex gap-6 p-8 glass-panel rounded-[2.5rem] border border-purple-100 dark:border-purple-900/20 bg-purple-50/30 dark:bg-purple-900/5">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center flex-shrink-0 font-black text-xl shadow-lg shadow-purple-500/20">
                                A
                            </div>
                            <div className="text-lg text-slate-700 dark:text-slate-200 font-bold italic self-center leading-snug">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {analogy}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )
        },
        {
            id: 'reflection',
            title: 'Reflect',
            color: 'rose',
            icon: <Edit3 className="w-4 h-4" />,
            content: (
                <ReflectionComponent questions={data.reflectionQuestions} context={context || data.summary} />
            )
        },
        {
            id: 'practice',
            title: 'Practice',
            color: 'orange',
            icon: <HelpCircle className="w-4 h-4" />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                >
                    <div className="flex items-center justify-center p-1.5 bg-slate-100 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] w-fit mx-auto border border-slate-200 dark:border-slate-700 shadow-inner">
                        <button
                            onClick={() => setViewMode('quiz')}
                            className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all tracking-widest ${viewMode === 'quiz' ? 'bg-white dark:bg-slate-700 shadow-lg text-primary scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layout className="w-3.5 h-3.5" />
                            MODULE TEST
                        </button>
                        <button
                            onClick={() => setViewMode('flashcards')}
                            className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all tracking-widest ${viewMode === 'flashcards' ? 'bg-white dark:bg-slate-700 shadow-lg text-primary scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            SPACED RECALL
                        </button>
                    </div>

                    <div className="mt-8">
                        {viewMode === 'quiz' ? <QuizComponent questions={data.quiz} /> : <Flashcards questions={data.quiz} data={data} onUpdate={onUpdate} />}
                    </div>
                </motion.div>
            )
        },
        {
            id: 'mindmap',
            title: 'Schema',
            color: 'green',
            icon: <Network className="w-4 h-4" />,
            content: (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full glass-panel rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-12 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
                >
                    <MermaidChart chart={data.mindMap} />
                </motion.div>
            )
        }
    ].filter(s => s.content);

    const activeSection = sections.find(s => s.id === focusedSection);

    return (
        <div className="w-full max-w-6xl space-y-12 mt-12 mb-32 relative">
            {/* Premium Header/Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-6 p-8 glass-panel rounded-[3rem] bg-white/60 dark:bg-slate-900/60 shadow-xl border border-white/20 dark:border-slate-800/20"
            >
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center shadow-inner overflow-hidden relative group">
                        <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-110 transition-transform duration-500" />
                        <Sparkles className="w-8 h-8 text-primary relative z-10" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Interactive Knowledge OS</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Ready for exploration</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    {data.sources && data.sources.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {data.sources.map((source, i) => (
                                <span key={i} className="px-3 py-1 bg-primary/5 text-primary text-[9px] font-black rounded-lg border border-primary/10 uppercase tracking-widest flex items-center gap-1.5">
                                    <FileText className="w-3 h-3" />
                                    {source}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`flex items-center gap-2.5 px-6 py-3.5 text-xs font-black rounded-2xl transition-all active:scale-95 uppercase tracking-widest ${showChat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Ask Tutor
                    </button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                    <button
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all active:scale-95 uppercase tracking-widest"
                        title="Export as Markdown"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        .MD
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all active:scale-95 uppercase tracking-widest"
                        title="Export as PDF"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        PDF
                    </button>
                </div>
            </motion.div>

            {/* Knowledge Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section, idx) => (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setFocusedSection(section.id)}
                        className={`group cursor-pointer p-8 glass-panel rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-${section.color}-500/50 hover:shadow-2xl hover:shadow-${section.color}-500/10 transition-all relative overflow-hidden h-64 flex flex-col justify-between`}
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${section.color}-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-${section.color}-500/10 transition-colors`} />

                        <div className="space-y-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl bg-${section.color}-500/10 flex items-center justify-center text-${section.color}-600 dark:text-${section.color}-400 group-hover:scale-110 transition-transform`}>
                                {section.icon}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:translate-x-1 transition-transform">{section.title}</h3>
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Explore Module</span>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Chatbot Sidebar */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed right-6 bottom-6 w-[400px] h-[600px] bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] flex flex-col overflow-hidden"
                    >
                        <div className="p-6 bg-primary text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5" />
                                <span className="font-black text-xs uppercase tracking-widest">Study Assistant</span>
                            </div>
                            <button onClick={() => setShowChat(false)}>
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white ml-auto rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isChatLoading}
                                    className="p-3 bg-primary text-white rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Focus Window Modal */}
            <AnimatePresence>
                {focusedSection && activeSection && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setFocusedSection(null)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 flex flex-col overflow-hidden"
                            id="study-kit-content"
                        >
                            {/* Focus Header */}
                            <div className={`p-8 bg-${activeSection.color}-500/5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-${activeSection.color}-500/20 flex items-center justify-center text-${activeSection.color}-600 dark:text-${activeSection.color}-400 shadow-sm`}>
                                        {activeSection.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{activeSection.title}</h2>
                                        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-0.5">Focus Module</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setFocusedSection(null)}
                                        className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl transition-colors group"
                                    >
                                        <XCircle className="w-7 h-7 text-slate-400 group-hover:text-red-500 transition-colors" />
                                    </button>
                                </div>
                            </div>

                            {/* Focus Content */}
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                <div className="max-w-4xl mx-auto">
                                    {activeSection.content}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function QuizComponent({ questions }: { questions: QuizQuestion[] }) {
    const [selections, setSelections] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleSelect = (qIdx: number, oIdx: number) => {
        if (submitted) return;
        setSelections(prev => ({ ...prev, [qIdx]: oIdx }));
    };

    const handleSubmit = () => {
        let newScore = 0;
        questions.forEach((q, idx) => {
            if (selections[idx] === q.correctOptionIndex) newScore++;
        });
        setScore(newScore);
        setSubmitted(true);

        if (newScore === questions.length) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4f46e5', '#8b5cf6', '#10b981']
            });
        }
    };

    const handleRetry = () => {
        setSelections({});
        setSubmitted(false);
        setScore(0);
    };

    return (
        <div className="space-y-8">
            {questions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                            {qIdx + 1}
                        </span>
                        <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                            <ReactMarkdown components={{ p: ({ children }) => <span className="m-0">{children}</span> }} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {q.question}
                            </ReactMarkdown>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 ml-9">
                        {q.options.map((option, oIdx) => {
                            const isSelected = selections[qIdx] === oIdx;
                            const isCorrect = q.correctOptionIndex === oIdx;

                            let btnClass = "w-full text-left p-4 rounded-2xl border-2 transition-all font-medium text-sm ";
                            if (submitted) {
                                if (isCorrect) btnClass += "bg-green-500/10 border-green-500 text-green-700 dark:text-green-300 ";
                                else if (isSelected) btnClass += "bg-red-500/10 border-red-500 text-red-700 dark:text-red-300 ";
                                else btnClass += "border-slate-100 dark:border-slate-800 opacity-50 ";
                            } else {
                                if (isSelected) btnClass += "border-primary bg-primary/5 text-primary ";
                                else btnClass += "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 ";
                            }

                            return (
                                <button
                                    key={oIdx}
                                    onClick={() => handleSelect(qIdx, oIdx)}
                                    className={btnClass}
                                    disabled={submitted}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-left">
                                            <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {option}
                                            </ReactMarkdown>
                                        </div>
                                        {submitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        {submitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(selections).length !== questions.length}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 active:scale-[0.98] mt-4"
                >
                    Complete Assessment
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 bg-primary/10 p-8 rounded-[2rem] border border-primary/20"
                >
                    <div className="relative">
                        <Trophy className={`w-12 h-12 ${score === questions.length ? 'text-yellow-500' : 'text-slate-400'}`} />
                        {score === questions.length && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full"
                            >
                                <Check className="w-3 h-3" />
                            </motion.div>
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Session Result</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                            {score} <span className="text-slate-400 text-xl">/ {questions.length}</span>
                        </h3>
                    </div>
                    <button
                        onClick={handleRetry}
                        className="mt-2 text-xs font-black text-slate-500 hover:text-primary transition-colors uppercase tracking-widest"
                    >
                        Try Again
                    </button>
                </motion.div>
            )}
        </div>
    );
}

function ReflectionComponent({ questions, context }: { questions: string[], context: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [grading, setGrading] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleGrade = async () => {
        if (!answer.trim() || loading) return;
        setLoading(true);
        setGrading(null);

        try {
            const res = await fetch('/api/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: questions[currentIndex],
                    answer: answer,
                    context: context
                })
            });
            const data = await res.json();
            setGrading(data);
        } catch (e) {
            console.error('Failed to grade', e);
        } finally {
            setLoading(false);
        }
    };

    const nextQuestion = () => {
        setGrading(null);
        setAnswer('');
        setCurrentIndex((prev) => (prev + 1) % questions.length);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl mx-auto space-y-8"
        >
            <div className="glass-panel rounded-[2.5rem] p-10 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Reflection</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                        {currentIndex + 1} / {questions.length}
                    </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-8">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {questions[currentIndex]}
                    </ReactMarkdown>
                </h3>

                <div className="relative group">
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your explanation here... Use the Feynman Technique!"
                        className="w-full min-h-[180px] p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all resize-none text-slate-700 dark:text-white"
                        disabled={loading || !!grading}
                    />
                    {!grading && (
                        <button
                            onClick={handleGrade}
                            disabled={!answer.trim() || loading}
                            className="absolute bottom-4 right-4 px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-50 disabled:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Grade My Answer
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {grading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 p-8 rounded-2xl bg-slate-900 dark:bg-black text-white border border-slate-800 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6">
                                <div className={`text-4xl font-black ${grading.score >= 80 ? 'text-green-500' : grading.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {grading.score}%
                                </div>
                            </div>

                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">AI Feedback</h4>
                            <p className="text-lg leading-relaxed font-medium mb-6">
                                {grading.feedback}
                            </p>

                            <button
                                onClick={nextQuestion}
                                className="w-full py-4 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                Next Question
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function SpeechHighlighter({ text, charIndex }: { text: string, charIndex: number }) {
    // Strip markdown for sync with speech engine
    const cleanText = text.replace(/[*_#>`~]/g, '');
    const words = cleanText.split(/(\s+)/);
    let cumulative = 0;

    return (
        <span>
            {words.map((part, i) => {
                const start = cumulative;
                cumulative += part.length;
                const end = cumulative;

                const isMatch = charIndex >= start && charIndex < end && !/\s+/.test(part);

                return (
                    <motion.span
                        key={i}
                        animate={isMatch ? { scale: 1.05, backgroundColor: 'rgba(79, 70, 229, 0.15)' } : { scale: 1, backgroundColor: 'transparent' }}
                        className={isMatch ? 'text-primary font-bold rounded px-0.5 transition-colors inline-block' : 'inline-block'}
                    >
                        {part}
                    </motion.span>
                );
            })}
        </span>
    );
}
