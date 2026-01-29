// ======================================================
// GAME.JS — Geometry Dash Style Runner (FULL FIXED)
// ======================================================

// ====================== CANVAS =========================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ====================== USER ===========================
let username = localStorage.getItem("gd_user");
if (!username) {
  username = prompt("Enter username") || "Player";
  localStorage.setItem("gd_user", username);
}

// ================== BASE CONFIG ========================
const GROUND_HEIGHT = 80;
const GRAVITY = 0.8;
let GAME_SPEED = 6;
const MAX_LEVEL = 300;

// =================== GAME STATE ========================
let score = 0;
let level = Number(localStorage.getItem("gd_level")) || 1;
let money = Number(localStorage.getItem("gd_money")) || 0;
let percent = 0;

let gameOver = false;
let beatGame = false;
let hardestMode = false;

// =================== UFO MODE ==========================
let ufoMode = false;
let ufoGravity = 0.35;
let portalSpawned = false;

// =================== POWER UPS =========================
let scoreBoostTimer = 0;
let spikeShieldTimer = 0;

// ===================== PLAYER ==========================
const player = {
  x: 160,
  y: 0,
  radius: 14,
  vy: 0,
  onGround: false,
  touchingOrb: null,
  deathAnim: 0
};

// ===================== STORAGE =========================
let saveData = JSON.parse(localStorage.getItem("gd_data")) || {
  skins: {
    green: true,
    blue: true,
    yellow: true,
    purple: false,
    rainbow: false,
    darkred: false
  },
  selected: "green",
  topScore: 0
};

// ======================= UI ============================
const scoreEl = document.getElementById("score");

// ================= OBJECT ARRAYS =======================
let walls = [];
let spikes = [];
let platforms = [];
let orbs = [];
let portals = [];

// ===================== RESET ===========================
function resetGame() {
  score = 0;
  percent = 0;
  gameOver = false;
  beatGame = false;
  ufoMode = false;
  portalSpawned = false;

  player.vy = 0;
  player.deathAnim = 0;

  walls = [];
  spikes = [];
  platforms = [];
  orbs = [];
  portals = [];

  player.y = canvas.height - GROUND_HEIGHT - player.radius;
}

// ==================== SPAWNING =========================
let spawnTimer = 0;

function spawnNormal() {
  const startX = canvas.width + 120;

  walls.push({ x: startX, w: 30, h: 70, passed: false });
  walls.push({ x: startX + 42, w: 30, h: 70, passed: false });

  platforms.push({
    x: startX - 20,
    y: canvas.height - GROUND_HEIGHT - 85,
    w: 140,
    h: 14
  });

  const spikeCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < spikeCount; i++) {
    spikes.push({
      x: startX + 220 + i * 28,
      y: canvas.height - GROUND_HEIGHT,
      size: 26
    });
  }
}

// ====================== INPUT ==========================
function jump() {
  if (ufoMode) {
    player.vy = -7;
    return;
  }

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

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});
canvas.addEventListener("mousedown", jump);

// ====================== UPDATE =========================
function update() {
  if (gameOver) {
    player.deathAnim += 2;
    return;
  }

  // Gravity
  player.vy += ufoMode ? ufoGravity : GRAVITY;
  player.y += player.vy;

  const groundY = canvas.height - GROUND_HEIGHT - player.radius;
  player.onGround = false;

  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  // Move objects
  [...walls, ...spikes, ...platforms, ...orbs, ...portals].forEach(o => {
    o.x -= GAME_SPEED;
  });

  // Orbs
  player.touchingOrb = null;
  orbs.forEach(o => {
    if (Math.abs(player.x - o.x) < 14 && Math.abs(player.y - o.y) < 14) {
      player.touchingOrb = o;
    }
  });

  // Platforms
  platforms.forEach(p => {
    if (
      player.x + player.radius > p.x &&
      player.x - player.radius < p.x + p.w &&
      player.y + player.radius >= p.y &&
      player.y + player.radius <= p.y + p.h &&
      player.vy >= 0
    ) {
      player.y = p.y - player.radius;
      player.vy = 0;
      player.onGround = true;
    }
  });

  // Walls
  walls.forEach(w => {
    if (
      player.x + player.radius > w.x &&
      player.x - player.radius < w.x + w.w &&
      player.y + player.radius >
        canvas.height - GROUND_HEIGHT - w.h
    ) {
      gameOver = true;
    }

    if (!w.passed && player.x > w.x) {
      score++;
      money++;
      w.passed = true;
    }
  });

  // Spikes
  spikes.forEach(s => {
    if (
      player.x > s.x &&
      player.x < s.x + s.size &&
      player.y + player.radius > s.y - s.size
    ) {
      if (spikeShieldTimer <= 0) gameOver = true;
    }
  });

  // Timers
  if (scoreBoostTimer > 0) scoreBoostTimer--;
  if (spikeShieldTimer > 0) spikeShieldTimer--;

  // Spawn
  spawnTimer++;
  if (spawnTimer > 120) {
    spawnNormal();
    spawnTimer = 0;
  }

  // LEVEL → PERCENT
  level = Math.min(MAX_LEVEL, Math.floor(score / 5) + 1);
  percent = Math.min(100, Math.floor((level / MAX_LEVEL) * 100));

  // UFO PORTAL AT 30%
  if (percent >= 30 && !portalSpawned) {
    portals.push({
      x: canvas.width + 100,
      y: canvas.height - GROUND_HEIGHT - 120,
      r: 18
    });
    portalSpawned = true;
  }

  // Portal collision
  portals.forEach(p => {
    if (
      Math.abs(player.x - p.x) < p.r &&
      Math.abs(player.y - p.y) < p.r
    ) {
      ufoMode = true;
    }
  });

  // WIN
  if (percent === 100 && !beatGame) {
    beatGame = true;
    alert("🏆 YOU BEAT THE GAME!");
  }

  // Save
  saveData.topScore = Math.max(saveData.topScore, score);
  localStorage.setItem("gd_data", JSON.stringify(saveData));
  localStorage.setItem("gd_level", level);
  localStorage.setItem("gd_money", money);

  scoreEl.textContent = `${percent}%`;
}

// ====================== DRAW ===========================
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(
    0,
    canvas.height - GROUND_HEIGHT,
    canvas.width,
    GROUND_HEIGHT
  );

  // Walls
  ctx.fillStyle = "#888";
  walls.forEach(w => {
    ctx.fillRect(
      w.x,
      canvas.height - GROUND_HEIGHT - w.h,
      w.w,
      w.h
    );
  });

  // Platforms
  ctx.fillStyle = "#fff";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  // Spikes
  ctx.fillStyle = "red";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.fill();
  });

  // Orbs
  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Portal
  portals.forEach(p => {
    ctx.strokeStyle = "purple";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Player
  ctx.fillStyle = saveData.selected;
  ctx.beginPath();
  ctx.arc(
    player.x,
    player.y + player.deathAnim,
    player.radius,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// ====================== LOOP ===========================
resetGame();
(function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
})();

