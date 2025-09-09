const endpoint = 'https://script.google.com/macros/s/AKfycbygbdcvkqKoVqubilnqdrj3T4aSLZZpdFvlInz1RKQQMAwRxW2l5ZpZ_qmWOKREJF2JPA/exec'; // Replace with your Google Apps Script URL

document.getElementById('theme-toggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
});

async function fetchData() {
    const response = await fetch(endpoint);
    const data = await response.json();
    return data;
}

fetchData().then(dictionaryData => {
    getRandomWord(dictionaryData);
    setupSearch(dictionaryData);
    setupShowAll(dictionaryData);
});

function getRandomWord(dictionaryData) {
    const randomIndex = Math.floor(Math.random() * dictionaryData.length);
    const randomWord = dictionaryData[randomIndex];
    document.getElementById('random-word-display').innerText = `${randomWord.Word}: ${randomWord.Meaning}`;
}

function setupSearch(dictionaryData) {
    document.getElementById('search-button').addEventListener('click', function() {
        const query = document.getElementById('search-input').value.toLowerCase();
        const result = dictionaryData.find(entry => entry.Word.toLowerCase() === query);
        const resultDisplay = document.getElementById('search-results');
        if (result) {
            resultDisplay.innerText = `${result.Word}: ${result.Meaning}`;
        } else {
            resultDisplay.innerText = 'No results found.';
        }
    });
}

function setupShowAll(dictionaryData) {
    document.getElementById('show-all-button').addEventListener('click', function() {
        const allWordsList = document.getElementById('all-words-list');
        allWordsList.style.display = allWordsList.style.display === 'none' ? 'block' : 'none';
        if (allWordsList.innerHTML === '') {
            dictionaryData.sort((a, b) => a.Word.localeCompare(b.Word));
            allWordsList.innerHTML = dictionaryData.map(entry => `<p>${entry.Word}: ${entry.Meaning}</p>`).join('');
        }
    });
}