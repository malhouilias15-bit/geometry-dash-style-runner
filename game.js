// ======================================================
// GEOMETRY DASH STYLE RUNNER — FINAL STABLE BUILD
// ======================================================

// ---------------- GLOBAL ----------------
let ufoMode = false;
let portalSpawned = false;
let percent = 0;
let percentTimer = 0;
let gameOver = false;
let levelComplete = false;
let hardestMode = false;

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
let money = Number(localStorage.getItem("money")) || 0;
let topPercent = Number(localStorage.getItem("topPercent")) || 0;
let levelName = localStorage.getItem("levelName") || "Polargeist";

let data = JSON.parse(localStorage.getItem("skins")) || {
  green: true,
  blue: false,
  yellow: false,
  purple: false,
  rainbow: false,
  darkred: false,
  selected: "green"
};

// ---------------- CONSTANTS ----------------
const GROUND = 80;
const GRAVITY = 0.8;
const UFO_GRAVITY = 0.35;
const SPEED = 6;

// ---------------- PLAYER ----------------
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  deathAnim: 0
};

// ---------------- OBJECTS ----------------
let walls = [];
let spikes = [];
let platforms = [];
let portals = [];

// ---------------- RESET ----------------
function resetGame() {
  percent = 0;
  percentTimer = 0;
  gameOver = false;
  levelComplete = false;
  ufoMode = false;
  portalSpawned = false;

  walls = [];
  spikes = [];
  platforms = [];
  portals = [];

  player.vy = 0;
  player.deathAnim = 0;
  player.y = canvas.height - GROUND - player.r;
}

// ---------------- INPUT ----------------
function jump() {
  if (ufoMode) {
    player.vy = -6;
    return;
  }
  if (player.onGround) {
    player.vy = -12;
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
    w: 140,
    h: 12
  });

  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    spikes.push({ x: x + 220 + i * 26, y: canvas.height - GROUND, s: 26 });
  }
}

function spawnHard() {
  const x = canvas.width + 120;

  walls.push({ x, w: 26, h: 60 });
  walls.push({ x: x + 34, w: 26, h: 60 });

  platforms.push({
    x: x - 10,
    y: canvas.height - GROUND - 70,
    w: 150,
    h: 12
  });

  for (let i = 0; i < 6; i++) {
    spikes.push({ x: x + 220 + i * 26, y: canvas.height - GROUND, s: 26 });
  }

  if (!portalSpawned && percent >= 30) {
    portals.push({
      x: canvas.width + 200,
      y: canvas.height - GROUND - 140,
      r: 24
    });
    portalSpawned = true;
  }
}

// ---------------- UPDATE ----------------
let spawnTimer = 0;

function update() {
  if (gameOver) {
    player.deathAnim += 2;
    return;
  }

  percentTimer++;
  if (percentTimer >= 180) {
    percent++;
    percentTimer = 0;

    if (percent % 5 === 0) {
      money++;
      localStorage.setItem("money", money);
    }

    topPercent = Math.max(topPercent, percent);
    localStorage.setItem("topPercent", topPercent);

    if (percent === 10) data.blue = true;
    if (percent === 100 && !hardestMode) data.rainbow = true;
    if (percent === 100 && hardestMode) data.darkred = true;

    localStorage.setItem("skins", JSON.stringify(data));
  }

  if (percent >= 100 && !levelComplete) {
    levelComplete = true;
    alert("LEVEL COMPLETE");
  }

  player.vy += ufoMode ? UFO_GRAVITY : GRAVITY;
  player.y += player.vy;

  const groundY = canvas.height - GROUND - player.r;
  player.onGround = false;

  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...portals].forEach(o => o.x -= SPEED);

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
    ) gameOver = true;
  });

  spikes.forEach(s => {
    if (
      player.x > s.x &&
      player.x < s.x + s.s &&
      player.y + player.r > s.y - s.s
    ) gameOver = true;
  });

  portals.forEach(p => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < p.r) ufoMode = true;
  });

  spawnTimer++;
  if (spawnTimer > 110) {
    hardestMode ? spawnHard() : spawnNormal();
    spawnTimer = 0;
  }
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
  ctx.fillStyle = hardestMode ? "#300" : "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f0";
  ctx.fillRect(0, canvas.height - GROUND, canvas.width, GROUND);

  ctx.fillStyle = "#888";
  walls.forEach(w => ctx.fillRect(w.x, canvas.height - GROUND - w.h, w.w, w.h));

  ctx.fillStyle = "#fff";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  spikes.forEach(drawSpike);

  ctx.strokeStyle = "#0ff";
  portals.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  let c = data.selected;
  if (c === "darkred") c = "#7a0000";
  if (c === "rainbow") c = `hsl(${Date.now() % 360},100%,50%)`;

  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(player.x, player.y + player.deathAnim, player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`${percent}%`, 20, 30);
}

// ---------------- LOOP ----------------
resetGame();
(function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
})();
