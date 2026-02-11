'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
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

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % questions.length);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
        }, 150);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex flex-col items-center space-y-6 py-4 w-full max-w-lg mx-auto">
            {/* Card Container with Perspective */}
            <div
                className="relative w-full aspect-[4/3] cursor-pointer group perspective-1000"
                onClick={handleFlip}
            >
                {/* The Card Inner (rotates) */}
                <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                    {/* Front Face (Question) */}
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl p-8 flex flex-col items-center justify-center text-center">
                        <span className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentIndex + 1}</span>
                        <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {currentQuestion.question}
                            </ReactMarkdown>
                        </div>
                        <p className="absolute bottom-6 text-[10px] text-slate-400 font-medium animate-pulse">Click to see answer</p>
                    </div>

                    {/* Back Face (Answer) */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border-2 border-indigo-500 shadow-xl p-8 flex flex-col items-center justify-center text-center">
                        <span className="absolute top-4 left-4 text-xs font-bold text-indigo-500 uppercase tracking-widest">Correct Answer</span>
                        <div className="prose dark:prose-invert max-w-none text-indigo-900 dark:text-indigo-200 font-medium text-lg">
                            <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {currentQuestion.options[currentQuestion.correctOptionIndex]}
                            </ReactMarkdown>
                        </div>
                        <p className="absolute bottom-6 text-[10px] text-indigo-400 font-medium">Click to see question</p>
                    </div>
                </div>

                {/* Card Glow Effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[24px] blur opacity-0 group-hover:opacity-10 transition duration-500 -z-10"></div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-6">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90 text-slate-600 dark:text-slate-300"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                    {currentIndex + 1} / {questions.length}
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90 text-slate-600 dark:text-slate-300"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <button
                onClick={() => { setIsFlipped(false); setCurrentIndex(0); }}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-wider"
            >
                <RotateCcw className="w-3 h-3" />
                Restart Session
            </button>

            <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    );
}
