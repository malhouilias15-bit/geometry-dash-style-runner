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
let hardest = false;

let level = Number(localStorage.getItem("snakeLevel")) || 1;
let levelPopup = 0;

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
  deadAnim: 0
};

// ================== STORAGE ==================
let data = JSON.parse(localStorage.getItem("snakeData")) || {
  skins: {
    green: true,
    blue: false,
    purple: false,
    yellow: false,
    rainbow: false,
    darkred: true // OWNER ONLY
  },
  selected: "green",
  leaderboard: [],
  topScore: 0
};

// ================== UI ==================
const scoreEl = document.getElementById("score");

// ================== OBJECTS ==================
let walls = [];
let spikes = [];
let platforms = [];
let orbs = [];

// ================== RESET ==================
function reset() {
  score = 0;
  gameOver = false;
  player.deadAnim = 0;
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
let timer = 0;

function spawnNormal() {
  const x = canvas.width + 120;

  // DOUBLE WALL
  if (Math.random() < 0.4) {
    walls.push({ x, w: 30, h: 60, passed: false });
    walls.push({ x: x + 40, w: 30, h: 60, passed: false });

    platforms.push({
      x: x - 10,
      y: canvas.height - groundH - 90,
      w: 120,
      h: 10
    });
  }

  const spikeX = x + 220;
  for (let i = 0; i < 3; i++) {
    spikes.push({ x: spikeX + i * 30, y: canvas.height - groundH, s: 22 });
  }
}

function spawnHard() {
  const x = canvas.width + 150;

  // 6 SPIKES
  for (let i = 0; i < 6; i++) {
    spikes.push({ x: x + i * 28, y: canvas.height - groundH, s: 22 });
  }

  // ORB IN MIDDLE (MANUAL)
  orbs.push({
    x: x + 2.5 * 28,
    y: canvas.height - groundH - 55,
    power: 18
  });

  // DOUBLE WALL + PLATFORM
  walls.push({ x: x + 200, w: 30, h: 70, passed: false });
  walls.push({ x: x + 240, w: 30, h: 70, passed: false });

  platforms.push({
    x: x + 190,
    y: canvas.height - groundH - 95,
    w: 120,
    h: 10
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
  if (gameOver) {
    player.deadAnim++;
    if (player.deadAnim > 40) reset();
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

  // CLEAN OFFSCREEN (FREEZE FIX)
  walls = walls.filter(o => o.x + 100 > 0);
  spikes = spikes.filter(o => o.x + 100 > 0);
  platforms = platforms.filter(o => o.x + 100 > 0);
  orbs = orbs.filter(o => o.x + 100 > 0);

  player.touchingOrb = null;
  orbs.forEach(o => {
    if (
      Math.abs(player.x - o.x) < 14 &&
      Math.abs(player.y - o.y) < 14
    ) player.touchingOrb = o;
  });

  walls.forEach(w => {
    if (
      player.x + player.r > w.x &&
      player.x - player.r < w.x + w.w &&
      player.y + player.r > canvas.height - groundH - w.h
    ) gameOver = true;

    if (!w.passed && player.x > w.x) {
      score++;
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
      if (spikeShield <= 0) gameOver = true;
    }
  });

  platforms.forEach(p => {
    if (
      player.y + player.r >= p.y &&
      player.y + player.r <= p.y + p.h &&
      player.x > p.x &&
      player.x < p.x + p.w &&
      player.vy >= 0
    ) {
      player.y = p.y - player.r;
      player.vy = 0;
      player.onGround = true;
    }
  });

  timer++;
  if (timer > 120) {
    hardest ? spawnHard() : spawnNormal();
    timer = 0;
  }

  if (score >= 10) speed = 7;
  if (score >= 70) speed = hardest ? 9 : 8;

  const newLevel = Math.min(300, Math.floor(score / 5) + 1);
  if (newLevel > level) levelPopup = 60;
  level = newLevel;

  localStorage.setItem("snakeLevel", level);
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

  ctx.fillStyle = "red";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.s / 2, s.y - s.s);
    ctx.lineTo(s.x + s.s, s.y);
    ctx.fill();
  });

  let color = data.selected;
  if (color === "rainbow") color = `hsl(${Date.now() % 360},100%,50%)`;

  ctx.globalAlpha = gameOver ? 1 - player.deadAnim / 40 : 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, Math.max(0, player.r - player.deadAnim / 2), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (levelPopup > 0) {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText("YOU LEVELED UP!", canvas.width / 2 - 120, 100);
    levelPopup--;
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
