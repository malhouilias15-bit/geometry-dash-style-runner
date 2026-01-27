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
  username = prompt("type username who to play") || "Player";
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
  touchingOrb: null
};

// ================== STORAGE ==================
let data = JSON.parse(localStorage.getItem("snakeData")) || {
  skins: {
    green: true,
    blue: true,
    purple: false,
    yellow: false,
    rainbow: false,
    darkred: false
  },
  selected: "green",
  topScore: 0,
  bestUser: "",
  bestScore: 0
};

// ================== OBJECTS ==================
let walls = [];
let spikes = [];
let platforms = [];
let orbs = [];

// ================== RESET ==================
function reset() {
  score = 0;
  gameOver = false;
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
  const x = canvas.width + 100;

  // normal small wall
  walls.push({ x, w: 25, h: 50, passed: false });

  // spikes: 1 / 2 / 3
  const count = [1,2,3][Math.floor(Math.random()*3)];
  for (let i = 0; i < count; i++) {
    spikes.push({
      x: x + 180 + i * 26,
      y: canvas.height - groundH,
      s: 22
    });
  }

  // double walls + big platform
  platforms.push({
    x: x + 90,
    y: canvas.height - groundH - 95,
    w: 140,
    h: 12
  });
}

function spawnHard() {
  const x = canvas.width + 120;

  // normal wall (small)
  walls.push({ x, w: 25, h: 60, passed: false });

  // 6 red spikes
  for (let i = 0; i < 6; i++) {
    spikes.push({
      x: x + 200 + i * 26,
      y: canvas.height - groundH,
      s: 22
    });
  }

  // orb above middle spike
  orbs.push({
    x: x + 200 + 2.5 * 26,
    y: canvas.height - groundH - 70,
    power: 16
  });

  // big platform same width as spikes
  platforms.push({
    x: x + 190,
    y: canvas.height - groundH - 120,
    w: 160,
    h: 12
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

  player.vy += 0.8;
  player.y += player.vy;
  player.onGround = false;

  const groundY = canvas.height - groundH - player.r;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...orbs].forEach(o => o.x -= speed);

  // cleanup (FIX FREEZE)
  walls = walls.filter(w => w.x + w.w > -50);
  spikes = spikes.filter(s => s.x + s.s > -50);
  platforms = platforms.filter(p => p.x + p.w > -50);
  orbs = orbs.filter(o => o.x > -50);

  player.touchingOrb = null;
  orbs.forEach(o => {
    if (
      player.x + player.r > o.x - 8 &&
      player.x - player.r < o.x + 8 &&
      player.y + player.r > o.y - 8 &&
      player.y - player.r < o.y + 8
    ) player.touchingOrb = o;
  });

  platforms.forEach(p => {
    if (
      player.x + player.r > p.x &&
      player.x - player.r < p.x + p.w &&
      player.y + player.r >= p.y &&
      player.y + player.r <= p.y + 10 &&
      player.vy >= 0
    ) {
      player.y = p.y - player.r;
      player.vy = 0;
      player.onGround = true;
    }
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

  timer++;
  if (timer > 120) {
    hardest ? spawnHard() : spawnNormal();
    timer = 0;
  }
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

  ctx.fillStyle = "red";
  spikes.forEach(s => ctx.fillRect(s.x, s.y - s.s, s.s, s.s));

  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = data.selected;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
}

// ================== LOOP ==================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
