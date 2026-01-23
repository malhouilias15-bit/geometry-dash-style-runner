const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= OWNER ================= */
const OWNER_USERNAME = "Snake_1234"; // <<< 

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
let forcedSkins = JSON.parse(localStorage.getItem("forcedSkins")) || {};
let snakeSkin = forcedSkins[username] || "green";

/* ================= GAME STATE ================= */
let demonMode = false;
let score = 0;
let speed = 5;
let gameOver = false;
const groundHeight = 80;

/* ================= POWERUPS ================= */
let shieldTimer = 0;
let scoreBoostTimer = 0;

/* ================= BUTTONS ================= */
function makeBtn(text, top) {
  const b = document.createElement("button");
  b.textContent = text;
  Object.assign(b.style, {
    position: "fixed",
    top,
    right: "20px",
    padding: "10px",
    zIndex: 10
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

let notebookBtn = null;
if (username === OWNER_USERNAME) {
  notebookBtn = makeBtn("📓 NOTEBOOK", "170px");
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
    zIndex: 10
  });
  document.body.appendChild(d);
  return d;
}

const shopMenu = makeMenu("210px");
const statsMenu = makeMenu("210px");
const skinsMenu = makeMenu("210px");
const notebookMenu = makeMenu("210px");

function toggle(m) {
  [shopMenu, statsMenu, skinsMenu, notebookMenu].forEach(x => x.style.display = "none");
  m.style.display = "block";
}

shopBtn.onclick = () => toggle(shopMenu);
statsBtn.onclick = () => toggle(statsMenu);
skinsBtn.onclick = () => toggle(skinsMenu);
if (notebookBtn) notebookBtn.onclick = () => toggle(notebookMenu);

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

/* ================= SKINS ================= */
skinsMenu.innerHTML = `
<button onclick="setSkin('green')">Green</button><br>
<button onclick="setSkin('blue')">Blue</button><br>
<button onclick="setSkin('yellow')">Yellow</button><br>
<button onclick="setSkin('purple')">Purple</button><br>
<button onclick="setSkin('orange')">Orange</button><br>
<button onclick="setSkin('rainbow')">Rainbow</button><br>
<button onclick="setSkin('darkred')">Dark Red</button>
`;

window.setSkin = (skin) => {
  snakeSkin = skin;
};

/* ================= OWNER NOTEBOOK ================= */
if (username === OWNER_USERNAME) {
  notebookMenu.innerHTML = `
<b>ADMIN NOTEBOOK</b><br><br>
<input id="targetUser" placeholder="username"><br><br>
<input id="targetSkin" placeholder="skin (darkred, rainbow...)"><br><br>
<button id="applySkin">Apply Skin</button>
`;

  document.getElementById("applySkin").onclick = () => {
    const u = document.getElementById("targetUser").value.trim();
    const s = document.getElementById("targetSkin").value.trim();
    if (!u || !s) return;

    forcedSkins[u] = s;
    localStorage.setItem("forcedSkins", JSON.stringify(forcedSkins));
    alert(`Applied ${s} to ${u}`);
  };
}

/* ================= STATS ================= */
function updateStats() {
  leaderboard.push({ name: username, score });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 100);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

  statsMenu.innerHTML = `
<b>${username}</b><br>
Best Score: ${topScore}<br>
Money: $${money}<hr>
<b>Leaderboard</b><br>
#1 ${leaderboard[0]?.name || "-"} (${leaderboard[0]?.score || 0})<br>
#2 ${leaderboard[1]?.name || "-"} (${leaderboard[1]?.score || 0})<br>
#100 ${leaderboard[99]?.name || "-"} (${leaderboard[99]?.score || 0})
`;
}

/* ================= PLAYER ================= */
const snake = { x: 150, y: 0, r: 14, vy: 0, onGround: false };

function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -14 : -11;
    snake.onGround = false;
    if (scoreBoostTimer > 0) score += 2;
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
}

/* ================= UPDATE & DRAW ================= */
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

  scoreEl.textContent = "Score: " + score;
  topScore = Math.max(topScore, score);
  save();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (demonMode) {
    ctx.fillStyle = "#550000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

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
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();
