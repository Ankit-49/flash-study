import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(request: Request) {
    if (!apiKey) {
        return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
    }

    try {
        const { message, chatHistory, context } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are a helpful study assistant. Your goal is to answer questions based ONLY on the provided context (notes and uploaded documents). 
            If the answer is not in the context, politely say that you don't know based on the provided material, but offer to help with something else.
            Keep your answers concise and well-structured.
            
            CONTEXT:
            ${context}`
        });

        // Convert chat history to Gemini format
        const history = chatHistory.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }
}
