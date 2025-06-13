#!/usr/bin/env python3
import random, math
from collections import Counter
from colorama import Fore, Back, Style, init
init(autoreset=True) #Ends color formatting after each print statement
from wordle_secret_words import get_secret_words
from scipy.stats import entropy
import itertools

#selects a secret word at random from the official Wordle list
def get_secret_word():
    secret_words = list(get_secret_words())
    secret_word = random.choice(secret_words).strip()
    return secret_word

def get_all_patterns():
    elements = ["0", "1", "2"]
    length = 5

    patterns = list(itertools.product(elements, repeat=length))
    joined_patterns = [''.join(x) for x in patterns]
    return joined_patterns

def get_bits_remaining(word_list: list[str]):
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

def get_pattern(guess, answer):
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
                "01020"
            
        >>> get_feedback("LEVER", "LOWER")
                "20022"
            
        >>> get_feedback("MOMMY", "MADAM")
                "20100"
            
        >>> get_feedback("ARGUE", "MOTTO")
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

def get_remaining_guesses(guesses: list[str], feedback: list[str], current_possible_answers: list[str], feedback_dict):
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

def calculate_entropies(possible_guesses: list[str], possible_answers: list[str], feedback_dict, all_patterns: list[str]):
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

    for guess in possible_guesses: # ~2,500 words
        counts = []
        for pattern in all_patterns: # 243 patterms
            if pattern in feedback_dict[guess]:
                answers = feedback_dict[guess][pattern]
                answers = answers.intersection(possible_answers)
            else: 
                answers = []
            counts.append(len(answers))
        total = sum(counts)
        counts = [c / total for c in counts if c > 0]
        entropies[guess] = entropy(counts, base = 2)
        if len(possible_answers) <= 2:
            return {answer: 100 for answer in possible_answers}
    return entropies
