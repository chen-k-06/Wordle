function count(word, x) {
    let count = 0;
    for (let letter of word) {
        if (letter === x) {
            count++;
        }
    }
    return count;
}

function checkGuess(secret_word, guess) {

}

function updateBoard() {

}

function handleKeyPress(event) {

}

function endGame(won) {

}

function get_feedback(secret_word, guess) {
    /*    '''Generates a feedback string based on comparing a 5-letter guess with the secret word. 
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