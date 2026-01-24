const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= OWNER ================= */
const OWNER_USERNAME = "SlitherySerpent734";

/* ================= RESIZE ================= */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ================= USER ================= */
let username = localStorage.getItem("username");
if (!username) {
  username = "Snake_" + Math.floor(Math.random() * 9000 + 1000);
  localStorage.setItem("username", username);
}

/* ================= UI ================= */
const scoreEl = document.getElementById("score");

/* ================= STORAGE ================= */
let money = +localStorage.getItem("money") || 0;
let topScore = +localStorage.getItem("topScore") || 0;
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
let unlockedSkins = JSON.parse(localStorage.getItem("unlockedSkins")) || {
  green: true,
  selected: "green"
};
let snakeSkin = unlockedSkins.selected;

/* ================= GAME STATE ================= */
let demonMode = false;
let score = 0;
let speed = 5.9;
let gameOver = false;
const groundHeight = 80;

/* ================= POWERUPS ================= */
let shieldTimer = 0;
let scoreBoostTimer = 0;

/* ================= BUTTONS ================= */
function makeBtn(text, top, right = "20px", bottom = null) {
  const b = document.createElement("button");
  b.textContent = text;
  Object.assign(b.style, {
    position: "fixed",
    top,
    right,
    bottom,
    padding: "10px",
    zIndex: 20
  });
  document.body.appendChild(b);
  return b;
}

const demonBtn = makeBtn("HARDEST LEVEL", "10px");
demonBtn.style.background = "darkred";
demonBtn.style.color = "white";
demonBtn.onclick = () => {
  demonMode = !demonMode;
  resetGame();
};

const shopBtn = makeBtn("SHOP", "50px");
const statsBtn = makeBtn("STATS", "90px");
const skinsBtn = makeBtn("SKINS", "130px");

/* ===== OWNER NOTEPAD (RESTORED) ===== */
if (username === OWNER_USERNAME) {
  const ownerBtn = makeBtn("OWNER NOTEPAD", null, "20px", "20px");
  ownerBtn.onclick = () => {
    const target = prompt("Give darkred to username:");
    if (!target) return;

    const forced = JSON.parse(localStorage.getItem("forcedDarkRed")) || {};
    forced[target] = true;
    localStorage.setItem("forcedDarkRed", JSON.stringify(forced));
    alert("Applied darkred skin.");
  };
}

/* ================= MENUS ================= */
function makeMenu(top) {
  const d = document.createElement("div");
  Object.assign(d.style, {
    position: "fixed",
    top,
    right: "20px",
    background: "#222",
    color: "white",
    padding: "12px",
    display: "none",
    zIndex: 20
  });
  document.body.appendChild(d);
  return d;
}

const shopMenu = makeMenu("170px");
const statsMenu = makeMenu("170px");
const skinsMenu = makeMenu("170px");

function toggle(menu) {
  [shopMenu, statsMenu, skinsMenu].forEach(m => m.style.display = "none");
  menu.style.display = "block";
  if (menu === skinsMenu) renderSkins();
  if (menu === statsMenu) updateStats();
}

shopBtn.onclick = () => toggle(shopMenu);
statsBtn.onclick = () => toggle(statsMenu);
skinsBtn.onclick = () => toggle(skinsMenu);

/* ================= SHOP ================= */
shopMenu.innerHTML = `
<button id="buyShield">Spike Shield ($25)</button><br><br>
<button id="buyBoost">Score Boost ($10)</button>
`;

document.getElementById("buyShield").onclick = () => {
  if (money >= 25) {
    money -= 25;
    shieldTimer = 300;
    save();
  }
};

document.getElementById("buyBoost").onclick = () => {
  if (money >= 10) {
    money -= 10;
    scoreBoostTimer = 300;
    save();
  }
};

/* ================= SKINS (WITH REQUIREMENTS TEXT) ================= */
function renderSkins() {
  skinsMenu.innerHTML = `
<button ${unlockedSkins.green ? "disabled" : ""}>GREEN (default)</button><br>
${skinLine("blue", "Score 10")}
${skinLine("purple", "Score 20")}
${skinLine("yellow", "Score 30")}
${skinLine("orange", "Score 40")}
${skinLine("rainbow", "Score 100")}
${skinLine("darkred", "Score 100 (HARDEST)")}
`;
}

