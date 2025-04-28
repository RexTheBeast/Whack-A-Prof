const mainMenu = document.getElementById('main-menu');
const game = document.getElementById('game');
const gameplay = document.getElementById('gameplay');
const tutorial = document.getElementById('tutorial');
const highScores = document.getElementById('high-scores');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const endGameCard = document.getElementById('end-game-card');
const availableTime = 30;
const moleInterval = 800; // Time in milliseconds for mole to appear
const height = 4; 
const width = 4;
let score = 0;
let moleIndex = null;
let moleTimer = null;
let countdownTimer = null;
let timeLeft = availableTime;

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

function randomMole() {
  const holes = document.querySelectorAll('.hole');
  holes.forEach(hole => hole.classList.remove('mole'));

  const randomIndex = Math.floor(Math.random() * holes.length);
  holes[randomIndex].classList.add('mole');
  moleIndex = randomIndex;
}

function whack(event) {
  if (parseInt(event.target.dataset.index) === moleIndex) {
    score+=10;
    scoreDisplay.textContent = "Score: " + score;
    moleIndex = null;
    event.target.classList.remove('mole');
  }
}

function resetGame() {
  score = 0;
  timeLeft = availableTime;
  scoreDisplay.textContent = "Score: 0";
  timerDisplay.textContent = "Time Left: " + timeLeft;

  clearInterval(moleTimer);
  clearInterval(countdownTimer);
  moleTimer = null;
  countdownTimer = null;

  endGameCard.style.display = 'none';
}


function startGame() {
  const startButton = document.querySelector('.start-game-button');

  if (countdownTimer !== null) {
    // Game is running, so manually end it
    endGame();
    return;
  }

  resetGame();
  randomMole();

  moleTimer = setInterval(randomMole, moleInterval);
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
  clearInterval(moleTimer);
  clearInterval(countdownTimer);
  moleTimer = null;
  countdownTimer = null;

  const pauseButton = document.querySelector('.pause-button');
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

  if (countdownTimer !== null) {
    // Pause the game
    clearInterval(moleTimer);
    clearInterval(countdownTimer);
    moleTimer = null;
    countdownTimer = null;
    pauseButton.textContent = "Unpause";
    timerDisplay.textContent += " (Paused)";
  } else {
    // Unpause the game
    randomMole();
    moleTimer = setInterval(randomMole, moleInterval);
    countdownTimer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = "Time Left: " + timeLeft;

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
    pauseButton.textContent = "Pause";
    timerDisplay.textContent = timerDisplay.textContent.replace(" (Paused)", "");
  }
}

document.querySelector('.pause-button').addEventListener('click', togglePause);
