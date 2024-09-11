import random
from colorama import Fore, Back, Style, init
init(autoreset=True) #Ends color formatting after each print statement
from wordle_secret_words import get_secret_words
from valid_wordle_guesses import get_valid_wordle_guesses

def get_feedback(guess: str, secret_word: str) -> str:
    '''Generates a feedback string based on comparing a 5-letter guess with the secret word. 
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
                "-----"

    
    '''
    output = ["-", "-", "-", "-", "-"]
    guess = guess.upper()
    secret_word = secret_word.upper()

    #check for yellows and greens
    for i in range(5):
        if guess[i] == secret_word[i]: #green
            output[i] = guess[i]

        elif guess[i] in secret_word: #yellow
            output[i] = guess[i].lower()
    
    #check for case where the guess contains more of a specific letter than the secret word
    for i in range(4, -1, -1): 
        letter = output[i].upper()
        output_upper = [letter.upper() for letter in output]

        if letter != "-" and output_upper.count(letter) > secret_word.count(letter) and output[i] != output[i].upper(): 
            output[i] = "-"

    return(output)

def get_AI_guess(guesses: list[str], feedback: list[str], secret_words: set[str], valid_guesses: set[str], guess_number: int) -> str:
    '''Analyzes feedback from previous guesses/feedback (if any) to make a new guess
        
        Args:
         guesses (list): A list of string guesses, which could be empty
         feedback (list): A list of feedback strings, which could be empty
         secret_words (set): A set of potential secret words
         valid_guesses (set): A set of valid AI guesses
         guess_number (int): the number of guesses made
        
        Returns:
         str: a valid guess that is exactly 5 uppercase letters
    '''
    #first guess should always be slate, mathmatically proven best starting word
    if (guesses[0] == ""): 
        return "SLATE"
    
    secret_words_copy = [i for i in secret_words]
    last_guess = guesses[guess_number - 1]
    
    #checks which words share the same feedback result as the guess
    for word in secret_words_copy:
        if feedback != get_feedback(last_guess, word):
            secret_words.remove(word)

    #picks next choice at random
    next_guess = random.choice(list(secret_words))

    while next_guess in guesses: 
        next_guess = random.choice(list(secret_words))

    valid_guesses = valid_guesses.remove(next_guess)
    return (next_guess.upper())


#selects a secret word at random from the official Wordle list
def get_secret_word():
    secret_words = list(get_secret_words())
    secret_word = random.choice(secret_words).strip()
    return secret_word

#plays the Wordle game
def wordle_game(secret_word: str):
    secret_words = list(get_secret_words())
    valid_guesses = list(get_valid_wordle_guesses())
    guesses = ["", "", "", "", "", ""]

    #user input guesses
    for i in range(6):
        guess = ""

        while (guess.upper() not in valid_guesses): 
            guess = input("Enter guess, or 'hint' for a hint: ")

            #AI guess input
            if (guess.upper() == "HINT"):
                if (i == 0):
                    guess = get_AI_guess(guesses, [], secret_words, valid_guesses, 0)
                    break

                else:
                    guess = get_AI_guess(guesses, get_feedback(guesses[i-1], secret_word), secret_words, valid_guesses, i)
                    break

            elif (guess.upper() not in valid_guesses): 
                print("Not a valid guess. Please try again.")

        guesses[i] = guess

        #output formatting
        print(Back.LIGHTBLACK_EX + '       ') 

        for guess in guesses: 
            if (guess != ""):
                feedback = get_feedback(guess, secret_word)
                print(Back.LIGHTBLACK_EX + ' ', end = '')
                for i in range(len(feedback)):
                    if feedback[i] == "-":
                        print(Back.LIGHTBLACK_EX + guess[i].upper(), end='')
                    
                    elif feedback[i] == feedback[i].lower():
                        print(Back.YELLOW + guess[i].upper() , end='')

                    else:
                        print(Back.GREEN + guess[i].upper() , end='')

                print(Back.LIGHTBLACK_EX + ' ')
            if (guess.upper() == secret_word.upper()): 
                print(Back.LIGHTBLACK_EX + '       ') 
                print("You've guess the word! It was", secret_word, end = "")
                print(".")
                return (i+1) #success
        print(Back.LIGHTBLACK_EX + '       ') 

    print("No more guesses left. The word was" , secret_word, end = "")
    print(".")
    return (-1) #failure


if __name__ == "__main__":
    # print(get_feedback("lever", "EATEN")) #"-e-E-"
    # print(get_feedback("LEVER", "LOWER")) # "L--ER"
    # print(get_feedback("MOMMY", "MADAM")) # "M-m--"
    # print(get_feedback("GREAT", "GRAPE")) # "-----"

    wordle_game(get_secret_word())