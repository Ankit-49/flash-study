import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, CheckCircle, XCircle, Trophy, ArrowRight, Loader2, Sparkles, Layers } from 'lucide-react';
import { StudyKitData, QuizQuestion } from './StudyKit';

interface ExamQuestion extends QuizQuestion {
    sourceTitle: string;
    kitId: string;
}

interface ExamSimulatorProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ExamSimulator({ isOpen, onClose }: ExamSimulatorProps) {
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadQuestions();
        }
    }, [isOpen]);

    const loadQuestions = () => {
        setIsLoading(true);
        const history = JSON.parse(localStorage.getItem('study_history') || '[]');

        let allQuestions: ExamQuestion[] = [];
        history.forEach((item: any) => {
            if (item.data.quiz) {
                const kitQuestions = item.data.quiz.map((q: QuizQuestion) => ({
                    ...q,
                    sourceTitle: item.title,
                    kitId: item.id
                }));
                allQuestions = [...allQuestions, ...kitQuestions];
            }
        });

        // Filter for "Due" or "New" (or just shuffle all for a proper simulator)
        // Shuffling 20 random questions from all decks
        const shuffled = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 20);
        setQuestions(shuffled);
        setIsLoading(false);
    };

    const handleAnswer = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);
        if (index === questions[currentIndex].correctOptionIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setIsComplete(true);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsComplete(false);
        loadQuestions();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl glass-panel rounded-[3rem] bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-white/20"
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Integrating Knowledge Bases...</p>
                    </div>
                ) : isComplete ? (
                    <div className="p-12 text-center space-y-8">
                        <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                            <Trophy className="w-12 h-12 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Exam Complete!</h2>
                            <p className="text-slate-500 font-medium">You've successfully cross-referenced your study materials.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-8">
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Score</span>
                                <span className="text-3xl font-black text-primary">{Math.round((score / questions.length) * 100)}%</span>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Correct</span>
                                <span className="text-3xl font-black text-primary">{score}/{questions.length}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleRestart}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Try New Random Set
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Brain className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Interleaved Practice</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            From: <span className="text-slate-600 dark:text-slate-300">{questions[currentIndex]?.sourceTitle}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-1">
                                    Q {currentIndex + 1} / {questions.length}
                                </span>
                                <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                {questions[currentIndex]?.question}
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {questions[currentIndex]?.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={`w-full p-6 rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group ${isAnswered
                                            ? idx === questions[currentIndex].correctOptionIndex
                                                ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400'
                                                : idx === selectedOption
                                                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-400'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 opacity-50'
                                            : 'bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-primary/50 text-slate-700 dark:text-slate-300'
                                        }`}
                                    disabled={isAnswered}
                                >
                                    <span>{option}</span>
                                    {isAnswered && (
                                        idx === questions[currentIndex].correctOptionIndex ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : idx === selectedOption ? (
                                            <XCircle className="w-5 h-5 text-rose-500" />
                                        ) : null
                                    )}
                                </button>
                            ))}
                        </div>

                        {isAnswered && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleNext}
                                className="w-full mt-8 py-4 bg-slate-900 dark:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-slate-800 transition-all shadow-xl"
                            >
                                {currentIndex === questions.length - 1 ? 'Finish Exam' : 'Next Question'}
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
