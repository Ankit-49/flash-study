'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Zap } from 'lucide-react';
import StudyKit, { StudyKitData } from '@/components/StudyKit';

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyKitData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text || text.length < 50) {
      setError('Please enter at least 50 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Study Kit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-black">

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
          Paste your complex notes or textbook paragraphs below. Get a structured study kit in seconds.
        </p>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-3xl space-y-4">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
            <textarea
              className="w-full min-h-[200px] p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-sm shadow-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all text-base leading-relaxed"
              placeholder="Paste your text here (e.g., Quantum Entanglement, The French Revolution, Mitochondria function)..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !text}
          className="w-full py-4 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Magic...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              Generate Study Kit
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && <StudyKit data={result} />}

      {/* Footer */}
      {!result && (
        <div className="mt-16 text-center text-slate-400 dark:text-slate-600 text-sm">
          Powered by AI • Built for Speed
        </div>
      )}
    </main>
  );
}
