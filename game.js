// ======================================================
// GEOMETRY DASH STYLE RUNNER — FULL FINAL BUILD
// ======================================================

// ---------------- CONFIG ----------------
const MAX_LEVEL = 300;
const GROUND = 80;
const GRAVITY = 0.85;
const UFO_GRAVITY = 0.35;
const SPEED = 6;

// ---------------- CANVAS ----------------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// ---------------- STORAGE ----------------
const LS = {
  get: (k, d) => JSON.parse(localStorage.getItem(k)) ?? d,
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

let username = localStorage.getItem("username");
if (!username) {
  username = prompt("Username") || "Player";
  localStorage.setItem("username", username);
}

let money = LS.get("money", 0);
let level = LS.get("level", 1);
let topScore = LS.get("topScore", 0);

// ---------------- SKINS ----------------
let skins = LS.get("skins", {
  green: true,
  blue: true,
  yellow: true,
  purple: false,
  rainbow: false,
  darkred: false,
  selected: "green"
});

// ---------------- GAME STATE ----------------
let hardest = false;
let score = 0;
let gameOver = false;
let beatGame = false;
let showLevelUp = 0;

// ---------------- PLAYER ----------------
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  deadFade: 0,
  ufo: false
};

// ---------------- OBJECTS ----------------
let walls = [];
let spikes = [];
let platforms = [];
let portals = [];
let orbs = [];

// ---------------- SHOP BUFFS ----------------
let scoreBoostTimer = 0;
let spikeShieldTimer = 0;

// ---------------- OWNER PAD ----------------
function ownerPad(name) {
  if (name === username) {
    skins.darkred = true;
    LS.set("skins", skins);
    alert("Dark Red granted");
  }
}

// ---------------- RESET ----------------
function resetGame() {
  score = 0;
  gameOver = false;
  beatGame = false;
  showLevelUp = 0;

  player.vy = 0;
  player.deadFade = 0;
  player.ufo = false;
  player.y = canvas.height - GROUND - player.r;

  walls = [];
  spikes = [];
  platforms = [];
  portals = [];
  orbs = [];
}

// ---------------- INPUT ----------------
function jump() {
  if (player.ufo) {
    player.vy = -6;
    return;
  }
  if (player.onGround) {
    player.vy = -13;
    player.onGround = false;
  }
}
addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("mousedown", jump);

// ---------------- SPAWNS ----------------
function spawnNormal() {
  const x = canvas.width + 100;

  walls.push({ x, w: 30, h: 70 });

  platforms.push({
    x: x + 40,
    y: canvas.height - GROUND - 90,
    w: 160,
    h: 14
  });

  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    spikes.push({ x: x + 230 + i * 26, y: canvas.height - GROUND, s: 26 });
  }
}

function spawnHard() {
  const x = canvas.width + 120;

  walls.push({ x, w: 24, h: 60 });
  walls.push({ x: x + 34, w: 24, h: 60 });

  platforms.push({
    x: x - 10,
    y: canvas.height - GROUND - 70,
    w: 150,
    h: 14
  });

  for (let i = 0; i < 6; i++) {
    spikes.push({ x: x + 220 + i * 26, y: canvas.height - GROUND, s: 26 });
  }

  orbs.push({
    x: x + 300,
    y: canvas.height - GROUND - 120,
    r: 10
  });

  if (!player.ufo && score >= 30) {
    portals.push({
      x: canvas.width + 200,
      y: canvas.height - GROUND - 150,
      r: 24
    });
  }
}

// ---------------- UPDATE ----------------
let spawnTimer = 0;

function update() {
  if (gameOver) {
    player.deadFade += 0.02;
    return;
  }

  spawnTimer++;
  if (spawnTimer > 120) {
    hardest ? spawnHard() : spawnNormal();
    spawnTimer = 0;
  }

  player.vy += player.ufo ? UFO_GRAVITY : GRAVITY;
  player.y += player.vy;

  const groundY = canvas.height - GROUND - player.r;
  player.onGround = false;

  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...portals, ...orbs].forEach(o => o.x -= SPEED);

  platforms.forEach(p => {
    if (
      player.x + player.r > p.x &&
      player.x - player.r < p.x + p.w &&
      player.y + player.r >= p.y &&
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
      player.y + player.r > canvas.height - GROUND - w.h
    ) {
      score++;
      topScore = Math.max(topScore, score);
      LS.set("topScore", topScore);
    }
  });

  spikes.forEach(s => {
    if (
      player.x > s.x &&
      player.x < s.x + s.s &&
      player.y + player.r > s.y - s.s &&
      spikeShieldTimer <= 0
    ) gameOver = true;
  });

  portals.forEach(p => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < p.r) {
      player.ufo = true;
    }
  });

  if (score >= MAX_LEVEL && !beatGame) {
    beatGame = true;
    alert("🏆 YOU BEAT THE GAME!");
  }

  if (scoreBoostTimer > 0) scoreBoostTimer--;
  if (spikeShieldTimer > 0) spikeShieldTimer--;
}

// ---------------- DRAW ----------------
function drawSpike(s) {
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x + s.s / 2, s.y - s.s);
  ctx.lineTo(s.x + s.s, s.y);
  ctx.fillStyle = "red";
  ctx.fill();
}

function draw() {
  ctx.fillStyle = hardest ? "#220000" : "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f0";
  ctx.fillRect(0, canvas.height - GROUND, canvas.width, GROUND);

  ctx.fillStyle = "#777";
  walls.forEach(w =>
    ctx.fillRect(w.x, canvas.height - GROUND - w.h, w.w, w.h)
  );

  ctx.fillStyle = "#fff";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
  spikes.forEach(drawSpike);

  ctx.strokeStyle = "#0ff";
  portals.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  let color = skins.selected;
  if (color === "darkred") color = "#7a0000";
  if (color === "rainbow") color = `hsl(${Date.now() % 360},100%,50%)`;

  ctx.globalAlpha = 1 - player.deadFade;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Money: $${money}`, 20, 55);
  ctx.fillText(`Level: ${level}/${MAX_LEVEL}`, 20, 80);
}

// ---------------- LOOP ----------------
resetGame();
(function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
})();
