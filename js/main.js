// js/main.js

import { fetchPromptsFromSheets } from './api.js';
import { UI_ELEMENTS, GLOBAL_STATE } from './constants.js';
import { renderCards, populateCategoryFilter, showLoadingSpinner, hideLoadingSpinner } from './ui.js';

async function init() {
    showLoadingSpinner();
    const prompts = await fetchPromptsFromSheets();
    hideLoadingSpinner();

    if (prompts.length === 0) {
        UI_ELEMENTS.promptContainer.innerHTML = '<p style="text-align: center; color: #cc0000; font-weight: bold; margin-top: 3rem;">Errore: Impossibile caricare i prompt dal Google Sheet. Verifica la configurazione della funzione Netlify.</p>';
        return;
    }

    const uniqueCategories = new Set();
    prompts.forEach(row => {
        const cat = row[3]; // La categoria è nella colonna 4 (indice 3)
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

    UI_ELEMENTS.categoryFilter.addEventListener("change", handleFilterAndSearch);
    UI_ELEMENTS.searchInput.addEventListener("input", handleFilterAndSearch);

    renderCards(prompts); // Renderizza le card iniziali
}

// Inizializza l'applicazione quando il DOM è completamente caricato
document.addEventListener('DOMContentLoaded', init);