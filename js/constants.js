// js/constants.js

export const SHEET_ID = "1uDoHvedmUcczP4rjI0GNZWOWstMPfhYuUahNPPbMoxg";
export const SHEET_RANGE = "Prompt Prestabiliti!A2:I";

export const NETLIFY_FUNCTION_URLS = {
    GET_SHEETS: "/.netlify/functions/get-my-sheets",
    CALL_GEMINI: "/.netlify/functions/call-gemini"
};

export const AI_OPTIONS = [
    { name: "Google Gemini", url: "https://gemini.google.com/" },
    { name: "ChatGPT", url: "https://chatgpt.com/" },
    { name: "Claude AI", url: "https://claude.ai/" },
    { name: "Microsoft Copilot", url: "https://copilot.microsoft.com/" },
    { name: "Perplexity AI", url: "https://www.perplexity.ai/" }
];

export const UI_ELEMENTS = {
    promptContainer: document.getElementById("prompt-container"),
    loadingSpinner: document.getElementById("loading-spinner"),
    categoryFilter: document.getElementById("category-filter"),
    searchInput: document.getElementById("search-input"),
    customModalOverlay: document.getElementById("custom-modal-overlay"),
    modalTitle: document.getElementById("modal-title"),
    modalContent: document.getElementById("modal-content"),
    aiSelectionModalOverlay: document.getElementById("ai-selection-modal-overlay"),
    aiSelectionDropdown: document.getElementById("ai-selection-dropdown"),
    // RIMOSSO: titleFilter
    globalErrorMessage: document.getElementById('global-error-message'),
    modalCloseButton: document.getElementById('modal-close-button'),
    aiSelectionCloseButton: document.getElementById('ai-selection-close-button'),
    aiSelectionConfirmButton: document.getElementById('ai-selection-confirm-button'),
};