function count(word, x) {
    let count = 0;
    for (let letter of word) {
        if (letter === x) {
            count++;
        }
    }
    return count;
}

import { get_secret_words } from './wordle_secret_words.js';
let secret_words = get_secret_words();

function get_secret_word() {
    let secret_words = get_secret_words();
    let secret_word = secret_words[Math.floor(Math.random() * secret_words.length)].trim();
    return secret_word;
}

function endGame(won) {
    if (!won) {

    }
    else {

    }
}

function get_feedback(secret_word, guess) {
    /* Generates a feedback string based on comparing a 5-letter guess with the secret word. 
       The feedback string uses the following schema: 
        - Correct letter, correct spot: uppercase letter ('A'-'Z')
        - Correct letter, wrong spot: lowercase letter ('a'-'z')
        - Letter not in the word: '-'

        Args:
            guess (str): The guessed word
            secret_word (str): The secret word

        Returns:
            str: Feedback string, based on comparing guess with the secret word
    
        Examples
        >>> get_feedback("lever", "EATEN")
        "-e-E-"
            
        >>> get_feedback("LEVER", "LOWER")
                "L--ER"
            
        >>> get_feedback("MOMMY", "MADAM")
                "M-m--"
            
        >>> get_feedback("ARGUE", "MOTTO")
                "-----" */

    output = ["-", "-", "-", "-", "-"]
    guess = guess.toUpperCase()
    secret_word = secret_word.toUpperCase()

    // check for yellows and greens
    for (let i = 0; i < 5; i++) {
        if (guess[i] == secret_word[i]) { // green
            output[i] = guess[i]
        }

        else if (secret_word.includes(guess[i])) {  // yellow 
            output[i] = guess[i].toLowerCase()
        }
    }
    output_upper = output.map(letter => letter.toUpperCase());

    //check for case where the guess contains more of a specific letter than the secret word
    for (let i = 4; i >= 0; i--) {
        letter = output[i].toUpperCase();

        if ((letter != "-") && (count(output_upper, letter) > count(secret_word, letter)) && (output[i] != output[i].toUpperCase())) {
            output[i] = "-";
        }
    }
    return output.join('');
}

let currentGuess = "";
let currentRow = 0;
const MAX_WORD_LENGTH = 5;
let secretWord = get_secret_word();

function updateTile(row, column, letter) {
    let tile = document.getElementById(`row-${row}-col-${column}`);
    tile.textContent = letter
}

document.addEventListener('keydown', function (event) {
    let key = event.key;
    if (key === 'Enter' && secret_words.includes(currentGuess)) {
        if (currentGuess.length === MAX_WORD_LENGTH) {
            console.log('Submitting guess:', currentGuess);
            let feedback = get_feedback(secretWord, currentGuess);
            console.log('Feedback:', feedback);
            currentRow++;
            currentGuess = "";
        }
    }
    else if (key === 'Backspace') {
        updateTile(currentRow, currentGuess.length, ' ');
        currentGuess = currentGuess.slice(0, -1);
        console.log('Deleted. Current guess:', currentGuess);
    }
    else if (/^[a-zA-Z]$/.test(key)) {
        if (currentGuess.length < MAX_WORD_LENGTH) {
            updateTile(currentRow, currentGuess.length, key.toUpperCase());
            currentGuess += key.toUpperCase();
            console.log('Added letter:', key.toUpperCase(), 'Current guess:', currentGuess);
        }
    }
})