function count(word, x) {
    let count = 0;
    for (let letter of word) {
        if (letter === x) {
            count++;
        }
    }
    return count;
}

// gets the list of all valid secret words
import { get_secret_words } from './wordle_secret_words.js';
let secret_words = get_secret_words();

// picks a secret word for a game
function get_secret_word() {
    let secret_words = get_secret_words();
    let secret_word = secret_words[Math.floor(Math.random() * secret_words.length)].trim();
    return secret_word;
}

// displays end of game documentation
function endGame(won) {
    if (!won) {
        console.log("Game over. The correct answer was ", secretWord);
    }
    else {
        console.log("You won!");
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

    let output = ["-", "-", "-", "-", "-"]
    guess = guess.toUpperCase()
    secret_word = secret_word.toUpperCase()

    // check for yellows and greens
    for (let i = 0; i < 5; i++) {
        if (guess[i] == secret_word[i]) { // green
            output[i] = guess[i];
        }

        else if (secret_word.includes(guess[i])) {  // yellow 
            output[i] = guess[i].toLowerCase();
        }
    }
    let output_upper = output.map(letter => letter.toUpperCase());

    //check for case where the guess contains more of a specific letter than the secret word
    for (let i = 4; i >= 0; i--) {
        let letter = output[i].toUpperCase();

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

// gets the list of all valid guesses (much longer than the list of secret words)
import { get_valid_guesses } from './valid_wordle_guesses.js';
let valid_guesses = get_valid_guesses();

// updates the tile to be the correct letter
function updateTileLetter(row, column, letter) {
    let tile = document.getElementById(`row-${row}-col-${column}`);
    tile.textContent = letter
    tile.classList.add('filled');
}

// updates the tile to be empty
function updateTileBackspace(row, column, letter) {
    let tile = document.getElementById(`row-${row}-col-${column}`);
    tile.textContent = letter
    tile.classList.remove('filled');
}

// listens for key presses and responds accordingly-- aka the main game function loop
document.addEventListener('keydown', function (event) {
    let key = event.key;
    if (key === 'Enter') {
        if (currentGuess != null && currentGuess.length === MAX_WORD_LENGTH && valid_guesses.includes(currentGuess)) {
            console.log('Submitting guess:', currentGuess);
            let feedback = get_feedback(secretWord, currentGuess);
            console.log('Feedback:', feedback);

            for (let i = 0; i < MAX_WORD_LENGTH; i++) {
                let tile = document.getElementById(`row-${currentRow}-col-${i}`);
                if (feedback[i] === '-') {
                    tile.classList.remove('filled');
                    tile.classList.add('notIncluded');
                }
                else if (feedback[i] === feedback[i].toUpperCase()) {
                    tile.classList.remove('filled');
                    tile.classList.add('correct');
                }
                else {
                    tile.classList.remove('filled');
                    tile.classList.add('included');
                }
            }
            if (feedback === feedback.toUpperCase() && count(feedback, '-') === 0) {
                endGame(true, secretWord);
            }

            currentRow++;
            currentGuess = "";
        }
    }
    else if (key === 'Backspace') {
        event.preventDefault(); // prevents the default action of going to the previous page (?)
        updateTileBackspace(currentRow, currentGuess.length - 1, '');
        currentGuess = currentGuess.slice(0, -1);
        console.log('Deleted. Current guess:', currentGuess);
    }
    else if (/^[a-zA-Z]$/.test(key)) {
        if (currentGuess.length < MAX_WORD_LENGTH) {
            updateTileLetter(currentRow, currentGuess.length, key.toUpperCase());
            currentGuess += key.toUpperCase();
            console.log('Added letter:', key.toUpperCase(), 'Current guess:', currentGuess);
        }
    }
    if (currentRow === 7) {
        endGame(false, secretWord);
    }
})