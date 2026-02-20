'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Calendar, ChevronRight, X, Layers, Clock, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';
import { StudyKitData } from './StudyKit';

interface HistoryItem {
    id: string;
    timestamp: number;
    title: string;
    data: StudyKitData;
    isPinned?: boolean;
}

interface SRSDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: StudyKitData) => void;
}

export default function SRSDashboard({ isOpen, onClose, onSelect }: SRSDashboardProps) {
    const [dueItems, setDueItems] = useState<HistoryItem[]>([]);
    const [upcomingItems, setUpcomingItems] = useState<HistoryItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadItems();
        }
    }, [isOpen]);

    const loadItems = () => {
        const saved = localStorage.getItem('study_history');
        if (saved) {
            try {
                const history: HistoryItem[] = JSON.parse(saved);
                const now = Date.now();

                const due: HistoryItem[] = [];
                const upcoming: HistoryItem[] = [];

                history.forEach(item => {
                    const questions = item.data.quiz || [];
                    if (questions.length === 0) return;

                    // If any card hasn't been reviewed yet, or a reviewed card is due
                    const hasAttentionRequired = questions.some(q => !q.lastReviewed || (q.nextReviewDate && q.nextReviewDate <= now));

                    if (hasAttentionRequired) {
                        due.push(item);
                    } else {
                        upcoming.push(item);
                    }
                });

                // Sort due items by oldest review date (or oldest timestamp if new)
                due.sort((a, b) => {
                    const aDate = Math.min(...(a.data.quiz?.map(q => q.nextReviewDate || 0) || [0]));
                    const bDate = Math.min(...(b.data.quiz?.map(q => q.nextReviewDate || 0) || [0]));
                    return aDate - bDate;
                });

                upcoming.sort((a, b) => {
                    const aDate = Math.min(...(a.data.quiz?.map(q => q.nextReviewDate || Infinity) || [Infinity]));
                    const bDate = Math.min(...(b.data.quiz?.map(q => q.nextReviewDate || Infinity) || [Infinity]));
                    return aDate - bDate;
                });

                setDueItems(due);
                setUpcomingItems(upcoming);
            } catch (e) {
                console.error('Failed to parse history for SRS', e);
            }
        }
    };

    const getNextReviewTime = (item: HistoryItem) => {
        const dates = item.data.quiz?.map(q => q.nextReviewDate || 0) || [];
        if (dates.length === 0) return "No cards";
        const minDate = Math.min(...dates);
        if (minDate <= Date.now()) return "Now";

        const diff = minDate - Date.now();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `in ${days}d ${hours}h`;
        if (hours > 0) return `in ${hours}h`;
        return "Soon";
    };

    const getMasteryLevel = (item: HistoryItem) => {
        const questions = item.data.quiz || [];
        if (questions.length === 0) return 0;
        const totalBox = questions.reduce((sum, q) => sum + (q.srsBox || 0), 0);
        // Max possible score is 5 * questions.length
        return Math.round((totalBox / (questions.length * 5)) * 100);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden z-[90] flex flex-col border border-white/20 dark:border-slate-700"
                    >
                        {/* Header */}
                        <div className="p-8 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <Brain className="w-8 h-8 text-primary" />
                                    Smart Review Dashboard
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                                    Optimized based on your forgetting curve
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-slate-50/50 dark:bg-slate-900/50">

                            {/* Due Now Section */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                                        <Layers className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                        Review Due ({dueItems.length})
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {dueItems.map(item => (
                                        <motion.div
                                            key={item.id}
                                            whileHover={{ y: -5 }}
                                            onClick={() => { onSelect(item.data); onClose(); }}
                                            className="group bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-orange-200 dark:border-orange-900/30 shadow-lg hover:shadow-orange-500/10 cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4">
                                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                                            </div>
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2 pr-6">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                                <span className="flex items-center gap-1.5">
                                                    <Layers className="w-4 h-4" />
                                                    {item.data.quiz?.length || 0} cards
                                                </span>
                                                {(() => {
                                                    const questions = item.data.quiz || [];
                                                    const isNew = questions.every(q => !q.lastReviewed);
                                                    const isDue = questions.some(q => q.nextReviewDate && q.nextReviewDate <= Date.now());
                                                    const reviewedCount = questions.filter(q => q.lastReviewed).length;

                                                    if (isNew) return (
                                                        <span className="flex items-center gap-1.5 text-blue-500 font-bold">
                                                            <Sparkles className="w-4 h-4" />
                                                            Get Started
                                                        </span>
                                                    );
                                                    if (isDue) return (
                                                        <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold">
                                                            <Clock className="w-4 h-4" />
                                                            Review Due
                                                        </span>
                                                    );
                                                    return (
                                                        <span className="flex items-center gap-1.5 text-green-500 font-bold">
                                                            <CheckCircle className="w-4 h-4" />
                                                            {reviewedCount}/{questions.length} Ready
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Mastery</span>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        {getMasteryLevel(item)}%
                                                    </span>
                                                </div>
                                                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all text-orange-600 dark:text-orange-400">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700">
                                                <div
                                                    className="h-full bg-orange-500"
                                                    style={{ width: `${getMasteryLevel(item)}%` }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                    {dueItems.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700">
                                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                                            <p className="font-medium">All caught up! Great job.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Upcoming Section */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                        Upcoming Reviews ({upcomingItems.length})
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingItems.map(item => (
                                        <motion.div
                                            key={item.id}
                                            whileHover={{ y: -5 }}
                                            onClick={() => { onSelect(item.data); onClose(); }}
                                            className="group bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {getNextReviewTime(item)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Mastery</span>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        {getMasteryLevel(item)}%
                                                    </span>
                                                </div>
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-400">
                                                    <TrendingUp className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${getMasteryLevel(item)}%` }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                    {upcomingItems.length === 0 && dueItems.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-400">
                                            <p>No study history found. Generate a kit to start tracking!</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
