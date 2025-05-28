// js/ui.js

import { UI_ELEMENTS, GLOBAL_STATE, AI_OPTIONS } from './constants.js';
import { callGeminiAPI } from './api.js';

// Funzioni per il modale di conferma copia
export function showCustomModal(title, content) {
    UI_ELEMENTS.modalTitle.textContent = title;
    UI_ELEMENTS.modalContent.textContent = content;
    UI_ELEMENTS.customModalOverlay.classList.add('show');
}

export function hideCustomModal() {
    UI_ELEMENTS.customModalOverlay.classList.remove('show');
}

// Funzioni per il nuovo modale di selezione AI
export function showAISelectionModal() {
    // Popola il dropdown con le opzioni AI (se non già fatto)
    if (UI_ELEMENTS.aiSelectionDropdown.options.length === 0 || UI_ELEMENTS.aiSelectionDropdown.options.length !== AI_OPTIONS.length) {
        UI_ELEMENTS.aiSelectionDropdown.innerHTML = '';
        AI_OPTIONS.forEach(ai => {
            const option = document.createElement("option");
            option.value = ai.url;
            option.textContent = ai.name;
            UI_ELEMENTS.aiSelectionDropdown.appendChild(option);
        });
    }
    UI_ELEMENTS.aiSelectionModalOverlay.classList.add('show');
}

export function hideAISelectionModal() {
    UI_ELEMENTS.aiSelectionModalOverlay.classList.remove('show');
}

export function confirmAISelection() {
    const selectedAIUrl = UI_ELEMENTS.aiSelectionDropdown.value;

    if (!GLOBAL_STATE.currentGeneratedPrompt && !GLOBAL_STATE.currentAIResponse) {
        hideAISelectionModal();
        showCustomModal("Azione non valida", "Genera un prompt o una risposta AI per continuare.");
        return;
    }

 let contentToPrepopulate = "";
    if (GLOBAL_STATE.currentGeneratedPrompt) {
        // Rimuovi "Prompt:\n```\n" e "\n```\n\n"
        contentToPrepopulate += GLOBAL_STATE.currentGeneratedPrompt;
    }
    if (GLOBAL_STATE.currentAIResponse) {
        if (contentToPrepopulate) { // Aggiungi una nuova riga solo se c'è già del contenuto
            contentToPrepopulate += "\n\n";
        }
        // Rimuovi "Risposta AI:\n```\n" e "\n```\n\n"
        contentToPrepopulate += GLOBAL_STATE.currentAIResponse;
    }
    
    const newWindow = window.open(selectedAIUrl, '_blank');
    if (newWindow) {
        newWindow.focus();
        setTimeout(() => {
            const tempTextarea = document.createElement("textarea");
            tempTextarea.value = contentToPrepopulate;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand("copy");
            document.body.removeChild(tempTextarea);
            hideAISelectionModal();
            showCustomModal("Copia & Vai", "Il contenuto è stato coperto negli appunti. Ora puoi incollarlo nella nuova scheda AI.");
        }, 500);
    } else {
        hideAISelectionModal();
        showCustomModal("Errore", "Impossibile aprire una nuova scheda. Assicurati di non avere un blocco popup attivo.");
    }
}

