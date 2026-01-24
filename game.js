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
let speed = 6;
let gameOver = false;
const groundHeight = 80;

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

const statsBtn = makeBtn("STATS", "50px");
const skinsBtn = makeBtn("SKINS", "90px");

/* ===== OWNER NOTEPAD ===== */
if (username === OWNER_USERNAME) {
  const ownerBtn = makeBtn("OWNER NOTEPAD", null, "20px", "20px");
  ownerBtn.onclick = () => {
    const target = prompt("Give darkred to username:");
    if (!target) return;
    const forced = JSON.parse(localStorage.getItem("forcedDarkRed")) || {};
    forced[target] = true;
    localStorage.setItem("forcedDarkRed", JSON.stringify(forced));
    alert("Darkred granted");
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

const statsMenu = makeMenu("130px");
const skinsMenu = makeMenu("130px");

statsBtn.onclick = () => {
  statsMenu.style.display = "block";
  skinsMenu.style.display = "none";
  updateStats();
};

skinsBtn.onclick = () => {
  skinsMenu.style.display = "block";
  statsMenu.style.display = "none";
  renderSkins();
};

/* ================= SKINS ================= */
const skinReqs = {
  green: 0,
  blue: 10,
  purple: 20,
  yellow: 30,
  orange: 40,
  rainbow: 100,
  darkred: 100
};

function renderSkins() {
  skinsMenu.innerHTML = Object.keys(skinReqs).map(s => {
    if (!unlockedSkins[s]) {
      return `<div style="opacity:.5">${s.toUpperCase()} — Score ${skinReqs[s]}</div>`;
    }
    if (unlockedSkins.selected === s) {
      return `<button disabled>EQUIPPED (${s})</button>`;
    }
    return `<button onclick="equipSkin('${s}')">EQUIP ${s}</button>`;
  }).join("<br>");
}

window.equipSkin = s => {
  unlockedSkins.selected = s;
  snakeSkin = s;
  save();
  renderSkins();
};

/* ================= STATS ================= */
function updateStats() {
  const top = leaderboard.slice(0, 5)
    .map((e, i) => `#${i + 1} ${e.name} — ${e.score}`)
    .join("<br>") || "No scores yet";

  statsMenu.innerHTML = `
<b>${username}</b><br>
Best Score: ${topScore}<hr>
<b>Leaderboard</b><br>${top}
`;
}

/* ================= PLAYER ================= */
const snake = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false
};

function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -14 : -12.5;
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("mousedown", jump);

/* ================= OBJECTS ================= */
let walls = [], platforms = [], spikes = [], orbs = [];
let bossWalls = [], escapeBlocks = [];

/* ================= RESET ================= */
function resetGame() {
  score = 0;
  gameOver = false;
  walls = [];
  platforms = [];
  spikes = [];
  orbs = [];
  bossWalls = [];
  escapeBlocks = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
}

/* ================= SPAWN ================= */
function spawnWalls() {
  const x = canvas.width + 200;
  const y = canvas.height - groundHeight - 60;

  walls.push({ x, y, w: 26, h: 60, scored: false });

  if (Math.random() < 0.4) {
    walls.push({ x: x + 40, y, w: 26, h: 60, scored: true });
    platforms.push({ x: x - 10, y: y - 35, w: 100, h: 12 });
  }
}

function spawnSpikes() {
  const baseX = canvas.width + 350;
  const count = demonMode ? (Math.random() < 0.5 ? 6 : 3) : Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < count; i++) {
    spikes.push({ x: baseX + i * 26, y: canvas.height - groundHeight, size: 20 });
  }

  if (demonMode && count === 6) {
    orbs.push({ x: baseX + 65, y: canvas.height - groundHeight - 90, r: 10 });
  }
}

function spawnBossWall() {
  const x = canvas.width + 300;
  const h = 220;
  const y = canvas.height - groundHeight - h;

  bossWalls.push({ x, y, w: 60, h });

  escapeBlocks.push(
    { x: x - 40, y: y - 40, w: 60, h: 12 },
    { x: x + 40, y: y - 90, w: 60, h: 12 }
  );
}

/* ================= UPDATE ================= */
let wallTimer = 0;
let spikeTimer = 0;
let bossTimer = 0;

function update() {
  if (gameOver) return;

  snake.vy += 0.8;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  }

  [...walls, ...platforms, ...spikes, ...orbs, ...bossWalls, ...escapeBlocks]
    .forEach(o => o.x -= speed);

  platforms.concat(escapeBlocks).forEach(p => {
    if (
      snake.y + snake.r >= p.y &&
      snake.y + snake.r <= p.y + p.h &&
      snake.x > p.x &&
      snake.x < p.x + p.w &&
      snake.vy >= 0
    ) {
      snake.y = p.y - snake.r;
      snake.vy = 0;
      snake.onGround = true;
    }
  });

  walls.forEach(w => {
    if (!w.scored && w.x + w.w < snake.x) {
      w.scored = true;
      score++;
      money++;
      unlockSkins();
      updateLeaderboard();
      save();
    }
  });

  bossWalls.forEach(b => {
    if (
      snake.x + snake.r > b.x &&
      snake.x - snake.r < b.x + b.w &&
      snake.y + snake.r > b.y
    ) gameOver = true;
  });

  if (++wallTimer > 120) spawnWalls(), wallTimer = 0;
  if (++spikeTimer > 260) spawnSpikes(), spikeTimer = 0;
  if (demonMode && ++bossTimer > 900) spawnBossWall(), bossTimer = 0;

  topScore = Math.max(topScore, score);
  scoreEl.textContent = "Score: " + score;
}

/* ================= LEADERBOARD ================= */
function updateLeaderboard() {
  leaderboard.push({ name: username, score });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
}

/* ================= SKIN UNLOCK ================= */
function unlockSkins() {
  for (let s in skinReqs) {
    if (!unlockedSkins[s]) {
      if (s === "darkred") {
        if (demonMode && score >= 100) unlockedSkins[s] = true;
      } else if (score >= skinReqs[s]) {
        unlockedSkins[s] = true;
      }
    }
  }
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

  ctx.fillStyle = "darkred";
  bossWalls.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  ctx.fillStyle = "white";
  platforms.concat(escapeBlocks).forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = snakeSkin === "rainbow"
    ? `hsl(${Date.now() % 360},100%,50%)`
    : snakeSkin;

  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= SAVE ================= */
function save() {
  localStorage.setItem("money", money);
  localStorage.setItem("topScore", topScore);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  localStorage.setItem("unlockedSkins", JSON.stringify(unlockedSkins));
}

/* ================= LOOP ================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();
