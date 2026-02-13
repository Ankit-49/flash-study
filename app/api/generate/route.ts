import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const systemPrompt = `You are a world-class teacher specializing in concept simplification.
For the provided text, generate a valid JSON object with the following structure:
{
  "summary": "One paragraph explaining the core concept in simple terms.",
  "analogies": ["Analogy 1", "Analogy 2"],
  "keyTerms": [
    { "term": "Term Name (Use LaTeX if formula)", "definition": "Definition (Use LaTeX for formulas and symbols)" }
  ],
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
  "podcast": [
    { "role": "Tutor", "content": "Introduction to the topic." },
    { "role": "Student", "content": "Question or reaction." }
  ],
  "mindMap": "A CLEAR Mermaid.js graph LR (horizontal) diagram. Use 'graph LR' ONLY. Ensure nodes are short. Avoid deep nesting. CRITICAL: DO NOT use any LaTeX or special math symbols inside Mermaid nodes as they will break the diagram."
}

CRITICAL INSTRUCTION FOR MATH AND JSON:
- You MUST use LaTeX for all formulas.
- Because this is a JSON response, you MUST escape all backslashes in LaTeX.
- Example: Write '\\\\frac{ a }{ b }' (double backslash) to produce '\\frac{ a } { b } ' in the string, which renders as a fraction.
- Example: Write '$E = mc ^ 2$' for inline math.
- Example: Write '$$...$$' for block math.
- DO NOT output plain text formulas like 'epsilon0'. Use '$\\\\epsilon_0$'.
- You MUST include ALL fields in the JSON object: "summary", "analogies", "keyTerms", "quiz", "mindMap", and "podcast".
- The "podcast" should be a 6-8 turn dialogue between a "Tutor" (expert, encouraging) and a "Student" (curious, asks clarifying questions).
- NEVER omit any field, even for large documents.
- Ensure the "quiz" contains exactly 3 diverse multiple-choice questions.
- Ensure the "mindMap" is a complete Mermaid.js graph.
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
        let imageParts: any[] = [];
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const files = formData.getAll('file') as File[];
            const plainText = formData.get('text') as string | null;

            if (plainText) text += plainText;

            for (const file of files) {
                if (!file) continue;
                console.log(`Processing file: ${file.name} (${file.type})`);
                const buffer = Buffer.from(await file.arrayBuffer());

                if (file.type.startsWith('image/')) {
                    imageParts.push({
                        inlineData: {
                            data: buffer.toString('base64'),
                            mimeType: file.type
                        }
                    });
                } else if (file.type === 'application/pdf') {
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

                    let fileText = '';
                    if (typeof pdfParse === 'function') {
                        const pdfData = await pdfParse(buffer);
                        fileText = pdfData.text;
                    } else if (typeof pdfParse === 'object' && pdfParse.PDFParse) {
                        const parser = new pdfParse.PDFParse({ data: buffer });
                        const result = await parser.getText();
                        fileText = result.text;
                    }

                    if (fileText) {
                        if (text) text += `\n\n--- CONTENT FROM: ${file.name} ---\n\n`;
                        text += fileText;
                    }
                } else {
                    // Assume text-based file
                    const fileText = buffer.toString('utf-8');
                    if (fileText) {
                        if (text) text += `\n\n--- CONTENT FROM: ${file.name} ---\n\n`;
                        text += fileText;
                    }
                }
            }
        } else {
            const json = await request.json();
            text = json.text;
        }

        if ((!text || text.length < 50) && imageParts.length === 0) {
            return NextResponse.json(
                { error: 'Please provide at least 50 characters of content or a valid file/image.' },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelsToTry = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro-latest"];
        let result;
        let lastError;

        // Truncate text if it's too long
        const maxLength = 100000;
        if (text.length > maxLength) {
            console.log(`Truncating input text from ${text.length} to ${maxLength} chars`);
            text = text.substring(0, maxLength);
        }

        const prompt = `${systemPrompt}\n\nContent to analyze (including any uploaded visual material):\n${text}`;

        console.log('Generating content with Gemini...');

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting with model: ${modelName}`);
                const isFlashLatest = modelName === "gemini-flash-latest";
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 16384,
                        responseMimeType: (modelName.includes('1.5') || modelName.includes('2.') || isFlashLatest) ? "application/json" : "text/plain"
                    }
                });

                // Combine text prompt and image parts
                const contentParts = [prompt, ...imageParts];
                result = await model.generateContent(contentParts);

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
        const extractJSON = (text: string) => {
            try {
                // Try direct parse first
                return JSON.parse(text);
            } catch (e) {
                // Cleaning phase
                let cleaned = text
                    .replace(/```json\n?/, '')
                    .replace(/\n?```/, '')
                    .trim();

                try {
                    return JSON.parse(cleaned);
                } catch (e2) {
                    // Deep extraction
                    const startIdx = cleaned.indexOf('{');
                    const endIdx = cleaned.lastIndexOf('}');
                    if (startIdx !== -1 && endIdx !== -1) {
                        cleaned = cleaned.substring(startIdx, endIdx + 1);
                        try {
                            return JSON.parse(cleaned);
                        } catch (e3) {
                            // Last resort: handle unescaped newlines within strings
                            // This is risky but helps with common AI formatting errors
                            const ultraCleaned = cleaned.replace(/\n(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, "\\n");
                            return JSON.parse(ultraCleaned);
                        }
                    }
                    throw e2;
                }
            }
        };

        try {
            const jsonOutput = extractJSON(outputText);

            return NextResponse.json({
                result: jsonOutput,
                context: text
            });
        } catch (parseError: any) {
            console.error('AI JSON Parsing failed after all attempts:', parseError.message);
            throw new Error(`AI response formatting error: ${parseError.message}`);
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
