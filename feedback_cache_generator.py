import json
from wordle_secret_words import get_secret_words
from valid_wordle_guesses import get_valid_wordle_guesses
from wordle import get_feedback
from collections import defaultdict
import os

def create_feedback_chunks(possible_guesses, possible_answers):
    chunks = defaultdict(dict)
    for guess in possible_guesses:
        for answer in possible_answers:
            feedback = get_feedback(guess, answer)
            chunks[guess[0]][guess] = chunks[guess[0]].get(guess, {})
            chunks[guess[0]][guess][answer] = feedback

    os.makedirs("feedback_chunks", exist_ok=True)
    for letter, chunk in chunks.items():
        with open(f"feedback_chunks/feedback_{letter}.json", "w", encoding="utf-8") as f:
            json.dump(chunk, f, indent=2)

create_feedback_chunks(get_valid_wordle_guesses(), get_secret_words())
