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
    const target = prompt("Give darkred skin to username:");
    if (!target) return;

    const forced = JSON.parse(localStorage.getItem("forcedDarkRed")) || {};
    forced[target] = true;
    localStorage.setItem("forcedDarkRed", JSON.stringify(forced));
    alert("Darkred skin granted.");
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
  skinsMenu.innerHTML = Object.keys(skinReqs).map(skin => {
    if (!unlockedSkins[skin]) {
      return `<div style="opacity:.5">${skin.toUpperCase()} — Score ${skinReqs[skin]}</div><br>`;
    }
    if (unlockedSkins.selected === skin) {
      return `<button disabled>EQUIPPED (${skin})</button><br>`;
    }
    return `<button onclick="equipSkin('${skin}')">EQUIP ${skin}</button><br>`;
  }).join("");
}

window.equipSkin = skin => {
  unlockedSkins.selected = skin;
  snakeSkin = skin;
  save();
  renderSkins();
};

/* ================= STATS ================= */
function updateStats() {
  statsMenu.innerHTML = `
<b>${username}</b><br><br>
Best Score: ${topScore}<br>
Money: $${money}
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
    if (scoreBoostTimer > 0) score += 2;
  }
}

document.addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("mousedown", jump);

/* ================= OBJECTS ================= */
let walls = [], platforms = [], spikes = [];

/* ================= RESET ================= */
function resetGame() {
  score = 0;
  gameOver = false;
  walls = [];
  platforms = [];
  spikes = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
}

/* ================= SPAWN ================= */
function spawnWalls() {
  const x = canvas.width + 200;
  const y = canvas.height - groundHeight - 60;

  walls.push({ x, y, w: 26, h: 60, scored: false });

  platforms.push({
    x: x - 10,
    y: y - 35,
    w: 100,
    h: 12
  });
}

/* ================= UPDATE ================= */
let wallTimer = 0;

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

  [...walls, ...platforms].forEach(o => o.x -= speed);

  platforms.forEach(p => {
    if (
      snake.y + snake.r >= p.y &&
      snake.y + snake.r <= p.y + 12 &&
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
      save();
    }
  });

  if (++wallTimer > 120) spawnWalls(), wallTimer = 0;

  topScore = Math.max(topScore, score);
  scoreEl.textContent = "Score: " + score;
}

/* ================= SKIN UNLOCK (NO FREEZE) ================= */
function unlockSkins() {
  for (let skin in skinReqs) {
    if (!unlockedSkins[skin]) {
      if (skin === "darkred") {
        if (demonMode && score >= 100) unlockedSkins[skin] = true;
      } else if (score >= skinReqs[skin]) {
        unlockedSkins[skin] = true;
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

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

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
