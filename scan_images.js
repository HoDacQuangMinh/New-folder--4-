const fs = require('fs');
const path = require('path');

// Configuration
const IMAGES_DIR = path.join(__dirname, 'public', 'datasets', 'images');
const OUTPUT_FILE = path.join(__dirname, 'public', 'game_data.json');

// Defines the root folders to start scanning
const DATASETS = {
    words: 'gregg-preanniversary-words',
    phrases: 'gregg-preanniversary-phrases'
};

const gameData = {
    words: [],
    phrases: []
};

// --- RECURSIVE SCANNER FUNCTION ---
// This function looks inside a folder. If it finds a file, it adds it.
// If it finds another folder, it dives inside that too.
function getFilesRecursively(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat && stat.isDirectory()) {
            // Dive into subfolder
            results = results.concat(getFilesRecursively(fullPath));
        } else {
            // Check if it is a PNG
            if (file.toLowerCase().endsWith('.png')) {
                // Store just the filename (without extension) for the game logic
                // The game logic currently reconstructs paths, which might be tricky if files are deep.
                // STRATEGY CHANGE: Let's store the RELATIVE PATH from 'public' so the game doesn't have to guess.
                
                // Get path relative to 'public' folder
                // e.g., "datasets/images/gregg.../train/word.png"
                const relativePath = fullPath.split('public')[1].replace(/\\/g, '/'); // Normalize slashes
                
                // We store an object with both the cleaned word name and the full path
                // This guarantees the game can load it.
                const cleanName = file.replace('.png', '').replace(/_/g, ' ');
                
                results.push({
                    word: cleanName,
                    path: relativePath
                });
            }
        }
    });
    
    return results;
}

console.log("🔍 Scanning recursively for Shorthand Runes...");

// 1. Scan Words
const wordsPath = path.join(IMAGES_DIR, DATASETS.words);
const foundWords = getFilesRecursively(wordsPath);
// Map back to just names if you want simple list, OR keep objects.
// Let's modify the APP to handle objects so we never have path errors again.
gameData.words = foundWords; 
console.log(`✅ Found ${foundWords.length} Words in ${wordsPath}`);

// 2. Scan Phrases
const phrasesPath = path.join(IMAGES_DIR, DATASETS.phrases);
const foundPhrases = getFilesRecursively(phrasesPath);
gameData.phrases = foundPhrases;
console.log(`✅ Found ${foundPhrases.length} Phrases in ${phrasesPath}`);

// 3. Save
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(gameData, null, 2));
console.log(`📜 Grimoire updated! Index saved to: ${OUTPUT_FILE}`);