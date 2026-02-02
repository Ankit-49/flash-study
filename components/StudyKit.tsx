'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, BookOpen, Brain, HelpCircle, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StudyKitProps {
    content: string;
}

interface Section {
    title: string;
    icon: React.ReactNode;
    content: string;
}

export default function StudyKit({ content }: StudyKitProps) {
    const [sections, setSections] = useState<Section[]>([]);

    useEffect(() => {
        const parseContent = () => {
            const parsed: Section[] = [];

            // Regex to split by the prompt's numeric headers
            const summaryMatch = content.match(/1\. SUMMARY:\s*([\s\S]*?)(?=2\. ANALOGIES:|$)/i);
            const analogiesMatch = content.match(/2\. ANALOGIES:\s*([\s\S]*?)(?=3\. QUIZ:|$)/i);
            const quizMatch = content.match(/3\. QUIZ:\s*([\s\S]*?)(?=4\. MIND MAP:|$)/i);
            const mindMapMatch = content.match(/4\. MIND MAP:\s*([\s\S]*?)$/i);

            if (summaryMatch) parsed.push({ title: 'Summary', icon: <BookOpen className="w-5 h-5 text-blue-500" />, content: summaryMatch[1].trim() });
            if (analogiesMatch) parsed.push({ title: 'Analogies', icon: <Brain className="w-5 h-5 text-purple-500" />, content: analogiesMatch[1].trim() });
            if (quizMatch) parsed.push({ title: 'Practice Questions', icon: <HelpCircle className="w-5 h-5 text-orange-500" />, content: quizMatch[1].trim() });
            if (mindMapMatch) parsed.push({ title: 'Mind Map', icon: <Network className="w-5 h-5 text-green-500" />, content: mindMapMatch[1].trim() });

            // Fallback
            if (parsed.length === 0 && content) {
                parsed.push({ title: 'Study Notes', icon: <BookOpen className="w-5 h-5" />, content });
            }

            setSections(parsed);
        };

        if (content) parseContent();
    }, [content]);

    if (!content) return null;

    return (
        <div className="w-full max-w-3xl space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {sections.map((section, idx) => (
                <SectionCard key={idx} section={section} delay={idx * 100} />
            ))}
        </div>
    );
}

function SectionCard({ section, delay }: { section: Section, delay: number }) {
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    const handleCopy = () => {
        navigator.clipboard.writeText(section.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopy();
                    }}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    title="Copy section"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            {isOpen && (
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 leading-relaxed">
                    <div className="mt-4">
                        {section.title === 'Mind Map' ? (
                            <pre className="font-mono text-sm overflow-x-auto whitespace-pre p-4 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                                {section.content}
                            </pre>
                        ) : (
                            <ReactMarkdown className="prose dark:prose-invert max-w-none text-sm group-data-[title='Practice Questions']:font-medium prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                                {section.content}
                            </ReactMarkdown>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
