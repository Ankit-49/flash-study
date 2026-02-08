import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log(`--- CHAT API CALL [v6] --- API Key Length: ${apiKey?.length || 0}`);

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const { message, chatHistory, context } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
        });

        const fullContext = `You are a helpful study assistant. Your goal is to answer questions based ONLY on the provided context (notes and uploaded documents). 
        If the answer is not in the context, politely say that you don't know based on the provided material, but offer to help with something else.
        Keep your answers concise and well-structured.
        
        CONTEXT:
        ${context}`;

        // Manual prompt engineering for context and history
        let fullPrompt = `${fullContext}\n\n`;

        // Add history
        chatHistory.forEach((msg: any) => {
            fullPrompt += `${msg.role === 'user' ? 'USER' : 'ASSISTANT'}: ${msg.content}\n`;
        });

        // Add current message
        fullPrompt += `USER: ${message}\nASSISTANT:`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }
}
