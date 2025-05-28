// netlify/functions/call-gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
    console.log("FUNCTION START: call-gemini.js initiated for ListModels.");
    console.log("Event HTTP Method:", event.httpMethod);

    if (event.httpMethod === "OPTIONS") {
        console.log("Received OPTIONS request for CORS preflight.");
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: ""
        };
    }

    if (event.httpMethod !== "POST") {
        console.warn("Method not allowed. Received:", event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed", message: "Only POST requests are supported." }),
        };
    }

    // Non abbiamo bisogno del prompt per ListModels, ma lo manteniamo per consistenza
    let prompt = null;
    try {
        const body = JSON.parse(event.body);
        prompt = body.prompt; // Potrebbe essere undefined, va bene per questo test
        console.log("Parsed prompt (first 100 chars):", prompt ? prompt.substring(0, 100) + "..." : "No prompt provided for this test.");
    } catch (parseError) {
        console.warn("Could not parse request body (expected for ListModels test):", parseError.message);
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.error("Server configuration error: GEMINI_API_KEY environment variable not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server Error", message: "Gemini API Key not found." }),
        };
    }

    try {
        console.log("Attempting to initialize GoogleGenerativeAI with provided API Key.");
        const genAI = new GoogleGenerativeAI(API_KEY);

        console.log("Calling ListModels to get available models...");
        const { models } = await genAI.listModels(); // CHIAMA LISTMODELS QUI

        const availableModels = models.map(model => ({
            name: model.name,
            supportedGenerationMethods: model.supportedGenerationMethods
        }));

        console.log("Successfully retrieved available models:");
        console.log(JSON.stringify(availableModels, null, 2)); // Stampa la lista dei modelli in formato leggibile

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ availableModels: availableModels }), // Restituisce la lista al client
        };

    } catch (error) {
        console.error("Caught error during ListModels API call:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        if (error.stack) {
            console.error("Error stack:", error.stack);
        }

        const errorMessage = `Failed to list models. Details: ${error.message || 'Unknown error'}.`;
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", message: errorMessage }),
        };
    } finally {
        console.log("FUNCTION END: call-gemini.js completed.");
    }
};