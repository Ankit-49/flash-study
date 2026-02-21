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
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.1, // Lower temperature for more consistent grading
            }
        });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (handling potential markdown formatting)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        const feedbackData = JSON.parse(jsonString);

        return NextResponse.json(feedbackData);
    } catch (error: any) {
        console.error('Grading Error:', error);
        return NextResponse.json({ error: 'Failed to grade answer' }, { status: 500 });
    }
}
