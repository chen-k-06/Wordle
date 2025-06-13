# api code 
from typing import Union
from fastapi import FastAPI
from pydantic import BaseModel
import random, math
from collections import Counter
from colorama import Fore, Back, Style, init
from wordle_secret_words import get_secret_words
from scipy.stats import entropy
import itertools

app = FastAPI()

# calculate bits remaining 
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

@app.get("/bits_remaining")
def get_bits_remaining(word_list): # API route handler 
    result = calculate_bits_remaining(word_list)
    return {"bits_remaining": result}

# get feedback dictionary 
def get_pattern(guess: str, answer: str) -> str:
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
                feedback_dict[guess][pattern] = set()
            feedback_dict[guess][pattern].add(answer)
    return feedback_dict

