/*https://wordle-5rl4.onrender.com
API server 
*/

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
    /*Generates a feedback string based on comparing a 5-letter guess with the secret word. 
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

    // Count occurrences in the secret word
    for (let letter of secret_letters) {
        letter_count[letter] = (letter_count[letter] || 0) + 1;
    }

    // First pass: mark greens
    for (let i = 0; i < 5; i++) {
        if (guess_letters[i] === secret_letters[i]) {
            output[i] = "2"; // green
            letter_count[guess_letters[i]] -= 1;
        }
    }

    // Second pass: mark yellows
    for (let i = 0; i < 5; i++) {
        if (output[i] === "0" && letter_count[guess_letters[i]] > 0) {
            output[i] = "1"; // yellow
            letter_count[guess_letters[i]] -= 1;
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

// API functions 
async function getFeedbackDict() {
    let fetchError = null;
    let result = null;

    try {
        const response = await fetch('https://wordle-5rl4.onrender.com/get_feedback_dict');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        result = await response.json();
        console.log('API Response:', result);
    } catch (error) {
        fetchError = error;
        console.error('Fetch error:', fetchError);
    }
    return result
}

async function get_bits_remaining(guess_list) {
    let fetchError = null;
    let result = null;

    try {
        const response = await fetch('https://wordle-5rl4.onrender.com/bits_remaining', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                word_list: guess_list
            })
        });

        result = await response.json();
        console.log('Response:', result);
    } catch (error) {
        fetchError = error;
        console.error('Fetch error:', fetchError);
    }
    return result
}

async function get_valid_remaining_guesses(previous_guesses, feedback_list, possible_answers, feedback_dict) {
    let fetchError = null;
    let result = null;

    try {
        const response = await fetch('https://wordle-5rl4.onrender.com/get_remaining_guesses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guesses: previous_guesses,
                feedback: feedback_list,
                current_possible_answers: possible_answers,
                feedback_dict: feedback_dict
            })
        });

        result = await response.json();
        console.log('Response:', result);
    } catch (error) {
        fetchError = error;
        console.error('Fetch error:', fetchError);
    }
    return result
}

let feedback_dict = null;

window.onload = async function () {
    try {
        const pingResponse = await fetch('https://wordle-5rl4.onrender.com/');
        console.log("Pinged server:", pingResponse.status);

        feedback_dict = await getFeedbackDict();
    } catch (error) {
        console.error("Error waking up server or fetching data:", error);
        setTimeout(() => location.reload(), 5000);
    }
    console.log('Page is fully loaded');
};

// MAIN GAME LOOP LOGIC
// listens for key presses and responds accordingly-- aka the main game function loop
let valid_remaining_guesses = valid_guesses
let guesses = []
let feedbacks = []

document.addEventListener('keydown', async function (event) {
    let key = event.key;

    if (key === 'Enter') {
        if (currentGuess != null && currentGuess.length === MAX_WORD_LENGTH && valid_guesses.includes(currentGuess)) {
            console.log('Submitting guess:', currentGuess);
            let feedback = get_feedback(secretWord, currentGuess);
            console.log('Feedback:', feedback);
            feedbacks.push(feedback)
            guesses.push(currentGuess)

            // debugging
            let previous_guesses = guesses;
            let feedback_list = feedbacks;
            let possible_answers = valid_remaining_guesses;

            console.log(JSON.stringify({
                guesses: previous_guesses,
                feedback: feedback_list,
                current_possible_answers: possible_answers,
                feedback_dict: feedback_dict
            }));

            for (let i = 0; i < MAX_WORD_LENGTH; i++) {
                let tile = document.getElementById(`row-${currentRow}-col-${i}`);
                tile.classList.remove('filled');

                if (feedback[i] === '0') {
                    tile.classList.add('notIncluded');
                }
                else if (feedback[i] === '2') {
                    tile.classList.add('correct');
                }
                else {
                    tile.classList.add('included');
                }
            }
            if (feedback === "22222") { // checks for win
                endGame(true, secretWord);
            }

            currentRow++;
            currentGuess = "";

            // update posibilities / uncertainty box 
            let tile = document.getElementById(`row-${currentRow}-pos-bits`);

            console.log("Sending to API:", {
                guesses: previous_guesses,
                feedback: feedback_list,
                current_possible_answers: possible_answers,
                feedback_dict: feedback_dict
            });

            valid_remaining_guesses = await get_valid_remaining_guesses(
                guesses,
                feedbacks,
                valid_remaining_guesses,
                feedback_dict
            );
            let bits_remaining = await get_bits_remaining(valid_remaining_guesses);
            tile.textContent = valid_remaining_guesses + "   " + bits_remaining;
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