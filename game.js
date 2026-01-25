const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= CANVAS ================= */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ================= USER ================= */
let username = localStorage.getItem("snakeUser");
if (!username) {
  username = prompt("Enter username") || "Player";
  localStorage.setItem("snakeUser", username);
}

/* ================= BASE ================= */
const groundH = 80;
let speed = 6;
let score = 0;
let money = 0;
let gameOver = false;
let hardest = false;
let shieldTimer = 0;

/* ================= PLAYER ================= */
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  touchingOrb: false
};

/* ================= STORAGE ================= */
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
  leaderboard: []
};

/* ================= UI ================= */
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
const hardBtn = btn("HARDEST LEVEL", "10px", true);
const noteBtn = btn("OWNER NOTEPAD", null, true);

/* ================= MENUS ================= */
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

/* ================= OBJECTS ================= */
let walls = [];
let spikes = [];
let platforms = [];
let orbs = [];

/* ================= RESET ================= */
function reset() {
  score = 0;
  gameOver = false;
  shieldTimer = 0;
  walls = [];
  spikes = [];
  platforms = [];
  orbs = [];
  player.y = canvas.height - groundH - player.r;
  player.vy = 0;
}

/* ================= SPAWN ================= */
let timer = 0;

function spawnNormal() {
  const x = canvas.width + 60;

  // single wall
  walls.push({ x, w: 30, h: 60 });

  // DOUBLE WALL (same size)
  if (Math.random() < 0.4) {
    walls.push({ x: x + 40, w: 30, h: 60 });
    platforms.push({
      x: x + 40,
      y: canvas.height - groundH - 90,
      w: 60,
      h: 10
    });
  }

  // spikes SEPARATE from walls
  const spikeCount = Math.floor(Math.random() * 3) + 1;
  const spikeX = x + 90;
  for (let i = 0; i < spikeCount; i++) {
    spikes.push({ x: spikeX + i * 26, y: canvas.height - groundH, s: 22 });
  }
}

function spawnHard() {
  const x = canvas.width + 80;

  // normal wall
  walls.push({ x: x - 60, w: 30, h: 60 });

  // double wall same size
  walls.push({ x, w: 30, h: 60 });
  walls.push({ x: x + 40, w: 30, h: 60 });

  platforms.push({
    x: x + 20,
    y: canvas.height - groundH - 90,
    w: 70,
    h: 10
  });

  // 6 spikes SEPARATE
  const spikeX = x + 100;
  for (let i = 0; i < 6; i++) {
    spikes.push({ x: spikeX + i * 26, y: canvas.height - groundH, s: 22 });
  }
}

/* ================= INPUT ================= */
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

/* ================= UPDATE ================= */
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

  [...walls, ...spikes, ...platforms].forEach(o => o.x -= speed);

  spikes.forEach(s => {
    if (
      shieldTimer <= 0 &&
      player.x > s.x &&
      player.x < s.x + s.s &&
      player.y + player.r > s.y
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
    hardest ? spawnHard() : spawnNormal();
    timer = 0;
    score++;
    money++;
    unlockByScore();
  }

  if (shieldTimer > 0) shieldTimer--;

  scoreEl.textContent = `Score: ${score} | $${money}`;
}

/* ================= DRAW ================= */
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

  ctx.fillStyle = "red";
  spikes.forEach(drawSpike);

  let color = data.selected;
  if (color === "rainbow") color = `hsl(${Date.now() / 10 % 360},100%,50%)`;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= SKINS ================= */
function unlockByScore() {
  if (score >= 10) data.skins.blue = true;
  if (score >= 20) data.skins.purple = true;
  if (score >= 30) data.skins.yellow = true;
  if (!hardest && score >= 100) data.skins.rainbow = true;
  if (hardest && score >= 100) data.skins.darkred = true;
  save();
}

function renderSkins() {
  skinsMenu.innerHTML = Object.keys(data.skins).map(k =>
    `<button onclick="equip('${k}')">${data.skins[k] ? "EQUIP" : "LOCKED"} ${k}</button>`
  ).join("<br>");
}

/* ================= SHOP ================= */
function renderShop() {
  shopMenu.innerHTML = `
    Money: $${money}<br><hr>
    <button onclick="buyShield()">Spike Shield 5s ($20)</button>
  `;
}

function buyShield() {
  if (money < 20) return alert("Not enough money");
  money -= 20;
  shieldTimer = 300;
}

/* ================= STATS ================= */
function renderStats() {
  saveScore();
  statsMenu.innerHTML = data.leaderboard
    .map((e, i) => `#${i + 1} ${e.name} — ${e.score}`)
    .join("<br>");
}

/* ================= OWNER ================= */
function renderNotepad() {
  noteMenu.innerHTML = `
    <input id="ownerName" placeholder="username">
    <button onclick="unlockDark()">UNLOCK DARKRED</button>
  `;
}

function unlockDark() {
  data.skins.darkred = true;
  save();
}

/* ================= SAVE ================= */
function equip(c) {
  if (!data.skins[c]) return alert("LOCKED");
  data.selected = c;
  save();
}

function saveScore() {
  const existing = data.leaderboard.find(e => e.name === username);
  if (!existing || score > existing.score) {
    data.leaderboard = data.leaderboard.filter(e => e.name !== username);
    data.leaderboard.push({ name: username, score });
  }
  data.leaderboard.sort((a, b) => b.score - a.score);
  data.leaderboard = data.leaderboard.slice(0, 100);
  save();
}

function save() {
  localStorage.setItem("snakeData", JSON.stringify(data));
}

/* ================= LOOP ================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
