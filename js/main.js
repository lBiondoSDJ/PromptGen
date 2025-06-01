// js/main.js

import { fetchPromptsFromSheets } from './api.js';
import { UI_ELEMENTS } from './constants.js';
import { renderCards, populateCategoryFilter, showLoadingSpinner, hideLoadingSpinner, showCustomModal, showGlobalErrorMessage } from './ui.js';

// Costante per definire la validità della cache in minuti (es. 60 minuti = 1 ora)
const CACHE_EXPIRATION_MINUTES = 60; 

async function init() {
    showLoadingSpinner();
    let prompts = [];
    const cachedData = localStorage.getItem('cachedPrompts'); // Tentativo di recuperare i dati dalla cache

    if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData); // Parsifica i dati della cache
        const now = new Date().getTime();
        // Calcola la differenza in minuti tra ora attuale e timestamp della cache
        const timeElapsedMinutes = (now - timestamp) / (1000 * 60); 

        // Se i dati sono presenti e non sono scaduti
        if (timeElapsedMinutes < CACHE_EXPIRATION_MINUTES) { 
            prompts = data; // Usa i dati dalla cache
            console.log('Prompts caricati dalla cache (validi).');
            hideLoadingSpinner(); // Nasconde lo spinner di caricamento
            // Non mostrare messaggi di errore globali se i dati sono stati caricati con successo dalla cache
            showGlobalErrorMessage(''); 
        } else {
            // I dati in cache sono scaduti, dobbiamo aggiornarli dal backend
            console.log('Prompts in cache scaduti, recupero dal backend...');
            await fetchAndCachePrompts();
        }
    } else {
        // Nessun dato in cache, dobbiamo recuperarli dal backend
        console.log('Nessun prompt in cache, recupero dal backend...');
        await fetchAndCachePrompts();
    }

    // Funzione helper per recuperare i prompt dal backend e aggiornare la cache
    async function fetchAndCachePrompts() {
        try {
            prompts = await fetchPromptsFromSheets();
            if (prompts.length === 0) {
                showGlobalErrorMessage('Attenzione: Nessun prompt caricato. Il foglio potrebbe essere vuoto o non accessibile.');
            } else {
                // Se il recupero ha successo, salva i dati e la timestamp in localStorage
                localStorage.setItem('cachedPrompts', JSON.stringify({
                    data: prompts,
                    timestamp: new Date().getTime()
                }));
                console.log('Prompts recuperati dal backend e salvati in cache.');
                showGlobalErrorMessage(''); // Pulisce eventuali messaggi di errore precedenti
            }
        } catch (error) {
            console.error("Errore critico durante l'inizializzazione o il recupero dei prompt:", error);
            showGlobalErrorMessage('Si è verificato un errore critico durante il caricamento iniziale dei prompt. Riprova più tardi.');
            // In caso di errore, se c'erano dati scaduti in cache, potremmo volerli mostrare comunque come fallback
            if (cachedData) {
                const { data } = JSON.parse(cachedData);
                prompts = data;
                console.warn('Impossibile recuperare nuovi prompt, utilizzando i dati scaduti dalla cache come fallback.');
            }
        } finally {
            hideLoadingSpinner(); // Nasconde lo spinner di caricamento
        }
    }

    // --- Logica di filtraggio e rendering (rimane invariata rispetto alla tua versione) ---
    const uniqueCategories = new Set();
    prompts.forEach(row => {
        const cat = row[3];
        if (cat) uniqueCategories.add(cat.toLowerCase());
    });
    populateCategoryFilter(uniqueCategories);

    function handleFilterAndSearch() {
        renderCards(
            prompts,
            UI_ELEMENTS.categoryFilter.value,
            UI_ELEMENTS.searchInput.value.toLowerCase()
        );
    }

    if (UI_ELEMENTS.categoryFilter) {
        UI_ELEMENTS.categoryFilter.addEventListener("change", handleFilterAndSearch);
    }
    if (UI_ELEMENTS.searchInput) {
        UI_ELEMENTS.searchInput.addEventListener("input", handleFilterAndSearch);
    }

    handleFilterAndSearch();
}

document.addEventListener('DOMContentLoaded', init);