// MODIFICATO: rimosso 'richiedeNotaAllegato' dai parametri
export function createCard(titolo, descrizione, promptTemplate, categoria, labelTesto, placeholderText, labelLang, labelCharacters, index, callbacks) {
    const card = document.createElement("div");
    card.className = "prompt-card";
    card.dataset.categoria = categoria?.toLowerCase() || "";

    const cardHeader = document.createElement("div");
    cardHeader.className = "card-header";
    cardHeader.setAttribute("role", "button");
    cardHeader.setAttribute("aria-expanded", "false");
    cardHeader.setAttribute("tabindex", "0");

    const headerTitle = document.createElement("h3");
    headerTitle.textContent = titolo;

    const icon = document.createElement("span");
    icon.className = "icon";
    icon.innerHTML = "&#9660;";

    cardHeader.appendChild(headerTitle);
    cardHeader.appendChild(icon);

    const cardContent = document.createElement("div");
    cardContent.className = "card-content";
    cardContent.setAttribute("aria-hidden", "true");

    const descElement = document.createElement("p");
    descElement.textContent = descrizione;

    let esperienzaInput;
    let genereInput;
    let testataInput;
    let areaTextInput;
    let langSelect;
    let charactersInput;
    // MODIFICATO: rimosso 'dettagliInput' perché non più utilizzato
    // let dettagliInput;

    if (promptTemplate.includes("[ESPERIENZA]")) {
        const esperienzaLabel = document.createElement("label");
        esperienzaLabel.textContent = "Tema o campo di esperienza principale:";
        esperienzaInput = document.createElement("input");
        esperienzaInput.placeholder = "es. economia, esteri, politica...";
        esperienzaInput.id = `esperienza-${index}`;
        cardContent.appendChild(esperienzaLabel);
        cardContent.appendChild(esperienzaInput);
    }

    if (promptTemplate.includes("[GENERE]")) {
        const genereLabel = document.createElement("label");
        genereLabel.textContent = "Genere di giornalismo:";
        genereInput = document.createElement("input");
        genereInput.placeholder = "es. cronaca, cultura, sport...";
        genereInput.id = `genere-${index}`;
        cardContent.appendChild(genereLabel);
        cardContent.appendChild(genereInput);
    }

    if (promptTemplate.includes("[TESTATA]")) {
        const testataLabel = document.createElement("label");
        testataLabel.textContent = "Nome della testata:";
        testataInput = document.createElement("input");
        testataInput.placeholder = "es. Il Sole 24 Ore, La Repubblica...";
        testataInput.id = `testata-${index}`;
        cardContent.appendChild(testataLabel);
        cardContent.appendChild(testataInput);
    }

    if (promptTemplate.includes("[AREA_TEXT]")) {
        const testoLabel = document.createElement("label");
        areaTextInput = document.createElement("textarea");
        areaTextInput.rows = 4;
        areaTextInput.id = `area-text-${index}`;
        testoLabel.textContent = typeof labelTesto === 'string' && labelTesto.trim() !== '' ? labelTesto : "Incolla qui il testo da elaborare:";
        areaTextInput.placeholder = typeof placeholderText === 'string' && placeholderText.trim() !== '' ? placeholderText : "Incolla qui il testo...";
        cardContent.appendChild(testoLabel);
        cardContent.appendChild(areaTextInput);
    }

    if (promptTemplate.includes("[LANG]")) {
        const langLabel = document.createElement("label");
        langLabel.textContent = typeof labelLang === 'string' && labelLang.trim() !== '' ? labelLang : "Lingua di destinazione:";
        langSelect = document.createElement("select");
        langSelect.id = `lang-${index}`;

        const lingue = [
            "Italiano", "Inglese USA", "Inglese UK", "Afrikaans", "Arabo", "Bengali", "Cinese",
            "Danese", "Ebraico", "Finlandese", "Francese", "Giapponese", "Hindi", "Indonesiano",
            "Olandese", "Persiano", "Polacco", "Portoghese", "Russo", "Spagnolo", "Svedese",
            "Thai", "Turco", "Vietnamita"
        ];
        const sortedOtherLanguages = lingue.filter(lang => !["Italiano", "Inglese USA", "Inglese UK"].includes(lang)).sort();
        const orderedLanguages = ["Italiano", "Inglese USA", "Inglese UK", ...sortedOtherLanguages];

        orderedLanguages.forEach(lingua => {
            const option = document.createElement("option");
            option.value = lingua;
            option.textContent = lingua;
            langSelect.appendChild(option);
        });
        cardContent.appendChild(langLabel);
        cardContent.appendChild(langSelect);
    }

    if (promptTemplate.includes("[CHARACTERS]")) {
        const charactersLabel = document.createElement("label");
        charactersLabel.textContent = typeof labelCharacters === 'string' && labelCharacters.trim() !== '' ? labelCharacters : "Numero di battute desiderate:";
        charactersInput = document.createElement("input");
        charactersInput.type = "number";
        charactersInput.placeholder = "es. 500";
        charactersInput.id = `characters-${index}`;
        cardContent.appendChild(charactersLabel);
        cardContent.appendChild(charactersInput);
    }

    // MODIFICATO: Rimosso il blocco per [DETTAGLI]
    /*
    if (promptTemplate.includes("[DETTAGLI]")) {
        const dettagliLabel = document.createElement("label");
        dettagliLabel.textContent = "Altri dettagli (se presenti nel prompt originale):";
        dettagliInput = document.createElement("input");
        dettagliInput.placeholder = "aggiungere qui personalizzazioni per lo specifico caso/documento";
        dettagliInput.id = `dettagli-${index}`;
        cardContent.appendChild(dettagliLabel);
        cardContent.appendChild(dettagliInput);
    }
    */

    // MODIFICATO: Rimosso il blocco per la nota generica
    /*
    if (promptTemplate.includes("[AREA_TEXT]") || promptTemplate.includes("[DETTAGLI]")) {
        const note = document.createElement("p");
        note.className = "note";
        note.textContent = "Ricorda: Per questo prompt, dovrai fornire il testo/file da elaborare alla tua IA di fiducia insieme al prompt generato.";
        cardContent.appendChild(note);
    }
    */

    const output = document.createElement("div");
    output.className = "prompt-output";
    output.innerHTML = "Il prompt personalizzato apparirà qui dopo la generazione.";

    const aiLoadingIndicator = document.createElement("div");
    aiLoadingIndicator.className = "ai-loading-indicator";
    aiLoadingIndicator.style.display = 'none';
    aiLoadingIndicator.innerHTML = '<div class="ai-spinner"></div><span>Generazione risposta AI...</span>';

    const buttonGroupRow1 = document.createElement("div");
    buttonGroupRow1.className = "button-group-row";
    const buttonGroupRow2 = document.createElement("div");
    buttonGroupRow2.className = "button-group-row";
    const buttonGroupRow3 = document.createElement("div");
    buttonGroupRow3.className = "button-group-row";
    const buttonGroupMain = document.createElement("div");
    buttonGroupMain.className = "button-group";

    const generatePromptButton = document.createElement("button");
    generatePromptButton.textContent = "Genera Prompt";
    generatePromptButton.className = "generate-prompt-button";
    generatePromptButton.onclick = () => {
        const inputs = {
            esperienza: esperienzaInput ? esperienzaInput.value : '',
            genere: genereInput ? genereInput.value : '',
            testata: testataInput ? testataInput.value : '',
            areaText: areaTextInput ? areaTextInput.value : '',
            lang: langSelect ? langSelect.value : '',
            // MODIFICATO: rimosso 'dettagli' dall'oggetto inputs
            // dettagli: dettagliInput ? dettagliInput.value : '',
            characters: charactersInput ? charactersInput.value : ''
        };
        callbacks.onGeneratePrompt(promptTemplate, inputs, output);
    };

    const copyPromptButton = document.createElement("button");
    copyPromptButton.textContent = "Copia Prompt";
    copyPromptButton.className = "copy-button";
    copyPromptButton.onclick = () => {
        callbacks.onCopyPrompt();
    };

    const generateAIResponseButton = document.createElement("button");
    generateAIResponseButton.textContent = "Genera Risposta AI";
    generateAIResponseButton.className = "ai-generate-button";
    generateAIResponseButton.onclick = () => {
        callbacks.onGenerateAIResponse(output, aiLoadingIndicator);
    };

    const copyAIResponseButton = document.createElement("button");
    copyAIResponseButton.textContent = "Copia Risposta AI";
    copyAIResponseButton.className = "copy-button";
    copyAIResponseButton.onclick = () => {
        callbacks.onCopyAIResponse();
    };

    const continueOnGeminiButton = document.createElement("button");
    continueOnGeminiButton.textContent = "Vai a AI esterna";
    continueOnGeminiButton.className = "continue-on-ai-button";
    continueOnGeminiButton.onclick = () => {
        callbacks.onContinueOnAI();
    };

    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Output";
    resetButton.className = "reset-button";
    resetButton.onclick = () => {
        callbacks.onResetOutput(output);
    };

    buttonGroupRow1.appendChild(generatePromptButton);
    buttonGroupRow1.appendChild(generateAIResponseButton);
    buttonGroupRow2.appendChild(copyPromptButton);
    buttonGroupRow2.appendChild(copyAIResponseButton);
    buttonGroupRow3.appendChild(continueOnGeminiButton);
    buttonGroupRow3.appendChild(resetButton);

    buttonGroupMain.appendChild(buttonGroupRow1);
    buttonGroupMain.appendChild(buttonGroupRow2);
    buttonGroupMain.appendChild(buttonGroupRow3);

    cardContent.appendChild(buttonGroupMain);
    cardContent.appendChild(aiLoadingIndicator);
    cardContent.appendChild(output);

    card.appendChild(cardHeader);
    card.appendChild(cardContent);

    cardHeader.onclick = () => toggleCardContent(cardHeader, cardContent);
    cardHeader.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleCardContent(cardHeader, cardContent);
        }
    };

    return card;
}

