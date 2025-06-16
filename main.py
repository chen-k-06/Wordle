# api code 
from fastapi import FastAPI
from pydantic import BaseModel
import math
from collections import Counter
from scipy.stats import entropy
from typing import Dict, List
import pickle
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chen-k-06.github.io"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

# -----------------------------------------------
# Calculate entropies / rank guesses functions
# -----------------------------------------------
def calculate_entropies(possible_guesses: list[str], possible_answers: list[str], feedback_dict: Dict[str, Dict[str, List[str]]], all_patterns: list[str]) -> Dict[str, float]:
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
    possible_answers = set(possible_answers)
    if len(possible_answers) <= 2:
        return {answer: 100 for answer in possible_answers}
    
    for guess in possible_guesses: # ~2,500 words
        counts = []
        for pattern in all_patterns: # 243 patterns
            if not feedback_dict[guess].get(pattern):
                continue
            answers = feedback_dict[guess][pattern] & possible_answers
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
    feedback_dict: Dict[str, Dict[str, List[str]]]
    all_patterns: list[str]

@app.post("/get_entropies")
def get_entropies(request: GetEntropies) -> dict: 
    result = calculate_entropies(request.possible_guesses, request.possible_answers, request.feedback_dict, request.all_patterns)
    return result