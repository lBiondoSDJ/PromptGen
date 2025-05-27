// js/api.js

import { SHEET_ID, SHEET_RANGE, NETLIFY_FUNCTION_URLS } from './constants.js';
import { showCustomModal } from './ui.js';

export async function fetchPromptsFromSheets() {
    try {
        const response = await fetch(NETLIFY_FUNCTION_URLS.GET_SHEETS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sheetId: SHEET_ID, sheetRange: SHEET_RANGE }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Errore nella risposta della Netlify Function (Sheets): ${response.status}. Dettagli:`, errorData);
            throw new Error(`Errore nel caricamento dei dati: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        return data.values || [];
    } catch (error) {
        console.error("Errore durante il recupero dei prompt dalla Netlify Function:", error);
        showCustomModal("Errore di Caricamento", "Si è verificato un errore nel caricamento dei prompt. Riprova più tardi o controlla la configurazione della funzione Netlify.");
        return [];
    }
}

export async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(NETLIFY_FUNCTION_URLS.CALL_GEMINI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Errore nella risposta della Cloud Function Gemini:", errorData);
            throw new Error(errorData.error || response.statusText);
        }

        const data = await response.json();
        return data.aiResponse || null;
    } catch (error) {
        console.error("Errore durante la chiamata alla Cloud Function Gemini:", error);
        throw new Error(`Errore di connessione: ${error.message}. Verifica la console per dettagli.`);
    }
}