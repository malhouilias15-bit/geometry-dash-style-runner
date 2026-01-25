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

let spikeShield = 0;
let scoreBoost = 0;

/* ================= PLAYER ================= */
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  jumped: false
};

/* ================= STORAGE ================= */
let data = JSON.parse(localStorage.getItem("snakeData")) || {
  skins: {
    green: true,
    blue: true,
    purple: true,
    yellow: true,
    rainbow: false
  },
  selected: "green",
  leaderboard: [],
  topScore: 0
};

/* ================= UI ================= */
const scoreEl = document.getElementById("score");

function btn(text, top) {
  const b = document.createElement("button");
  b.textContent = text;
  b.style.position = "fixed";
  b.style.top = top;
  b.style.left = "10px";
  b.style.zIndex = 10;
  document.body.appendChild(b);
  return b;
}

const skinsBtn = btn("Skins", "40px");
const statsBtn = btn("Stats", "70px");
const shopBtn = btn("Shop", "100px");

/* ================= MENUS ================= */
function menu(top) {
  const d = document.createElement("div");
  d.style.position = "fixed";
  d.style.top = top;
  d.style.left = "10px";
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

skinsBtn.onclick = () => toggle(skinsMenu, renderSkins);
statsBtn.onclick = () => toggle(statsMenu, renderStats);
shopBtn.onclick = () => toggle(shopMenu, renderShop);

function toggle(m, r) {
  [skinsMenu, statsMenu, shopMenu].forEach(x => x.style.display = "none");
  m.style.display = "block";
  r();
}

/* ================= OBJECTS ================= */
let walls = [];
let spikes = [];

/* ================= RESET ================= */
function reset() {
  score = 0;
  money = 0;
  gameOver = false;
  spikeShield = 0;
  scoreBoost = 0;
  walls = [];
  spikes = [];
  player.y = canvas.height - groundH - player.r;
  player.vy = 0;
}
reset();

/* ================= SPAWN ================= */
let timer = 0;

function spawnSet() {
  const baseX = canvas.width + 100;

  walls.push({
    x: baseX,
    w: 30,
    h: 60,
    passed: false
  });

  // FAIR GAP BEFORE SPIKES
  const spikeX = baseX + 120;
  const count = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < count; i++) {
    spikes.push({
      x: spikeX + i * 28,
      y: canvas.height - groundH,
      s: 22
    });
  }
}

/* ================= INPUT ================= */
function jump() {
  if (player.onGround) {
    player.vy = -12;
    player.onGround = false;
    player.jumped = true;
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
    player.jumped = false;
  }

  walls.forEach(w => w.x -= speed);
  spikes.forEach(s => s.x -= speed);

  // WALL COLLISION + SCORE BOOST
  walls.forEach(w => {
    if (
      player.x > w.x &&
      !w.passed &&
      player.jumped
    ) {
      score += scoreBoost > 0 ? 2 : 1;
      money++;
      w.passed = true;
    }

    if (
      player.x + player.r > w.x &&
      player.x - player.r < w.x + w.w &&
      player.y + player.r > canvas.height - groundH - w.h
    ) {
      gameOver = true;
    }
  });

  // SPIKES
  spikes.forEach(s => {
    if (
      player.x > s.x &&
      player.x < s.x + s.s &&
      player.y + player.r > s.y
    ) {
      if (spikeShield <= 0) gameOver = true;
    }
  });

  timer++;
  if (timer > 120) {
    spawnSet();
    timer = 0;
  }

  if (spikeShield > 0) spikeShield--;
  if (scoreBoost > 0) scoreBoost--;

  if (score > data.topScore) data.topScore = score;
  if (score >= 100) data.skins.rainbow = true;

  scoreEl.textContent = `Score: ${score} | $${money}`;
}

/* ================= DRAW ================= */
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundH, canvas.width, groundH);

  ctx.fillStyle = "gray";
  walls.forEach(w =>
    ctx.fillRect(w.x, canvas.height - groundH - w.h, w.w, w.h)
  );

  ctx.fillStyle = "red";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.s / 2, s.y - s.s);
    ctx.lineTo(s.x + s.s, s.y);
    ctx.fill();
  });

  let color = data.selected;
  if (color === "rainbow")
    color = `hsl(${Date.now() / 10 % 360},100%,50%)`;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= SKINS ================= */
function renderSkins() {
  skinsMenu.innerHTML = Object.keys(data.skins).map(k =>
    `<button onclick="equip('${k}')">
      ${data.skins[k] ? "EQUIP" : "LOCKED"} ${k}
    </button>`
  ).join("<br>");
}

function equip(c) {
  if (!data.skins[c]) return;
  data.selected = c;
  save();
}

/* ================= SHOP ================= */
function renderShop() {
  shopMenu.innerHTML = `
    Money: $${money}<br><br>
    <button onclick="buyBoost()">$10 Score Boost (5s)</button><br>
    <button onclick="buyShield()">$20 Spike Shield (5s)</button>
  `;
}

function buyBoost() {
  if (money < 10) return;
  money -= 10;
  scoreBoost = 300;
}

function buyShield() {
  if (money < 20) return;
  money -= 20;
  spikeShield = 300;
}

/* ================= STATS ================= */
function renderStats() {
  saveScore();
  statsMenu.innerHTML = `
    User: ${username}<br>
    Top Score: ${data.topScore}<br>
    Money: $${money}<br><br>
    <b>Leaderboard</b><br>
    ${data.leaderboard.map((e,i)=>`#${i+1} ${e.name}: ${e.score}`).join("<br>")}
  `;
}

/* ================= SAVE ================= */
function saveScore() {
  const ex = data.leaderboard.find(e => e.name === username);
  if (!ex || score > ex.score) {
    data.leaderboard = data.leaderboard.filter(e => e.name !== username);
    data.leaderboard.push({ name: username, score });
  }
  data.leaderboard.sort((a,b)=>b.score-a.score);
  data.leaderboard = data.leaderboard.slice(0,10);
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
loop();
