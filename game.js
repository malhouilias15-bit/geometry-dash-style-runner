/* =============================
   CANVAS SETUP
============================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 500;

/* =============================
   GAME STATE
============================= */
let gameOver = false;
let score = 0;
let speed = 5;
let groundHeight = 60;

let money = Number(localStorage.getItem("money")) || 0;
let topScore = Number(localStorage.getItem("topScore")) || 0;

let wallGroups = [];
let platforms = [];
let spikes = [];

let spikeShield = false;
let spikeShieldTimer = 0;
let scoreBoost = false;
let scoreBoostTimer = 0;

/* =============================
   DEMON MODE
============================= */
let demonMode = false;

/* DEMON BUTTON */
const demonBtn = document.createElement("button");
demonBtn.textContent = "HARDEST LEVEL";
demonBtn.style.position = "fixed";
demonBtn.style.top = "15px";
demonBtn.style.left = "50%";
demonBtn.style.transform = "translateX(-50%)";
demonBtn.style.padding = "12px 18px";
demonBtn.style.background = "darkred";
demonBtn.style.color = "white";
demonBtn.style.border = "2px solid red";
demonBtn.style.fontWeight = "bold";
demonBtn.style.cursor = "pointer";
demonBtn.style.zIndex = "999";
document.body.appendChild(demonBtn);

demonBtn.onclick = () => {
  demonMode = true;
  speed = 12;
};

/* =============================
   PLAYER (SNAKE)
============================= */
const snake = {
  x: 120,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false
};

let snakeSkin = "lime";

/* =============================
   INPUT
============================= */
window.addEventListener("keydown", e => {
  if (e.code === "Space" && snake.onGround && !gameOver) {
    snake.vy = -13;
    snake.onGround = false;
  }
});

/* =============================
   SPAWN WALLS
============================= */
function spawnWallGroup() {
  const y = canvas.height - groundHeight - 60;
  const isDouble = Math.random() < 0.5;

  const group = { walls: [], scored: false };
  group.walls.push({ x: canvas.width + 200, y, w: 26, h: 60 });

  if (isDouble) {
    group.walls.push({ x: canvas.width + 240, y, w: 26, h: 60 });
    platforms.push({
      x: canvas.width + 180,
      y: y - 30,
      w: 120,
      h: 12
    });
  }

  wallGroups.push(group);
}

/* =============================
   SPAWN SPIKES (TRIPLE IN DEMON)
============================= */
function spawnSpikes() {
  const lastWallGroup = wallGroups[wallGroups.length - 1];
  let safeX = canvas.width + (demonMode ? 280 : 400);

  if (lastWallGroup) {
    const lastWall = lastWallGroup.walls[lastWallGroup.walls.length - 1];
    safeX = lastWall.x + (demonMode ? 220 : 260);
  }

  const triple = demonMode && Math.random() < 0.2;
  const count = triple ? 3 : 1;

  for (let i = 0; i < count; i++) {
    spikes.push({
      x: safeX + i * 26,
      y: canvas.height - groundHeight,
      size: 22
    });
  }
}

/* =============================
   LOOP TIMERS
============================= */
let wallTimer = 0;
let spikeTimer = 0;

/* =============================
   UPDATE
============================= */
function update() {
  if (gameOver) return;

  snake.vy += demonMode ? 1.1 : 0.8;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  }

  wallGroups.forEach(g => g.walls.forEach(w => w.x -= speed));
  platforms.forEach(p => p.x -= speed);
  spikes.forEach(s => s.x -= speed);

  wallGroups.forEach(g => {
    g.walls.forEach(w => {
      if (
        snake.x + snake.r > w.x &&
        snake.x - snake.r < w.x + w.w &&
        snake.y + snake.r > w.y
      ) gameOver = true;
    });
  });

  spikes.forEach(s => {
    if (
      !spikeShield &&
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size
    ) gameOver = true;
  });

  platforms.forEach(p => {
    if (
      snake.x + snake.r > p.x &&
      snake.x - snake.r < p.x + p.w &&
      snake.y + snake.r >= p.y &&
      snake.y + snake.r <= p.y + p.h &&
      snake.vy >= 0
    ) {
      snake.y = p.y - snake.r;
      snake.vy = 0;
      snake.onGround = true;
    }
  });

  wallGroups.forEach(g => {
    const last = g.walls[g.walls.length - 1];
    if (!g.scored && last.x + last.w < snake.x) {
      g.scored = true;
      score += scoreBoost ? 2 : 1;
      speed = (demonMode ? 8 : 5) + Math.floor(score / 10);

      if (score % 10 === 0) {
        money += 20;
        localStorage.setItem("money", money);
      }

      if (score > topScore) {
        topScore = score;
        localStorage.setItem("topScore", topScore);
      }
    }
  });

  if (++wallTimer > (demonMode ? 55 : 90)) {
    spawnWallGroup();
    wallTimer = 0;
  }

  if (score >= 10 && ++spikeTimer > (demonMode ? 90 : 160)) {
    spawnSpikes();
    spikeTimer = 0;
  }
}

/* =============================
   DRAW
============================= */
function draw() {
  ctx.fillStyle = demonMode ? "#2b0000" : "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = demonMode ? "#880000" : "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  ctx.fillStyle = "gray";
  wallGroups.forEach(g => g.walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h)));

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = snakeSkin === "rainbow"
    ? `hsl(${Date.now() / 10 % 360},100%,50%)`
    : snakeSkin;

  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Money: $" + money, 20, 50);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
  }
}

/* =============================
   MAIN LOOP
============================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

snake.y = canvas.height - groundHeight - snake.r;
loop();
