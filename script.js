const game = document.getElementById('game');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
let score = 0;
let moleIndex = null;
let moleTimer = null;
let countdownTimer = null;
let timeLeft = 30;

function createHoles() {
  game.innerHTML = ''; // Clear any existing holes
  for (let i = 0; i < 9; i++) {
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

function startGame() {
  // Reset everything
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = "Score: 0";
  timerDisplay.textContent = "Time Left: 30";

  clearInterval(moleTimer);
  clearInterval(countdownTimer);

  randomMole(); // Show the first mole immediately

  // Start the mole moving every 800ms
  moleTimer = setInterval(randomMole, 800);

  // Start the timer countdown every 1000ms
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
