// js/main.js

import { fetchPromptsFromSheets } from './api.js';
import { UI_ELEMENTS } from './constants.js';
// RIMOSSO: populateTitleFilter dall'import
import { renderCards, populateCategoryFilter, showLoadingSpinner, hideLoadingSpinner, showCustomModal, showGlobalErrorMessage } from './ui.js';

async function init() {
    showLoadingSpinner();
    let prompts = [];
    try {
        prompts = await fetchPromptsFromSheets();
        if (prompts.length === 0) {
            showGlobalErrorMessage('Attenzione: Nessun prompt caricato. Il foglio potrebbe essere vuoto o non accessibile.');
        } else {
            showGlobalErrorMessage('');
        }
    } catch (error) {
        console.error("Errore critico durante l'inizializzazione:", error);
        showGlobalErrorMessage('Si è verificato un errore critico durante il caricamento iniziale dei prompt. Riprova più tardi.');
    } finally {
        hideLoadingSpinner();
    }

    const uniqueCategories = new Set();
    prompts.forEach(row => {
        const cat = row[3];
        if (cat) uniqueCategories.add(cat.toLowerCase());
    });
    populateCategoryFilter(uniqueCategories);

    // RIMOSSO: Chiamata a populateTitleFilter(prompts);

    function handleFilterAndSearch() {
        renderCards(
            prompts,
            UI_ELEMENTS.categoryFilter.value,
            UI_ELEMENTS.searchInput.value.toLowerCase()
            // RIMOSSO: UI_ELEMENTS.titleFilter.value
        );
    }

    if (UI_ELEMENTS.categoryFilter) {
        UI_ELEMENTS.categoryFilter.addEventListener("change", handleFilterAndSearch);
    }
    if (UI_ELEMENTS.searchInput) {
        UI_ELEMENTS.searchInput.addEventListener("input", handleFilterAndSearch);
    }
    // RIMOSSO: Event listener per UI_ELEMENTS.titleFilter

    handleFilterAndSearch();
}

document.addEventListener('DOMContentLoaded', init);