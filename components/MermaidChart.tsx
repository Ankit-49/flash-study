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
            theme: 'base',
            securityLevel: 'loose',
            fontFamily: 'inherit',
            themeVariables: {
                primaryColor: '#6366f1',
                primaryTextColor: '#fff',
                primaryBorderColor: '#4f46e5',
                lineColor: '#818cf8',
                secondaryColor: '#f8fafc',
                tertiaryColor: '#f1f5f9',
            },
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis',
            },
        });

        if (ref.current) {
            ref.current.removeAttribute('data-processed');
            mermaid.contentLoaded();
        }
    }, [chart]);

    // Clean up lines and common AI errors in mermaid output
    const cleanChart = chart.replace(/\\n/g, '\n').replace(/&/g, 'and').trim();

    return (
        <div className="w-full flex justify-start items-start py-6 sm:py-10 px-2 sm:px-4 overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-transparent min-h-[300px] touch-pan-x">
            <div
                ref={ref}
                className="mermaid transition-opacity duration-500 opacity-100 mx-auto"
            >
                {cleanChart}
            </div>
        </div>
    );
}
