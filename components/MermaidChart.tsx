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
        });

        if (ref.current) {
            ref.current.removeAttribute('data-processed');
            mermaid.contentLoaded();
        }
    }, [chart]);

    // Clean up empty lines and common AI errors in mermaid output
    const cleanChart = chart.replace(/\\n/g, '\n').trim();

    return (
        <div className="w-full flex justify-center py-4 overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
            <div ref={ref} className="mermaid">
                {cleanChart}
            </div>
        </div>
    );
}
