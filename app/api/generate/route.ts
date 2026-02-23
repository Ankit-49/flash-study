/**
 * API route for generating study kits using Gemini AI.
 * Handles content generation, PDF parsing, and rate limiting.
 */
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
  "mnemonics": [
    { "concept": "Concept Name", "mnemonic": "Acronym, catchphrase, or visual story", "type": "acronym or story" }
  ],
  "reflectionQuestions": [
    "Open-ended question 1 requiring critical thinking",
    "Open-ended question 2 requiring critical thinking"
  ],
  "sources": ["Full name of source file 1", "Full name of source file 2"],
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
    },
    { 
        "question": "Question text", 
        "options": ["Option A", "Option B", "Option C", "Option D"], 
        "correctOptionIndex": 3
    },
    { 
        "question": "Question text", 
        "options": ["Option A", "Option B", "Option C", "Option D"], 
        "correctOptionIndex": 4
    }
  ],
  "mindMap": "A CLEAR Mermaid.js graph LR (horizontal) diagram. Use 'graph LR' ONLY. Ensure nodes are short. Avoid deep nesting. MANDATORY: Use double quotes for ALL labels, e.g., A[\"Label Text\"] or B(\"Label\"). CRITICAL: DO NOT use any LaTeX, special math symbols, or parentheses inside labels unless they are inside double quotes. Math in Mermaid will ALWAYS break the diagram."
}

CRITICAL INSTRUCTION FOR MATH AND JSON:
- You MUST use LaTeX for all formulas.
- Because this is a JSON response, you MUST escape all backslashes in LaTeX.
- Example: Write '\\\\frac{ a }{ b }' (double backslash) to produce '\\frac{ a } { b } ' in the string, which renders as a fraction.
- Example: Write '$E = mc ^ 2$' for inline math.
- Example: Write '$$...$$' for block math.
- DO NOT output plain text formulas like 'epsilon0'. Use '$\\\\epsilon_0$'.
- You MUST include ALL fields in the JSON object: "summary", "analogies", "keyTerms", "mnemonics", "reflectionQuestions", "sources", "quiz", and "mindMap".
- NEVER omit any field, even for large documents.
- For "mnemonics", provide 2-3 creative memory aids for the most difficult concepts.
- For "reflectionQuestions", provide 2-3 deep, open-ended questions that encourage applying the concept.
- For "sources", list the names of the files/documents provided as input. If multiple sources are provided, synthesize them into one cohesive kit.
- Ensure the "quiz" contains exactly 5 diverse multiple-choice questions.
- Ensure the "mindMap" is a complete Mermaid.js graph.
- CRITICAL: Ensure the output is strictly valid JSON.
- DO NOT miss commas between array elements (e.g., in "quiz" or "keyTerms").
- ALWAYS escape double quotes inside strings: use \\" if you need a quote inside a field.
- Do not include markdown code blocks.`;

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
            const fileNames: string[] = [];

            if (plainText) text += `Input context (text): ${plainText}\n\n`;

            for (const file of files) {
                if (!file) continue;
                fileNames.push(file.name);
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
                    try {
                        const canvas = require('@napi-rs/canvas');
                        if (typeof global !== 'undefined') {
                            (global as any).DOMMatrix = canvas.DOMMatrix;
                            (global as any).Path2D = canvas.Path2D;
                            (global as any).DOMPoint = canvas.DOMPoint;
                        }
                        console.log('Successfully loaded @napi-rs/canvas polyfills');
                    } catch (canvasErr: any) {
                        console.error('Failed to load @napi-rs/canvas:', canvasErr.message);
                    }

                    let pdfParse = require('pdf-parse');
                    if (typeof pdfParse !== 'function' && typeof pdfParse.default === 'function') {
                        pdfParse = pdfParse.default;
                    }

                    let fileText = '';
                    try {
                        if (typeof pdfParse === 'function') {
                            const pdfData = await pdfParse(buffer);
                            fileText = pdfData.text;
                        } else if (typeof pdfParse === 'object' && pdfParse.PDFParse) {
                            const parser = new pdfParse.PDFParse({ data: buffer });
                            const result = await parser.getText();
                            fileText = result.text;
                        }
                    } catch (parseErr: any) {
                        console.error('pdf-parse core failed:', parseErr.message);
                        throw new Error(`PDF parsing failed: ${parseErr.message}`);
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

            if (fileNames.length > 0) {
                text = `Input sources: ${fileNames.join(', ')}\n\n${text}`;
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

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        const genAI = new GoogleGenerativeAI(apiKey);
        // Prioritize stable flash models which have higher free tier limits (15 RPM)
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-2.0-flash",
            "gemini-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro-latest"
        ];

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

        for (let i = 0; i < modelsToTry.length; i++) {
            const modelName = modelsToTry[i];
            try {
                console.log(`Attempting with model: ${modelName} (Attempt ${i + 1}/${modelsToTry.length})`);
                const isFlash = modelName.includes('flash');
                const isTwoZero = modelName.includes('2.0');

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 16384,
                        responseMimeType: (isFlash || isTwoZero) ? "application/json" : "text/plain"
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
                const errorMessage = err.message || '';
                console.error(`Model ${modelName} failed:`, errorMessage);
                lastError = err;

                // If it's a quota/rate limit error, wait longer before trying next model
                if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('quota')) {
                    const waitTime = 2000 * (i + 1); // Exponential-ish backoff
                    console.warn(`Rate limit hit on ${modelName}. Waiting ${waitTime}ms before next attempt...`);
                    await sleep(waitTime);
                } else if (errorMessage.includes('404')) {
                    console.warn(`Model ${modelName} not found, skipping immediately.`);
                }
            }
        }

        if (!result) {
            throw lastError || new Error('All available Gemini models failed to generate content.');
        }

        const response = await result.response;
        let outputText = response.text();

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
                            // Last resort: handle unescaped newlines and common missing commas
                            const ultraCleaned = cleaned
                                .replace(/\n(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, "\\n") // Unescaped newlines
                                .replace(/}\s*{/g, "},{") // Missing commas between objects
                                .replace(/]\s*{/g, "],{") // Missing commas between array/object
                                .replace(/}\s*\[/g, "},["); // Missing commas between object/array
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
            console.error('AI JSON Parsing failed after all attempts.');
            console.error('--- RAW OUTPUT START ---');
            console.error(outputText);
            console.error('--- RAW OUTPUT END ---');
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
