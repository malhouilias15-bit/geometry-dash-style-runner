// ================== CANVAS ==================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ================== USER ==================
let username = localStorage.getItem("snakeUser");
if (!username) {
  username = prompt("Enter username") || "Player";
  localStorage.setItem("snakeUser", username);
}

// ================== BASE ==================
const groundH = 80;
let speed = 6;
let score = 0;
let money = Number(localStorage.getItem("snakeMoney")) || 0;
let gameOver = false;
let dying = false;
let hardest = false;

let level = Number(localStorage.getItem("snakeLevel")) || 1;
let lastLevel = level;

let spikeShield = 0;
let scoreBoost = 0;

// ================== PLAYER ==================
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  touchingOrb: null,
  alpha: 1
};

// ================== STORAGE ==================
let data = JSON.parse(localStorage.getItem("snakeData")) || {
  skins: {
    green: true,
    blue: false,
    purple: false,
    yellow: false,
    rainbow: false,
    darkred: false
  },
  selected: "green",
  leaderboard: [],
  topScore: 0
};

// ================== UI ==================
const scoreEl = document.getElementById("score");
let levelUpTextTimer = 0;

// ================== OBJECTS ==================
let walls = [];
let spikes = [];
let platforms = [];
let orbs = [];
let timer = 0;

// ================== RESET ==================
function reset() {
  score = 0;
  gameOver = false;
  dying = false;
  player.alpha = 1;
  spikeShield = 0;
  scoreBoost = 0;
  walls = [];
  spikes = [];
  platforms = [];
  orbs = [];
  speed = 6;
  player.y = canvas.height - groundH - player.r;
  player.vy = 0;
}

// ================== SPAWN ==================
function spawnNormal() {
  const x = canvas.width + 120;

  // wall
  walls.push({ x, w: 30, h: 60, passed: false });

  // double wall + platform
  if (Math.random() < 0.35) {
    walls.push({ x: x + 60, w: 30, h: 100, passed: false });
    platforms.push({
      x: x + 40,
      y: canvas.height - groundH - 140,
      w: 80,
      h: 10
    });
  }

  // spikes (1 / 2 / 3)
  const spikeCount = [1, 2, 3][Math.floor(Math.random() * 3)];
  const sx = x + 220;
  for (let i = 0; i < spikeCount; i++) {
    spikes.push({ x: sx + i * 28, y: canvas.height - groundH, s: 22 });
  }
}

function spawnHard() {
  const x = canvas.width + 140;

  // normal wall only
  walls.push({ x, w: 40, h: 120, passed: false });

  // 6 spikes
  for (let i = 0; i < 6; i++) {
    spikes.push({ x: x + 200 + i * 26, y: canvas.height - groundH, s: 22 });
  }

  // orb in middle (manual)
  orbs.push({
    x: x + 200 + 2.5 * 26,
    y: canvas.height - groundH - 50,
    power: 16
  });
}

// ================== INPUT ==================
function jump() {
  if (player.touchingOrb) {
    player.vy = -player.touchingOrb.power;
    player.touchingOrb = null;
    return;
  }
  if (player.onGround) {
    player.vy = -12;
    player.onGround = false;
  }
}

document.addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("mousedown", jump);

// ================== UPDATE ==================
function update() {
  if (gameOver) return;

  if (dying) {
    player.alpha -= 0.03;
    player.vy += 0.8;
    player.y += player.vy;
    if (player.alpha <= 0) reset();
    return;
  }

  player.vy += 0.8;
  player.y += player.vy;

  const groundY = canvas.height - groundH - player.r;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...orbs].forEach(o => o.x -= speed);

  // 🔥 CLEANUP (FIXES FREEZE)
  walls = walls.filter(w => w.x + w.w > -100);
  spikes = spikes.filter(s => s.x + s.s > -100);
  platforms = platforms.filter(p => p.x + p.w > -100);
  orbs = orbs.filter(o => o.x > -100);

  if (scoreBoost > 0) scoreBoost--;
  if (spikeShield > 0) spikeShield--;

  player.touchingOrb = null;
  orbs.forEach(o => {
    if (
      player.x + player.r > o.x - 8 &&
      player.x - player.r < o.x + 8 &&
      player.y + player.r > o.y - 8 &&
      player.y - player.r < o.y + 8
    ) player.touchingOrb = o;
  });

  walls.forEach(w => {
    if (
      player.x + player.r > w.x &&
      player.x - player.r < w.x + w.w &&
      player.y + player.r > canvas.height - groundH - w.h
    ) dying = true;

    if (!w.passed && player.x > w.x) {
      score += scoreBoost > 0 ? 2 : 1;
      money++;
      w.passed = true;
    }
  });

  spikes.forEach(s => {
    if (
      player.x + player.r > s.x &&
      player.x - player.r < s.x + s.s &&
      player.y + player.r > s.y - s.s
    ) {
      if (spikeShield <= 0) dying = true;
    }
  });

  timer++;
  if (timer > 120) {
    hardest ? spawnHard() : spawnNormal();
    timer = 0;
  }

  level = Math.min(300, Math.floor(score / 5) + 1);
  if (level > lastLevel) {
    levelUpTextTimer = 120;
    lastLevel = level;
  }

  localStorage.setItem("snakeMoney", money);
  scoreEl.textContent = `Score: ${score} | $${money} | Lv: ${level}`;
}

// ================== DRAW ==================
function draw() {
  ctx.fillStyle = hardest ? "#300" : "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundH, canvas.width, groundH);

  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, canvas.height - groundH - w.h, w.w, w.h));

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  let color = data.selected;
  if (color === "darkred") color = "#7a0000";
  if (color === "rainbow") color = `hsl(${Date.now() / 10 % 360},100%,50%)`;

  ctx.globalAlpha = player.alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (levelUpTextTimer > 0) {
    ctx.globalAlpha = levelUpTextTimer / 120;
    ctx.fillStyle = "gold";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU LEVELED UP!", canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 1;
    levelUpTextTimer--;
  }
}

// ================== LOOP ==================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
