import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const systemPrompt = `You are a world-class teacher specializing in concept simplification.
For the provided text, generate a valid JSON object with the following structure:
{
  "summary": "One paragraph explaining the core concept in simple terms.",
  "analogies": ["Analogy 1", "Analogy 2"],
  "quiz": [
    { 
      "question": "Question text", 
      "options": ["Option A", "Option B", "Option C", "Option D"], 
      "correctOptionIndex": 0 
    },
    { 
        "question": "Question text", 
        "options": ["Option A", "Option B", "Option C", "Option D"], 
        "correctOptionIndex": 1
    },
    { 
        "question": "Question text", 
        "options": ["Option A", "Option B", "Option C", "Option D"], 
        "correctOptionIndex": 2
    }
  ],
  "mindMap": "A hierarchical mind map using Markdown bullet points (e.g., - Main Concept\n  - Subconcept). Use LaTeX for math equations where appropriate."
}

CRITICAL INSTRUCTION FOR MATH AND JSON:
- You MUST use LaTeX for all formulas.
- Because this is a JSON response, you MUST escape all backslashes in LaTeX.
- Example: Write `\\\\frac{ a }{ b }` (double backslash) to produce `\\frac{ a } { b } ` in the string, which renders as a fraction.
- Example: Write `$E = mc ^ 2$` for inline math.
- Example: Write `$$...$$` for block math.
- DO NOT output plain text formulas like 'epsilon0'. Use `$\\\\epsilon_0$`.
- Ensure the output is strictly valid JSON. Do not include markdown code blocks.`;

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
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `${systemPrompt} \n\nContent to analyze: \n${text} `;

        console.log('Generating content with Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const outputText = response.text();
        console.log('Generation successful');

        const jsonOutput = JSON.parse(outputText);

        return NextResponse.json({ result: jsonOutput });

    } catch (error: any) {
        console.error('AI Generation Error Details:', error);
        console.error('Error Message:', error.message);

        // Return more specific error in dev mode or catch specific issues
        return NextResponse.json(
            { error: `Failed to generate study kit: ${error.message || 'Unknown error'} ` },
            { status: 500 }
        );
    }
}
