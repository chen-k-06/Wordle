/*https://wordle-5rl4.onrender.com
API server 
*/

// gets the list of all valid secret words
import { get_secret_words } from './wordle_secret_words.js';
let secret_words = get_secret_words();

// picks a secret word for a game
function get_secret_word() {
    let secret_word = secret_words[Math.floor(Math.random() * secret_words.length)].trim();
    console.log("Secret word: ", secret_word)
    return secret_word;
}

// displays end of game documentation
function endGame(won) {
    const popup = document.getElementById("endgame-popup");
    const message = document.getElementById("endgame-message");

    if (!won) {
        console.log("Game over. The correct answer was ", secretWord);
        message.textContent = 'Game over. The correct answer was "${secretWord}"'
    }
    else {
        console.log("You won!");
        message.textContent = 'You won!'
    }

    popup.classList.remove("hidden");
}


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

let currentGuess = "";
let currentRow = 0;
const MAX_WORD_LENGTH = 5;
let secretWord = get_secret_word();

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
async function get_valid_remaining_guesses(guesses, feedback, current_possible_answers) {
    /*Reduces the list of possible answers based on the most recent feedback. Returns a new list of 
       possible answers that is a subset of current_possible_answers
        
        Args:
         guesses (list): A list of string guesses, which could be empty
         feedback (list): A list of feedback strings, which could be empty
         possible_answers (list): a list of possible words that could be the secret word, 
            not yet updated based on most recent feedback. Cannot be empty.
 
        Returns:
         possible_answers (list): a list of remaining possible words that could be the secret word
    */
    let fetchError = null;
    let result = null;
    if (!valid_remaining_guesses || valid_remaining_guesses.length === 0) {
        console.warn("No valid remaining guesses returned.");
        return;
    }

    try {
        const response = await fetch('https://wordle-5rl4.onrender.com/get_remaining_guesses', {
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
    let fetchError = null;
    let result = null;

    try {
        const response = await fetch('https://wordle-5rl4.onrender.com/get_entropies', {
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
    try {
        const pingResponse = await fetch('https://wordle-5rl4.onrender.com/');
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
            console.log('Submitting guess:', currentGuess);
            let feedback = get_feedback(currentGuess, secretWord);
            console.log('Feedback:', feedback);
            feedbacks.push(feedback)
            guesses.push(currentGuess)

            // debugging
            let previous_guesses = guesses;
            let feedback_list = feedbacks;

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
            if (feedback === "22222") { // checks for win
                endGame(true, secretWord);
                return;
            }

            currentRow++;
            currentGuess = "";

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

            // reset tile contents
            for (let i = 0; i < 6; i++) {
                tile = document.getElementById(`row-${i}-top-picks`);
                tile.classList.remove("fly-in");
                tile.classList.add("fly-out");
                tile.textContent = " "
            }

            // populate tiles
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
    else if (key === 'Backspace' && currentGuess.length != 0) {
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
        return;
    }
})

// help button event listener 
document.getElementById("help-button").addEventListener("click", () => {
    console.log('Help button was clicked!');
    const help_popup = document.getElementById("help-popup");
    const message = document.getElementById("help-message");
    message.textContent = `Wordle is a web-based word game developed by Josh Wardle. \n
    Players have six attempts to guess a five-letter secret word, with feedback given for each guess.\n
    \n
    A green tile signifies that that letter exists, in that position, in the secret word.\n
    A yellow tile means that letter is in the secret word, but not in that spot.\n
    And a grey tile means that letter isnt in the secret word at all.\n
    \n
    Also shown are optimal possible guesses and how many bits of information they provide. \n
    Here, we define a bit of information to = -log2(p), where p is the probabilty of an event. \n
    Therefore, the more information-- bits-- a guess is estimated to provide, the better a guess it is.\n
    \n
    After you enter your answer, the amount of actual bits of information gained from that guess will \n
    appear in red on the right. The number of bits remaining in the word list, along with how many words \n
    are still eligble to be the secret word, will appear on the left.`.trim();
    help_popup.classList.remove("hidden");
});

// close the help popup
document.getElementById("help-close").addEventListener("click", () => {
    const help_popup = document.getElementById("help-popup");
    help_popup.classList.add("hidden");
});

document.getElementById("restart-button").addEventListener("click", () => {
    location.reload();
});