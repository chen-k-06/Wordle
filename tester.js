import { get_secret_words } from './wordle_secret_words.js';
import fs from 'fs';

let secret_words = get_secret_words();

function get_feedback(guess, secret_word) {
    /*Generates a feedback string based on comparing a 5-letter guess with the secret word. 
       The feedback string uses the following schema: 
        - Correct letter, correct spot: 2
        - Correct letter, wrong spot: 1
        - Letter not in the word: 0

        Args:
            guess (str): The guessed word
            secret_word (str): The secret word

        Returns:
            str: Feedback string, based on comparing guess with the secret word
    
        Examples
        >>> get_pattern("lever", "EATEN")
                "01020"
            
        >>> get_pattern("LEVER", "LOWER")
                "20022"
            
        >>> get_pattern("MOMMY", "MADAM")
                "20100"
            
        >>> get_pattern("ARGUE", "MOTTO")
                "00000"
    */
    guess = guess.toUpperCase();
    secret_word = secret_word.toUpperCase();

    let output = ["0", "0", "0", "0", "0"];
    let secret_letters = secret_word.split('');
    let guess_letters = guess.split('');

    let letter_count = {};
    for (let letter of secret_letters) {
        letter_count[letter] = (letter_count[letter] || 0) + 1;
    }

    for (let i = 0; i < 5; i++) {
        if (guess_letters[i] === secret_letters[i]) { // green -> 2
            output[i] = "2";
            letter_count[guess_letters[i]] -= 1;
        }
    }

    for (let i = 0; i < 5; i++) { // yellow -> 1
        if (output[i] === "0" && letter_count[guess_letters[i]] > 0) {
            output[i] = "1"
            letter_count[guess_letters[i]] -= 1;
        }
    }

    return output.join('')
}

function generateFeedbackDict(guesses) {
    const feedbackDict = {};

    for (let guess of guesses) {
        feedbackDict[guess] = {};

        for (let answer of guesses) {
            const pattern = get_feedback(guess, answer); // string like "01210"

            if (!(pattern in feedbackDict[guess])) {
                feedbackDict[guess][pattern] = new Set();
            }

            feedbackDict[guess][pattern].add(answer);
        }
    }

    // Convert Sets to Arrays for serialization compatibility (e.g. JSON)
    for (let guess in feedbackDict) {
        for (let pattern in feedbackDict[guess]) {
            feedbackDict[guess][pattern] = Array.from(feedbackDict[guess][pattern]);
        }
    }

    return feedbackDict;
}

const feedbackDict = generateFeedbackDict(secret_words);
fs.writeFileSync('feedback_dict.json', JSON.stringify(feedbackDict, null, 2));
console.log("✅ feedback_dict.json has been written.");
// console.log(get_feedback("LEVER", "LOWER")); // Should output "20022"
// console.log(get_feedback("MOMMY", "MADAM")); // Should output "20100"
// console.log(get_feedback("ARGUE", "MOTTO")); // Should output "00000"
