const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

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

const shopMenu = makeMenu("130px");
const statsMenu = makeMenu("130px");

shopBtn.onclick = () => toggle(shopMenu);
statsBtn.onclick = () => toggle(statsMenu);

function toggle(m) {
  shopMenu.style.display = "none";
  statsMenu.style.display = "none";
  m.style.display = "block";
}

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
    scoreBoostTimer = 300; // 5 seconds
    save();
  }
};

/* ================= STATS + LEADERBOARD ================= */
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

    // ✅ SCORE BOOST: +2 SCORE PER JUMP
    if (scoreBoostTimer > 0) {
      score += 2;
    }
  }
}

document.addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("mousedown", jump);

/* ================= OBJECTS ================= */
let walls = [];
let platforms = [];
let spikes = [];
let orbs = [];

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

/* ================= SPAWN ================= */
function spawnWallGroup() {
  const baseX = canvas.width + 200;
  const y = canvas.height - groundHeight - 60;

  // ✅ DOUBLE WALLS ALWAYS IN DEMON
  walls.push({ x: baseX, y, w: 26, h: 60, scored: false });
  if (demonMode) {
    walls.push({ x: baseX + 40, y, w: 26, h: 60, scored: false });

    // ✅ PLATFORM ABOVE DOUBLE WALLS
    platforms.push({
      x: baseX - 10,
      y: y - 30,
      w: 120,
      h: 12
    });
  }
}

function spawnSpikes() {
  const baseX = canvas.width + 350;

  // ✅ ALWAYS 6 SPIKES IN DEMON
  const count = demonMode ? 6 : 3;

  for (let i = 0; i < count; i++) {
    spikes.push({
      x: baseX + i * 26,
      y: canvas.height - groundHeight,
      size: 20
    });
  }

  // ✅ ORB ABOVE SPIKES IN DEMON
  if (demonMode) {
    orbs.push({
      x: baseX + 65,
      y: canvas.height - groundHeight - 90,
      r: 10
    });
  }
}

/* ================= UPDATE ================= */
let wallTimer = 0;
let spikeTimer = 0;

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

  const moveSpeed = demonMode ? speed * 1.3 : speed;
  walls.forEach(w => w.x -= moveSpeed);
  platforms.forEach(p => p.x -= moveSpeed);
  spikes.forEach(s => s.x -= moveSpeed);
  orbs.forEach(o => o.x -= moveSpeed);

  walls.forEach(w => {
    if (
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

  platforms.forEach(p => {
    if (
      snake.x + snake.r > p.x &&
      snake.x - snake.r < p.x + p.w &&
      snake.y + snake.r >= p.y &&
      snake.y + snake.r <= p.y + p.h &&
      snake.vy >= 0
    ) {
      snake.y = p.y - snake.r;
      snake.vy = 0;
      snake.onGround = true;
    }
  });

  spikes.forEach(s => {
    if (
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size &&
      shieldTimer <= 0
    ) gameOver = true;
  });

  orbs.forEach((o, i) => {
    if (Math.hypot(snake.x - o.x, snake.y - o.y) < snake.r + o.r) {
      snake.vy = -15;
      orbs.splice(i, 1);
    }
  });

  if (++wallTimer > 120) {
    spawnWallGroup();
    wallTimer = 0;
  }

  if (++spikeTimer > 260) {
    spawnSpikes();
    spikeTimer = 0;
  }

  shieldTimer && shieldTimer--;
  scoreBoostTimer && scoreBoostTimer--;

  topScore = Math.max(topScore, score);
  save();
  scoreEl.textContent = "Score: " + score;
}

/* ================= DRAW ================= */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ✅ RED SKY IN HARDEST
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

  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.fill();
  });

  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    updateStats();
  }
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
