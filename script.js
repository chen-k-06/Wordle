/* https://api-hosting-cdnc.onrender.com
API server 
*/

// gets the list of all valid secret words
import { get_secret_words } from './wordle_secret_words.js';
let secret_words = get_secret_words();

function get_secret_word() {
    /**
     * Returns a random secret word from the list of secret words.
     *
     * @returns {string} The secret word.
     */

    let secret_word = secret_words[Math.floor(Math.random() * secret_words.length)].trim();
    console.log("Secret word: ", secret_word)
    return secret_word;
}

// displays end of game popup 
function endGame(won) {
    /**
     * Calculates the square of a number.
     *
     * @param {boolean} won - Signifies if the secret word was successfully guessed before 6 guesses.
     */

    const popup = document.getElementById("endgame-popup");
    const message = document.getElementById("endgame-message");

    if (!won) {
        console.log("Game over. The correct answer was ", secretWord);
        message.textContent = "Game over. The correct answer was \"" + secretWord + "\".";
    }
    else {
        console.log("You won!");
        message.textContent = 'You won!'
    }

    popup.classList.remove("hidden");
}


function get_feedback(guess, secret_word) {
    /**
    Generates a feedback string based on comparing a 5-letter guess with the secret word. 
    The feedback string uses the following schema: 
        - Correct letter, correct spot: 2
        - Correct letter, wrong spot: 1
        - Letter not in the word: 0
    *
    * @param {string} guess - The guessed word
    * @param {string} secret_word - The secret word
    * @returns {string} - Feedback string, based on comparing guess with the secret word
    * 
    * Examples
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

let currentGuess = "";
let currentRow = 0;
const MAX_WORD_LENGTH = 5;
let secretWord = get_secret_word();

// updates the tile to be the correct letter
function updateTileLetter(row, column, letter) {
    /**
     * Updates the tile with the correct letter
     *
     * @param {string} row - The row number
     * @param {string} column - The column number
     * @param {string} letter - The letter
     */

    let tile = document.getElementById(`row-${row}-col-${column}`);
    tile.textContent = letter
    tile.classList.add('filled');
}

function updateTileBackspace(row, column, letter) {
    /**
     * Deletes any content currently in the tile
     *
     * @param {string} row - The row number
     * @param {string} column - The column number
     * @param {string} letter - The letter. Always = ' '
     */

    let tile = document.getElementById(`row-${row}-col-${column}`);
    tile.textContent = letter
    tile.classList.remove('filled');
}

