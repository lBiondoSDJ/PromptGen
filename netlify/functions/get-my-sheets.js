// .netlify/functions/get-my-sheets.js
const { google } = require('googleapis');

exports.handler = async (event) => {
    // Solo le richieste POST sono accettate
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed', message: 'Only POST requests are supported.' }),
        };
    }

    let sheetId, sheetRange;
    try {
        // Parsifica il corpo JSON della richiesta
        const body = JSON.parse(event.body);
        sheetId = body.sheetId;
        sheetRange = body.sheetRange;
    } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON body.' }),
        };
    }

    // Assicurati che sheetId e sheetRange siano presenti
    if (!sheetId || !sheetRange) {
        // Questo è il log che stai vedendo ora
        console.error('Parametri sheetId o sheetRange mancanti dalla richiesta del client.');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Bad Request', message: 'Missing sheetId or sheetRange in request body.' }),
        };
    }

    // La Google API Key è ora in una variabile d'ambiente Netlify
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

    if (!apiKey) {
        console.error('GOOGLE_SHEETS_API_KEY non configurata nelle variabili d\'ambiente Netlify.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server Error', message: 'API key not configured.' }),
        };
    }

    const sheets = google.sheets({ version: 'v4', auth: apiKey });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: sheetRange,
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                // Per sicurezza, puoi specificare il tuo dominio Netlify al posto di '*'
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        console.error('Errore durante il recupero dei dati da Google Sheets:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from Google Sheets', details: error.message }),
        };
    }
};