const mainMenu = document.getElementById("main-menu");
const game = document.getElementById("game");
const gameplay = document.getElementById("gameplay");
const tutorial = document.getElementById("tutorial");
const highScores = document.getElementById("high-scores");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const endGameCard = document.getElementById("end-game-card");

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NAVIGATION BUTTON LISTENERS
 * menu / tutorial / leaderboard buttons.
 * ─────────────────────────────────────────────────────────────────────────────
 */
document.getElementById("play-button").addEventListener("click", () => {
  hideAllScreens();
  gameplay.classList.remove("hidden");
});

document.getElementById("tutorial-button").addEventListener("click", () => {
  hideAllScreens();
  tutorial.classList.remove("hidden");
});

document.getElementById("leaderboard-button").addEventListener("click", () => {
  hideAllScreens();
  highScores.classList.remove("hidden");
});

/**
 * Return-to-main-menu buttons.
 * Each .back-button closes the current overlay and shows the main menu.
 */
document.querySelectorAll(".back-button").forEach((button) => {
  button.addEventListener("click", showMainMenu);
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GAME STATE VARIABLES
 * Configuration constants and runtime flags used throughout the game logic.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const availableTime = 30;
const height = 4;
const width = 4;
const characterDuration = 2000; // How long each character stays visible (ms)
let score = 0;
let activeCharacters = new Set(); // Track active characters by their hole index
let gameRunning = false;
let countdownTimer = null;
let timeLeft = availableTime;
let gamePaused = false;
let nextCharacterTimeout = null;

/**
 * Hide all primary UI overlays: main menu, tutorial, leaderboard, gameplay.
 * @sideEffect Toggles the `.hidden` class on each overlay element.
 */
function hideAllScreens() {
  mainMenu.classList.add("hidden");
  tutorial.classList.add("hidden");
  highScores.classList.add("hidden");
  gameplay.classList.add("hidden");
}

/**
 * Show the main menu overlay and hide all others.
 * @sideEffect Calls hideAllScreens(), then removes `.hidden` from `mainMenu`.
 */
function showMainMenu() {
  hideAllScreens();
  mainMenu.classList.remove("hidden");
}

/**
 * Recalculate grid hole size and gap based on viewport dimensions,
 * then update CSS variables `--hole` and `--gap`. Also resets timer display.
 * @sideEffect Updates `timerDisplay.textContent` and CSS vars on `<html>`.
 */
function scaleBoard() {
  timerDisplay.textContent = "Time Left: " + availableTime;
  const maxSide = Math.min(
    window.innerWidth * 0.75,
    window.innerHeight * 0.6667
  );
  const hole = maxSide / Math.max(height + 2 * 0.25, width + 2 * 0.25);
  const gap = hole * 0.15;

  document.documentElement.style.setProperty("--hole", hole + "px");
  document.documentElement.style.setProperty("--gap", gap + "px");
}

/**
 * Build a `rows × cols` grid of clickable hole `<div>`s inside `game`.
 * @param {number} rows  Number of grid rows.
 * @param {number} cols  Number of grid columns.
 * @sideEffect Clears `game.innerHTML`, sets grid template, and appends holes.
 */
function createHoles(rows, cols) {
  game.innerHTML = "";
  const totalHoles = rows * cols;
  game.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  game.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  for (let i = 0; i < totalHoles; i++) {
    const hole = document.createElement("div");
    hole.classList.add("hole");
    hole.dataset.index = i;
    hole.addEventListener("click", whack);
    game.appendChild(hole);
  }
}

/**
 * Spawn a mole in a random empty hole, keep it visible for `characterDuration`,
 * then remove it. Recursively schedules the next spawn at a random interval.
 * @sideEffect Mutates `activeCharacters`, adds/removes `.mole` classes, and
 *             sets `nextCharacterTimeout`.
 */
function spawnCharacter() {
  if (gamePaused || !gameRunning) return;

  const holes = document.querySelectorAll(".hole");
  const availableHoles = [...holes].filter(
    (hole, index) => !activeCharacters.has(index)
  );

  // Only spawn if there are available holes
  if (availableHoles.length > 0) {
    const randomHoleIndex = Math.floor(Math.random() * availableHoles.length);
    const selectedHole = availableHoles[randomHoleIndex];
    const holeIndex = parseInt(selectedHole.dataset.index);

    // Add mole to the selected hole
    selectedHole.classList.add("mole");
    activeCharacters.add(holeIndex);

    // Remove mole after characterDuration milliseconds
    setTimeout(() => {
      if (!gamePaused) {
        selectedHole.classList.remove("mole");
        activeCharacters.delete(holeIndex);
      }
    }, characterDuration);
  }

  // Schedule next character spawn
  const nextInterval = Math.floor(Math.random() * 1001) + 500;
  nextCharacterTimeout = setTimeout(spawnCharacter, nextInterval);
}

/**
 * Handle a click on a hole: award or deduct points, update score display.
 * @param {MouseEvent} event
 * @sideEffect Updates `score`, `scoreDisplay.textContent`, and
 *             may remove `.mole` from the clicked hole.
 */
function whack(event) {
  const index = parseInt(event.target.dataset.index);
  if (activeCharacters.has(index)) {
    score += 10;
    scoreDisplay.textContent = "Score: " + score;
    activeCharacters.delete(index);
    event.target.classList.remove("mole");
  } else {
    score -= 5;
    if (score < 0) score = 0; // Prevent negative score
    scoreDisplay.textContent = "Score: " + score;
  }
  // Prevent whacking if game is paused or not running
  if (gamePaused || !gameRunning) {
    return;
  }
}

/**
 * Reset all game state to initial values, clear timers, and hide game over card.
 * @sideEffect Clears timeouts/intervals, resets flags, removes moles, hides overlay.
 */
function resetGame() {
  score = 0;
  timeLeft = availableTime;
  scoreDisplay.textContent = "Score: 0";
  timerDisplay.textContent = "Time Left: " + timeLeft;

  clearTimeout(nextCharacterTimeout);
  clearInterval(countdownTimer);
  nextCharacterTimeout = null;
  countdownTimer = null;
  gameRunning = false;
  gamePaused = false;

  // Clear any active characters
  const holes = document.querySelectorAll(".hole");
  holes.forEach((hole) => hole.classList.remove("mole"));
  activeCharacters.clear();

  endGameCard.style.display = "none";
}

/**
 * Start or stop a game round. On first call, resets state, begins spawn loop and countdown.
 * On second call (while `gameRunning`), ends the round immediately.
 * @sideEffect Toggles `gameRunning`, updates buttons, and manages timers.
 */
function startGame() {
  const startButton = document.querySelector(".start-game-button");
  const pauseButton = document.querySelector(".pause-button");
  pauseButton.style.display = "inline-block";
  if (gameRunning) {
    // Game is running, so manually end it
    endGame();
    return;
  }

  resetGame();
  gameRunning = true;

  // Start spawning characters
  spawnCharacter();

  countdownTimer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = "Time Left: " + timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  startButton.textContent = "Stop Game";
}

/**
 * End the current game: clear timers, show the “Game Over” card, and display final score.
 * @sideEffect Clears `nextCharacterTimeout`, `countdownTimer`, toggles UI elements.
 */
function endGame() {
  clearTimeout(nextCharacterTimeout);
  clearInterval(countdownTimer);
  nextCharacterTimeout = null;
  countdownTimer = null;
  gameRunning = false;
  const pauseButton = document.querySelector(".pause-button");
  pauseButton.style.display = "none";

  const startButton = document.querySelector(".start-game-button");
  startButton.textContent = "Start Game";

  endGameCard.innerHTML = `<div class="card-content">
    <h2>Game Over!</h2>
    <p>Your final score: ${score}</p>
    <button onclick="closeEndGameCard()">Close</button>
  </div>`;
  endGameCard.style.display = "flex";
}

/**
 * Hide the end-game overlay and reset the game state.
 * @sideEffect Calls resetGame() and hides the overlay.
 */
function closeEndGameCard() {
  endGameCard.style.display = "none";
  resetGame();
}

/**
 * Toggle pause state: stops or resumes spawning and countdown.
 * @sideEffect Clears or sets timers, updates `pauseButton` label and timer text.
 */
function togglePause() {
  const pauseButton = document.querySelector(".pause-button");

  if (gamePaused) {
    // Unpause the game
    gamePaused = false;
    spawnCharacter();
    countdownTimer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = "Time Left: " + timeLeft;

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
    pauseButton.textContent = "Pause";
    timerDisplay.textContent = timerDisplay.textContent.replace(
      " (Paused)",
      ""
    );
  } else {
    // Pause the game
    clearTimeout(nextCharacterTimeout);
    clearInterval(countdownTimer);
    nextCharacterTimeout = null;
    countdownTimer = null;
    gamePaused = true;
    pauseButton.textContent = "Unpause";
    timerDisplay.textContent += " (Paused)";
  }
}

window.addEventListener("load", () => {
  createHoles(height, width);
  scaleBoard();
});
window.addEventListener("resize", scaleBoard);

document.querySelector(".pause-button").addEventListener("click", togglePause);

showMainMenu();
