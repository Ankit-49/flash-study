import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
        const { question, answer, context } = await request.json();

        if (!question || !answer) {
            return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelsToTry = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro-latest"];
        let result;
        let lastError;

        const prompt = `You are an Expert Educator and Subject Matter Expert specializing in the Feynman Technique.
Your goal is to evaluate a student's answer based on a provided context.

SCORING RUBRIC (0-100):
- 90-100: Perfect accuracy. Concept explained simply and clearly without losing technical nuance.
- 70-89: Mostly accurate. May have minor omissions or could be simplified further for better understanding.
- 40-69: Partially correct but contains notable misunderstandings or misses key components of the concept.
- Below 40: Factually incorrect or irrelevant to the provided context.

CONTEXT FROM STUDY MATERIAL:
"""
${context.substring(0, 10000)}
"""

QUESTION: "${question}"
STUDENT'S ANSWER: "${answer}"

INSTRUCTIONS:
1. Evaluate if the student understands the core concept.
2. If they are wrong, explain the correct concept precisely using the context above.
3. Provide actionable feedback on how they can improve their explanation (Feynman Technique focus).
4. Offer one "Deep Dive" question or point to encourage further mastery.

Format your response as a strictly valid JSON object:
{
  "feedback": "Your concise evaluation (max 4 sentences).",
  "score": 85
}`;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting reflection grading with model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.1,
                    }
                });

                result = await model.generateContent(prompt);
                if (result && result.response) {
                    console.log(`Successfully graded with model: ${modelName}`);
                    break;
                }
            } catch (err: any) {
                console.error(`Reflection Model ${modelName} failed:`, err.message);
                lastError = err;
            }
        }

        if (!result) {
            throw lastError || new Error('All available Gemini models failed to generate feedback.');
        }

        const response = await result.response;
        const outputText = response.text();

        // Robust JSON Extraction
        const extractJSON = (text: string) => {
            try {
                return JSON.parse(text);
            } catch (e) {
                let cleaned = text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
                try {
                    return JSON.parse(cleaned);
                } catch (e2) {
                    const startIdx = cleaned.indexOf('{');
                    const endIdx = cleaned.lastIndexOf('}');
                    if (startIdx !== -1 && endIdx !== -1) {
                        cleaned = cleaned.substring(startIdx, endIdx + 1);
                        return JSON.parse(cleaned);
                    }
                    throw e2;
                }
            }
        };

        const feedbackData = extractJSON(outputText);
        return NextResponse.json(feedbackData);
    } catch (error: any) {
        console.error('Grading Error:', error);
        return NextResponse.json({ error: 'Failed to grade answer: ' + error.message }, { status: 500 });
    }
}
