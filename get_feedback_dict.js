import fs from 'fs';         // Node’s file‐system module
import path from 'path';     // For building file paths
/**
 * For each guess in `guesses`, maps each feedback pattern
 * (as returned by getPattern) to the list of answers that would
 * produce that pattern.
 *
 * @param {string[]} guesses – array of possible guesses/answers
 * @returns {Object.<string, Object.<string, string[]>>}
 *   An object whose keys are guesses, and whose values are
 *   objects mapping pattern strings to arrays of answers.
 */
function generateFeedbackDict(guesses) {
    const feedbackDict = {};

    for (const guess of guesses) {
        feedbackDict[guess] = {};

        for (const answer of guesses) {
            const pattern = getPattern(guess, answer);  // e.g. "01220"

            // initialize array for this pattern if needed
            if (!feedbackDict[guess][pattern]) {
                feedbackDict[guess][pattern] = [];
            }

            // only add answer once
            if (!feedbackDict[guess][pattern].includes(answer)) {
                feedbackDict[guess][pattern].push(answer);
            }
        }
    }

    return feedbackDict;
}

// Example usage and write to file
async function main() {
    const guesses = ['weary', 'bears', 'crane'];
    const dict = generateFeedbackDict(guesses);

    // Serialize as pretty‑printed JSON (or use .txt extension)
    const out = JSON.stringify(dict, null, 2);

    // Write to feedback_dict.txt in the same folder
    const outPath = path.resolve(__dirname, 'feedback_dict.txt');
    fs.writeFileSync(outPath, out, 'utf8');

    console.log('Wrote feedback_dict to', outPath);
}

main();