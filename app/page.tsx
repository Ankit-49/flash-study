'use client';

import { useState, useRef } from 'react';
import { Sparkles, Loader2, Zap, Upload, FileText } from 'lucide-react';
import StudyKit, { StudyKitData } from '@/components/StudyKit';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyKitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      setResult(data.result);
      if (data.context) {
        setContext(data.context);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate Study Kit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-black transition-colors duration-500">
      <main className={`flex-1 flex flex-col items-center p-6 sm:p-24 transition-all duration-500 ease-in-out ${isChatOpen ? 'lg:mr-[400px]' : ''}`}>

        {/* Header */}
        <div className="text-center space-y-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400 fill-current" />
            <span className="font-bold text-indigo-600 dark:text-indigo-400 tracking-wider text-sm uppercase">FlashStudy MVP</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Turn Confusion into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Clarity</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Upload a file, paste your notes, or do both. Get a structured study kit in seconds.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-3xl space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Text Input */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your notes or textbook content here..."
                  className="w-full min-h-[150px] p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-sm shadow-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all text-base leading-relaxed"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-center text-slate-400 font-medium text-sm">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
              <span className="px-4">AND / OR</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>

            {/* File Upload */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${files.length > 0 ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900/80 backdrop-blur-sm shadow-xl'}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.md,.pdf"
                    multiple
                  />

                  {files.length > 0 ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Uploaded Files ({files.length})
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); clearFiles(); }}
                          className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group/file"
                          >
                            <FileText className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-xs truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 text-center">
                        <p className="text-[10px] text-slate-400">Click to add more files</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">Add PDF, TXT, or MD files</p>
                      <p className="text-xs text-slate-500">You can select multiple files at once</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || (!text && files.length === 0)}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Study Kit...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Generate Study Kit
              </>
            )}
          </button>

          {result && <StudyKit data={result} />}
        </div>
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
