# Wordle
Wordle is a web-based word game developed by Josh Wardle. Players have six attempts to guess a five-letter word, with feedback given for each guess in the form of colored tiles indicating when letters match or occupy the correct position. (Wikipedia)

Seperately, I've implemented an entropy-based AI bot with a 100% win rate inspired by 3Blue1Brown's video on information theory: [https://www.3blue1brown.com/lessons/wordle]

The web-based version of this game is hosted at [https://chen-k-06.github.io/Wordle/]. The game is also playable in the terminal using Wordle.py-- this is why there are duplicates of a lot of code in JS/Python or even in the API. 
Code to test the bot's accuracy can be found in wordle_tester.py. wordle_bot_results contains a graph of the distribution of number of guesses required for every possible goal word in Wordle. 

API is hosted at [https://wordle-5rl4.onrender.com].
