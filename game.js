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
let level = 1;
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

function btn(text, top, right = false, center = false) {
  const b = document.createElement("button");
  b.textContent = text;
  b.style.position = "fixed";

  if (center) {
    b.style.left = "50%";
    b.style.transform = "translateX(-50%)";
    b.style.bottom = "10px";
  } else {
    b.style[top ? "top" : "bottom"] = top || "10px";
    b.style[right ? "right" : "left"] = "10px";
  }

  b.style.zIndex = 10;
  document.body.appendChild(b);
  return b;
}

const skinsBtn = btn("Skins", "40px");
const statsBtn = btn("Stats", "70px");
const shopBtn = btn("Shop", "100px");
const hardBtn = btn("HARDEST", "10px", true);
const noteBtn = btn("OWNER PAD", null, true);
const levelBtn = btn("LEVELS", null, false, true);

// ================== MENUS ==================
function menu(top, right = false) {
  const d = document.createElement("div");
  d.style.position = "fixed";
  d.style[top ? "top" : "bottom"] = top || "50px";
  d.style[right ? "right" : "left"] = "10px";
  d.style.background = "#222";
  d.style.color = "white";
  d.style.padding = "10px";
  d.style.display = "none";
  d.style.zIndex = 10;
  document.body.appendChild(d);
  return d;
}

const skinsMenu = menu("140px");
const statsMenu = menu("140px");
const shopMenu = menu("140px");
const noteMenu = menu(null, true);
const levelMenu = menu(null, false);

skinsBtn.onclick = () => toggle(skinsMenu, renderSkins);
statsBtn.onclick = () => toggle(statsMenu, renderStats);
shopBtn.onclick = () => toggle(shopMenu, renderShop);
noteBtn.onclick = () => toggle(noteMenu, renderNotepad);
levelBtn.onclick = () => toggle(levelMenu, renderLevels);

hardBtn.onclick = () => {
  hardest = !hardest;
  reset();
};

function toggle(m, r) {
  [skinsMenu, statsMenu, shopMenu, noteMenu, levelMenu].forEach(x => x.style.display = "none");
  m.style.display = "block";
  r();
}

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
  const x = canvas.width + 120;
  walls.push({ x, w: 30, h: 60, passed: false });

  if (Math.random() < 0.4) {
    walls.push({ x: x + 40, w: 30, h: 60, passed: false });
    platforms.push({
      x: x - 10,
      y: canvas.height - groundH - 65,
      w: 130,
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

  // BIG WALL
  if (Math.random() < 0.4) {
    walls.push({ x, w: 70, h: 150, passed: false });

    // ORB 1 (normal boost)
    orbs.push({
      x: x - 40,
      y: canvas.height - groundH - 60,
      power: 14
    });

    // ORB 2 (SAFE BOOST)
    orbs.push({
      x: x + 20,
      y: canvas.height - groundH - 95,
      power: 18
    });

    // SAFE PLATFORM (slightly higher)
    platforms.push({
      x: x + 10,
      y: canvas.height - groundH - 165,
      w: 90,
      h: 10
    });

    // SPIKES
    for (let i = 0; i < 6; i++) {
      spikes.push({ x: x + 220 + i * 28, y: canvas.height - groundH, s: 22 });
    }
    return;
  }

  // DOUBLE WALL
  if (Math.random() < 0.3) {
    walls.push({ x, w: 30, h: 70, passed: false });
    walls.push({ x: x + 40, w: 30, h: 70, passed: false });
    platforms.push({
      x: x - 5,
      y: canvas.height - groundH - 60,
      w: 120,
      h: 10
    });
  }

  const spikeCount = Math.random() < 0.5 ? 3 : 2;
  for (let i = 0; i < spikeCount; i++) {
    spikes.push({ x: x + 200 + i * 30, y: canvas.height - groundH, s: 22 });
  }

  if (Math.random() < 0.5) {
    walls.push({ x, w: 30, h: 60, passed: false });
  }
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

  const groundY = canvas.height - groundH - player.r;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...orbs].forEach(o => o.x -= speed);

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

  level = Math.min(300, Math.floor(score / 5) + 1);
  localStorage.setItem("snakeMoney", money);
  scoreEl.textContent = `Score: ${score} | $${money} | Lv: ${level}`;
}

// ================== DRAW ==================
function drawSpike(s) {
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x + s.s / 2, s.y - s.s);
  ctx.lineTo(s.x + s.s, s.y);
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

  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "red";
  spikes.forEach(drawSpike);

  let color = data.selected;
  if (color === "rainbow")
    color = `hsl(${Date.now() / 10 % 360},100%,50%)`;

  ctx.fillStyle = color;
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