function skinLine(name, req) {
  if (!unlockedSkins[name]) {
    return `<div style="opacity:.5">${name.toUpperCase()} — ${req}</div><br>`;
  }
  if (unlockedSkins.selected === name) {
    return `<button disabled>EQUIPPED (${name})</button><br>`;
  }
  return `<button onclick="equipSkin('${name}')">EQUIP ${name}</button><br>`;
}

window.equipSkin = s => {
  unlockedSkins.selected = s;
  snakeSkin = s;
  save();
  renderSkins();
};

/* ================= STATS ================= */
function updateStats() {
  const top = leaderboard.slice(0, 3)
    .map((e, i) => `#${i + 1} ${e.name} (${e.score})`)
    .join("<br>") || "No scores yet";

  statsMenu.innerHTML = `
<b>${username}</b><br><br>
Best Score: ${topScore}<br>
Money: $${money}<hr>
<b>Leaderboard</b><br>${top}
`;
}

/* ================= PLAYER ================= */
const snake = {
  x: 150,
  y: 0,
  prevY: 0,
  r: 14,
  vy: 0,
  onGround: false,
  onPlatform: false
};

function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -14 : -12.5;
    snake.onGround = false;
    snake.onPlatform = false;
    if (scoreBoostTimer > 0) score += 1;
  }
}

document.addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("mousedown", jump);

/* ================= OBJECTS ================= */
let walls = [], platforms = [], spikes = [], orbs = [];

/* ================= RESET ================= */
function resetGame() {
  score = 0;
  gameOver = false;
  walls = [];
  platforms = [];
  spikes = [];
  orbs = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
  save();
}

/* ================= SPAWN ================= */
function spawnWalls() {
  const x = canvas.width + 200;
  const wallY = canvas.height - groundHeight - 60;

  walls.push({ x, y: wallY, w: 26, h: 60, scored: false });

  if (Math.random() < 0.4) {
    walls.push({ x: x + 40, y: wallY, w: 26, h: 60, scored: true });

    // ✅ FIXED PLATFORM HEIGHT (NOT TOO HIGH)
    platforms.push({
      x: x - 20,
      y: wallY - 40,
      w: 120,
      h: 14
    });
  }
}

function spawnSpikes() {
  const baseX = canvas.width + 350;
  const count = demonMode ? 6 : Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < count; i++) {
    spikes.push({ x: baseX + i * 26, y: canvas.height - groundHeight, size: 20 });
  }

  if (demonMode) {
    orbs.push({ x: baseX + 65, y: canvas.height - groundHeight - 90, r: 10 });
  }
}

/* ================= UPDATE ================= */
let wallTimer = 0;
let spikeTimer = 0;

function update() {
  if (gameOver) return;

  snake.prevY = snake.y;
  snake.vy += 0.8;
  snake.y += snake.vy;
  snake.onPlatform = false;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  }

  const moveSpeed = demonMode ? speed * 1.3 : speed;
  [...walls, ...platforms, ...spikes, ...orbs].forEach(o => o.x -= moveSpeed);

  platforms.forEach(p => {
    if (
      snake.prevY + snake.r <= p.y &&
      snake.y + snake.r >= p.y &&
      snake.x + snake.r > p.x &&
      snake.x - snake.r < p.x + p.w
    ) {
      snake.y = p.y - snake.r;
      snake.vy = 0;
      snake.onGround = true;
      snake.onPlatform = true;
    }
  });

  walls.forEach(w => {
    if (
      !snake.onPlatform &&
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > w.y
    ) gameOver = true;

    if (!w.scored && w.x + w.w < snake.x) {
      w.scored = true;
      score++;
      money++;
    }
  });

  spikes.forEach(s => {
    if (
      !snake.onPlatform &&
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size &&
      shieldTimer <= 0
    ) gameOver = true;
  });

  if (++wallTimer > 120) spawnWalls(), wallTimer = 0;
  if (++spikeTimer > 260) spawnSpikes(), spikeTimer = 0;

  shieldTimer && shieldTimer--;
  scoreBoostTimer && scoreBoostTimer--;

  topScore = Math.max(topScore, score);
  scoreEl.textContent = "Score: " + score;
  save();
}

/* ================= DRAW ================= */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (demonMode) {
    ctx.fillStyle = "#550000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = snakeSkin === "rainbow"
    ? `hsl(${Date.now() % 360},100%,50%)`
    : snakeSkin;

  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= LOOP ================= */
function save() {
  localStorage.setItem("money", money);
  localStorage.setItem("topScore", topScore);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  localStorage.setItem("unlockedSkins", JSON.stringify(unlockedSkins));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();

