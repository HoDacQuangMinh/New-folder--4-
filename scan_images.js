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
function getFilesRecursively(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath));
        } else {
            if (file.toLowerCase().endsWith('.png')) {
                // FIXED LOGIC: Create a clean web-friendly path
                // 1. Get the path relative to the 'public' folder
                // This converts "C:\Users\...\public\datasets\..." into "datasets\..."
                let relativePath = path.relative(path.join(__dirname, 'public'), fullPath);
                
                // 2. Ensure we use forward slashes (/) for web URLs, even on Windows
                relativePath = '/' + relativePath.replace(/\\/g, '/');
                
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