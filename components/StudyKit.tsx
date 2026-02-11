'use client';

import { useState, useRef } from 'react';
import { Copy, Check, ChevronDown, BookOpen, Brain, HelpCircle, Network, Trophy, XCircle, CheckCircle, Layout, Layers, Tag, Download, FileText, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Flashcards from './Flashcards';
import MermaidChart from './MermaidChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

export default function StudyKit({ data }: StudyKitProps) {
    const [viewMode, setViewMode] = useState<'quiz' | 'flashcards'>('quiz');
    const [exporting, setExporting] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    if (!data) return null;

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

    const handleExportPDF = async () => {
        if (!contentRef.current) return;
        setExporting(true);
        try {
            // Temporarily hide interactive elements or adjust styles for better PDF
            const canvas = await html2canvas(contentRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 800 // Consistent width for PDF
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`StudyKit-${Date.now()}.pdf`);
        } catch (error) {
            console.error('PDF Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    const markdownComponents = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p: ({ node, ...props }: any) => <p className="mb-2" {...props} />,
    };

    const sections: Section[] = [
        {
            title: 'Summary',
            icon: <BookOpen className="w-5 h-5 text-blue-500" />,
            content: (
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                    >
                        {data.summary}
                    </ReactMarkdown>
                </div>
            )
        },
        {
            title: 'Key Terms',
            icon: <Tag className="w-5 h-5 text-teal-500" />,
            content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.keyTerms?.map((term, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-colors">
                            <p className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                {term.term}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {term.definition}
                            </p>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: 'Analogies',
            icon: <Brain className="w-5 h-5 text-purple-500" />,
            content: (
                <ul className="list-disc pl-5 space-y-2">
                    {data.analogies.map((analogy, i) => (
                        <li key={i} className="text-slate-700 dark:text-slate-300">
                            <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {analogy}
                            </ReactMarkdown>
                        </li>
                    ))}
                </ul>
            )
        },
        {
            title: 'Practice Questions',
            icon: <HelpCircle className="w-5 h-5 text-orange-500" />,
            content: (
                <div className="space-y-6">
                    <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mx-auto mb-4 border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setViewMode('quiz')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'quiz' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Layout className="w-4 h-4" />
                            Quiz View
                        </button>
                        <button
                            onClick={() => setViewMode('flashcards')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'flashcards' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Layers className="w-4 h-4" />
                            Flashcards
                        </button>
                    </div>

                    {viewMode === 'quiz' ? <QuizComponent questions={data.quiz} /> : <Flashcards questions={data.quiz} />}
                </div>
            )
        },
        {
            title: 'Mind Map',
            icon: <Network className="w-5 h-5 text-green-500" />,
            content: (
                <div className="w-full">
                    <MermaidChart chart={data.mindMap} />
                </div>
            )
        }
    ];

    return (
        <div className="w-full max-w-3xl space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Export Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Your Study Kit</h4>
                        <p className="text-[10px] text-slate-500">Ready to save or review</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Markdown
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {exporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Download className="w-3.5 h-3.5" />
                        )}
                        Export PDF
                    </button>
                </div>
            </div>

            <div ref={contentRef} className="space-y-4">
                {sections.map((section, idx) => (
                    <SectionCard key={idx} section={section} delay={idx * 100} />
                ))}
            </div>
        </div>
    );
}

function SectionCard({ section, delay }: { section: Section, delay: number }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div
                className="flex items-center justify-between p-4 cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="text-slate-500 dark:text-slate-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                        <ChevronDown className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                        {section.icon}
                        <span>{section.title}</span>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 leading-relaxed mt-4">
                    {section.content}
                </div>
            )}
        </div>
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
    };

    const handleRetry = () => {
        setSelections({});
        setSubmitted(false);
        setScore(0);
    };

    return (
        <div className="space-y-6">
            {questions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3">
                    <div className="font-medium text-slate-800 dark:text-slate-100 flex gap-2">
                        <span>{qIdx + 1}.</span>
                        <div className="prose dark:prose-invert max-w-none inline-block">
                            <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    p: ({ node, ...props }: any) => <p className="m-0 inline" {...props} />
                                }}
                            >
                                {q.question}
                            </ReactMarkdown>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {q.options.map((option, oIdx) => {
                            const isSelected = selections[qIdx] === oIdx;
                            const isCorrect = q.correctOptionIndex === oIdx;
                            let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all ";

                            if (submitted) {
                                if (isCorrect) btnClass += "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300 ";
                                else if (isSelected) btnClass += "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-300 ";
                                else btnClass += "border-slate-200 dark:border-slate-700 opacity-60 ";
                            } else {
                                if (isSelected) btnClass += "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ";
                                else btnClass += "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 ";
                            }

                            return (
                                <button
                                    key={oIdx}
                                    onClick={() => handleSelect(qIdx, oIdx)}
                                    className={btnClass}
                                    disabled={submitted}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="prose dark:prose-invert max-w-none text-sm text-left">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    p: ({ node, ...props }: any) => <p className="m-0 inline" {...props} />
                                                }}
                                            >
                                                {option}
                                            </ReactMarkdown>
                                        </div>
                                        {submitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                                        {submitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
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
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Submit Answers
                </button>
            ) : (
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                            Score: {score} / {questions.length}
                        </span>
                    </div>
                    <button onClick={handleRetry} className="text-sm text-indigo-600 hover:underline">
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
