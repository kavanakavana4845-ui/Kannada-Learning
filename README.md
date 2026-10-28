# KannadaMitra — Kannada for Real Life

A beginner-friendly Kannada phrase guide built with React, Vite, JavaScript, CSS, and Lucide React. It runs entirely in your browser; it does not need a backend, account, or API key.

## Run locally

1. Install [Node.js](https://nodejs.org/) (npm is included).
2. Open a terminal in this project folder.
3. Install dependencies:

   ```sh
   npm install
   ```

4. Start the development server:

   ```sh
   npm run dev
   ```

5. Open the local URL printed in the terminal (usually http://localhost:5173/).

## Production build

Run `npm run build`. Vite writes the production-ready site to `dist/`. To preview that build locally, run `npm run preview`.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys the site whenever code is pushed to `main`. GitHub Pages is configured to publish the workflow output. The project base path is configured for `https://kavanakavana4845-ui.github.io/Kannada-Learning/`.

## Features

- Five everyday categories with 12 phrases each.
- Search in English, Kannada, pronunciation, context, and keywords.
- Phrase cards with clipboard copy and browser Kannada speech when a Kannada voice is installed.
- A built-in eSpeak NG Kannada voice fallback for devices without a Kannada speech voice. The fallback fetches its speech data from jsDelivr the first time it is used.
- Six prepared everyday conversations.
- Responsive layout for desktop and mobile screens.
- Phrase data is separate from the interface in `src/data/phrases.js`.

## Content review

Kannada phrases and conversation examples are learning drafts and have not been reviewed by a native speaker. Please ask a fluent Kannada speaker to check spelling, natural usage, and pronunciation before relying on them in important situations. The built-in eSpeak NG voice is synthetic and may sound robotic; the first use needs an internet connection to fetch its Kannada speech data.

## Speech engine license

The built-in eSpeak NG engine is GPL-3.0-or-later. Spellophone's maintainers state that apps bundling this engine should be released under GPL-3.0-or-later with source available. Review the included package license before distributing the app.

## Feature checklist

- [ ] Open each category and confirm its phrases appear.
- [ ] Search with an English word, a pronunciation, and Kannada text.
- [ ] Search for a term with no match and clear the search.
- [ ] Copy a phrase and check that it appears on the clipboard.
- [ ] Try audio with a Kannada voice installed and on a device without one.
- [ ] Open each conversation and review the speaker labels and translations.
- [ ] Check the layout at desktop and mobile widths.
- [ ] Run `npm run build` before sharing the production site.
