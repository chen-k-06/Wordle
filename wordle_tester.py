from wordle import wordle_game, get_AI_guess
from wordle_secret_words import get_secret_words

#in order to use this code, wordle_game must be modified so that guesses are not taken from user input but are automatically set to hints
if __name__ == "__main__":
    accuracy = 0 #how many words from the secret words list can the 
    successful_games = 0
    guesses_needed = []
    average_guesses_needed = 0
    secret_words = get_secret_words()
    num_of_words = len(secret_words)
    print(num_of_words)

    for secret_word in secret_words: 
        result = wordle_game(secret_word)
        if result != -1: 
            successful_games += 1
            guesses_needed.append(result)
    
    accuracy = (successful_games/num_of_words) * 100
    for num in guesses_needed: 
        average_guesses_needed += num
    average_guesses_needed = average_guesses_needed/num_of_words

    print(f"Accuracy (% of games won): {accuracy:.2f}")
    print("Number of games won:", successful_games)
    print("Average guesses needed in a game:", average_guesses_needed)
