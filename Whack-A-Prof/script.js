const mainMenu = document.getElementById('main-menu');
const game = document.getElementById('game');
const gameplay = document.getElementById('gameplay');
const tutorial = document.getElementById('tutorial');
const highScores = document.getElementById('high-scores');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const endGameCard = document.getElementById('end-game-card');
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

// Function to hide all screens
function hideAllScreens() {
  mainMenu.classList.add('hidden');
  tutorial.classList.add('hidden');
  highScores.classList.add('hidden');
  gameplay.classList.add('hidden');
}

// Function to show the main menu
function showMainMenu() {
  hideAllScreens();
  mainMenu.classList.remove('hidden');
}

// Set up button listeners
document.getElementById('play-button').addEventListener('click', () => {
  hideAllScreens();
  gameplay.classList.remove('hidden');
});

document.getElementById('tutorial-button').addEventListener('click', () => {
  hideAllScreens();
  tutorial.classList.remove('hidden');
});

document.getElementById('leaderboard-button').addEventListener('click', () => {
  hideAllScreens();
  highScores.classList.remove('hidden');
});

// Back buttons return to main menu
document.querySelectorAll('.back-button').forEach(button => {
  button.addEventListener('click', showMainMenu);
});

// Start by showing only main menu
showMainMenu();


function scaleBoard() {
  timerDisplay.textContent = "Time Left: " + availableTime;
  const maxSide = Math.min(
    window.innerWidth * 0.75,
    window.innerHeight * 0.6667
  );
  const hole = maxSide / Math.max(height + 2*0.25, width + 2*0.25);
  const gap = hole * 0.15;

  document.documentElement.style.setProperty('--hole', hole + 'px');
  document.documentElement.style.setProperty('--gap', gap + 'px');
}

window.addEventListener('load'   , () => { createHoles(height, width); scaleBoard(); });
window.addEventListener('resize' , scaleBoard);

function createHoles(rows, cols) {
  game.innerHTML = '';
  const totalHoles = rows * cols;
  game.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  game.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  
  for (let i = 0; i < totalHoles; i++) {
    const hole = document.createElement('div');
    hole.classList.add('hole');
    hole.dataset.index = i;
    hole.addEventListener('click', whack);
    game.appendChild(hole);
  }
}

function spawnCharacter() {
  if (gamePaused || !gameRunning) return;
  
  const holes = document.querySelectorAll('.hole');
  const availableHoles = [...holes].filter((hole, index) => !activeCharacters.has(index));
  
  // Only spawn if there are available holes
  if (availableHoles.length > 0) {
    const randomHoleIndex = Math.floor(Math.random() * availableHoles.length);
    const selectedHole = availableHoles[randomHoleIndex];
    const holeIndex = parseInt(selectedHole.dataset.index);
    
    // Add mole to the selected hole
    selectedHole.classList.add('mole');
    activeCharacters.add(holeIndex);
    
    // Remove mole after characterDuration milliseconds
    setTimeout(() => {
      if (!gamePaused) {
        selectedHole.classList.remove('mole');
        activeCharacters.delete(holeIndex);
      }
    }, characterDuration);
  }

  // Schedule next character spawn
  const nextInterval = Math.floor(Math.random() * 1001) + 500;
  nextCharacterTimeout = setTimeout(spawnCharacter, nextInterval);
}

function whack(event) {
  const index = parseInt(event.target.dataset.index);
  if (activeCharacters.has(index)) {
    score += 10;
    scoreDisplay.textContent = "Score: " + score;
    activeCharacters.delete(index);
    event.target.classList.remove('mole');
  }
  else {
    score -= 5;
    if (score < 0) 
      score = 0; // Prevent negative score
    scoreDisplay.textContent = "Score: " + score;
  }
  // Prevent whacking if game is paused or not running
  if (gamePaused || !gameRunning) {
    return;
  }
}

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
  const holes = document.querySelectorAll('.hole');
  holes.forEach(hole => hole.classList.remove('mole'));
  activeCharacters.clear();
  
  endGameCard.style.display = 'none';
}


function startGame() {
  const startButton = document.querySelector('.start-game-button');

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

function endGame() {
  clearTimeout(nextCharacterTimeout);
  clearInterval(countdownTimer);
  nextCharacterTimeout = null;
  countdownTimer = null;
  gameRunning = false;

  const pauseButton = document.querySelector('.start-game-button');
  pauseButton.textContent = "Start Game";

  endGameCard.innerHTML = `<div class="card-content">
    <h2>Game Over!</h2>
    <p>Your final score: ${score}</p>
    <button onclick="closeEndGameCard()">Close</button>
  </div>`;
  endGameCard.style.display = 'flex';
}

function closeEndGameCard() {
  endGameCard.style.display = 'none';
  resetGame();
}

function togglePause() {
  const pauseButton = document.querySelector('.pause-button');

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
    timerDisplay.textContent = timerDisplay.textContent.replace(" (Paused)", "");
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

document.querySelector('.pause-button').addEventListener('click', togglePause);
