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
    console.log(`--- GENERATE API CALL [v5] --- API Key Length: ${apiKey?.length || 0}`);

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
            const files = formData.getAll('file') as File[];
            const plainText = formData.get('text') as string | null;

            let combinedText = '';

            if (plainText) {
                combinedText += plainText;
            }

            for (const file of files) {
                if (file) {
                    console.log(`Processing file: ${file.name} (${file.type})`);
                    const buffer = Buffer.from(await file.arrayBuffer());
                    let fileText = '';

                    if (file.type === 'application/pdf') {
                        // Use createRequire to bypass ESM/CJS interop issues with pdf-parse
                        const { createRequire } = await import('module');
                        const require = createRequire(import.meta.url);

                        // Polyfill DOMMatrix, Path2D, etc. for pdfjs-dist@5 (used by pdf-parse)
                        const canvas = require('@napi-rs/canvas');
                        if (typeof global !== 'undefined') {
                            (global as any).DOMMatrix = canvas.DOMMatrix;
                            (global as any).Path2D = canvas.Path2D;
                            (global as any).DOMPoint = canvas.DOMPoint;
                        }

                        let pdfParse = require('pdf-parse');

                        if (typeof pdfParse !== 'function' && typeof pdfParse.default === 'function') {
                            pdfParse = pdfParse.default;
                        }

                        if (typeof pdfParse === 'function') {
                            // Legacy function-based API or correctly resolved default export
                            const pdfData = await pdfParse(buffer);
                            fileText = pdfData.text;
                        } else if (typeof pdfParse === 'object' && pdfParse.PDFParse) {
                            // New class-based API in version 2.4.5+
                            const parser = new pdfParse.PDFParse({ data: buffer });
                            const result = await parser.getText();
                            fileText = result.text;
                        } else {
                            console.error('pdf-parse export type:', typeof pdfParse);
                            console.error('pdf-parse export keys:', Object.keys(pdfParse || {}));
                            throw new Error(`pdf-parse library parsing failed: exported value is not a function or compatible class (type: ${typeof pdfParse})`);
                        }
                    } else {
                        // Assume text-based file (txt, md, js, etc.)
                        fileText = buffer.toString('utf-8');
                    }

                    if (combinedText) {
                        combinedText += `\n\n--- ADDITIONAL CONTENT FROM UPLOADED FILE: ${file.name} ---\n\n`;
                    }
                    combinedText += fileText;
                }
            }

            if (!combinedText.trim()) {
                return NextResponse.json({ error: 'No content found to analyze' }, { status: 400 });
            }

            text = combinedText;
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
        const modelsToTry = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro-latest"];
        let result;
        let lastError;

        // Truncate text if it's too long (Gemini Flash has a large context window, but let's be safe)
        const maxLength = 100000;
        if (text.length > maxLength) {
            console.log(`Truncating input text from ${text.length} to ${maxLength} chars`);
            text = text.substring(0, maxLength);
        }

        const prompt = `${systemPrompt}\n\nContent to analyze:\n${text}`;

        console.log('Generating content with Gemini...');

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting with model: ${modelName}`);
                const isFlashLatest = modelName === "gemini-flash-latest";
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        // Only use responseMimeType for models we are sure support it
                        responseMimeType: (modelName.includes('1.5') || modelName.includes('2.') || isFlashLatest) ? "application/json" : "text/plain"
                    }
                });

                result = await model.generateContent(prompt);
                if (result && result.response) {
                    console.log(`Successfully generated with model: ${modelName}`);
                    break;
                }
            } catch (err: any) {
                console.error(`Model ${modelName} failed:`, err.message);
                lastError = err;
            }
        }

        if (!result) {
            throw lastError || new Error('All available Gemini models failed to generate content.');
        }

        const response = await result.response;
        let outputText = response.text();
        console.log('Generation successful');

        // Robust JSON Extraction and Cleaning
        try {
            // Remove potential markdown blocks
            outputText = outputText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();

            // Handle common AI "mistakes" in JSON (unescaped newlines in strings)
            // This is a partial fix for "Bad control character"
            const cleanedOutput = outputText.replace(/\n/g, ' ').replace(/\r/g, ' ');

            const jsonOutput = JSON.parse(cleanedOutput);

            return NextResponse.json({
                result: jsonOutput,
                context: text
            });
        } catch (parseError) {
            console.error('Initial JSON parse failed, trying fallback extraction:', parseError);

            // Fallback: try to find the first '{' and last '}'
            const startIdx = outputText.indexOf('{');
            const endIdx = outputText.lastIndexOf('}');

            if (startIdx !== -1 && endIdx !== -1) {
                try {
                    const fallbackExtract = outputText.substring(startIdx, endIdx + 1)
                        .replace(/\n/g, ' ')
                        .replace(/\r/g, ' ');
                    const jsonOutput = JSON.parse(fallbackExtract);
                    return NextResponse.json({
                        result: jsonOutput,
                        context: text
                    });
                } catch (e) {
                    throw new Error('Failed to parse AI response as JSON even with fallback extraction.');
                }
            }
            throw parseError;
        }

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
