'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
    chart: string;
}

export default function MermaidChart({ chart }: MermaidChartProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'inherit',
            flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                curve: 'basis'
            },
        });

        if (ref.current) {
            ref.current.removeAttribute('data-processed');
            mermaid.contentLoaded();
        }
    }, [chart]);

    // Clean up empty lines and common AI errors in mermaid output
    const cleanChart = chart.replace(/\\n/g, '\n').trim();

    return (
        <div className="w-full flex justify-center py-6 overflow-x-auto bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-transparent">
            <div
                ref={ref}
                className="mermaid transition-all duration-500 scale-110 origin-top min-w-[600px] flex justify-center"
            >
                {cleanChart}
            </div>
        </div>
    );
}
