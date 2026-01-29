// ======================================================
// GAME.JS — GEOMETRY DASH STYLE RUNNER
// FULL FIXED + UFO + PERCENT SYSTEM
// ======================================================

// ================= GLOBAL =================
let ufoMode = false;
let ufoGravity = 0.35;
let portalSpawned = false;

let distance = 0;
let percent = 0;
let gameCompleted = false;

// ================= CANVAS =================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ================= USER =================
let username = localStorage.getItem("gd_user");
if (!username) {
  username = prompt("Username") || "Player";
  localStorage.setItem("gd_user", username);
}

// ================= BASE =================
const GROUND_HEIGHT = 80;
const GRAVITY = 0.8;
let SPEED = 6;

// ================= STATE =================
let gameOver = false;
let hardestMode = false;
let money = Number(localStorage.getItem("gd_money")) || 0;

// ================= PLAYER =================
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  deadAnim: 0
};

// ================= STORAGE =================
let data = JSON.parse(localStorage.getItem("gd_data")) || {
  skins: {
    green: true,
    rainbow: false,
    darkred: false
  },
  selected: "green"
};

// ================= OBJECTS =================
let walls = [];
let spikes = [];
let platforms = [];
let portals = [];

// ================= RESET =================
function resetGame() {
  gameOver = false;
  gameCompleted = false;
  ufoMode = false;
  portalSpawned = false;
  distance = 0;
  percent = 0;

  walls = [];
  spikes = [];
  platforms = [];
  portals = [];

  player.vy = 0;
  player.deadAnim = 0;
  player.y = canvas.height - GROUND_HEIGHT - player.r;
}

// ================= SPAWNS =================
let timer = 0;

function spawnLevel1() {
  const x = canvas.width + 120;

  walls.push({ x, w: 30, h: 70 });
  platforms.push({
    x: x + 40,
    y: canvas.height - GROUND_HEIGHT - 90,
    w: 140,
    h: 12
  });

  spikes.push({
    x: x + 230,
    y: canvas.height - GROUND_HEIGHT,
    s: 26
  });
}

function spawnLevel2() {
  const x = canvas.width + 120;

  walls.push({ x, w: 26, h: 60 });
  walls.push({ x: x + 34, w: 26, h: 60 });

  platforms.push({
    x: x - 10,
    y: canvas.height - GROUND_HEIGHT - 70,
    w: 150,
    h: 12
  });

  for (let i = 0; i < 5; i++) {
    spikes.push({
      x: x + 220 + i * 26,
      y: canvas.height - GROUND_HEIGHT,
      s: 26
    });
  }
}

// ================= INPUT =================
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

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});
canvas.addEventListener("mousedown", jump);

// ================= UPDATE =================
function update() {
  if (gameOver) {
    player.deadAnim += 2;
    return;
  }

  // Progress
  distance += SPEED;
  percent = Math.min(100, Math.floor(distance / 120));

  if (percent >= 100 && !gameCompleted) {
    gameCompleted = true;

    if (hardestMode) data.skins.darkred = true;
    else data.skins.rainbow = true;

    localStorage.setItem("gd_data", JSON.stringify(data));
    alert("🏆 LEVEL COMPLETE!");
  }

  // UFO portal (30% hardest)
  if (hardestMode && percent >= 30 && !portalSpawned) {
    portals.push({
      x: canvas.width + 100,
      y: canvas.height - GROUND_HEIGHT - 150,
      r: 24
    });
    portalSpawned = true;
  }

  // Physics
  player.vy += ufoMode ? ufoGravity : GRAVITY;
  player.y += player.vy;

  const groundY = canvas.height - GROUND_HEIGHT - player.r;
  player.onGround = false;

  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...portals].forEach(o => {
    o.x -= SPEED;
  });

  // Platform collision
  platforms.forEach(p => {
    if (
      player.x + player.r > p.x &&
      player.x - player.r < p.x + p.w &&
      player.y + player.r >= p.y &&
      player.y + player.r <= p.y + p.h &&
      player.vy >= 0
    ) {
      player.y = p.y - player.r;
      player.vy = 0;
      player.onGround = true;
    }
  });

  // Wall collision
  walls.forEach(w => {
    if (
      player.x + player.r > w.x &&
      player.x - player.r < w.x + w.w &&
      player.y + player.r > canvas.height - GROUND_HEIGHT - w.h
    ) {
      gameOver = true;
    }
  });

  // Spike collision
  spikes.forEach(s => {
    if (
      player.x > s.x &&
      player.x < s.x + s.s &&
      player.y + player.r > s.y - s.s
    ) {
      gameOver = true;
    }
  });

  // Portal collision
  portals.forEach(p => {
    if (
      Math.hypot(player.x - p.x, player.y - p.y) < p.r
    ) {
      ufoMode = true;
    }
  });

  // Spawning
  timer++;
  if (timer > 110) {
    percent < 50 ? spawnLevel1() : spawnLevel2();
    timer = 0;
  }

  // Money save
  money += 0.01;
  localStorage.setItem("gd_money", Math.floor(money));
}

// ================= DRAW =================
function drawSpike(s) {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x + s.s / 2, s.y - s.s);
  ctx.lineTo(s.x + s.s, s.y);
  ctx.fill();
}

function draw() {
  ctx.fillStyle = hardestMode ? "#300" : "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f0";
  ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

  ctx.fillStyle = "#888";
  walls.forEach(w =>
    ctx.fillRect(w.x, canvas.height - GROUND_HEIGHT - w.h, w.w, w.h)
  );

  ctx.fillStyle = "#fff";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  spikes.forEach(drawSpike);

  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 4;
  portals.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  let color = data.selected;
  if (color === "darkred") color = "#7a0000";
  if (color === "rainbow")
    color = `hsl(${Date.now() % 360},100%,50%)`;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(player.x, player.y + player.deadAnim, player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`${percent}%`, 20, 30);
}

// ================= LOOP =================
resetGame();
(function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
})();
