const game = document.getElementById('game');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const endGameCard = document.getElementById('end-game-card');
const availableTime = 30;
const moleInterval = 800; // Time in milliseconds for mole to appear
let score = 0;
let moleIndex = null;
let moleTimer = null;
let countdownTimer = null;
let timeLeft = availableTime

function scaleBoard() {
  timerDisplay.textContent = "Time Left: " + availableTime;
  const maxSide = Math.min(
    window.innerWidth * 0.75,
    window.innerHeight * 0.6667
  );
  const hole = maxSide / (3+2*0.15);
  const gap = hole * 0.15;

  document.documentElement.style.setProperty('--hole', hole + 'px');
  document.documentElement.style.setProperty('--gap' , gap  + 'px');
}

window.addEventListener('load'   , () => { createHoles(4,4); scaleBoard(); });
window.addEventListener('resize' , scaleBoard);

function createHoles(rows, cols) {
  game.innerHTML = '';
  const totalHoles = rows * cols;
  game.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
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
  const startButton = document.querySelector('button');

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

  const startButton = document.querySelector('button');
  startButton.textContent = "Start Game";

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
