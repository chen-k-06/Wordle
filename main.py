# api code 
from fastapi import FastAPI
from pydantic import BaseModel
import math
from collections import Counter
from scipy.stats import entropy
from typing import Dict, List

app = FastAPI()

# ---------------------------
# Calculate bits remaining
# ---------------------------
class WordListRequest(BaseModel):
    word_list: list[str]

def calculate_bits_remaining(word_list: list[str]) -> float:
    ''' Calculates the uncertainty (bits) left in the given list 
    
        Args: 
            word_list (list): the list of remaining potential secret words

        Returns: 
            math.log2(len(word_list)) aka the number of bits remaining in word_list
    '''
    N = len(word_list)
    if N == 0:
        return 0
    return math.log2(N)

@app.post("/bits_remaining")
def get_bits_remaining(request: WordListRequest): # API route handler 
    result = calculate_bits_remaining(request.word_list)
    return {"bits_remaining": result}

# ---------------------------
# Feedback Pattern Functions
# ---------------------------
def get_pattern(guess: str, answer: str) -> str:
    '''Generates a feedback string based on comparing a 5-letter guess with the secret word. 
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
    '''

    output = [0]*5
    guess = guess.upper()
    answer = answer.upper()
    answer_counter = Counter(answer)

    #check for greens
    for i in range(5):
        if guess[i] == answer[i]: #green -> 2
            output[i] = 2
            answer_counter[guess[i]] -= 1

    for i in range(5): # yellow -> 1
        if output[i] == 0 and guess[i] in answer_counter and answer_counter[guess[i]] > 0:
            output[i] = 1
            answer_counter[guess[i]] -= 1

    return("".join(str(x) for x in output))

def generate_feedback_dict(guesses: list[str]) -> dict:
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
                feedback_dict[guess][pattern] = []
            if answer not in feedback_dict[guess][pattern]:
                feedback_dict[guess][pattern].append(answer)
    return feedback_dict

class GuessListRequest(BaseModel):
    guesses: list[str]

@app.post("/feedback_dict")
def get_feedback_dict(request: GuessListRequest) -> dict:
    result = generate_feedback_dict(request.guesses)
    return result

# ---------------------------
# Reduce guess list function
# ---------------------------
def reduce_guess_list(guesses: list[str], feedback: list[str], current_possible_answers: list[str], feedback_dict: Dict[str, Dict[str, List[str]]]):
    '''Reduces the list of possible answers based on the most recent feedback. Returns a new list of 
       possible answers that is a subset of current_possible_answers
        
        Args:
         guesses (list): A list of string guesses, which could be empty
         feedback (list): A list of feedback strings, which could be empty
         current_possible_answers (list): a list of possible words that could be the secret word, 
            not yet updated based on most recent feedback. Cannot be empty.

        Returns:
         possible_answers (list): a list of remaining possible words that could be the secret word
    '''
    if (guesses[0] == ""):  # current guess is the first guess -> valid guesses is the list of all valid guesses
        return current_possible_answers
    
    possible_answers = set()
    current_possible_answers = set(current_possible_answers)
    last_guess = guesses[len(feedback) - 1]
    last_feedback = feedback[len(feedback) - 1]

    words = feedback_dict[last_guess][last_feedback]
    possible_answers = current_possible_answers.intersection(words)

    return list(possible_answers)

class RemainingGuessesListRequest(BaseModel):
    guesses: list[str]
    feedback: list[str]
    current_possible_answers: list[str]
    feedback_dict: Dict[str, Dict[str, List[str]]]

@app.post("/get_remaining_guesses")
def get_remaining_guesses(request: RemainingGuessesListRequest) -> list[str]:
    result = reduce_guess_list(request.guesses, request.feedback, request.current_possible_answers, request.feedback_dict)
    return result

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
        for pattern in all_patterns: # 243 patterms
            if pattern in feedback_dict[guess]:
                answers = set(feedback_dict[guess][pattern]).intersection(possible_answers)
            else: 
                answers = set()
            counts.append(len(answers))
        total = sum(counts)
        if total > 0: 
            counts = [c / total for c in counts if c > 0]
            entropies[guess] = entropy(counts, base = 2)
        else: 
            entropies[guess] = 0.0

    return entropies

class GetEntropies(BaseModel):
    possible_guesses: list[str]
    possible_answers: list[str]
    feedback_dict: Dict[str, Dict[str, List[str]]]
    all_patterns: list[str]

@app.post("/get_entropies")
def get_entropies(request: GetEntropies) -> dict: 
    result = calculate_entropies(request.possible_guesses, request.possible_answers, request.feedback_dict, request.all_patterns)
    return result