# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, single-page dictionary of the Petrich (Bulgarian) dialect. Plain HTML/CSS/JavaScript: no build step, no package manager, no tests, no linter. All UI text is in Bulgarian (`<html lang="bg">`). Keep new user-facing text in Bulgarian too.

The repo root is the site root: `index.html`, `style.css`, `script.js`, `logo.png`, `favicon.png`. The remote is `github.com/badjorov/Petrich-Bulgarian-Dictionary`, and the site is served as a static site (GitHub Pages). Pushing to `main` publishes the live site.

## Running locally

Open `index.html` through a local HTTP server so `fetch()` works. Opening it as a `file://` page will not work.

```
python -m http.server 8000
# then open http://localhost:8000
```

## Architecture

There is no backend. Google services provide the data and the input:

- **Data source: a published Google Sheet.** `GOOGLE_SHEET_TSV_URL` at the top of `script.js` points to a sheet published to the web as TSV. On page load, `fetchData()` downloads it once and parses it into the in-memory `dictionaryData` array. It then sorts the array with `localeCompare(..., 'bg')`. Search, the random "word of the day" and the "all words" list all read from that array. To add or edit words, change the Sheet, not the code.
- **Sheet column order is a contract.** The parser maps columns by position: 0 `word`, 1 `meaning`, 2 `explanation`, 3 `example`, 4 `pronunciation`. Row 1 is treated as a header and skipped. Rows without a `word` or `meaning` are dropped. If the sheet's columns change, `fetchData()` must change with them.
- **Leave the "Разяснения" column empty.** This is column 2, `explanation`. When drafting or adding dictionary entries, fill every other column but always leave this one blank. The owner writes the explanations personally.
- **TSV parsing is naive.** It splits on `\n` and `\t` and strips surrounding quotes. A line break or tab inside a cell will break that row.
- **Suggestions: a Google Form.** `GOOGLE_FORM_URL` opens in a new tab from the "suggest a word" dialog. Submissions are reviewed by hand and are not written to the dictionary automatically.
- **Rendering.** `createResultHTML()` builds the markup for one entry, and `displayResults()` is used for both search results and the full list. Both insert sheet values into `innerHTML` without escaping, so the sheet content is trusted as HTML.
- **Dialogs** are native `<dialog>` elements (`showModal()` / `close()`, and a click on the backdrop closes them).
- **Theme.** Colors are CSS custom properties on `:root`. `body.dark-mode` overrides them. `script.js` toggles that class and saves the choice in `localStorage` under the key `theme`.

## Gotchas

- GitHub Pages file names are case-sensitive. Past commits renamed `Logo.png` → `logo.png`, `Favicon.png` → `favicon.png` and `styles.css` → `style.css`. Asset references in `index.html` must match the exact file names.
- `script.js` looks up DOM elements by ID at the top of the file. If you rename or remove an ID in `index.html`, update `script.js` too.
