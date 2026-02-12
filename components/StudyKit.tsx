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
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>('summary');
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    if (!data) return null;

    const handleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(data.summary);
        utterance.onend = () => setIsSpeaking(false);
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
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
            icon: <BookOpen className="w-5 h-5 text-blue-500" />,
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={handleSpeech}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors uppercase tracking-widest"
                        >
                            {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            {isSpeaking ? 'Stop Listening' : 'Listen to Summary'}
                        </button>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {data.summary}
                        </ReactMarkdown>
                    </div>
                </div>
            )
        },
        {
            id: 'terms',
            title: 'Key Concepts',
            color: 'teal',
            icon: <Tag className="w-5 h-5 text-teal-500" />,
            content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.keyTerms.map((term, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 bg-white/50 dark:bg-slate-950/30 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all group/term"
                        >
                            <div className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-teal-500 group-hover:scale-125 transition-transform"></span>
                                <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {term.term}
                                </ReactMarkdown>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {term.definition}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )
        },
        {
            id: 'analogies',
            title: 'Analogies',
            color: 'purple',
            icon: <Brain className="w-5 h-5 text-purple-500" />,
            content: (
                <div className="space-y-4">
                    {data.analogies.map((analogy, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 font-bold text-xs italic">
                                A
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 italic self-center">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {analogy}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            )
        },
        {
            id: 'practice',
            title: 'Self Assessment',
            color: 'orange',
            icon: <HelpCircle className="w-5 h-5 text-orange-500" />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setViewMode('quiz')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'quiz' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layout className="w-3.5 h-3.5" />
                            QUIZ
                        </button>
                        <button
                            onClick={() => setViewMode('flashcards')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'flashcards' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            CARDS
                        </button>
                    </div>

                    <div className="mt-4">
                        {viewMode === 'quiz' ? <QuizComponent questions={data.quiz} /> : <Flashcards questions={data.quiz} />}
                    </div>
                </div>
            )
        },
        {
            id: 'mindmap',
            title: 'Knowledge Map',
            color: 'green',
            icon: <Network className="w-5 h-5 text-green-500" />,
            content: (
                <div className="w-full glass-panel rounded-2xl p-4 sm:p-8 bg-white/30">
                    <MermaidChart chart={data.mindMap} />
                </div>
            )
        }
    ].filter(s => s.content);

    return (
        <div className="w-full max-w-4xl space-y-8 mt-12 mb-20">
            {/* Premium Header/Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-6 p-6 glass-panel rounded-3xl"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">AI Study Syllabus</h4>
                        <p className="text-xs text-slate-500 font-medium">Generated from your materials</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export .MD
                    </button>
                </div>
            </motion.div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 gap-6">
                {sections.map((section, idx) => (
                    <SectionCard
                        key={section.id}
                        section={section}
                        isOpen={activeSection === section.id}
                        toggle={() => setActiveSection(activeSection === section.id ? null : section.id)}
                        delay={idx * 0.1}
                    />
                ))}
            </div>
        </div>
    );
}

function SectionCard({ section, isOpen, toggle, delay }: { section: Section, isOpen: boolean, toggle: () => void, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={`glass-panel rounded-3xl overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-primary/20 bg-white/80 dark:bg-slate-900/80 shadow-2xl' : 'hover:bg-white/50 dark:hover:bg-slate-900/50'}`}
        >
            <div
                className="flex items-center justify-between p-6 cursor-pointer select-none"
                onClick={toggle}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {section.icon}
                    </div>
                    <span className={`font-bold transition-all ${isOpen ? 'text-lg text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {section.title}
                    </span>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-400'}`}>
                    <ChevronDown className="w-6 h-6" />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="p-8 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                            {section.content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
