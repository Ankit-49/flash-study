const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // There isn't a direct listModels on the client in some versions, but let's try to just run a simple generateContent with a known working model like 'gemini-pro' to check connectivity,
        // OR we can try to use the model management API if exposed. 
        // Actually, checking the docs, we might not have listModels easily in the node SDK without the model manager.

        // Let's try to fallback to a safe model
        console.log("Testing gemini-1.5-flash-001...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const resultFlash = await modelFlash.generateContent("Test");
        console.log("gemini-1.5-flash-001 works!");

    } catch (error) {
        console.error("Error with 001:", error.message);
    }

    try {
        console.log("Testing gemini-pro...");
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const resultPro = await modelPro.generateContent("Test");
        console.log("gemini-pro works!");
    } catch (error) {
        console.error("Error with pro:", error.message);
    }
}

listModels();
