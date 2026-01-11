const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const music = document.getElementById("bgMusic");
const jumpBtn = document.getElementById("jumpBtn");

const GROUND_Y = 340;

// ---------- MUSIC ----------
let musicStarted = false;
function startMusic() {
  if (!musicStarted) {
    music.volume = 1.0;
    music.play().catch(() => {});
    musicStarted = true;
  }
}

// ---------- SNAKE ----------
const snake = {
  x: 120,
  y: GROUND_Y - 20,
  r: 12,
  vy: 0,
  gravity: 1,
  jump: -16
};

let onGround = true;
let gameOver = false;

// ---------- GAME SPEED ----------
let speed = 5;

// ---------- WALLS ----------
let walls = [];

function spawnWall() {
  walls.push({
    x: canvas.width,
    y: GROUND_Y - 60,
    w: 30,
    h: 60,
    passed: false
  });
}

// ---------- SPIKES ----------
let spikes = [];

function spawnSpike() {
  const doubleSpike = Math.random() < 0.5;
  spikes.push({
    x: canvas.width,
    y: GROUND_Y,
    size: 25,
    double: doubleSpike
  });
}

// ---------- INPUT ----------
function jump() {
  if (onGround && !gameOver) {
    snake.vy = snake.jump;
    onGround = false;
    startMusic();
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

jumpBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  jump();
});

// ---------- SCORE ----------
let score = 0;

// ---------- GAME LOOP ----------
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", 260, 200);
    return;
  }

  // gravity
  snake.vy += snake.gravity;
  snake.y += snake.vy;

  if (snake.y >= GROUND_Y - snake.r) {
    snake.y = GROUND_Y - snake.r;
    snake.vy = 0;
    onGround = true;
  }

  // speed increase
  if (score >= 10) speed = 6 + (score - 10) * 0.2;

  // move walls
  walls.forEach(w => w.x -= speed);
  walls = walls.filter(w => w.x + w.w > 0);

  // move spikes
  spikes.forEach(s => s.x -= speed);
  spikes = spikes.filter(s => s.x + s.size * 2 > 0);

  // spawn logic
  if (walls.length === 0 || walls[walls.length - 1].x < canvas.width - 300) {
    spawnWall();
  }

  if (score >= 10 && (spikes.length === 0 || spikes[spikes.length - 1].x < canvas.width - 400)) {
    spawnSpike();
  }

  // collisions WALLS
  walls.forEach(w => {
    if (
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > w.y
    ) {
      gameOver = true;
    }

    if (!w.passed && w.x + w.w < snake.x) {
      w.passed = true;
      score++;
      scoreEl.textContent = "Score: " + score;
    }
  });

  // collisions SPIKES
  spikes.forEach(s => {
    const hit =
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size;

    const hit2 =
      s.double &&
      snake.x + snake.r > s.x + s.size &&
      snake.x - snake.r < s.x + s.size * 2 &&
      snake.y + snake.r > s.y - s.size;

    if (hit || hit2) gameOver = true;
  });

  // ---------- DRAW ----------
  // ground
  ctx.fillStyle = "#00c800";
  ctx.fillRect(0, GROUND_Y, canvas.width, 60);

  // snake (GREEN DOT)
  ctx.fillStyle = "#00ff55";
  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  // walls
  ctx.fillStyle = "#654321";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // spikes
  ctx.fillStyle = "#222";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.fill();

    if (s.double) {
      ctx.beginPath();
      ctx.moveTo(s.x + s.size, s.y);
      ctx.lineTo(s.x + s.size * 1.5, s.y - s.size);
      ctx.lineTo(s.x + s.size * 2, s.y);
      ctx.fill();
    }
  });

  requestAnimationFrame(loop);
}

spawnWall();
loop();
