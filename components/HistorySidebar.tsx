'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Trash2, Calendar, ChevronRight, Bookmark, Pin, Edit2, Check, Search, AlertTriangle, Sparkles, Trophy } from 'lucide-react';
import { StudyKitData } from './StudyKit';

interface HistoryItem {
    id: string;
    timestamp: number;
    title: string;
    data: StudyKitData;
    isPinned?: boolean;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: StudyKitData) => void;
}

export default function HistorySidebar({ isOpen, onClose, onSelect }: HistorySidebarProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem('study_history');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const sorted = parsed.sort((a: HistoryItem, b: HistoryItem) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return b.timestamp - a.timestamp;
                    });
                    setHistory(sorted);
                } catch (e) {
                    console.error('Failed to parse history', e);
                }
            }
        }
    }, [isOpen]);

    const saveHistory = (items: HistoryItem[]) => {
        setHistory(items);
        localStorage.setItem('study_history', JSON.stringify(items));
    };

    const deleteItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = history.filter(item => item.id !== id);
        saveHistory(updated);
    };

    const togglePin = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = history.map(item =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
        ).sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.timestamp - a.timestamp;
        });
        saveHistory(updated);
    };

    const startRename = (item: HistoryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(item.id);
        setEditValue(item.title);
    };

    const handleRename = (id: string) => {
        const updated = history.map(item =>
            item.id === id ? { ...item, title: editValue } : item
        );
        saveHistory(updated);
        setEditingId(null);
    };

    const clearAllHistory = () => {
        saveHistory([]);
        setShowClearConfirm(false);
    };

    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div key="history-wrapper">
                    <motion.div
                        key="history-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100]"
                    />
                    <motion.div
                        key="history-sidebar-content"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-[320px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[110] flex flex-col"
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

                        {/* Search Bar */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search your sessions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredHistory.length === 0 ? (
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
                                            if (editingId === item.id) return;
                                            onSelect(item.data);
                                            onClose();
                                        }}
                                        className={`group relative p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${item.isPinned ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/30'}`}
                                    >
                                        <div className="flex flex-col gap-1 pr-12">
                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleRename(item.id)}
                                                        className="w-full bg-white dark:bg-slate-800 border border-primary/30 rounded px-2 py-1 text-sm outline-none"
                                                    />
                                                    <button onClick={() => handleRename(item.id)} className="p-1 text-green-500">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors flex-1">
                                                        {item.title}
                                                    </h4>
                                                    {item.data.quiz?.every(q => !q.lastReviewed) && (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-tighter shrink-0 flex items-center gap-0.5">
                                                            <Sparkles className="w-2 h-2" />
                                                            NEW
                                                        </span>
                                                    )}
                                                    {item.data.quiz?.every(q => q.srsBox === 5) && (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 text-[8px] font-black uppercase tracking-tighter shrink-0 flex items-center gap-0.5">
                                                            <Trophy className="w-2 h-2" />
                                                            MASTERED
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={(e) => startRename(item, e)}
                                                        className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium lowercase">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                onClick={(e) => togglePin(item.id, e)}
                                                className={`p-1.5 rounded-lg transition-all ${item.isPinned ? 'text-primary' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary'}`}
                                            >
                                                <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-current' : ''}`} />
                                            </button>
                                            <button
                                                onClick={(e) => deleteItem(item.id, e)}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Clear All & Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            {history.length > 0 && (
                                <div className="px-2">
                                    {!showClearConfirm ? (
                                        <button
                                            onClick={() => setShowClearConfirm(true)}
                                            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Clear All History
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 text-center uppercase tracking-widest">Are you sure?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={clearAllHistory}
                                                    className="flex-1 py-2 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                                                >
                                                    Yes, Clear
                                                </button>
                                                <button
                                                    onClick={() => setShowClearConfirm(false)}
                                                    className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Saved locally on your device</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
