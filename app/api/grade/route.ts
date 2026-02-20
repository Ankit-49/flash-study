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
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a helpful teaching assistant.
Context of the study material: "${context.substring(0, 3000)}"
Question asked: "${question}"
Student's answer: "${answer}"

Provide a concise (max 3-4 sentences) evaluation of the answer. 
1. State if the answer is correct or if it needs improvement.
2. Provide a brief explanation of the correct concept if they were wrong.
3. Offer one "deep dive" follow-up point.

Format your response as a JSON object:
{
  "feedback": "Your evaluation text",
  "score": 0-100 (where 100 is perfectly correct)
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
