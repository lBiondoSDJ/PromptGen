// netlify/functions/call-gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
    // Aggiungi log all'inizio della funzione per tracciare l'esecuzione
    console.log("FUNCTION START: call-gemini.js initiated.");
    console.log("Event HTTP Method:", event.httpMethod);
    // Non loggare l'intero corpo dell'evento se può contenere dati sensibili o essere molto lungo
    // console.log("Event Body (raw, first 200 chars):", event.body ? event.body.substring(0, 200) + "..." : "No body");

    // Gestione delle richieste preflight OPTIONS per CORS
    // Questo è importante per evitare errori 404/CORS iniziali nel browser
    if (event.httpMethod === "OPTIONS") {
        console.log("Received OPTIONS request for CORS preflight.");
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Puoi restringere questo al tuo dominio Netlify in produzione (es. "https://tuo-sito.netlify.app")
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type", // Assicurati che Content-Type sia qui se lo invii nelle tue richieste POST
            },
            body: "" // Il corpo per le richieste OPTIONS è solitamente vuoto
        };
    }

    // Assicurati che la richiesta sia un POST
    if (event.httpMethod !== "POST") {
        console.warn("Method not allowed. Received:", event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed", message: "Only POST requests are supported." }),
        };
    }

    let prompt;
    try {
        // Parsifica il corpo JSON della richiesta
        const body = JSON.parse(event.body);
        prompt = body.prompt;
        // Logga solo i primi caratteri del prompt per evitare log troppo lunghi
        console.log("Parsed prompt (first 100 chars):", prompt ? prompt.substring(0, 100) + "..." : "No prompt");
    } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Bad Request", message: "Invalid JSON body." }),
        };
    }

    // Verifica che il prompt sia stato fornito
    if (!prompt) {
        console.error("Missing 'prompt' in request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Bad Request", message: "Missing 'prompt' in request body." }),
        };
    }

    // La chiave API di Gemini deve essere una variabile d'ambiente su Netlify
    // Non esporla MAI direttamente nel codice o nel frontend!
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
        // Utilizziamo "gemini-1.5-pro" come richiesto, dato che ha funzionato in precedenza
        console.log("Initializing Gemini model: gemini-1.0-pro");
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

        console.log("Calling model.generateContent with the prompt...");
        // Aggiungi un timeout esplicito per la chiamata API di Gemini se la libreria lo supporta,
        // o considera l'uso di 'abortController' per gestire i timeout della fetch.
        // Per ora ci affidiamo al timeout della funzione Netlify.
        const result = await model.generateContent(prompt);
        console.log("Received result from generateContent.");

        const response = await result.response;
        const text = response.text();
        console.log("Gemini AI response obtained (first 100 chars):", text ? text.substring(0, 100) + "..." : "No text received.");

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Lascia "*" per lo sviluppo. Restringi in produzione.
            },
            body: JSON.stringify({ aiResponse: text }),
        };

    } catch (error) {
        console.error("Caught error during Gemini API call:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        // 'error.stack' è molto utile per il debugging ma può essere verboso
        if (error.stack) {
            console.error("Error stack:", error.stack);
        }

        // Dettaglia il messaggio di errore per il client
        const errorMessage = `Failed to get response from AI. Details: ${error.message || 'Unknown error'}.`;
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", message: errorMessage }),
        };
    } finally {
        console.log("FUNCTION END: call-gemini.js completed.");
    }
};