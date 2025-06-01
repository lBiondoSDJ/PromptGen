// js/main.js

import { fetchPromptsFromSheets } from './api.js';
import { UI_ELEMENTS } from './constants.js'; // GLOBAL_STATE non è più importato qui
import { renderCards, populateCategoryFilter, populateTitleFilter, showLoadingSpinner, hideLoadingSpinner, showCustomModal, showGlobalErrorMessage } from './ui.js';

async function init() {
    showLoadingSpinner(); // Ora questa funzione in ui.js aggiorna lo stato e renderizza
    let prompts = [];
    try {
        prompts = await fetchPromptsFromSheets();
        if (prompts.length === 0) {
            // Se non ci sono prompt ma non c'è stato un errore specifico dall'API,
            // potrebbe essere un foglio vuoto o un problema di dati.
            showGlobalErrorMessage('Attenzione: Nessun prompt caricato. Il foglio potrebbe essere vuoto o non accessibile.');
        } else {
            showGlobalErrorMessage(''); // Pulisce eventuali messaggi di errore precedenti
        }
    } catch (error) {
        console.error("Errore critico durante l'inizializzazione:", error);
        // showGlobalErrorMessage gestisce l'aggiornamento dell'UI_ELEMENTS.globalErrorMessage
        showGlobalErrorMessage('Si è verificato un errore critico durante il caricamento iniziale dei prompt. Riprova più tardi.');
    } finally {
        hideLoadingSpinner(); // Nasconde lo spinner indipendentemente dal successo/fallimento
    }


    const uniqueCategories = new Set();
    prompts.forEach(row => {
        const cat = row[3];
        if (cat) uniqueCategories.add(cat.toLowerCase());
    });
    populateCategoryFilter(uniqueCategories);

    populateTitleFilter(prompts); // Popola il filtro dei titoli con i prompt caricati

    function handleFilterAndSearch() {
        renderCards(
            prompts,
            UI_ELEMENTS.categoryFilter.value,
            UI_ELEMENTS.searchInput.value.toLowerCase(),
            UI_ELEMENTS.titleFilter.value
        );
    }

    // Aggiungi event listeners per tutti i filtri
    if (UI_ELEMENTS.categoryFilter) {
        UI_ELEMENTS.categoryFilter.addEventListener("change", handleFilterAndSearch);
    }
    if (UI_ELEMENTS.searchInput) {
        UI_ELEMENTS.searchInput.addEventListener("input", handleFilterAndSearch);
    }
    if (UI_ELEMENTS.titleFilter) { // Assicurati che titleFilter sia in UI_ELEMENTS
        UI_ELEMENTS.titleFilter.addEventListener("change", handleFilterAndSearch);
    }


    // Chiama handleFilterAndSearch all'inizio per il rendering iniziale delle card
    handleFilterAndSearch();
}

// Inizializza l'applicazione quando il DOM è completamente caricato
document.addEventListener('DOMContentLoaded', init);