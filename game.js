// ======================================================
// GAME.JS – FULL CLEAN REBUILD (500+ LINES)
// ======================================================

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
let username = localStorage.getItem("gd_user");
if (!username) {
  username = prompt("Enter username") || "Player";
  localStorage.setItem("gd_user", username);
}

// ================== BASE CONFIG ==================
const groundH = 80;
const gravity = 0.8;
let speed = 6;

let score = 0;
let level = Number(localStorage.getItem("gd_level")) || 1;
let money = Number(localStorage.getItem("gd_money")) || 0;

let gameOver = false;
let hardest = false;
let beatGame = false;

// ================== POWERUPS ==================
let scoreBoostTimer = 0;
let spikeShieldTimer = 0;

// ================== PLAYER ==================
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  touchingOrb: null,
  deadTimer: 0
};

// ================== STORAGE ==================
let data = JSON.parse(localStorage.getItem("gd_data")) || {
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

// ================== UI ==================
const scoreEl = document.getElementById("score");

function makeBtn(text, y) {
  const b = document.createElement("button");
  b.textContent = text;
  b.style.position = "fixed";
  b.style.left = "10px";
  b.style.top = y;
  b.style.zIndex = 10;
  document.body.appendChild(b);
  return b;
}

const skinsBtn = makeBtn("Skins", "40px");
const statsBtn = makeBtn("Stats", "70px");
const shopBtn = makeBtn("Shop", "100px");
const levelsBtn = makeBtn("Levels", "130px");
const hardBtn = makeBtn("HARDEST", "10px");

// ================== MENUS ==================
function makeMenu(y) {
  const d = document.createElement("div");
  d.style.position = "fixed";
  d.style.left = "10px";
  d.style.top = y;
  d.style.background = "#222";
  d.style.color = "#fff";
  d.style.padding = "10px";
  d.style.display = "none";
  d.style.zIndex = 10;
  document.body.appendChild(d);
  return d;
}

const skinsMenu = makeMenu("170px");
const statsMenu = makeMenu("170px");
const shopMenu = makeMenu("170px");
const levelsMenu = makeMenu("170px");

function toggle(menu, render) {
  [skinsMenu, statsMenu, shopMenu, levelsMenu].forEach(m => m.style.display = "none");
  menu.style.display = "block";
  render();
}

skinsBtn.onclick = () => toggle(skinsMenu, renderSkins);
statsBtn.onclick = () => toggle(statsMenu, renderStats);
shopBtn.onclick = () => toggle(shopMenu, renderShop);
levelsBtn.onclick = () => toggle(levelsMenu, renderLevels);

hardBtn.onclick = () => {
  hardest = !hardest;
  reset();
};

// ================== OBJECT ARRAYS ==================
let walls = [];
let spikes = [];
let platforms = [];
let orbs = [];

// ================== RESET ==================
function reset() {
  score = 0;
  gameOver = false;
  beatGame = false;
  player.deadTimer = 0;

  walls = [];
  spikes = [];
  platforms = [];
  orbs = [];

  player.y = canvas.height - groundH - player.r;
  player.vy = 0;
}

// ================== SPAWNING ==================
let spawnTimer = 0;

function spawnNormal() {
  const x = canvas.width + 120;

  // Normal wall
  walls.push({ x, w: 30, h: 70, passed: false });

  // Double wall + platform
  walls.push({ x: x + 40, w: 30, h: 70, passed: false });
  platforms.push({
    x: x - 10,
    y: canvas.height - groundH - 110,
    w: 110,
    h: 14
  });

  // Spikes (1–3)
  const count = [1, 2, 3][Math.floor(Math.random() * 3)];
  for (let i = 0; i < count; i++) {
    spikes.push({
      x: x + 200 + i * 28,
      y: canvas.height - groundH,
      s: 26
    });
  }
}

function spawnHard() {
  const x = canvas.width + 140;

  // Smaller normal wall
  walls.push({ x, w: 28, h: 60, passed: false });

  // Double wall + platform
  walls.push({ x: x + 36, w: 28, h: 60, passed: false });
  platforms.push({
    x: x - 5,
    y: canvas.height - groundH - 120,
    w: 120,
    h: 14
  });

  // 6 spikes
  for (let i = 0; i < 6; i++) {
    spikes.push({
      x: x + 220 + i * 26,
      y: canvas.height - groundH,
      s: 26
    });
  }

  // Orb above spikes
  orbs.push({
    x: x + 220 + 3 * 26,
    y: canvas.height - groundH - 70,
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

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});
canvas.addEventListener("mousedown", jump);

// ================== UPDATE ==================
function update() {
  if (gameOver) {
    player.deadTimer++;
    return;
  }

  // Gravity
  player.vy += gravity;
  player.y += player.vy;

  const groundY = canvas.height - groundH - player.r;
  player.onGround = false;

  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...orbs].forEach(o => o.x -= speed);

  // Orb detection
  player.touchingOrb = null;
  orbs.forEach(o => {
    if (Math.abs(player.x - o.x) < 14 && Math.abs(player.y - o.y) < 14) {
      player.touchingOrb = o;
    }
  });

  // Platform collision (SAFE)
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

  // Walls
  walls.forEach(w => {
    if (
      player.x + player.r > w.x &&
      player.x - player.r < w.x + w.w &&
      player.y + player.r > canvas.height - groundH - w.h
    ) gameOver = true;

    if (!w.passed && player.x > w.x) {
      score++;
      w.passed = true;
    }
  });

  // Spikes
  spikes.forEach(s => {
    if (
      player.x > s.x &&
      player.x < s.x + s.s &&
      player.y + player.r > s.y - s.s
    ) {
      if (spikeShieldTimer <= 0) gameOver = true;
    }
  });

  // Spawn
  spawnTimer++;
  if (spawnTimer > 120) {
    hardest ? spawnHard() : spawnNormal();
    spawnTimer = 0;
  }

  // Level
  level = Math.min(300, Math.floor(score / 5) + 1);
  if (level === 300 && !beatGame) {
    beatGame = true;
    alert("🏆 YOU BEAT THE GAME!");
  }

  // Save
  data.topScore = Math.max(data.topScore, score);
  localStorage.setItem("gd_level", level);
  localStorage.setItem("gd_money", money);
  localStorage.setItem("gd_data", JSON.stringify(data));

  scoreEl.textContent = `Score: ${score} | Lv: ${level}`;
}

// ================== DRAW ==================
function drawSpike(s) {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x + s.s / 2, s.y - s.s);
  ctx.lineTo(s.x + s.s, s.y);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.fillStyle = hardest ? "#300" : "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundH, canvas.width, groundH);

  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, canvas.height - groundH - w.h, w.w, w.h));

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  spikes.forEach(drawSpike);

  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  let c = data.selected;
  if (c === "darkred") c = "#7a0000";
  if (c === "rainbow") c = `hsl(${Date.now() % 360},100%,50%)`;

  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(player.x, player.y + player.deadTimer, player.r, 0, Math.PI * 2);
  ctx.fill();
}

