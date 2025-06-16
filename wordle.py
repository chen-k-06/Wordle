from colorama import Fore, Back, Style, init
init(autoreset=True) #Ends color formatting after each print statement
from wordle_secret_words import get_secret_words
from valid_wordle_guesses import get_valid_wordle_guesses
from wordle_helper_functions import calculate_entropies, get_pattern, get_secret_word, get_all_patterns, generate_feedback_dict, get_remaining_guesses
import pickle, os

#plays the Wordle game
def wordle_game(secret_word: str):
    valid_guesses = list(get_valid_wordle_guesses())
    secret_words = list(get_secret_words())
    possible_secret_words = list(get_secret_words())
    guesses = ["", "", "", "", "", ""]
    feedbacks = []
    all_patterns = get_all_patterns()

    if os.path.exists("pattern_cache.pkl"):
        with open("pattern_cache.pkl", "rb") as file:
            feedback_dict = pickle.load(file)

    else: 
        feedback_dict = generate_feedback_dict(valid_guesses)
        with open("pattern_cache.pkl", "wb") as file:
            pickle.dump(feedback_dict, file, protocol=pickle.HIGHEST_PROTOCOL)
        print("Generated and cached pattern dictionary.")

    #user input guesses
    for i in range(6):
        guess = "hint"

        while (guess.upper() not in valid_guesses): 
            # guess = input("Enter guess, or 'hint' for a hint: ")

            #AI guess input
            if (guess.upper() == "HINT"):
                    if i == 0:
                        guess = "SOARE"
                        break
                    guess = calculate_entropies(secret_words, possible_secret_words, feedback_dict, all_patterns)
                    sorted_items = sorted(guess.items(), key=lambda item: item[1], reverse=True)
                    guess = sorted_items[0]
                    guess = guess[0]
                    break

            elif (guess.upper() not in valid_guesses): 
                print("Not a valid guess. Please try again.")
             
        guesses[i] = guess
        feedback = get_pattern(guess, secret_word)
        feedbacks.append(feedback)
        possible_secret_words = get_remaining_guesses(guesses, feedbacks, possible_secret_words, feedback_dict)    


        #output formatting
        print(Back.LIGHTBLACK_EX + '       ') 

        for j in range(i + 1): 
            guess = guesses[j]
            feedback = feedbacks[j]
            if (guess != ""):
                print(Back.LIGHTBLACK_EX + ' ', end = '')
                for k in range(len(feedback)):
                    if feedback[k] == '0':
                        print(Back.LIGHTBLACK_EX + guess[k].upper(), end='')
                    
                    elif feedback[k] == '1':
                        print(Back.YELLOW + guess[k].upper() , end='')

                    else:
                        print(Back.GREEN + guess[k].upper() , end='')

                print(Back.LIGHTBLACK_EX + ' ')
            if (guess.upper() == secret_word.upper()): 
                print(Back.LIGHTBLACK_EX + '       ') 
                print("You've guess the word! It was", secret_word, end = "")
                print(".")
                return (i+1) #success
            
        # print(Back.LIGHTBLACK_EX + '       ') 

    print("No more guesses left. The word was" , secret_word, end = "")
    print(".")
    return (-1) #failure


if __name__ == "__main__":
    # print(get_feedback("lever", "EATEN")) #"-e-E-"
    # print(get_feedback("LEVER", "LOWER")) # "L--ER"
    # print(get_feedback("MOMMY", "MADAM")) # "M-m--"
    # print(get_feedback("GREAT", "GRAPE")) # "-----"

    wordle_game(get_secret_word())