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
- Example: Write '\\\\frac{ a }{ b }' (double backslash) to produce '\\frac{ a } { b } ' in the string, which renders as a fraction.
- Example: Write '$E = mc ^ 2$' for inline math.
- Example: Write '$$...$$' for block math.
- DO NOT output plain text formulas like 'epsilon0'. Use '$\\\\epsilon_0$'.
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
        let text = '';

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            const plainText = formData.get('text') as string | null;

            if (file) {
                console.log(`Processing file: ${file.name} (${file.type})`);
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                if (file.type === 'application/pdf') {
                    const pdfParse = (await import('pdf-parse')).default;
                    const pdfData = await pdfParse(buffer);
                    text = pdfData.text;
                } else {
                    // Assume text-based file (txt, md, js, etc.)
                    text = buffer.toString('utf-8');
                }
            } else if (plainText) {
                text = plainText;
            }
        } else {
            const json = await request.json();
            text = json.text;
        }

        if (!text || text.length < 50) {
            return NextResponse.json(
                { error: 'Please provide at least 50 characters of content or a valid file.' },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        // Truncate text if it's too long (Gemini Flash has a large context window, but let's be safe)
        const maxLength = 100000;
        if (text.length > maxLength) {
            console.log(`Truncating input text from ${text.length} to ${maxLength} chars`);
            text = text.substring(0, maxLength);
        }

        const prompt = `${systemPrompt}\n\nContent to analyze:\n${text}`;

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
            { error: `Failed to generate study kit: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