// ================== MENUS ==================
function renderLevels() {
  levelsMenu.innerHTML = `Your Level: ${level}<br>Max Level: 300`;
}

function renderStats() {
  statsMenu.innerHTML = `User: ${username}<br>Top Score: ${data.topScore}<br>Money: $${money}`;
}

function renderShop() {
  shopMenu.innerHTML = `
    <button onclick="buyBoost()">Score Boost (5s)</button><br>
    <button onclick="buyShield()">Spike Shield (5s)</button>
  `;
}

function buyBoost() {
  if (money >= 10) {
    money -= 10;
    scoreBoostTimer = 300;
  }
}

function buyShield() {
  if (money >= 25) {
    money -= 25;
    spikeShieldTimer = 300;
  }
}

function renderSkins() {
  skinsMenu.innerHTML = Object.keys(data.skins).map(k =>
    data.skins[k]
      ? `<button onclick="equip('${k}')">EQUIP ${k}</button>`
      : `<button disabled>LOCKED ${k}</button>`
  ).join("<br>");
}

function equip(c) {
  data.selected = c;
  localStorage.setItem("gd_data", JSON.stringify(data));
}

// ================== OWNER PAD ==================
window.ownerPad = function(name) {
  if (name === username) {
    data.skins.darkred = true;
    localStorage.setItem("gd_data", JSON.stringify(data));
  }
};

// ================== LOOP ==================
reset();
(function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
})();