async function get_valid_remaining_guesses(guesses, feedback, current_possible_answers) {
    /**
     * Calls the API. Reduces the list of possible answers based on the most recent feedback. Returns a new list of 
       possible answers that is a subset of current_possible_answers
     *
     * @param {string[]} guesses - A list of string guesses, which could be empty
     * @param {string[]} feedback - A list of feedback strings, which could be empty
     * @param {string[]} current_possible_answers - a list of possible words that could be the secret word, 
            not yet updated based on most recent feedback. Cannot be empty.
     * @returns {string[]} The reduced list of possible secret words
     */

    let fetchError = null;
    let result = null;
    if (!valid_remaining_guesses || valid_remaining_guesses.length === 0) {
        console.warn("No valid remaining guesses returned.");
        return;
    }

    try {
        const response = await fetch('https://api-hosting-cdnc.onrender.com/wordle_get_remaining_guesses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guesses: guesses,
                feedback: feedback,
                current_possible_answers: current_possible_answers
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

async function rank_guesses(possible_guesses, possible_answers) {
    /**
     * Calls the API. Ranks all possible guesses based on expected information, taking possible answers
     * into account. 
     *
     * @param {string[]} possible_guesses - a list of all valid guesses. Will not be empty
     * @param {string[]} possible_answers - a list of all words that could be the secret word. Will not be empty

     * @returns {Object.<string, number>} A dictionary of possible guesses sorted by entropy
     */
    let fetchError = null;
    let result = null;

    try {
        const response = await fetch('https://api-hosting-cdnc.onrender.com/wordle_get_entropies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                possible_guesses: possible_guesses,
                possible_answers: possible_answers,
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

window.onload = async function () {
    /**
     * When the webpage loads, ping the server. If unsuccessful, try again after 5 seconds.
     */

    try {
        const pingResponse = await fetch('https://api-hosting-cdnc.onrender.com/');
        console.log("Pinged server:", pingResponse.status);

    } catch (error) {
        console.error("Error waking up server or fetching data:", error);
        setTimeout(() => location.reload(), 5000);
    }
    console.log('Page is fully loaded');
};

// MAIN GAME LOOP LOGIC
// listens for key presses and responds accordingly-- aka the main game function loop
let valid_remaining_guesses = secret_words
let guesses = []
let feedbacks = []
let bits = []
bits.push(13.66)
let isWaiting = false; // flag to prevent 'enter' before rank_guesses() returns

document.addEventListener('keydown', async function (event) {
    let key = event.key;

    if (key === 'Enter') {
        if (isWaiting == false && currentGuess != null && currentGuess.length === MAX_WORD_LENGTH && secret_words.includes(currentGuess)) {
            // get feedback. log all relevant values into lists
            console.log('Submitting guess:', currentGuess);
            let feedback = get_feedback(currentGuess, secretWord);
            console.log('Feedback:', feedback);
            feedbacks.push(feedback)
            guesses.push(currentGuess)

            let previous_guesses = guesses;
            let feedback_list = feedbacks;

            // color tiles
            for (let i = 0; i < MAX_WORD_LENGTH; i++) {
                let tile = document.getElementById(`row-${currentRow}-col-${i}`);
                tile.classList.add('flip-in');

                setTimeout(() => {
                    tile.classList.remove('filled');

                    if (feedback[i] === '0') {
                        tile.classList.add('notIncluded');
                    } else if (feedback[i] === '2') {
                        tile.classList.add('correct');
                    } else {
                        tile.classList.add('included');
                    }
                }, 250);
            }

            // check for win
            if (feedback === "22222") {
                // pause before displaying end of game popup
                const sleepPromise = sleep(600);
                await (sleepPromise);

                endGame(true, secretWord);
                return;
            }

            currentRow++;
            currentGuess = "";

            // if max guesses exceeded, game over
            if (currentRow === 6) {
                // pause before displaying end of game popup
                const sleepPromise = sleep(600);
                await (sleepPromise);

                endGame(false, secretWord);
                return;
            }

            // update posibilities / uncertainty box 
            let tile = document.getElementById(`row-${currentRow}-pos-bits`);

            valid_remaining_guesses = await get_valid_remaining_guesses(previous_guesses, feedback_list, valid_remaining_guesses);

            let bits_remaining = Math.log2(valid_remaining_guesses.length)
            bits_remaining = Math.trunc(bits_remaining * 100) / 100
            bits.push(bits_remaining)
            tile.textContent = valid_remaining_guesses.length + " possibilities, " + bits_remaining + " bits";

            // update actual bits tile
            tile = document.getElementById(`row-${currentRow - 1}-actual-bits`);
            tile.textContent = (Math.trunc((bits[guesses.length - 1] - bits_remaining) * 100) / 100) + " bits";

            // re rank guesses
            if ((Math.trunc((bits[guesses.length - 1] - bits_remaining) * 100) / 100) != 0) {
                isWaiting = true;
                console.log("Sending to API: secret words:", secret_words, " valid remaining guesses: ", valid_remaining_guesses)
                let guesses_ranked = {};
                try {
                    guesses_ranked = await rank_guesses(secret_words, valid_remaining_guesses);
                    console.log('Top guesses:', guesses_ranked);
                } catch (e) {
                    console.error("Failed to rank guesses:", e);
                } finally {
                    isWaiting = false;
                }

                let entries = Object.entries(guesses_ranked);
                console.log('Top guesses:', guesses_ranked);

                // reset right sidebar contents
                for (let i = 0; i < 6; i++) {
                    tile = document.getElementById(`row-${i}-top-picks`);
                    tile.classList.remove("fly-in");
                    tile.classList.add("fly-out");
                    tile.textContent = " "
                }

                // update right sidebar with new ranked guesses
                for (let i = 0; i < Math.min(6, entries.length); i++) {
                    const [guess, entropy] = entries[i];
                    tile = document.getElementById(`row-${i}-top-picks`);
                    tile.classList.remove("fly-in", "fly-out");

                    void tile.offsetWidth; // force reflow 
                    tile.classList.add("fly-in");
                    tile.textContent = `${guess}, ${entropy.toFixed(2)} bits`;
                }
            }
        }
    }

    // backspace key logic 
    else if (key === 'Backspace' && currentGuess.length != 0) {
        event.preventDefault(); // prevents the default action of going to the previous page (?)
        updateTileBackspace(currentRow, currentGuess.length - 1, '');
        currentGuess = currentGuess.slice(0, -1);
        console.log('Deleted. Current guess:', currentGuess);
    }

    // letter key logic
    else if (/^[a-zA-Z]$/.test(key)) {
        if (currentGuess.length < MAX_WORD_LENGTH) {
            updateTileLetter(currentRow, currentGuess.length, key.toUpperCase());
            currentGuess += key.toUpperCase();
            console.log('Added letter:', key.toUpperCase(), 'Current guess:', currentGuess);
        }
    }
})

// help button event listener 
document.getElementById("help-button").addEventListener("click", () => {

    // if the help button is click, display the popup with the relevant game information
    console.log('Help button was clicked!');
    const help_popup = document.getElementById("help-popup");
    const message = document.getElementById("help-message");
    message.innerHTML = `Wordle is a web-based word game developed by Josh Wardle.<br>
    Players have six attempts to guess a five-letter secret word, with feedback given for each guess.<br>
    <br>
    A green tile indicates that the letter is correct and in the right position.<br>
    A yellow tile means the letter is in the secret word but in a different position.<br>
    A grey tile shows that the letter does not appear in the secret word at all.<br>
    <br>
    On the left, you’ll see the optimal possible guesses along with the amount of information (in bits) each provides.<br>
    In information theory, one bit of information is defined as −log⁡2(p), where p is the probability of an event occurring.<br>
    Therefore, a less likely event yields more bits of information and is considered a better guess.<br>
    <br>
    After entering your guess, the actual amount of information gained (in bits) will be displayed in red on the right.<br>
    On the left, you’ll also see how many bits of information remain in the word list and how many words are still possible candidates for the secret word.`
    help_popup.classList.remove("hidden");
});

// close the help popup
document.getElementById("help-close").addEventListener("click", () => {
    const help_popup = document.getElementById("help-popup");
    help_popup.classList.add("hidden");
});

// reloads the page to restart the game
document.getElementById("restart-button").addEventListener("click", () => {
    location.reload();
});

function sleep(ms) {
    /**
     * Sleeps for ms milliseconds
     */
    return (new Promise(resolve => setTimeout(resolve, ms)));
}