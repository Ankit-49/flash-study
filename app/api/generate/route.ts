import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const systemPrompt = `You are a world-class teacher specializing in concept simplification.
For the provided text, generate ONLY these 4 sections:

1. SUMMARY: One paragraph explaining the core concept in simple terms.
2. ANALOGIES: Two real-world analogies that make this concept relatable.
3. QUIZ: Three multiple-choice questions testing understanding (mark correct answer with ✓).
4. MIND MAP: A text-based hierarchy showing main concepts and relationships.

Format output clearly with headers.`;

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('Gemini API Error: GEMINI_API_KEY is missing');
        return NextResponse.json(
            { error: 'Gemini API key not configured' },
            { status: 500 }
        );
    }

    try {
        const { text } = await request.json();

        if (!text || text.length < 10) {
            return NextResponse.json(
                { error: 'Please enter some text to analyze.' },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `${systemPrompt}\n\nContent to analyze:\n${text}`;

        console.log('Generating content with Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const output = response.text();
        console.log('Generation successful');

        return NextResponse.json({ result: output });

    } catch (error: any) {
        console.error('AI Generation Error Details:', error);
        console.error('Error Message:', error.message);

        // Return more specific error in dev mode or catch specific issues
        return NextResponse.json(
            { error: `Failed to generate study kit: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
