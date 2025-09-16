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
const randomWordContent = document.getElementById('random-word-content');
const showAllBtn = document.getElementById('show-all-btn');
const suggestBtn = document.getElementById('suggest-btn');
const allWordsModal = document.getElementById('all-words-modal');
const suggestModal = document.getElementById('suggest-modal');
const closeAllWordsBtn = document.getElementById('close-all-words-btn');
const closeSuggestBtn = document.getElementById('close-suggest-btn');
const allWordsList = document.getElementById('all-words-list');
const openFormBtn = document.getElementById('open-form-btn');


// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    
    // 2. Fetch dictionary data
    fetchData();
    
    // 3. Setup event listeners
    setupEventListeners();
});

// =================================================================
// == 3. DATA FETCHING & PARSING (UPDATED) ==
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
            
            return item;
        }).filter(item => item && item.word && item.meaning); // Only keep rows with a word and meaning

        // Sort data alphabetically *once* after fetching
        dictionaryData.sort((a, b) => a.word.localeCompare(b.word, 'bg'));

        // Once data is loaded, populate the page
        displayRandomWord();
        populateAllWordsList();

    } catch (error) {
        console.error('Error fetching or parsing data:', error);
        showError('Възникна грешка при зареждане на речника.');
    }
}

// =================================================================
// == 4. CORE FEATURES (UPDATED) ==
// =================================================================

function displayRandomWord() {
    if (dictionaryData.length === 0) {
        randomWordContent.innerHTML = '<p>Няма думи за показване.</p>';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * dictionaryData.length);
    const item = dictionaryData[randomIndex];
    
    // Use the same helper function as displayResults
    randomWordContent.innerHTML = createResultHTML(item);
}

function performSearch(event) {
    event.preventDefault(); // Stop form from submitting
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
        searchResults.innerHTML = ''; // Clear results if query is empty
        return;
    }

    // Updated search to include all fields
    const results = dictionaryData.filter(item => 
        item.word.toLowerCase().includes(query) || 
        item.meaning.toLowerCase().includes(query) ||
        (item.explanation && item.explanation.toLowerCase().includes(query)) ||
        (item.example && item.example.toLowerCase().includes(query)) ||
        (item.pronunciation && item.pronunciation.toLowerCase().includes(query))
    );
    
    displayResults(results, searchResults);
}

function populateAllWordsList() {
    // This function runs once after data is fetched
    if (dictionaryData.length === 0) {
        allWordsList.innerHTML = '<p>Няма думи за показване.</p>';
        return;
    }
    displayResults(dictionaryData, allWordsList, true); // Pass 'true' to skip "no results"
}

// =================================================================
// == 5. UI & EVENT HANDLERS (UPDATED) ==
// =================================================================

function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    searchForm.addEventListener('submit', performSearch);
    
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

    // Suggestion form opener
    openFormBtn.addEventListener('click', () => {
        if (GOOGLE_FORM_URL === 'YOUR_GOOGLE_FORM_URL_HERE') {
            alert('Моля, добавете валиден Google Form URL в script.js');
        } else {
            window.open(GOOGLE_FORM_URL, '_blank');
            suggestModal.close();
        }
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = '☀️'; // Set icon to sun
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.textContent = '🌙'; // Set icon to moon
    }
}

// Reusable function to create the HTML for a dictionary item
function createResultHTML(item) {
    // Conditionally build the HTML parts
    const pronunciationHTML = item.pronunciation ? `<p class="pronunciation">[${item.pronunciation}]</p>` : '';
    const explanationHTML = item.explanation ? `<p class="explanation"><em>${item.explanation}</em></p>` : '';
    const exampleHTML = item.example ? `<p class="example"><strong>Пример:</strong> "${item.example}"</p>` : '';
    
    return `
        <strong>${item.word}</strong>
        ${pronunciationHTML}
        <p class="meaning">${item.meaning}</p>
        ${explanationHTML}
        ${exampleHTML}
    `;
}

function displayResults(results, container, skipNoResults = false) {
    if (results.length === 0 && !skipNoResults) {
        container.innerHTML = '<p class="no-results">Няма намерени резултати.</p>';
        return;
    }
    
    // Create one big HTML string for better performance
    container.innerHTML = results.map(item => `
        <div class="result-item">
            ${createResultHTML(item)}
        </div>
    `).join('');
}

function showError(message) {
    // Show error in both random word and search results
    randomWordContent.innerHTML = `<p class="no-results">${message}</p>`;
    searchResults.innerHTML = `<p class="no-results">${message}</p>`;
}
