// ======================================================
// GAME.JS
// Geometry-Dash-Style Runner
// FULL CLEAN REBUILD — ITCH.IO READY
// ======================================================
let ufoMode = false;
let ufoGravity = 0.35;
let portalSpawned = false;

// ======================================================
// ====================== CANVAS =========================
// ======================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);



// ======================================================
// ====================== USER ===========================
// ======================================================

let username = localStorage.getItem("gd_user");

if (!username) {
  username = prompt("Enter username") || "Player";
  localStorage.setItem("gd_user", username);
}



// ======================================================
// ================== BASE CONFIG ========================
// ======================================================

const GROUND_HEIGHT = 80;
const GRAVITY = 0.8;

let GAME_SPEED = 6;

const MAX_LEVEL = 300;



// ======================================================
// =================== GAME STATE ========================
// ======================================================

let score = 0;
let level = Number(localStorage.getItem("gd_level")) || 1;
let money = Number(localStorage.getItem("gd_money")) || 0;

let gameOver = false;
let beatGame = false;
let hardestMode = false;



// ======================================================
// =================== POWER UPS =========================
// ======================================================

let scoreBoostTimer = 0;
let spikeShieldTimer = 0;



// ======================================================
// ===================== PLAYER ==========================
// ======================================================

const player = {
  x: 160,
  y: 0,
  radius: 14,
  vy: 0,
  onGround: false,
  touchingOrb: null,
  deathAnim: 0
};



// ======================================================
// ===================== STORAGE =========================
// ======================================================

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



// ======================================================
// ======================= UI ============================
// ======================================================

const scoreEl = document.getElementById("score");

function makeButton(text, top) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.style.position = "fixed";
  btn.style.left = "10px";
  btn.style.top = top;
  btn.style.zIndex = "10";
  document.body.appendChild(btn);
  return btn;
}

const btnHard = makeButton("HARDEST", "10px");
const btnSkins = makeButton("Skins", "40px");
const btnStats = makeButton("Stats", "70px");
const btnShop = makeButton("Shop", "100px");
const btnLevels = makeButton("Levels", "130px");



// ======================================================
// ====================== MENUS ==========================
// ======================================================

function makeMenu(top) {
  const menu = document.createElement("div");
  menu.style.position = "fixed";
  menu.style.left = "10px";
  menu.style.top = top;
  menu.style.background = "#222";
  menu.style.color = "#fff";
  menu.style.padding = "10px";
  menu.style.display = "none";
  menu.style.zIndex = "10";
  document.body.appendChild(menu);
  return menu;
}

const skinsMenu = makeMenu("170px");
const statsMenu = makeMenu("170px");
const shopMenu = makeMenu("170px");
const levelsMenu = makeMenu("170px");

function toggleMenu(menu, renderFn) {
  [skinsMenu, statsMenu, shopMenu, levelsMenu].forEach(m => {
    m.style.display = "none";
  });
  menu.style.display = "block";
  renderFn();
}



// ======================================================
// =================== MENU EVENTS =======================
// ======================================================

btnSkins.onclick = () => toggleMenu(skinsMenu, renderSkins);
btnStats.onclick = () => toggleMenu(statsMenu, renderStats);
btnShop.onclick = () => toggleMenu(shopMenu, renderShop);
btnLevels.onclick = () => toggleMenu(levelsMenu, renderLevels);

btnHard.onclick = () => {
  hardestMode = !hardestMode;
  resetGame();
};



// ======================================================
// ================= OBJECT ARRAYS =======================
// ======================================================

let walls = [];
let spikes = [];
let platforms = [];
let orbs = [];
let portals = [];


// ======================================================
// ===================== RESET ===========================
// ======================================================

function resetGame() {
  score = 0;
  gameOver = false;
  beatGame = false;

  player.vy = 0;
  player.deathAnim = 0;

  walls = [];
  spikes = [];
  platforms = [];
  orbs = [];

  player.y = canvas.height - GROUND_HEIGHT - player.radius;
}



// ======================================================
// ==================== SPAWNING =========================
// ======================================================

let spawnTimer = 0;



// ------------------------------------------------------
// NORMAL MODE SPAWN
// PLATFORM IS LOWER (FAIR)
// ------------------------------------------------------

function spawnNormal() {
  const startX = canvas.width + 120;

  // Single wall
  walls.push({
    x: startX,
    w: 30,
    h: 70,
    passed: false
  });

  // Double wall
  walls.push({
    x: startX + 42,
    w: 30,
    h: 70,
    passed: false
  });

  // PLATFORM — LOWER THAN BEFORE
  platforms.push({
    x: startX - 20,
    y: canvas.height - GROUND_HEIGHT - 85, // LOWERED
    w: 140,
    h: 14
  });

  // Spikes (1–3)
  const spikeCount = 1 + Math.floor(Math.random() * 3);

  for (let i = 0; i < spikeCount; i++) {
    spikes.push({
      x: startX + 220 + i * 28,
      y: canvas.height - GROUND_HEIGHT,
      size: 26
    });
  }
}



// ------------------------------------------------------
// HARDEST MODE SPAWN
// PLATFORM EVEN LOWER (BUT STILL JUMPABLE)
// ------------------------------------------------------

