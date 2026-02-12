'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Zap, Upload, FileText, ChevronRight, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudyKit, { StudyKitData } from '@/components/StudyKit';
import ChatInterface from '@/components/ChatInterface';
import ThemeToggle from '@/components/ThemeToggle';
import HistorySidebar from '@/components/HistorySidebar';

export default function Home() {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyKitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingSteps = [
    "Analyzing your materials...",
    "Extracting core semantic units...",
    "Synthesizing structured summaries...",
    "Building interactive visual map...",
    "Generating self-assessment quiz...",
    "Finalizing your premium Study Kit..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    const hasEnoughText = text && text.trim().length >= 50;
    const hasFiles = files.length > 0;

    if (!hasEnoughText && !hasFiles) {
      setError('Please enter at least 50 characters of text or upload at least one file.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      files.forEach((file) => {
        formData.append('file', file);
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.result) {
        setResult(data.result);
        saveToHistory(data.result);
      }
      if (data.context) {
        setContext(data.context);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate Study Kit');
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = (data: StudyKitData) => {
    const saved = localStorage.getItem('study_history');
    const history = saved ? JSON.parse(saved) : [];
    const newItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: data.summary.substring(0, 40) + "...",
      data
    };
    localStorage.setItem('study_history', JSON.stringify([newItem, ...history].slice(0, 20)));
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-background">
      {/* Background Mesh Gradient */}
      <div className="theme-gradient" />

      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-all shadow-sm"
          title="Study History"
        >
          <History className="w-5 h-5" />
        </button>
        <ThemeToggle />
      </div>

      <main className={`flex-1 flex flex-col items-center p-6 sm:p-24 relative z-10 transition-all duration-500 ease-in-out ${isChatOpen ? 'lg:mr-[400px]' : ''}`}>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6 mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-2 bg-primary/10 backdrop-blur-md px-3 py-1 rounded-full border border-primary/20 w-fit mx-auto"
          >
            <Zap className="w-3.5 h-3.5 text-primary fill-current" />
            <span className="font-bold text-primary tracking-widest text-[10px] uppercase">Powered by Gemini Pro</span>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Master Anything <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Instantly</span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The world's most advanced study companion. Paste your notes or upload documents to generate structured kits in seconds.
          </p>
        </motion.div>

        {/* Main Interface Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-3xl space-y-8"
        >
          <div className="glass-panel rounded-[2rem] p-6 sm:p-10 space-y-8 relative overflow-hidden group">
            {/* Decorative background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />

            {/* Input Section */}
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Paste Content</label>
                <div className="relative group/input">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Drop your textbook chapters, lecture notes, or complex theories here..."
                    className="w-full min-h-[160px] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-inner focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all text-base leading-relaxed"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-400">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800"></div>
                <span className="text-[10px] font-bold tracking-widest uppercase">or upload sources</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800"></div>
              </div>

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative group/dropzone w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${files.length > 0 ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".txt,.md,.pdf"
                  multiple
                />

                <AnimatePresence mode="wait">
                  {files.length > 0 ? (
                    <motion.div
                      key="files-list"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected Documents ({files.length})</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); clearFiles(); }}
                          className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                        >
                          Remove All
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {files.map((file, index) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group/file relative"
                          >
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-[11px] truncate">
                                {file.name}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload-prompt"
                      className="text-center space-y-3"
                    >
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto group-hover/dropzone:scale-110 group-hover/dropzone:bg-primary/10 transition-all duration-300">
                        <Upload className="w-6 h-6 text-slate-400 group-hover/dropzone:text-primary transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Upload Material</p>
                        <p className="text-[10px] text-slate-500 font-medium">PDF, TXT, or Markdown supported</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-500/20 flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                {error}
              </motion.div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || (!text && files.length === 0)}
              className="w-full relative group/btn overflow-hidden py-4.5 bg-primary text-white rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-x group-hover:opacity-100 opacity-0 transition-opacity" />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                    <motion.p
                      key={loadingStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-medium text-white/70 uppercase tracking-widest"
                    >
                      {loadingSteps[loadingStep]}
                    </motion.p>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Study Kit
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-12"
              >
                <StudyKit data={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onSelect={(data: StudyKitData) => setResult(data)}
        />
      </main>

      {context && (
        <ChatInterface
          context={context}
          isOpen={isChatOpen}
          onToggle={setIsChatOpen}
        />
      )}
    </div>
  );
}
