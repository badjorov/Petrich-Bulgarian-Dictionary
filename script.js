// =================================================================
// == 1. CONFIGURATION: PASTE YOUR LINKS HERE ==
// =================================================================

// ⚠️ STEP 1: Paste your Google Sheet TSV URL here
// Get this from File > Share > Publish to web > TSV (Tab-separated values)
const GOOGLE_SHEET_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsFLbNVPuaOvdb69OefdWR14i3kMbqniE0_W77U5pouNDXn1zSsk9SCPwKgCziListB3omos2XE7gC/pub?gid=0&single=true&output=tsv';

// ⚠️ STEP 2: Paste your Google Form URL here
// Get this from the "Send" button in your Google Form
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSer9DgHq1_thbsC9UULPni8-8dYGeXua6qNQwrBbsug8C6rPw/viewform?usp=dialog';

// =================================================================
// == 2. GLOBAL VARIABLES & INITIALIZATION ==
// =================================================================

let dictionaryData = []; // This will hold all our {word, meaning, ...} objects

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const wordCount = document.getElementById('word-count');
const randomWordContent = document.getElementById('random-word-content');
const showAllBtn = document.getElementById('show-all-btn');
const suggestBtn = document.getElementById('suggest-btn');
const allWordsModal = document.getElementById('all-words-modal');
const suggestModal = document.getElementById('suggest-modal');
const closeAllWordsBtn = document.getElementById('close-all-words-btn');
const closeSuggestBtn = document.getElementById('close-suggest-btn');
const allWordsList = document.getElementById('all-words-list');
const letterIndex = document.getElementById('letter-index');
const openFormBtn = document.getElementById('open-form-btn');


// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load theme preference and apply
    applyThemePreference();

    // 2. Fetch dictionary data
    fetchData();

    // 3. Setup event listeners
    setupEventListeners();
});

// =================================================================
// == 3. DATA FETCHING & PARSING ==
// =================================================================

async function fetchData() {
    if (GOOGLE_SHEET_TSV_URL === 'YOUR_GOOGLE_SHEET_TSV_URL_HERE') {
        showError('Моля, добавете валиден Google Sheet TSV URL в script.js');
        return;
    }

    try {
        const response = await fetch(GOOGLE_SHEET_TSV_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const tsvText = await response.text();

        // Parse the TSV (Tab-Separated Values)
        // .slice(1) skips the header row
        dictionaryData = tsvText.trim().split('\n').slice(1).map(row => {
            // Split the row by the tab character '\t'
            const columns = row.split('\t');

            // Helper function to clean cell data
            const cleanCell = (cell) => cell ? cell.trim().replace(/^"|"$/g, '') : '';

            // Map columns to object properties
            const item = {
                word: cleanCell(columns[0]),
                meaning: cleanCell(columns[1]),
                explanation: cleanCell(columns[2]),
                example: cleanCell(columns[3]),
                pronunciation: cleanCell(columns[4])
            };

            // Pre-computed text used for searching (lower case, without stress marks)
            item.searchText = normalizeText([item.word, item.meaning, item.explanation, item.example, item.pronunciation].join('\n'));

            return item;
        }).filter(item => item && item.word && item.meaning); // Only keep rows with a word and meaning

        // Sort data alphabetically *once* after fetching
        dictionaryData.sort((a, b) => a.word.localeCompare(b.word, 'bg'));

        // Once data is loaded, populate the page
        wordCount.textContent = `${dictionaryData.length} ${dictionaryData.length === 1 ? 'дума' : 'думи'} в речника`;
        displayWordOfTheDay();
        populateAllWordsList();

        // Support shareable links like ?q=дума
        const initialQuery = new URLSearchParams(window.location.search).get('q');
        if (initialQuery) {
            searchInput.value = initialQuery;
            performSearch();
        }

    } catch (error) {
        console.error('Error fetching or parsing data:', error);
        showError('Възникна грешка при зареждане на речника.');
    }
}

// Lower-cases text and removes stress marks (e.g. "бабу́шка" -> "бабушка", "ѝ" -> "и"),
// so a search finds a word whether or not the stress is written.
// Only the grave and acute accents are removed, so "й" stays different from "и".
function normalizeText(text) {
    return (text || '').toLowerCase().normalize('NFD').replace(/[̀́]/g, '').normalize('NFC');
}

// =================================================================
// == 4. CORE FEATURES ==
// =================================================================

// Picks the same word for everybody during the whole day; it changes at midnight.
function displayWordOfTheDay() {
    if (dictionaryData.length === 0) {
        randomWordContent.innerHTML = '<p>Няма думи за показване.</p>';
        return;
    }

    const today = new Date();
    const dayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let hash = 0;
    for (const ch of dayKey) {
        hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    }
    const item = dictionaryData[hash % dictionaryData.length];

    randomWordContent.innerHTML = `<div class="result-item">${createResultHTML(item)}</div>`;
}

function performSearch() {
    const rawQuery = searchInput.value.trim();
    const query = normalizeText(rawQuery);
    updateUrlQuery(rawQuery);

    if (query.length === 0) {
        searchResults.innerHTML = ''; // Clear results if query is empty
        return;
    }

    if (dictionaryData.length === 0) {
        return; // Data not loaded yet; the search runs again once it is.
    }

    // Words whose headword matches come first, then matches in other fields.
    const wordMatches = [];
    const otherMatches = [];
    for (const item of dictionaryData) {
        if (normalizeText(item.word).includes(query)) {
            wordMatches.push(item);
        } else if (item.searchText.includes(query)) {
            otherMatches.push(item);
        }
    }
    const results = wordMatches.concat(otherMatches);

    displayResults(results, searchResults, false, rawQuery);
}

function updateUrlQuery(query) {
    const url = new URL(window.location.href);
    if (query) {
        url.searchParams.set('q', query);
    } else {
        url.searchParams.delete('q');
    }
    history.replaceState(null, '', url);
}

function populateAllWordsList() {
    // This function runs once after data is fetched
    if (dictionaryData.length === 0) {
        allWordsList.innerHTML = '<p>Няма думи за показване.</p>';
        return;
    }

    // Group the (already sorted) words by their first letter
    let html = '';
    const letters = [];
    let currentLetter = null;
    dictionaryData.forEach(item => {
        const letter = normalizeText(item.word).charAt(0).toUpperCase();
        if (letter !== currentLetter) {
            currentLetter = letter;
            letters.push(letter);
            html += `<h3 class="letter-heading" id="letter-${letters.length}">${letter}</h3>`;
        }
        html += `<div class="result-item">${createResultHTML(item)}</div>`;
    });

    allWordsList.innerHTML = html;
    letterIndex.innerHTML = letters
        .map((letter, i) => `<a href="#letter-${i + 1}" data-target="letter-${i + 1}">${letter}</a>`)
        .join('');
}

// =================================================================
// == 5. UI & EVENT HANDLERS ==
// =================================================================

function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);

    // Search on submit and while typing (with a short delay)
    let searchTimer;
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(searchTimer);
        performSearch();
    });
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(performSearch, 200);
    });

    // Modal Openers
    showAllBtn.addEventListener('click', () => allWordsModal.showModal());
    suggestBtn.addEventListener('click', () => suggestModal.showModal());

    // Modal Closers
    closeAllWordsBtn.addEventListener('click', () => allWordsModal.close());
    closeSuggestBtn.addEventListener('click', () => suggestModal.close());

    // Close modal by clicking the backdrop
    allWordsModal.addEventListener('click', (e) => {
        if (e.target === allWordsModal) allWordsModal.close();
    });
    suggestModal.addEventListener('click', (e) => {
        if (e.target === suggestModal) suggestModal.close();
    });

    // Letter index: scroll inside the list without changing the page URL
    letterIndex.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-target]');
        if (!link) return;
        e.preventDefault();
        const heading = document.getElementById(link.dataset.target);
        if (heading) allWordsList.scrollTo({ top: heading.offsetTop - allWordsList.offsetTop, behavior: 'smooth' });
    });

    // Suggestion form opener
    openFormBtn.addEventListener('click', () => {
        if (GOOGLE_FORM_URL === 'YOUR_GOOGLE_FORM_URL_HERE') {
            alert('Моля, добавете валиден Google Form URL в script.js');
        } else {
            window.open(GOOGLE_FORM_URL, '_blank', 'noopener');
            suggestModal.close();
        }
    });
}

