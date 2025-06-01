// js/ui.js

import { UI_ELEMENTS, AI_OPTIONS } from './constants.js';
import { callGeminiAPI } from './api.js';

// 1. STATO UI CENTRALIZZATO E INTERNO A UI.JS
const appUIState = {
    isLoadingInitialPrompts: false, // Per lo spinner generale all'avvio (caricamento prompt)
    isGeneratingAIResponse: false, // Per lo spinner di generazione risposta AI (specifico della card)
    customModal: {
        isVisible: false,
        title: '',
        content: ''
    },
    aiSelectionModal: {
        isVisible: false
    },
    currentGeneratedPrompt: "", // Il prompt generato dall'utente
    currentAIResponse: "",      // La risposta ottenuta da Gemini
    globalErrorMessage: ""      // Per errori critici non gestiti da modali specifiche
};

// 2. Funzione per aggiornare lo stato e innescare il rendering
function setUIState(newState) {
    Object.assign(appUIState, newState);
    renderUIBasedOnState();
}

// 3. Funzione centrale per il rendering dell'UI in base allo stato
function renderUIBasedOnState() {
    // Gestione Spinner Iniziale (all'avvio dell'app per caricare i prompt)
    if (UI_ELEMENTS.loadingSpinner) {
        if (appUIState.isLoadingInitialPrompts) {
            UI_ELEMENTS.loadingSpinner.classList.remove("hidden");
            if (UI_ELEMENTS.promptContainer) {
                UI_ELEMENTS.promptContainer.innerHTML = '';
            }
        } else {
            UI_ELEMENTS.loadingSpinner.classList.add("hidden");
        }
    }

    // Gestione Custom Modal
    if (UI_ELEMENTS.customModalOverlay && UI_ELEMENTS.modalTitle && UI_ELEMENTS.modalContent) {
        if (appUIState.customModal.isVisible) {
            UI_ELEMENTS.modalTitle.textContent = appUIState.customModal.title;
            UI_ELEMENTS.modalContent.textContent = appUIState.customModal.content;
            UI_ELEMENTS.customModalOverlay.classList.add('show');
        } else {
            UI_ELEMENTS.customModalOverlay.classList.remove('show');
        }
    }

    // Gestione AI Selection Modal
    if (UI_ELEMENTS.aiSelectionModalOverlay && UI_ELEMENTS.aiSelectionDropdown) {
        if (appUIState.aiSelectionModal.isVisible) {
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
        } else {
            UI_ELEMENTS.aiSelectionModalOverlay.classList.remove('show');
        }
    }

    // Gestione del messaggio di errore globale
    if (UI_ELEMENTS.globalErrorMessage) {
        if (appUIState.globalErrorMessage) {
            UI_ELEMENTS.globalErrorMessage.textContent = appUIState.globalErrorMessage;
            UI_ELEMENTS.globalErrorMessage.style.display = 'block';
        } else {
            UI_ELEMENTS.globalErrorMessage.style.display = 'none';
            UI_ELEMENTS.globalErrorMessage.textContent = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (UI_ELEMENTS.customModalOverlay) {
        UI_ELEMENTS.customModalOverlay.addEventListener('click', (event) => {
            if (event.target === UI_ELEMENTS.customModalOverlay || event.target === UI_ELEMENTS.modalCloseButton) {
                hideCustomModal();
            }
        });
    }

    if (UI_ELEMENTS.aiSelectionModalOverlay) {
        UI_ELEMENTS.aiSelectionModalOverlay.addEventListener('click', (event) => {
            if (event.target === UI_ELEMENTS.aiSelectionModalOverlay || event.target === UI_ELEMENTS.aiSelectionCloseButton) {
                hideAISelectionModal();
            }
        });
    }

    if (UI_ELEMENTS.aiSelectionConfirmButton) {
        UI_ELEMENTS.aiSelectionConfirmButton.addEventListener('click', confirmAISelection);
    }
    renderUIBasedOnState();
});

export function showCustomModal(title, content) {
    setUIState({
        customModal: {
            isVisible: true,
            title: title,
            content: content
        }
    });
}

export function hideCustomModal() {
    setUIState({
        customModal: {
            isVisible: false,
            title: '',
            content: ''
        }
    });
}

export function showAISelectionModal() {
    setUIState({
        aiSelectionModal: {
            isVisible: true
        }
    });
}

export function hideAISelectionModal() {
    setUIState({
        aiSelectionModal: {
            isVisible: false
        }
    });
}

export function confirmAISelection() {
    const selectedAIUrl = UI_ELEMENTS.aiSelectionDropdown.value;

    if (!appUIState.currentGeneratedPrompt && !appUIState.currentAIResponse) {
        hideAISelectionModal();
        showCustomModal("Azione non valida", "Genera un prompt o una risposta AI per continuare.");
        return;
    }

    let contentToPrepopulate = "";
    if (appUIState.currentGeneratedPrompt) {
        contentToPrepopulate += appUIState.currentGeneratedPrompt;
    }
    if (appUIState.currentAIResponse) {
        if (contentToPrepopulate) {
            contentToPrepopulate += "\n\n";
        }
        contentToPrepopulate += appUIState.currentAIResponse;
    }

    const newWindow = window.open(selectedAIUrl, '_blank');
    if (newWindow) {
        newWindow.focus();
        setTimeout(() => {
            copyTextToClipboard(contentToPrepopulate);
            hideAISelectionModal();
            showCustomModal("Copia & Vai", "Il contenuto è stato coperto negli appunti. Ora puoi incollarlo nella nuova scheda AI.");
        }, 500);
    } else {
        hideAISelectionModal();
        showCustomModal("Errore", "Impossibile aprire una nuova scheda. Assicurati di non avere un blocco popup attivo.");
    }
}

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

    if (promptTemplate.includes("[ESPERIENZA]")) {
        const esperienzaLabelContainer = document.createElement("div");
        esperienzaLabelContainer.className = "label-with-help";

        const esperienzaLabel = document.createElement("label");
        esperienzaLabel.textContent = "Ambito specifico di competenza ed esperienza:";

        const esperienzaHelpIcon = document.createElement("span");
        esperienzaHelpIcon.className = "help-icon";
        esperienzaHelpIcon.textContent = "?";

        const esperienzaTooltip = document.createElement("span");
        esperienzaTooltip.className = "tooltip";
        esperienzaTooltip.textContent = "Fornisce al modello linguistico il contesto appropriato e specifico per restituire una risposta coerente. Questo aiuta l'IA a usare la terminologia e lo stile appropriati.";

        esperienzaHelpIcon.appendChild(esperienzaTooltip);

        esperienzaLabelContainer.appendChild(esperienzaLabel);
        esperienzaLabelContainer.appendChild(esperienzaHelpIcon);

        esperienzaInput = document.createElement("input");
        esperienzaInput.placeholder = "es. tennis, rock & roll, mercati finanziari, parlamento, diritto penale,...";
        esperienzaInput.id = `esperienza-${index}`;

        cardContent.appendChild(esperienzaLabelContainer);
        cardContent.appendChild(esperienzaInput);
    }

    if (promptTemplate.includes("[GENERE]")) {
        const genereLabelContainer = document.createElement("div");
        genereLabelContainer.className = "label-with-help";

        const genereLabel = document.createElement("label");
        genereLabel.textContent = "Contesto generale per il compito richiesto:";

        const genereHelpIcon = document.createElement("span");
        genereHelpIcon.className = "help-icon";
        genereHelpIcon.textContent = "?";

        const genereTooltip = document.createElement("span");
        genereTooltip.className = "tooltip";
        genereTooltip.textContent = "Definisce al modello linguistico i confini entro cui spaziare per restituire una risposta appropriata orientando l'IA sul contesto generale del compito da svolgere.";

        genereHelpIcon.appendChild(genereTooltip);

        genereLabelContainer.appendChild(genereLabel);
        genereLabelContainer.appendChild(genereHelpIcon);

        genereInput = document.createElement("input");
        genereInput.placeholder = "es. sport, cultura, cronaca, economia, musica, politica,…";
        genereInput.id = `genere-${index}`;

        cardContent.appendChild(genereLabelContainer);
        cardContent.appendChild(genereInput);
    }

    if (promptTemplate.includes("[TESTATA]")) {
        const testataLabelContainer = document.createElement("div");
        testataLabelContainer.className = "label-with-help";

        const testataLabel = document.createElement("label");
        testataLabel.textContent = "Nome della testata o dell’operatore di comunicazione:";

        const testataHelpIcon = document.createElement("span");
        testataHelpIcon.className = "help-icon";
        testataHelpIcon.textContent = "?";

        const testataTooltip = document.createElement("span");
        testataTooltip.className = "tooltip";
        testataTooltip.textContent = "Specifica il nome del tuo giornale, blog, agenzia di stampa o ufficio comunicazione. L'IA cercherà di replicare lo stile e il tono tipici dell'organizzazione.";

        testataHelpIcon.appendChild(testataTooltip);

        testataLabelContainer.appendChild(testataLabel);
        testataLabelContainer.appendChild(testataHelpIcon);

        testataInput = document.createElement("input");
        testataInput.placeholder = "es. Il Sole 24 Ore, calciomercato.com, uffici stampa, agenzie di comunicazione,...";
        testataInput.id = `testata-${index}`;

        cardContent.appendChild(testataLabelContainer);
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
        charactersInput.placeholder = "es. 2400";
        charactersInput.id = `characters-${index}`;
        cardContent.appendChild(charactersLabel);
        cardContent.appendChild(charactersInput);
    }

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

export function renderCards(prompts, filterCategoria = "", searchTerm = "") { // RIMOSSO: titleFilterValue
    if (UI_ELEMENTS.promptContainer) {
        UI_ELEMENTS.promptContainer.innerHTML = "";
    }

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
        // RIMOSSO: matchesTitle
        return matchesCategory && matchesSearch;
    });

    if (filteredPrompts.length === 0) {
        if (UI_ELEMENTS.promptContainer) {
            UI_ELEMENTS.promptContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; margin-top: 3rem;">Nessun prompt trovato con i criteri di ricerca selezionati.</p>';
        }
    } else {
        filteredPrompts.forEach((row, i) => {
            const [titolo, descrizione, promptTemplate, categoria, labelTesto, placeholderText, labelLang, labelCharacters] = row;

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
                    if (template.includes("[CHARACTERS]")) {
                        finalPrompt = finalPrompt.replace(/\[CHARACTERS\]/g, inputs.characters || "");
                    }

                    setUIState({ currentGeneratedPrompt: finalPrompt, currentAIResponse: "" });
                    outputElement.innerHTML = marked.parse(finalPrompt);
                    outputElement.style.color = '#444';
                },
                onCopyPrompt: () => {
                    const textToCopy = appUIState.currentGeneratedPrompt;
                    if (!textToCopy) {
                        showCustomModal("Azione non valida", "Genera prima il prompt da copiare.");
                        return;
                    }
                    copyTextToClipboard(textToCopy);
                    showCustomModal("Copia Effettuata", "Il prompt è stato copiato negli appunti.");
                },
                onGenerateAIResponse: async (outputElement, loadingIndicatorElement) => {
                    if (!appUIState.currentGeneratedPrompt || appUIState.currentGeneratedPrompt.includes("[") || appUIState.currentGeneratedPrompt.includes("]")) {
                        showCustomModal("Azione non valida", "Per favor, genera prima un prompt personalizzato e assicurati che non contenga campi non completati.");
                        return;
                    }
                    loadingIndicatorElement.style.display = 'flex';
                    outputElement.innerHTML = "Generazione della risposta AI in corso...";
                    outputElement.style.color = '#888';

                    try {
                        const aiResponse = await callGeminiAPI(appUIState.currentGeneratedPrompt);
                        if (aiResponse) {
                            setUIState({ currentAIResponse: aiResponse });
                            outputElement.innerHTML = marked.parse(aiResponse);
                            outputElement.style.color = '#222';
                        } else {
                            outputElement.innerHTML = "Nessuna risposta valida dall'AI.";
                            outputElement.style.color = '#cc0000';
                            setUIState({ currentAIResponse: "" });
                        }
                    } catch (error) {
                        console.error("Errore durante la generazione della risposta AI:", error);
                        outputElement.innerHTML = `Errore AI: ${error.message}. Riprova.`;
                        outputElement.style.color = '#cc0000';
                        setUIState({ currentAIResponse: "" });
                    } finally {
                        loadingIndicatorElement.style.display = 'none';
                    }
                },
                onCopyAIResponse: () => {
                    const textToCopy = appUIState.currentAIResponse;
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
                    setUIState({ currentGeneratedPrompt: "", currentAIResponse: "" });
                    showCustomModal("Output Reset", "Il campo di output è stato pulito. Puoi generare un nuovo prompt.");
                }
            });
            if (UI_ELEMENTS.promptContainer) {
                UI_ELEMENTS.promptContainer.appendChild(card);
            }
        });
    }
}

export function populateCategoryFilter(categories) {
    if (UI_ELEMENTS.categoryFilter) {
        UI_ELEMENTS.categoryFilter.innerHTML = '<option value="">Tutte le categorie</option>';
        Array.from(categories).sort().forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            UI_ELEMENTS.categoryFilter.appendChild(option);
        });
    }
}

// RIMOSSO: populateTitleFilter

export function showLoadingSpinner() {
    setUIState({ isLoadingInitialPrompts: true, globalErrorMessage: "" });
}

export function hideLoadingSpinner() {
    setUIState({ isLoadingInitialPrompts: false });
}

export function showGlobalErrorMessage(message) {
    setUIState({ globalErrorMessage: message });
}

function copyTextToClipboard(text) {
    const tempTextarea = document.createElement("textarea");
    tempTextarea.value = text;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextarea);
}