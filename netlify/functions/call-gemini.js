// netlify/functions/call-gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    const { prompt } = JSON.parse(event.body);

    // Verifica che il prompt sia stato fornito
    if (!prompt) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing 'prompt' in request body." }),
        };
    }

    // La chiave API di Gemini deve essere una variabile d'ambiente su Netlify
    // Non esporla MAI direttamente nel codice o nel frontend!
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.error("GEMINI_API_KEY environment variable not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error: Gemini API Key not found." }),
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
 HEAD
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // O "gemini-1.5-pro", "gemini-1.0-pro", ecc. Scegli il modello appropriato.
fe30f8e22c49a0b7e207472fcc5cde56a1f7c88c

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Considera di restringere questo in produzione
            },
            body: JSON.stringify({ aiResponse: text }),
        };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to get response from AI. Please try again.", details: error.message }),
        };
    }
};