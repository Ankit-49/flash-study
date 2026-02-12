'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Copy, Check, ChevronDown, BookOpen, Brain, HelpCircle,
    Network, Trophy, XCircle, CheckCircle, Layout, Layers,
    Tag, Download, FileText, Loader2, Sparkles, Volume2,
    VolumeX, Share2, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Flashcards from './Flashcards';
import MermaidChart from './MermaidChart';

interface QuizQuestion {
    question: string;
    options: string[];
    correctOptionIndex: number;
}

export interface StudyKitData {
    summary: string;
    analogies: string[];
    keyTerms: { term: string; definition: string }[];
    quiz: QuizQuestion[];
    mindMap: string;
}

interface StudyKitProps {
    data: StudyKitData;
}

interface Section {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
    color: string;
}

export default function StudyKit({ data }: StudyKitProps) {
    const [viewMode, setViewMode] = useState<'quiz' | 'flashcards'>('quiz');
    const [activeTab, setActiveTab] = useState('summary');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingTextId, setSpeakingTextId] = useState<string | null>(null);
    const [charIndex, setCharIndex] = useState(0);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    if (!data) return null;

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

    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, []);

    const handleExportMarkdown = () => {
        let md = `# Study Kit: ${data.summary.substring(0, 50)}...\n\n`;
        md += `## Summary\n${data.summary}\n\n`;

        md += `## Key Terms\n`;
        data.keyTerms?.forEach(tk => {
            md += `- **${tk.term}**: ${tk.definition}\n`;
        });
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
            id: 'practice',
            title: 'Recall',
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
                        {viewMode === 'quiz' ? <QuizComponent questions={data.quiz} /> : <Flashcards questions={data.quiz} />}
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
                    className="w-full glass-panel rounded-[3rem] p-8 sm:p-12 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
                >
                    <MermaidChart chart={data.mindMap} />
                </motion.div>
            )
        }
    ].filter(s => s.content);

    const activeContent = sections.find(s => s.id === activeTab)?.content;

    return (
        <div className="w-full max-w-5xl space-y-10 mt-12 mb-32">
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

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2.5 px-6 py-3.5 text-xs font-black text-white bg-primary hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] rounded-2xl transition-all active:scale-95 uppercase tracking-widest shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        Export .MD
                    </button>
                </div>
            </motion.div>

            {/* Premium Tab Navigation */}
            <div className="flex items-center justify-center p-2 bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-inner w-full max-w-fit mx-auto sticky top-4 z-40">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={`relative flex items-center gap-2.5 px-6 py-3.5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === section.id ? 'text-primary' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        {activeTab === section.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white dark:bg-slate-700 shadow-xl rounded-[2rem] z-0"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{section.icon}</span>
                        <span className="relative z-10 hidden sm:inline">{section.title}</span>
                    </button>
                ))}
            </div>

            {/* Animated Tab Content */}
            <div className="relative min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        {activeContent}
                    </motion.div>
                </AnimatePresence>
            </div>
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
