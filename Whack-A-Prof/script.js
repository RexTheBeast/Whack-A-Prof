// --- Configuration ---
const config = {
  availableTime: 30, // seconds
  height: 4,
  width: 4,
  characterDuration: 2000, // ms
  spawnIntervalMin: 500, // ms
  spawnIntervalMax: 1500, // ms
  HIGH_SCORES_KEY: 'whackAProfHighScores',
  MAX_HIGH_SCORES: 10 // Limit leaderboard to top 10
};

// -- Local Storage for Scores
function getHighScores() {
    const scoresJSON = localStorage.getItem(config.HIGH_SCORES_KEY);
    try {
        const scores = JSON.parse(scoresJSON);
        // Ensure it's an array, return empty array if not or null
        return Array.isArray(scores) ? scores : [];
    } catch (e) {
        // If parsing fails, return empty array
        console.error("Error parsing high scores from localStorage:", e);
        return [];
    }
}

function saveHighScore(newScore) {
    if (typeof newScore !== 'number' || isNaN(newScore) || newScore <= 0) {
        // Don't save zero or invalid scores
        return;
    }

    const scores = getHighScores();
    scores.push(newScore);
    scores.sort((a, b) => b - a); // Sort descending (highest first)
    const updatedScores = scores.slice(0, config.MAX_HIGH_SCORES); // Keep only top N scores

    try {
        localStorage.setItem(config.HIGH_SCORES_KEY, JSON.stringify(updatedScores));
        console.log("High scores saved:", updatedScores);
    } catch (e) {
        console.error("Error saving high scores to localStorage:", e);
    }
}
// --- UI Module ---
const UI = {
  // DOM Elements
  elements: {
      mainMenu: document.getElementById('main-menu'),
      gameplay: document.getElementById('gameplay'),
      tutorial: document.getElementById('tutorial'),
      highScores: document.getElementById('high-scores'),
      highScoresList: document.getElementById('score-list'),
      gameBoard: document.getElementById('game'),
      scoreDisplay: document.getElementById('score'),
      timerDisplay: document.getElementById('timer'),
      endGameCard: document.getElementById('end-game-card'),
      endGameScore: null, // Will be created dynamically or assign if exists
      holes: [], // Will be populated
      playButton: document.getElementById('play-button'),
      tutorialButton: document.getElementById('tutorial-button'),
      leaderboardButton: document.getElementById('leaderboard-button'),
      backButtons: document.querySelectorAll('.back-button'),
      startGameButton: document.querySelector('.start-game-button'), // Assuming one start button in gameplay
      pauseButton: document.querySelector('.pause-button'), // Assuming one pause button
      closeEndCardButton: null, // Will find/create later
  },

  init(gameInstance) {
      this.game = gameInstance; // Reference to the game logic instance
      this.setupEventListeners();
      this.scaleBoard();
      window.addEventListener('resize', this.scaleBoard.bind(this)); // Ensure 'this' is UI
      this.showScreen('mainMenu');
      this.createHoles(config.height, config.width);
      this.updateTimerDisplay(config.availableTime, false); // Initial display
      this.updateScoreDisplay(0); // Initial display
  },

  /**
 * ─────────────────────────────────────────────────────────────────────────────
 * NAVIGATION BUTTON LISTENERS
 * Wire up your menu / tutorial / leaderboard buttons.
 * ─────────────────────────────────────────────────────────────────────────────
 */
  setupEventListeners() {
      this.elements.playButton.addEventListener('click', () => this.showScreen('gameplay'));
      this.elements.tutorialButton.addEventListener('click', () => this.showScreen('tutorial'));
      this.elements.leaderboardButton.addEventListener('click', () => this.showScreen('highScores'));

    /**
     * Return-to-main-menu buttons.
     * Each .back-button closes the current overlay and shows the main menu.
     */
      this.elements.backButtons.forEach(button => {
          button.addEventListener('click', () => this.showScreen('mainMenu'));
      });

      this.elements.startGameButton.addEventListener('click', () => {
          // Toggle between Start and Stop
          if (this.game.isRunning() || this.game.isPaused()) {
               this.game.stop(); // Use stop for manual ending
          } else {
               this.game.start();
          }
      });

      this.elements.pauseButton.addEventListener('click', () => {
           this.game.togglePause();
      });

      /**
        * Handle a click on a hole: award or deduct points, update score display.
        * @param {MouseEvent} event
        * @sideEffect Updates `score`, `scoreDisplay.textContent`, and
        *             may remove `.mole` from the clicked hole.
         */
      this.elements.gameBoard.addEventListener('click', (event) => {
        if (!this.game.isRunning() || this.game.isPaused()) return; // if the game isn't running/is paused, do nothing
          
          const clickedElement = event.target; // stores whatever is clicked
          let hitMole = false;

          if (clickedElement.classList.contains('mole') && clickedElement.classList.contains('hole')) { // if what is clicked contains both a mole and a hole, register a whack
              const index = parseInt(clickedElement.dataset.index,10);
              if (!isNaN(index)) {
                  this.game.handleWhack(index);
                  hitMole = true;
              } }
                
              if (!hitMole){ // otherwise, register a miss or timeout and apply penalty
              this.game.handleMiss();
              }
          
      });
  },
  /**
  * Hide all primary UI overlays: main menu, tutorial, leaderboard, gameplay.
  * @sideEffect Toggles the `.hidden` class on each overlay element.
  */

  hideAllScreens() {
      this.elements.mainMenu.classList.add('hidden');
      this.elements.tutorial.classList.add('hidden');
      this.elements.highScores.classList.add('hidden');
      this.elements.gameplay.classList.add('hidden');
  },
     /**
            * Show the main menu overlay and hide all others.
            * @sideEffect Calls hideAllScreens(), then removes `.hidden` from respective screen.
             */
  showScreen(screenName) {
      this.hideAllScreens();
      switch (screenName) {
          case 'mainMenu':
          
              this.elements.mainMenu.classList.remove('hidden');
              break;
          case 'gameplay':
              this.elements.gameplay.classList.remove('hidden');
              // Reset button states when showing gameplay screen initially
              if (!this.game || (!this.game.isRunning() && !this.game.isPaused())) {
                   this.setButtonState('start', 'Start Game');
                   this.setButtonState('pause', 'Pause'); // Default state
                   this.elements.pauseButton.disabled = true; // Can't pause if not running
              }
              break;
          case 'tutorial':
              this.elements.tutorial.classList.remove('hidden');
              break;
          case 'highScores':
              this.displayHighScores();
              this.elements.highScores.classList.remove('hidden');
              break;
      }
  },
  /**
 * Recalculate grid hole size and gap based on viewport dimensions,
 * then update CSS variables `--hole` and `--gap`. Also resets timer display.
 * @sideEffect Updates `timerDisplay.textContent` and CSS vars on `<html>`.
 */

  scaleBoard() {
      const maxSide = Math.min(
          window.innerWidth * 0.75,
          window.innerHeight * 0.6667
      );
      const holeSize = maxSide / Math.max(config.height + 2 * 0.25, config.width + 2 * 0.25);
      const gapSize = holeSize * 0.15;

      document.documentElement.style.setProperty('--hole', `${holeSize}px`);
      document.documentElement.style.setProperty('--gap', `${gapSize}px`);
  },

  /**
 * Build a `rows × cols` grid of clickable hole `<div>`s inside `game`.
 * @param {number} rows  Number of grid rows.
 * @param {number} cols  Number of grid columns.
 * @sideEffect Clears `game.innerHTML`, sets grid template, and appends holes.
 */
  createHoles(rows, cols) {
      this.elements.gameBoard.innerHTML = ''; // Clear existing
      this.elements.holes = []; // Clear cache
      const totalHoles = rows * cols;
      this.elements.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      this.elements.gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

      for (let i = 0; i < totalHoles; i++) {
          const hole = document.createElement('div');
          hole.classList.add('hole');
          hole.dataset.index = i;
          // Note: Click listener is now handled by delegation on gameBoard
          this.elements.gameBoard.appendChild(hole);
          this.elements.holes.push(hole); // Cache reference
      }
  },

  showMole(index) {
      if (this.elements.holes[index]) {
          this.elements.holes[index].classList.add('mole');
      }
  },

  hideMole(index) {
      if (this.elements.holes[index]) {
          this.elements.holes[index].classList.remove('mole');
      }
  },

  clearAllMoles() {
       this.elements.holes.forEach(hole => hole.classList.remove('mole'));
  },

  updateScoreDisplay(score) {
      this.elements.scoreDisplay.textContent = `Score: ${score}`;
  },

  updateTimerDisplay(timeLeft, isPaused) {
      this.elements.timerDisplay.textContent = `Time Left: ${timeLeft}${isPaused ? ' (Paused)' : ''}`;
  },

  displayEndGame(finalScore) {
      // Ensure the card content exists or create it
      let content = this.elements.endGameCard.querySelector('.card-content');
      if (!content) {
          this.elements.endGameCard.innerHTML = `<div class="card-content">
              <h2>Game Over!</h2>
              <p>Your final score: <span class="final-score"></span></p>
              <button class="close-end-card-button">Close</button>
          </div>`;
          content = this.elements.endGameCard.querySelector('.card-content');
          this.elements.endGameScore = content.querySelector('.final-score');
          this.elements.closeEndCardButton = content.querySelector('.close-end-card-button');
           // Add listener only once
           this.elements.closeEndCardButton.addEventListener('click', () => {
               this.hideEndGame();
               this.game.reset(); // Let game handle reset logic
           });
      }

      this.elements.endGameScore.textContent = finalScore;
      this.elements.endGameCard.style.display = 'flex';
  },

  hideEndGame() {
      this.elements.endGameCard.style.display = 'none';
  },

  setButtonState(buttonName, text, disabled = false) {
      let buttonElement;
      switch (buttonName) {
           case 'start':
                buttonElement = this.elements.startGameButton;
                break;
           case 'pause':
                buttonElement = this.elements.pauseButton;
                break;
           // Add other buttons if needed
      }
      if (buttonElement) {
           buttonElement.textContent = text;
           buttonElement.disabled = disabled;
      }
  },
  displayHighScores() {
    const scores = getHighScores(); // Uses the helper function
    // Make sure we're using the correct reference here
    const listElement = this.elements.highScoresList;

    // Check if the list element was found correctly
    if (!listElement) {
        console.error("Score list element (#score-list) not found in UI.elements!");
        // Optionally try to find it again, though it should be in elements
        // listElement = document.getElementById('score-list');
        // if (!listElement) return; // Still not found, exit
        return;
    }

    // This line ONLY clears the content of the <ol> element
    listElement.innerHTML = '';

    if (scores.length === 0) {
        listElement.innerHTML = '<li>No high scores yet!</li>';
    } else {
        scores.forEach((score, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${score}`; // Score
            listElement.appendChild(listItem);
        });
    }
},


};

// --- Game Class ---
class Game {
  constructor(ui, config) {
      this.ui = ui;
      this.config = config;
      this.reset(); // Initialize state
  }

  // --- State ---
  score = 0;
  timeLeft = 0;
  activeMoles = new Set(); // Track active mole indices
  gameRunning = false;
  gamePaused = false;
  countdownIntervalId = null;
  spawnTimeoutId = null;

  // --- Core Logic Methods ---
  /**
    * Start or stop a game round. On first call, resets state, begins spawn loop and countdown.
    * On second call (while `gameRunning`), ends the round immediately.
    * @sideEffect Toggles `gameRunning`, updates buttons, and manages timers.
    */
  start() {
      if (this.gameRunning) return; // Prevent multiple starts

      this.reset(); // Ensure clean state before starting
      this.gameRunning = true;
      this.gamePaused = false; // Explicitly set paused to false
      this.timeLeft = this.config.availableTime;

      this.ui.updateScoreDisplay(this.score);
      this.ui.updateTimerDisplay(this.timeLeft, this.gamePaused);
      this.ui.hideEndGame();
      this.ui.setButtonState('start', 'Stop Game');
      this.ui.setButtonState('pause', 'Pause', false); // Enable pause

      this._scheduleNextSpawn();
      this._startTimer();
  }

  /**
 * End the current game: clear timers, show the “Game Over” card, and display final score.
 * @sideEffect Clears `nextCharacterTimeout`, `countdownTimer`, toggles UI elements.
 */
  stop() { // Renamed from endGame for clarity (can be triggered by user or timer)
      if (!this.gameRunning && !this.gamePaused) return; // Do nothing if already stopped

      this.gameRunning = false;
      this.gamePaused = false; // Ensure not paused when stopped

      this._clearTimers();
      this.ui.clearAllMoles(); // Clear visuals
      this.activeMoles.clear(); // Clear internal tracking

      

      // Only show end game card if it wasn't a pause->stop scenario
      // Or maybe always show it when stopped? Let's show it.
      this.ui.displayEndGame(this.score);
      saveHighScore(this.score);

      // Reset button states for next game potential
      this.ui.setButtonState('start', 'Start Game');
      this.ui.setButtonState('pause', 'Pause', true); // Disable pause
  }
  /**
 * Reset all game state to initial values, clear timers, and hide game over card.
 * @sideEffect Clears timeouts/intervals, resets flags, removes moles, hides overlay.
 */
  reset() {
      this.score = 0;
      this.timeLeft = this.config.availableTime;
      this.activeMoles.clear();
      this.gameRunning = false;
      this.gamePaused = false;

      this._clearTimers();
      this.ui.clearAllMoles();
      this.ui.hideEndGame();

      // Update UI to reflect reset state
      this.ui.updateScoreDisplay(this.score);
      this.ui.updateTimerDisplay(this.timeLeft, this.gamePaused);
      this.ui.setButtonState('start', 'Start Game');
      this.ui.setButtonState('pause', 'Pause', true); // Disable pause
  }

  togglePause() {
      if (!this.gameRunning) return; // Can't pause if not running

      this.gamePaused = !this.gamePaused;

      if (this.gamePaused) {
          this._clearTimers(); // Stop game clock and spawning
          this.ui.setButtonState('pause', 'Unpause');
      } else {
          this._startTimer(); // Resume game clock
          this._scheduleNextSpawn(); // Resume spawning
          this.ui.setButtonState('pause', 'Pause');
      }
      // Update timer display regardless
      this.ui.updateTimerDisplay(this.timeLeft, this.gamePaused);
  }
/**
 * Handle a successful click on a mole: award points, update score display.
 * @param {MouseEvent} event
 * @sideEffect Updates `score`, `scoreDisplay.textContent`, and
 *             may remove `.mole` from the clicked hole.
 */
  handleWhack(index) {
          this.score += 10;
          this.activeMoles.delete(index);
          this.ui.hideMole(index); // Let UI handle visuals
          this.ui.updateScoreDisplay(this.score);
          // Add sound effect call here: this.ui.playSound('whack');

  }
    /**
        * Handle an unsuccessful click on a hole or the game board: deduct points, update score display.
        * @param {MouseEvent} event
        * @sideEffect Updates `score`, `scoreDisplay.textContent` 
         */
  handleMiss(){
    this.score -= 5; // Penalty for missed whack
    if (this.score < 0) this.score = 0; // minimum score is zero
    this.ui.updateScoreDisplay(this.score);
    // Add sound effect call here: this.ui.playSound('miss');
    // this.ui.missedMole(index); // Visual feedback for missed whack
  }
 

  // --- Internal Helper Methods ---
  _tick() { // Called by the interval timer
      if (this.gamePaused) return; // Double check just in case

      this.timeLeft--;
      this.ui.updateTimerDisplay(this.timeLeft, this.gamePaused);

      if (this.timeLeft <= 0) {
          this.stop(); // Game over due to time
      }
  }
  /**
 * Spawn a mole in a random empty hole, keep it visible for `characterDuration`,
 * then remove it. Recursively schedules the next spawn at a random interval.
 * @sideEffect Mutates `activeCharacters`, adds/removes `.mole` classes, and
 *             sets `nextCharacterTimeout`.
 */
  _spawnMole() {
      // Find available holes (indices not in activeMoles)
      const totalHoles = this.config.height * this.config.width;
      const availableHoleIndices = [];
      for (let i = 0; i < totalHoles; i++) {
          if (!this.activeMoles.has(i)) {
              availableHoleIndices.push(i);
          }
      }

      if (availableHoleIndices.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableHoleIndices.length);
          const holeIndex = availableHoleIndices[randomIndex];

          this.activeMoles.add(holeIndex);
          this.ui.showMole(holeIndex);

          // Schedule removal AND PENALTY
          setTimeout(() => {
              // Only remove if it's still supposed to be active (wasn't whacked)
              // And if game hasn't been stopped/paused in the meantime
               if (this.gameRunning && !this.gamePaused && this.activeMoles.has(holeIndex)) {

                    // Penalty for not whacking
                    this.handleMiss();
                    // Visual feedback call here: this.ui.showExpiryFeedback(holeIndex);
                    // Add sound effect call here: this.ui.playSound('expire');
                    this.activeMoles.delete(holeIndex);
                    this.ui.hideMole(holeIndex);
               }
          }, this.config.characterDuration);
      }
  }

  _scheduleNextSpawn() {
      if (!this.gameRunning || this.gamePaused) return; // Don't schedule if not running or paused

      // Clear any existing spawn timeout to prevent duplicates if called rapidly
      if (this.spawnTimeoutId) {
           clearTimeout(this.spawnTimeoutId);
      }

      const nextInterval = Math.random() * (this.config.spawnIntervalMax - this.config.spawnIntervalMin) + this.config.spawnIntervalMin;
      this.spawnTimeoutId = setTimeout(() => {
          this._spawnMole();
          this._scheduleNextSpawn(); // Schedule the *next* one after this one runs
      }, nextInterval);
  }

  _startTimer() {
      // Prevent multiple timers
      if (this.countdownIntervalId) {
           clearInterval(this.countdownIntervalId);
      }
      this.countdownIntervalId = setInterval(() => this._tick(), 1000);
  }

  _clearTimers() {
      clearInterval(this.countdownIntervalId);
      clearTimeout(this.spawnTimeoutId);
      this.countdownIntervalId = null;
      this.spawnTimeoutId = null;
  }

  isRunning() {
       return this.gameRunning;
  }

  isPaused() {
      return this.gamePaused;
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const whackAMoleGame = new Game(UI, config);
  UI.init(whackAMoleGame); // Pass the game instance to UI and initialize UI
});