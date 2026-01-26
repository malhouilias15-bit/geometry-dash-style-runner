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

  // wall
  walls.push({ x, w: 30, h: 60, passed: false });

  // DOUBLE WALL + PLATFORM (FIXED)
  if (Math.random() < 0.4) {
    walls.push({ x: x + 40, w: 30, h: 60, passed: false });

    platforms.push({
      x: x - 10,
      y: canvas.height - groundH - 70, // LOWER
      w: 130, // LONGER
      h: 10
    });
  }

  // SPIKES (FAIR GAP)
  const spikeX = x + 220;
  for (let i = 0; i < 3; i++) {
    spikes.push({
      x: spikeX + i * 30,
      y: canvas.height - groundH,
      s: 22
    });
  }
}

function spawnHard() {
  const x = canvas.width + 150;

  // ===== BIG WALL (40% chance) =====
  if (Math.random() < 0.4) {
    walls.push({ x, w: 70, h: 150, passed: false });

    // ONE ORB ATTACHED TO WALL (manual jump)
    orbs.push({
      x: x + 35,
      y: canvas.height - groundH - 90
    });

    // PLATFORM ABOVE (escape block)
    platforms.push({
      x: x + 10,
      y: canvas.height - groundH - 150,
      w: 80,
      h: 10
    });

    // 6 SPIKES + ORB (manual jump)
    for (let i = 0; i < 6; i++) {
      spikes.push({
        x: x + 220 + i * 28,
        y: canvas.height - groundH,
        s: 22
      });
    }

    orbs.push({
      x: x + 260,
      y: canvas.height - groundH - 40
    });

    return;
  }

  // ===== DOUBLE WALL + LOWER PLATFORM =====
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

  // ===== TRIPLE / DOUBLE SPIKES =====
  const spikeCount = Math.random() < 0.5 ? 3 : 2;
  for (let i = 0; i < spikeCount; i++) {
    spikes.push({
      x: x + 200 + i * 30,
      y: canvas.height - groundH,
      s: 22
    });
  }

  // ===== NORMAL WALL =====
  if (Math.random() < 0.5) {
    walls.push({ x, w: 30, h: 60, passed: false });
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
  if (gameOver) return;

  if (hardest && score >= 100) {
  gameOver = true;
  alert("🏆 YOU BEAT THE GAME!");
  return;
}

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

  // WALL COLLISION
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

  // SPIKES — FIXED HITBOX (THE MAIN BUG)
  spikes.forEach(s => {
    if (
      player.x + player.r > s.x &&
      player.x - player.r < s.x + s.s &&
      player.y + player.r > s.y - s.s
    ) {
      if (spikeShield <= 0) gameOver = true;
    }
  });

  // PLATFORMS
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
  if (score >= 70) speed = 8;
if (score >= 70 && hardest) {
  speed = 9;
}

  if (spikeShield > 0) spikeShield--;
  if (scoreBoost > 0) scoreBoost--;

  if (score > data.topScore) data.topScore = score;

  // SKIN UNLOCKS (UNCHANGED)
  if (!hardest && score >= 10) data.skins.blue = true;
  if (!hardest && score >= 20) data.skins.purple = true;
  if (!hardest && score >= 30) data.skins.yellow = true;
  if (!hardest && score >= 100) data.skins.rainbow = true;
  if (hardest && score >= 100) data.skins.darkred = true;

  scoreEl.textContent = `Score: ${score} | $${money}`;
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

// ================== MENUS ==================
function renderSkins() {
  skinsMenu.innerHTML = `
    <button onclick="equip('green')">EQUIP green</button><br>
    <button onclick="equip('blue')">${data.skins.blue ? "EQUIP" : "LOCKED"} blue (10)</button><br>
    <button onclick="equip('purple')">${data.skins.purple ? "EQUIP" : "LOCKED"} purple (20)</button><br>
    <button onclick="equip('yellow')">${data.skins.yellow ? "EQUIP" : "LOCKED"} yellow (30)</button><br>
    <button onclick="equip('rainbow')">${data.skins.rainbow ? "EQUIP" : "LOCKED"} rainbow (100)</button><br>
    <button onclick="equip('darkred')">${data.skins.darkred ? "EQUIP" : "LOCKED"} darkred (100 hard)</button>
  `;
}

function equip(c) {
  if (!data.skins[c]) return;
  data.selected = c;
  save();
}

function renderShop() {
  shopMenu.innerHTML = `
    Money: $${money}<br><br>
    <button onclick="buyBoost()">Score Boost $10 (5s)</button><br>
    <button onclick="buyShield()">Spike Shield $20 (5s)</button>
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

function renderStats() {
  saveScore();
  statsMenu.innerHTML = `
    User: ${username}<br>
    Top Score: ${data.topScore}<br>
    Money: $${money}<br><br>
    ${data.leaderboard.map((e,i)=>`#${i+1} ${e.name} — ${e.score}`).join("<br>")}
  `;
}

function renderNotepad() {
  noteMenu.innerHTML = `
    <b>OWNER PAD</b><br><br>
    <input id="giveUser" placeholder="username" style="width:140px"><br><br>
    <button onclick="giveDarkred()">Give DarkRed</button>
  `;
}

function unlockDark() {
  function giveDarkred() {
  const user = document.getElementById("giveUser").value.trim();
  if (!user) return;

  let allUsers = JSON.parse(localStorage.getItem("snakeAllUsers")) || {};

  if (!allUsers[user]) {
    allUsers[user] = {
      skins: { darkred: true }
    };
  } else {
    allUsers[user].skins = allUsers[user].skins || {};
    allUsers[user].skins.darkred = true;
  }

  localStorage.setItem("snakeAllUsers", JSON.stringify(allUsers));

  // if it's YOU, unlock instantly
  if (user === username) {
    data.skins.darkred = true;
    save();
  }

  alert(`DarkRed given to ${user}`);
}

  data.skins.darkred = true;
  save();
}

// ================== SAVE ==================
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

// ================== LOOP ==================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
