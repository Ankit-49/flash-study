'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface QuizQuestion {
    question: string;
    options: string[];
    correctOptionIndex: number;
}

interface FlashcardsProps {
    questions: QuizQuestion[];
}

export default function Flashcards({ questions }: FlashcardsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [direction, setDirection] = useState(0);

    const handleNext = () => {
        setDirection(1);
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % questions.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex flex-col items-center space-y-8 py-4 w-full max-w-lg mx-auto">
            <div className="relative w-full aspect-[16/10] perspective-2000">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 100, rotateY: 0 }}
                        animate={{ opacity: 1, x: 0, rotateY: isFlipped ? 180 : 0 }}
                        exit={{ opacity: 0, x: -direction * 100 }}
                        transition={{
                            rotateY: { duration: 0.6, ease: "circOut" },
                            x: { type: "spring", stiffness: 300, damping: 30 }
                        }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="relative w-full h-full cursor-pointer"
                        onClick={handleFlip}
                    >
                        {/* Front Face */}
                        <motion.div
                            className="absolute inset-0 backface-hidden glass-panel rounded-3xl p-10 flex flex-col items-center justify-center text-center bg-white/90 dark:bg-slate-900/90 shadow-2xl border-2 border-slate-100 dark:border-slate-800"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <div className="absolute top-6 left-8 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Question {currentIndex + 1}</span>
                            </div>

                            <div className="prose dark:prose-invert max-w-none text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {currentQuestion.question}
                                </ReactMarkdown>
                            </div>

                            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-50">Tap to Reveal</span>
                                <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Back Face */}
                        <motion.div
                            className="absolute inset-0 backface-hidden glass-panel rounded-3xl p-10 flex flex-col items-center justify-center text-center bg-primary/5 dark:bg-primary/10 shadow-2xl border-2 border-primary/30"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)'
                            }}
                        >
                            <div className="absolute top-6 left-8 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Verification</span>
                            </div>

                            <div className="prose dark:prose-invert max-w-none text-xl font-black text-primary leading-snug">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {currentQuestion.options[currentQuestion.correctOptionIndex]}
                                </ReactMarkdown>
                            </div>

                            <p className="absolute bottom-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-50">Tap to Flip Back</p>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Premium Controls */}
            <div className="flex items-center gap-8">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg hover:text-primary transition-all active:scale-90 group"
                >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                        {currentIndex + 1} <span className="text-slate-400 text-xs">/</span> {questions.length}
                    </div>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg hover:text-primary transition-all active:scale-90 group"
                >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <button
                onClick={() => { setIsFlipped(false); setCurrentIndex(0); }}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em] pt-2"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Deck
            </button>

            <style jsx global>{`
                .perspective-2000 {
                    perspective: 2000px;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
            `}</style>
        </div>
    );
}
