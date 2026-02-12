'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Trash2, Calendar, ChevronRight, Bookmark } from 'lucide-react';
import { StudyKitData } from './StudyKit';

interface HistoryItem {
    id: string;
    timestamp: number;
    title: string;
    data: StudyKitData;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: StudyKitData) => void;
}

export default function HistorySidebar({ isOpen, onClose, onSelect }: HistorySidebarProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem('study_history');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setHistory(parsed.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp));
                } catch (e) {
                    console.error('Failed to parse history', e);
                }
            }
        }
    }, [isOpen]);

    const deleteItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = history.filter(item => item.id !== id);
        setHistory(updated);
        localStorage.setItem('study_history', JSON.stringify(updated));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-[320px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[70] flex flex-col"
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-slate-900 dark:text-white">Study History</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                        <Bookmark className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">No saved sessions yet</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        onClick={() => {
                                            onSelect(item.data);
                                            onClose();
                                        }}
                                        className="group relative p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex flex-col gap-1 pr-8">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium lowercase">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => deleteItem(item.id, e)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:opacity-0 transition-all" />
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Saved locally on your device</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
