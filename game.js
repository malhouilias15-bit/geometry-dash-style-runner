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
let lastLevel = level; // 🔥 NEW

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

// 🔥 LEVEL UP TEXT
let levelUpTextTimer = 0;

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
const levelMenu = menu(null, false);

skinsBtn.onclick = () => toggle(skinsMenu, renderSkins);
statsBtn.onclick = () => toggle(statsMenu, renderStats);
shopBtn.onclick = () => toggle(shopMenu, renderShop);
levelBtn.onclick = () => toggle(levelMenu, renderLevels);

hardBtn.onclick = () => {
  hardest = !hardest;
  reset();
};

function toggle(m, r) {
  [skinsMenu, statsMenu, shopMenu, levelMenu].forEach(x => x.style.display = "none");
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

  const spikeX = x + 220;
  for (let i = 0; i < 3; i++) {
    spikes.push({ x: spikeX + i * 30, y: canvas.height - groundH, s: 22 });
  }
}

function spawnHard() {
  const x = canvas.width + 150;

  if (Math.random() < 0.4) {
    walls.push({ x, w: 70, h: 150, passed: false });

    orbs.push({ x: x - 60, y: canvas.height - groundH - 55, power: 14 });

    platforms.push({
      x: x + 10,
      y: canvas.height - groundH - 165,
      w: 90,
      h: 10
    });

    for (let i = 0; i < 6; i++) {
      spikes.push({ x: x + 220 + i * 28, y: canvas.height - groundH, s: 22 });
    }

    orbs.push({
      x: x + 220 + 2.5 * 28,
      y: canvas.height - groundH - 50,
      power: 16
    });
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

  if (scoreBoost > 0) scoreBoost--;
  if (spikeShield > 0) spikeShield--;

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
      score += scoreBoost > 0 ? 2 : 1;
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

  level = Math.min(300, Math.floor(score / 5) + 1);
  if (level > lastLevel) {
    levelUpTextTimer = 120; // 🔥
    lastLevel = level;
  }

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

  let color = data.selected;
  if (color === "darkred") color = "#7a0000";
  if (color === "rainbow") color = `hsl(${Date.now() / 10 % 360},100%,50%)`;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  // 🔥 LEVEL UP TEXT
  if (levelUpTextTimer > 0) {
    ctx.globalAlpha = levelUpTextTimer / 120;
    ctx.fillStyle = "gold";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU LEVELED UP!", canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 1;
    levelUpTextTimer--;
  }
}

// ================== MENUS ==================
function renderLevels() {
  levelMenu.innerHTML = `<b>LEVEL</b><br>Your Level: ${level}`;
}

function renderStats() {
  statsMenu.innerHTML = `User: ${username}<br>Top Score: ${data.topScore}<br>Money: $${money}`;
}

function renderShop() {
  shopMenu.innerHTML = `
    Money: $${money}<br>
    <button onclick="buyBoost()">Score Boost ($10)</button><br>
    <button onclick="buyShield()">Spike Shield ($25)</button>
  `;
}

function buyBoost() {
  if (money < 10) return;
  money -= 10;
  scoreBoost = 300;
}

function buyShield() {
  if (money < 25) return;
  money -= 25;
  spikeShield = 300;
}

function renderSkins() {
  skinsMenu.innerHTML = `
    ${skinBtn("green",0)}
    ${skinBtn("blue",10)}
    ${skinBtn("purple",20)}
    ${skinBtn("yellow",30)}
    ${skinBtn("darkred",50)}
    ${skinBtn("rainbow",100)}
  `;
}

function skinBtn(c, req) {
  if (data.skins[c]) return `<button onclick="equip('${c}')">EQUIP ${c}</button><br>`;
  if (score >= req) {
    data.skins[c] = true;
    save();
    return `<button onclick="equip('${c}')">EQUIP ${c}</button><br>`;
  }
  return `<button disabled>LOCKED ${c}</button><br>`;
}

function equip(c) {
  data.selected = c;
  save();
}

function save() {
  localStorage.setItem("snakeData", JSON.stringify(data));
}

// ================== LOOP ==================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