function spawnHard() {
  const startX = canvas.width + 140;

  // Smaller wall
  walls.push({
    x: startX,
    w: 26,
    h: 60,
    passed: false
  });

  // Double wall
  walls.push({
    x: startX + 36,
    w: 26,
    h: 60,
    passed: false
  });

  // PLATFORM — EVEN LOWER
  platforms.push({
    x: startX - 20,
    y: canvas.height - GROUND_HEIGHT - 65, // EVEN LOWER
    w: 150,
    h: 14
  });

  // 6 spikes
  for (let i = 0; i < 6; i++) {
    spikes.push({
      x: startX + 240 + i * 26,
      y: canvas.height - GROUND_HEIGHT,
      size: 26
    });
  }

  // Orb above spikes
  orbs.push({
    x: startX + 240 + 3 * 26,
    y: canvas.height - GROUND_HEIGHT - 80,
    power: 16
  });
}



// ======================================================
// ====================== INPUT ==========================
// ======================================================

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



// ======================================================
// ====================== UPDATE =========================
// ======================================================

function update() {
  if (gameOver) {
    player.deathAnim += 2;
    return;
  }
// Spawn UFO portal at score 30 (HARDEST only)
if (hardest && score >= 30 && !portalSpawned) {
  portals.push({
    x: canvas.width + 200,
    y: canvas.height - groundH - 120,
    r: 22
  });
  portalSpawned = true;
}
  
  // Gravity
  player.vy += ufoMode ? ufoGravity : gravity;
  player.y += player.vy;

  const groundY = canvas.height - GROUND_HEIGHT - player.radius;
  player.onGround = false;

  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  // Move objects
  [...walls, ...spikes, ...platforms, ...orbs].forEach(o => {
    o.x -= GAME_SPEED;
  });

  // Orb collision
  player.touchingOrb = null;
  orbs.forEach(o => {
    if (
      Math.abs(player.x - o.x) < 14 &&
      Math.abs(player.y - o.y) < 14
    ) {
      player.touchingOrb = o;
    }
  });
  
// Portal detection
portals.forEach(p => {
  if (
    Math.abs(player.x - p.x) < p.r &&
    Math.abs(player.y - p.y) < p.r
  ) {
    ufoMode = true;
  }
});

  // PLATFORM COLLISION (SAFE)
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
  money += 1; // 💰 +1 money per score
  w.passed = true;
}

  // Spikes
  spikes.forEach(s => {
    if (
      player.x > s.x &&
      player.x < s.x + s.size &&
      player.y + player.radius > s.y - s.size
    ) {
      if (spikeShieldTimer <= 0) {
        gameOver = true;
      }
    }
  });

  // Timers
  if (scoreBoostTimer > 0) scoreBoostTimer--;
  if (spikeShieldTimer > 0) spikeShieldTimer--;

  // Spawn logic
  spawnTimer++;
  if (spawnTimer > 120) {
    hardestMode ? spawnHard() : spawnNormal();
    spawnTimer = 0;
  }

  // Level
  level = Math.min(MAX_LEVEL, Math.floor(score / 5) + 1);

  if (level === MAX_LEVEL && !beatGame) {
    beatGame = true;
    alert("🏆 YOU BEAT THE GAME!");
  }

  // Save
  saveData.topScore = Math.max(saveData.topScore, score);
  localStorage.setItem("gd_level", level);
  localStorage.setItem("gd_money", money);
  localStorage.setItem("gd_data", JSON.stringify(saveData));

  scoreEl.textContent = `Score: ${score} | Lv: ${level}`;
}



// ======================================================
// ====================== DRAW ===========================
// ======================================================

function drawSpike(s) {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x + s.size / 2, s.y - s.size);
  ctx.lineTo(s.x + s.size, s.y);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.fillStyle = hardestMode ? "#300" : "#000";
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
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  // Spikes
  spikes.forEach(drawSpike);

  // Orbs
  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Player
  let color = saveData.selected;
  if (color === "darkred") color = "#7a0000";
  if (color === "rainbow") {
    color = `hsl(${Date.now() % 360},100%,50%)`;
  }

  ctx.fillStyle = color;
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



// ======================================================
// ====================== MENUS ==========================
// ======================================================

function renderLevels() {
  levelsMenu.innerHTML = `
    Your Level: ${level}<br>
    Max Level: ${MAX_LEVEL}
  `;
}

function renderStats() {
  statsMenu.innerHTML = `
    User: ${username}<br>
    Top Score: ${saveData.topScore}<br>
    Money: $${money}
  `;
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
  skinsMenu.innerHTML = Object.keys(saveData.skins)
    .map(s =>
      saveData.skins[s]
        ? `<button onclick="equipSkin('${s}')">${s}</button>`
        : `<button disabled>${s} (LOCKED)</button>`
    )
    .join("<br>");
}

function equipSkin(skin) {
  saveData.selected = skin;
  localStorage.setItem("gd_data", JSON.stringify(saveData));
}



// ======================================================
// ===================== OWNER PAD =======================
// ======================================================

window.ownerPad = function(name) {
  if (name === username) {
    saveData.skins.darkred = true;
    localStorage.setItem("gd_data", JSON.stringify(saveData));
  }
};



// ======================================================
// ====================== LOOP ===========================
// ======================================================

resetGame();

(function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
})();
