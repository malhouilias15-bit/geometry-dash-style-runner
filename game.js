const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// UI
const scoreEl = document.getElementById("score");
const moneyEl = document.getElementById("money");
const shopBtn = document.getElementById("shopBtn");
const shop = document.getElementById("shop");
const skip10Btn = document.getElementById("skip10");

shopBtn.onclick = () => {
  shop.classList.toggle("hidden");
};

// GAME STATE
let score = 0;
let money = 0;
let lastPaidScore = 0;
let speed = 5;
let gameOver = false;

const groundHeight = 80;

// SNAKE
const snake = {
  x: 120,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false
};

// OBJECTS
let walls = [];

// INPUT
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = -14;
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  jump();
}, { passive: false });

// SHOP ITEM
skip10Btn.onclick = () => {
  if (money >= 20 && score < 10) {
    money -= 20;
    score = 10;
    lastPaidScore = 10;
    speed = 5 + Math.floor(score / 10);
    updateUI();
  }
};

// SPAWN WALL
function spawnWall() {
  walls.push({
    x: canvas.width,
    y: canvas.height - groundHeight - 60,
    w: 26,
    h: 60,
    scored: false
  });
}

// UPDATE UI
function updateUI() {
  scoreEl.textContent = "Score: " + score;
  moneyEl.textContent = "💰 $" + money;
}

// LOOP
let timer = 0;

function update() {
  if (gameOver) return;

  snake.vy += 0.8;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  }

  walls.forEach(w => w.x -= speed);

  walls.forEach(w => {
    if (
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > w.y
    ) gameOver = true;

    if (!w.scored && w.x + w.w < snake.x) {
      w.scored = true;
      score++;
      speed = 5 + Math.floor(score / 10);

      // MONEY EVERY 10 SCORE
      if (score % 10 === 0 && score > lastPaidScore) {
        money += 20;
        lastPaidScore = score;
      }

      updateUI();
    }
  });

  walls = walls.filter(w => w.x > -50);

  timer++;
  if (timer > 90) {
    spawnWall();
    timer = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // walls
  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // snake
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

snake.y = canvas.height - groundHeight - snake.r;
updateUI();
loop();
