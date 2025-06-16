# api code 
from fastapi import FastAPI
from pydantic import BaseModel
from scipy.stats import entropy
from typing import Dict
import os
import pickle
from fastapi.middleware.cors import CORSMiddleware
from wordle_helper_functions import get_pattern

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

#------------------------------------------------
# Get feedback dict cache functions
#------------------------------------------------
def get_feedback_dict(valid_guesses):
    feedback_dict = None

    if os.path.exists("pattern_cache.pkl"):
        try:
            with open("pattern_cache.pkl", "rb") as file:
                feedback_dict = pickle.load(file)
        except Exception as e:
            print("Error loading pattern_cache.pkl:", e)
    
    if feedback_dict is None:
        feedback_dict = generate_feedback_dict(valid_guesses)
        with open("pattern_cache.pkl", "wb") as file:
            pickle.dump(feedback_dict, file)

    return feedback_dict

def generate_feedback_dict(guesses):
    '''For each possible guess and possible information returned, store a list of candidate words
    
    >>> feedback_dict = generate_feedback_dict(['weary', 'bears, 'crane'])
    >>> feedback_dict['crane'][(2, 2, 2, 2, 2)]
    {'crane'}
    >>> sorted(pattern_dict['crane'][(0, 1, 2, 0, 1)])
    ['bears', 'weary']
    '''
    feedback_dict = {}
    for guess in guesses:
        feedback_dict[guess] = {}
        for answer in guesses:
            pattern = get_pattern(guess, answer)
            if pattern not in feedback_dict[guess]:
                feedback_dict[guess][pattern] = set()
            feedback_dict[guess][pattern].add(answer)
    return feedback_dict

# -----------------------------------------------
# Calculate entropies / rank guesses functions
# -----------------------------------------------
def calculate_entropies(possible_guesses: list[str], possible_answers: list[str], all_patterns: list[str]) -> Dict[str, float]:
    '''
    Calculates the entropy for every guess in possible guesses, taking into account 
    the remaining possible answers. 
        Args:
            possible_guesses (list): a list of all valid guesses. Will not be empty
            possible_answers (list): a list of all words that could be the secret word. Will not be empty

        Returns:
            entropies (list): a list of entropies that correspond to each guess in possible_guesses
    '''
    entropies = {}
    feedback_dict = get_feedback_dict(possible_guesses)
    possible_answers = set(possible_answers)
    if len(possible_answers) <= 2:
        return {answer: 100 for answer in possible_answers}
    
    if feedback_dict is None:
        raise ValueError("feedback_dict is None. Cache may be corrupted or not built correctly.")

    for guess in possible_guesses: # ~2,500 words at most
        counts = []
        for pattern in all_patterns: # 243 patterns
            if ((guess not in feedback_dict) or (pattern not in feedback_dict[guess])):
                continue
            answers = (set(feedback_dict[guess][pattern])).intersection(possible_answers)
            counts.append(len(answers))
        total = sum(counts)
        if total > 0: 
            counts = [c / total for c in counts if c > 0]
            entropies[guess] = entropy(counts, base = 2)
        else: 
            entropies[guess] = 0.0
    sorted_entropies = dict(sorted(entropies.items(), key=lambda item: item[1], reverse=True))
    return sorted_entropies

class GetEntropies(BaseModel):
    possible_guesses: list[str]
    possible_answers: list[str]
    all_patterns: list[str]

@app.post("/get_entropies")
def get_entropies(request: GetEntropies) -> dict: 
    global feedback_dict
    feedback_dict = None

    if feedback_dict is None:
        feedback_dict = get_feedback_dict(request.possible_guesses)

    result = calculate_entropies(request.possible_guesses, request.possible_answers, request.all_patterns)
    return result