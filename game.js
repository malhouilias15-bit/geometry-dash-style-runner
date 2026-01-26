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
let money = 0;
let gameOver = false;
let hardest = false;
let beatGame = false;

let spikeShield = 0;
let scoreBoost = 0;

// ================== PLAYER ==================
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  touchingOrb: false
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

function btn(text, top, right = false) {
  const b = document.createElement("button");
  b.textContent = text;
  b.style.position = "fixed";
  b.style[top ? "top" : "bottom"] = top || "10px";
  b.style[right ? "right" : "left"] = "10px";
  b.style.zIndex = 10;
  document.body.appendChild(b);
  return b;
}

const skinsBtn = btn("Skins", "40px");
const statsBtn = btn("Stats", "70px");
const shopBtn = btn("Shop", "100px");
const hardBtn = btn("HARDEST", "10px", true);
const noteBtn = btn("OWNER PAD", null, true);

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

skinsBtn.onclick = () => toggle(skinsMenu, renderSkins);
statsBtn.onclick = () => toggle(statsMenu, renderStats);
shopBtn.onclick = () => toggle(shopMenu, renderShop);
noteBtn.onclick = () => toggle(noteMenu, renderNotepad);

hardBtn.onclick = () => {
  hardest = !hardest;
  reset();
};

function toggle(m, r) {
  [skinsMenu, statsMenu, shopMenu, noteMenu].forEach(x => x.style.display = "none");
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
  money = 0;
  gameOver = false;
  beatGame = false;
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

function spawnHard() {
  const x = canvas.width + 140;

  // 40% BIG WALL
  if (Math.random() < 0.4) {
    walls.push({ x, w: 70, h: 150, passed: false });

    // SINGLE ORB ATTACHED TO WALL
    orbs.push({
      x: x + 20,
      y: canvas.height - groundH - 100
    });

    platforms.push({
      x: x + 40,
      y: canvas.height - groundH - 160,
      w: 60,
      h: 10
    });

    // 6 SPIKES + ORB
    orbs.push({
      x: x + 170,
      y: canvas.height - groundH - 80
    });

    for (let i = 0; i < 6; i++) {
      spikes.push({
        x: x + 200 + i * 28,
        y: canvas.height - groundH,
        s: 22
      });
    }
    return;
  }

  // DOUBLE WALL + PLATFORM
  if (Math.random() < 0.5) {
    walls.push({ x, w: 30, h: 60, passed: false });
    walls.push({ x: x + 40, w: 30, h: 60, passed: false });

    platforms.push({
      x: x - 10,
      y: canvas.height - groundH - 70,
      w: 130,
      h: 10
    });
  } else {
    // NORMAL WALL
    walls.push({ x, w: 30, h: 60, passed: false });
  }

  // DOUBLE OR TRIPLE SPIKES
  const spikeCount = Math.random() < 0.5 ? 2 : 3;
  for (let i = 0; i < spikeCount; i++) {
    spikes.push({
      x: x + 220 + i * 30,
      y: canvas.height - groundH,
      s: 22
    });
  }
}

// ================== INPUT ==================
function jump() {
  if (player.touchingOrb) {
    player.vy = -14;
    player.touchingOrb = false;
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
  if (gameOver || beatGame) return;

  player.vy += 0.8;
  player.y += player.vy;

  const groundY = canvas.height - groundH - player.r;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...orbs].forEach(o => o.x -= speed);

  player.touchingOrb = false;
  orbs.forEach(o => {
    if (
      player.x + player.r > o.x - 8 &&
      player.x - player.r < o.x + 8 &&
      player.y + player.r > o.y - 8 &&
      player.y - player.r < o.y + 8
    ) player.touchingOrb = true;
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
    ) gameOver = true;
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
    spawnHard();
    timer = 0;
  }

  if (score >= 70) speed = 9;
  if (score >= 85) speed = 10;

  if (score >= 100) beatGame = true;

  scoreEl.textContent = beatGame
    ? "YOU BEAT THE GAME!"
    : `Score: ${score} | $${money}`;
}

// ================== DRAW ==================
function draw() {
  ctx.fillStyle = "#300";
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

  ctx.fillStyle = data.selected;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
}

// ================== LOOP ==================
reset();
(function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
})();
