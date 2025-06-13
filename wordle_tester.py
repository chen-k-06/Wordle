from wordle import wordle_game
from wordle_secret_words import get_secret_words

#in order to use this code, wordle_game must be modified so that guesses are not taken from user input but are automatically set to hints
if __name__ == "__main__":
    accuracy = 0 #how many words from the secret words list can the 
    successful_games = 0
    guesses_needed = []
    average_guesses_needed = 0
    secret_words = sorted(get_secret_words())
    num_of_words = len(secret_words)
    print(num_of_words)

    for secret_word in secret_words: 
        result = wordle_game(secret_word)
        if result != -1: 
            successful_games += 1
            guesses_needed.append(result)
        print("num guesses needed: ", result)
        print("games played: ", successful_games)
    
    accuracy = (successful_games/num_of_words) * 100

    average_guesses_needed = sum(guesses_needed) / len(guesses_needed) if guesses_needed else 0

    print(f"Accuracy (% of games won): {accuracy:.2f}")
    print("Number of games won:", successful_games)
    print("Average guesses needed in a game:", average_guesses_needed)

    import matplotlib.pyplot as plt

    # Simple line plot of guesses per game
    plt.figure(figsize=(12, 6))
    plt.plot(guesses_needed, label='Guesses Needed per Game', color='blue', alpha=0.7)
    plt.axhline(y=average_guesses_needed, color='red', linestyle='--', label=f'Average = {average_guesses_needed:.2f}')
    plt.xlabel('Game Number')
    plt.ylabel('Guesses Needed')
    plt.title('Wordle Bot: Guesses Needed per Game')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()
