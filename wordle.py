import random
import math
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

    return(''.join(output))

def get_uniform_entropy(outcomes):
    N = len(outcomes)
    if N == 0:
        return 0
    return math.log2(N)

# returns an integer, the entropy of that event given a list of outcomes & probabilities
def get_entropy(probabilities):
    entropy = 0.0
    if not probabilities: 
        return 0
    
    for probability in probabilities:
        if (probability > 0):
            entropy += -1*probability*math.log2(probability)
    return entropy
    

def rank_guesses(possible_guesses, possible_answers):
    entropies = {}
    feedback_cache = {}

    for guess in possible_guesses:
        for answer in possible_answers:
                feedback_cache[(guess, answer)] = get_feedback(guess, answer)

    for guess in possible_guesses:
        feedback_counts = {}            
        for answer in possible_answers:
            #For each possible answer in your current list, compute the feedback pattern you would get if you guessed this word.
            feedback = feedback_cache[(guess, answer)]
            feedback_counts[feedback] = feedback_counts.get(feedback, 0) + 1
        
        probabilities = [count / len(possible_answers) for count in feedback_counts.values()]
        entropy = get_entropy(probabilities)
        entropies[guess] = entropy

    sorted_entropies = {key: value for key, value in sorted(entropies.items(), key=lambda item: item[1], reverse=True)}    
    print(sorted_entropies)
    return sorted_entropies


def get_AI_guess(guesses: list[str], feedback: list[str], secret_words: set[str], valid_guesses: set[str], guess_number: int) -> tuple[float, str]:
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
        return (13.66,"SLATE")
    
    valid_guesses_copy = []
    
    # checks which words share the same feedback result as the guess
    # end game code 
    for guess in valid_guesses: 
        flag = False
        for i in range(len(feedback)): 
            item = feedback[i]
            last_guess = guesses[i]
            if get_feedback(last_guess, guess) != item:
                flag = True
                break
        if flag == False: 
            valid_guesses_copy.append(guess)
    
    bits_remaining = get_uniform_entropy(valid_guesses_copy)
    print("potential words left: ", len(valid_guesses_copy))
    print("bits left: ", bits_remaining)

    # valid_guesses = valid_guesses.remove(next_guess)
    if (bits_remaining == 0) :
        return (0, valid_guesses_copy[0])

    guesses = rank_guesses(valid_guesses, valid_guesses_copy)
    return (bits_remaining, list(guesses)[0])


#selects a secret word at random from the official Wordle list
def get_secret_word():
    secret_words = list(get_secret_words())
    secret_word = random.choice(secret_words).strip()
    return secret_word

#plays the Wordle game
# will need to be rewritten in JS
def wordle_game(secret_word: str):
    secret_words = list(get_secret_words())
    valid_guesses = list(get_valid_wordle_guesses())
    guesses = ["", "", "", "", "", ""]
    feedbacks = []
    bits = [] # uncertainty left in the answer space. should be strictly decreasing
    #user input guesses
    for i in range(6):
        guess = "HINT"

        while (guess.upper() not in valid_guesses): 
            # guess = input("Enter guess, or 'hint' for a hint: ")

            #AI guess input
            if (guess.upper() == "HINT"):
                    bits_remaining, guess = get_AI_guess(guesses, feedbacks, secret_words, valid_guesses, i)
                    bits.append(bits_remaining)
                    break

            elif (guess.upper() not in valid_guesses): 
                print("Not a valid guess. Please try again.")
             
        guesses[i] = guess
        feedbacks.append(get_feedback(guess, secret_word))

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