// netlify/functions/call-gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
    console.log("FUNCTION START: call-gemini.js initiated.");
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

    let prompt;
    try {
        const body = JSON.parse(event.body);
        prompt = body.prompt;
        console.log("Parsed prompt (first 100 chars):", prompt ? prompt.substring(0, 100) + "..." : "No prompt");
    } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Bad Request", message: "Invalid JSON body." }),
        };
    }

    if (!prompt) {
        console.error("Missing 'prompt' in request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Bad Request", message: "Missing 'prompt' in request body." }),
        };
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
        console.log("Initializing Gemini model: gemini-1.5-pro");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        console.log("Calling model.generateContent with the prompt...");
        const result = await model.generateContent(prompt);
        console.log("Received result from generateContent.");

        const response = await result.response;
        const text = response.text();
        console.log("Gemini AI response obtained (first 100 chars):", text ? text.substring(0, 100) + "..." : "No text received.");

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ aiResponse: text }),
        };

    } catch (error) {
        console.error("Caught error during Gemini API call:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        if (error.stack) {
            console.error("Error stack:", error.stack);
        }

        const errorMessage = `Failed to get response from AI. Details: ${error.message || 'Unknown error'}.`;
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", message: errorMessage }),
        };
    } finally {
        console.log("FUNCTION END: call-gemini.js completed.");
    }
};