// The theme class is already set by a small script at the top of <body>
// (saved choice, or the system setting if nothing was saved). Here we only sync the icon.
function applyThemePreference() {
    updateThemeIcon();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    try {
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    } catch (e) {
        // Storage can be blocked (e.g. private mode); the theme still changes for this visit.
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

// Wraps matches of the query in <mark>, skipping anything inside HTML tags.
function highlight(html, query) {
    if (!query) return html;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    return html.split(/(<[^>]*>)/).map(part => part.startsWith('<') ? part : part.replace(re, '<mark>$1</mark>')).join('');
}

// Reusable function to create the HTML for a dictionary item
function createResultHTML(item, query = '') {
    // Conditionally build the HTML parts
    const pronunciationHTML = item.pronunciation ? `<span class="pronunciation">[${item.pronunciation}]</span>` : '';
    const explanationHTML = item.explanation ? `<p class="explanation">${item.explanation}</p>` : '';
    const exampleHTML = item.example ? `<p class="example"><span class="example-label">Пример</span>„${highlight(item.example, query)}“</p>` : '';

    return `
        <div class="entry-head">
            <span class="headword">${highlight(item.word, query)}</span>
            ${pronunciationHTML}
        </div>
        <p class="meaning">${highlight(item.meaning, query)}</p>
        ${explanationHTML}
        ${exampleHTML}
    `;
}

function displayResults(results, container, skipNoResults = false, query = '') {
    if (results.length === 0 && !skipNoResults) {
        container.innerHTML = '<p class="no-results">Няма намерени резултати.</p>';
        return;
    }

    const summary = query
        ? `<p class="results-summary">${results.length === 1 ? 'Намерен е 1 резултат' : `Намерени са ${results.length} резултата`}</p>`
        : '';

    // Create one big HTML string for better performance
    container.innerHTML = summary + results.map(item => `
        <div class="result-item">
            ${createResultHTML(item, query)}
        </div>
    `).join('');
}

function showError(message) {
    // Show error in both random word and search results
    randomWordContent.innerHTML = `<p class="no-results">${message}</p>`;
    searchResults.innerHTML = `<p class="no-results">${message}</p>`;
    wordCount.textContent = '';
}