function toggleCardContent(cardHeader, cardContent) {
    const isOpen = cardContent.style.display === "block";
    if (isOpen) {
        cardContent.style.display = "none";
        cardHeader.classList.remove("open");
        cardContent.classList.remove("open");
        cardHeader.setAttribute("aria-expanded", "false");
        cardContent.setAttribute("aria-hidden", "true");
    } else {
        document.querySelectorAll('.card-content.open').forEach(openContent => {
            openContent.style.display = "none";
            openContent.classList.remove("open");
            openContent.previousElementSibling.classList.remove("open");
            openContent.previousElementSibling.setAttribute("aria-expanded", "false");
            openContent.setAttribute("aria-hidden", "true");
        });
        cardContent.style.display = "block";
        cardHeader.classList.add("open");
        cardContent.classList.add("open");
        cardHeader.setAttribute("aria-expanded", "true");
        cardContent.setAttribute("aria-hidden", "false");
    }
}

export function renderCards(prompts, filterCategoria = "", searchTerm = "") {
    UI_ELEMENTS.loadingSpinner.classList.add("hidden");
    UI_ELEMENTS.promptContainer.innerHTML = "";

    const filteredPrompts = prompts.filter((row) => {
        if (row.length < 6) {
            console.warn("Riga del foglio con meno di 6 colonne, saltata in fase di filtro:", row);
            return false;
        }
        const [titolo, descrizione, prompt, categoria] = row;
        const matchesCategory = !filterCategoria || (categoria && categoria.toLowerCase() === filterCategoria);
        const matchesSearch = !searchTerm ||
                                (titolo && titolo.toLowerCase().includes(searchTerm)) ||
                                (descrizione && descrizione.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    if (filteredPrompts.length === 0) {
        UI_ELEMENTS.promptContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; margin-top: 3rem;">Nessun prompt trovato con i criteri di ricerca selezionati.</p>';
    } else {
        filteredPrompts.forEach((row, i) => {
            // MODIFICATO: rimosso 'richiedeNotaAllegato' dalla destrutturazione della riga
            const [titolo, descrizione, promptTemplate, categoria, labelTesto, placeholderText, labelLang, labelCharacters] = row;

            // MODIFICATO: rimosso 'isNotaAllegatoRequired' dalla chiamata a createCard
            const card = createCard(titolo, descrizione, promptTemplate, categoria, labelTesto, placeholderText, labelLang, labelCharacters, i, {
                onGeneratePrompt: (template, inputs, outputElement) => {
                    let finalPrompt = template
                        .replace(/\[ESPERIENZA\]/g, inputs.esperienza || "[ESPERIENZA]")
                        .replace(/\[GENERE\]/g, inputs.genere || "[GENERE]")
                        .replace(/\[TESTATA\]/g, inputs.testata || "[TESTATA]");

                    if (template.includes("[AREA_TEXT]")) {
                        finalPrompt = finalPrompt.replace(/\[AREA_TEXT\]/g, inputs.areaText || "");
                    }
                    if (template.includes("[LANG]")) {
                        finalPrompt = finalPrompt.replace(/\[LANG\]/g, inputs.lang || "");
                    }
                    // MODIFICATO: rimosso la sostituzione per [DETTAGLI]
                    // if (template.includes("[DETTAGLI]")) {
                    //     finalPrompt = finalPrompt.replace(/\[DETTAGLI\]/g, inputs.dettagli || "");
                    // }
                    if (template.includes("[CHARACTERS]")) {
                        finalPrompt = finalPrompt.replace(/\[CHARACTERS\]/g, inputs.characters || "");
                    }

                    GLOBAL_STATE.currentGeneratedPrompt = finalPrompt;
                    outputElement.innerHTML = marked.parse(finalPrompt);
                    outputElement.style.color = '#444';
                    GLOBAL_STATE.currentAIResponse = "";
                },
                onCopyPrompt: () => {
                    const textToCopy = GLOBAL_STATE.currentGeneratedPrompt;
                    if (!textToCopy) {
                        showCustomModal("Azione non valida", "Genera prima il prompt da copiare.");
                        return;
                    }
                    copyTextToClipboard(textToCopy);
                    showCustomModal("Copia Effettuata", "Il prompt è stato copiato negli appunti.");
                },
                onGenerateAIResponse: async (outputElement, loadingIndicatorElement) => {
                    if (!GLOBAL_STATE.currentGeneratedPrompt || GLOBAL_STATE.currentGeneratedPrompt.includes("[") || GLOBAL_STATE.currentGeneratedPrompt.includes("]")) {
                        showCustomModal("Azione non valida", "Per favore, genera prima un prompt personalizzato e assicurati che non contenga campi non completati.");
                        return;
                    }
                    loadingIndicatorElement.style.display = 'flex';
                    outputElement.innerHTML = "Generazione della risposta AI in corso...";
                    outputElement.style.color = '#888';

                    try {
                        const aiResponse = await callGeminiAPI(GLOBAL_STATE.currentGeneratedPrompt);
                        if (aiResponse) {
                            GLOBAL_STATE.currentAIResponse = aiResponse;
                            outputElement.innerHTML = marked.parse(aiResponse);
                            outputElement.style.color = '#222';
                        } else {
                            outputElement.innerHTML = "Nessuna risposta valida dall'AI.";
                            outputElement.style.color = '#cc0000';
                            GLOBAL_STATE.currentAIResponse = "";
                        }
                    } catch (error) {
                        console.error("Errore durante la generazione della risposta AI:", error);
                        outputElement.innerHTML = `Errore AI: ${error.message}. Riprova.`;
                        outputElement.style.color = '#cc0000';
                        GLOBAL_STATE.currentAIResponse = "";
                    } finally {
                        loadingIndicatorElement.style.display = 'none';
                    }
                },
                onCopyAIResponse: () => {
                    const textToCopy = GLOBAL_STATE.currentAIResponse;
                    if (!textToCopy) {
                        showCustomModal("Azione non valida", "Genera prima una risposta AI da copiare.");
                        return;
                    }
                    copyTextToClipboard(textToCopy);
                    showCustomModal("Copia Effettuata", "La risposta AI è stata copiata negli appunti.");
                },
                onContinueOnAI: () => {
                    showAISelectionModal();
                },
                onResetOutput: (outputElement) => {
                    outputElement.innerHTML = "Il prompt personalizzato apparirà qui dopo la generazione.";
                    outputElement.style.color = '#444';
                    GLOBAL_STATE.currentGeneratedPrompt = "";
                    GLOBAL_STATE.currentAIResponse = "";
                    showCustomModal("Output Reset", "Il campo di output è stato pulito. Puoi generare un nuovo prompt.");
                }
            });
            UI_ELEMENTS.promptContainer.appendChild(card);
        });
    }
}

export function populateCategoryFilter(categories) {
    UI_ELEMENTS.categoryFilter.innerHTML = '<option value="">Tutte le categorie</option>';
    Array.from(categories).sort().forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        UI_ELEMENTS.categoryFilter.appendChild(option);
    });
}

export function showLoadingSpinner() {
    UI_ELEMENTS.loadingSpinner.classList.remove("hidden");
    UI_ELEMENTS.promptContainer.innerHTML = '';
}

export function hideLoadingSpinner() {
    UI_ELEMENTS.loadingSpinner.classList.add("hidden");
}

function copyTextToClipboard(text) {
    const tempTextarea = document.createElement("textarea");
    tempTextarea.value = text;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextarea);
}

window.ui = {
    showCustomModal,
    hideCustomModal,
    showAISelectionModal,
    hideAISelectionModal,
    confirmAISelection
};