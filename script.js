const game = document.getElementById('game');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const availableTime = 30;
const moleInterval = 800; // Time in milliseconds for mole to appear
const holeCount = 9;
let score = 0;
let moleIndex = null;
let moleTimer = null;
let countdownTimer = null;
let timeLeft = availableTime

function scaleBoard() {
  const maxSide = Math.min(
    window.innerWidth * 0.75,
    window.innerHeight * 0.6667
  );
  const hole = maxSide / (3+2*0.15);
  const gap = hole * 0.15;

  document.documentElement.style.setProperty('--hole', hole + 'px');
  document.documentElement.style.setProperty('--gap' , gap  + 'px');
}

window.addEventListener('load'   , () => { createHoles(); scaleBoard(); });
window.addEventListener('resize' , scaleBoard);

function createHoles() {
  game.innerHTML = ''; // Clear any existing holes
  for (let i = 0; i < holeCount; i++) {
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
}

function startGame() {
  resetGame(); // Sets all game related variables to their initial state
  randomMole(); // Show the first mole immediately

  // Start the mole moving every moleInterval
  moleTimer = setInterval(randomMole, moleInterval);

  // Start the timer countdown every second
  countdownTimer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = "Time Left: " + timeLeft;

    if (timeLeft <= 0) {
      clearInterval(moleTimer);
      clearInterval(countdownTimer);
      timerDisplay.textContent = "Time Left: 0";
      alert('Game Over! Your final score is: ' + score);
    }
  }, 1000);
}
