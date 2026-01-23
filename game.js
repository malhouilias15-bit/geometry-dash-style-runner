const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ---------- RESIZE ---------- */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ---------- USERNAME ---------- */
let username = localStorage.getItem("username");
if (!username) {
  username = "Snake_" + Math.floor(1000 + Math.random() * 9000);
  localStorage.setItem("username", username);
}

/* ---------- SCORE UI (CENTER TOP) ---------- */
const scoreEl = document.getElementById("score");
Object.assign(scoreEl.style, {
  position: "fixed",
  top: "10px",
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: "22px",
  zIndex: 20
});
scoreEl.textContent = "Score: 0";

/* ---------- MODE ---------- */
let demonMode = false;

/* ---------- STORAGE ---------- */
let topScore = +localStorage.getItem("topScore") || 0;
let money = +localStorage.getItem("money") || 0;

let skinUnlocks =
  JSON.parse(localStorage.getItem("skinUnlocks")) || {
    blue: false,
    yellow: false,
    purple: false,
    orange: false,
    rainbow: false,
    darkred: false
  };

let snakeSkin = localStorage.getItem("snakeSkin") || "green";

/* ---------- LEADERBOARD STORAGE ---------- */
let leaderboard =
  JSON.parse(localStorage.getItem("leaderboard")) || [];

/* ---------- GAME STATE ---------- */
let score = 0;
let speed = 4.8;
let gameOver = false;
const groundHeight = 80;

/* ---------- POWERUPS ---------- */
let shieldTimer = 0;
let boostTimer = 0;

/* ---------- BUTTON MAKER ---------- */
function makeBtn(text, top, right, left) {
  const b = document.createElement("button");
  b.textContent = text;
  Object.assign(b.style, {
    position: "fixed",
    top,
    right,
    left,
    padding: "10px",
    zIndex: 20
  });
  document.body.appendChild(b);
  return b;
}

/* ---------- BUTTONS ---------- */
const demonBtn = makeBtn("HARDEST LEVEL", "10px", "20px");
demonBtn.style.background = "darkred";
demonBtn.style.color = "white";
demonBtn.onclick = () => {
  demonMode = !demonMode;
  resetGame();
};

const shopBtn = makeBtn("SHOP", "50px", "20px");
const skinsBtn = makeBtn("SKINS", "90px", "20px");
const statsBtn = makeBtn("STATS", "130px", "20px");

/* ---------- MENUS ---------- */
function makeMenu(top, right) {
  const d = document.createElement("div");
  Object.assign(d.style, {
    position: "fixed",
    top,
    right,
    background: "#222",
    color: "white",
    padding: "12px",
    display: "none",
    zIndex: 20,
    minWidth: "220px"
  });
  document.body.appendChild(d);
  return d;
}

const shopMenu = makeMenu("170px", "20px");
const skinsMenu = makeMenu("170px", "260px");
const statsMenu = makeMenu("170px", "500px");

shopBtn.onclick = () =>
  (shopMenu.style.display =
    shopMenu.style.display === "none" ? "block" : "none");

skinsBtn.onclick = () =>
  (skinsMenu.style.display =
    skinsMenu.style.display === "none" ? "block" : "none");

statsBtn.onclick = () => {
  statsMenu.style.display =
    statsMenu.style.display === "none" ? "block" : "none";
  refreshStats();
};

/* ---------- SHOP ---------- */
shopMenu.innerHTML = `
<h3>SHOP</h3>
<button id="buyShield">Spike Shield ($25)</button><br><br>
<button id="buyBoost">Score Boost ($10)</button>
`;

document.getElementById("buyShield").onclick = () => {
  if (money >= 25) {
    money -= 25;
    shieldTimer = 300;
    localStorage.setItem("money", money);
  }
};

document.getElementById("buyBoost").onclick = () => {
  if (money >= 10) {
    money -= 10;
    boostTimer = 300;
    localStorage.setItem("money", money);
  }
};

/* ---------- SKINS ---------- */
function skinBtn(name, color) {
  const b = document.createElement("button");
  b.textContent = name;
  b.onclick = () => {
    if (skinUnlocks[name]) {
      snakeSkin = color;
      localStorage.setItem("snakeSkin", snakeSkin);
    }
  };
  skinsMenu.appendChild(b);
  skinsMenu.appendChild(document.createElement("br"));
}

function refreshSkins() {
  skinsMenu.innerHTML = "<h3>SKINS</h3>";
  skinBtn("blue", "blue");
  skinBtn("yellow", "yellow");
  skinBtn("purple", "purple");
  skinBtn("orange", "orange");
  skinBtn("rainbow", "rainbow");
  skinBtn("darkred", "darkred");
}
refreshSkins();

/* ---------- STATS + LEADERBOARD ---------- */
function refreshStats() {
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 100);

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const worst = leaderboard[leaderboard.length - 1];

  statsMenu.innerHTML = `
<h3>${username}</h3>
<p>Best Score: ${topScore}</p>
<p>Cash: $${money}</p>
<hr>
<h3>LEADERBOARD</h3>
<p>🥇 ${top1 ? top1.name + " - " + top1.score : "-"}</p>
<p>🥈 ${top2 ? top2.name + " - " + top2.score : "-"}</p>
<p>🧱 Worst: ${
    worst ? worst.name + " - " + worst.score : "-"
  }</p>
`;
}

/* ---------- SNAKE ---------- */
const snake = { x: 140, y: 0, r: 14, vy: 0, onGround: false };

/* ---------- OBJECTS ---------- */
let wallGroups = [];
let spikes = [];
let orbs = [];

/* ---------- INPUT ---------- */
function doJump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -14 : -11;
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") doJump();
});
canvas.addEventListener("mousedown", doJump);
canvas.addEventListener(
  "touchstart",
  e => {
    e.preventDefault();
    doJump();
  },
  { passive: false }
);

/* ---------- RESET ---------- */
function resetGame() {
  score = 0;
  gameOver = false;
  wallGroups = [];
  spikes = [];
  orbs = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
  scoreEl.textContent = "Score: 0";
}

/* ---------- SPAWN ---------- */
function spawnWallGroup() {
  wallGroups.push({
    x: canvas.width + 200,
    y: canvas.height - groundHeight - 60,
    w: 26,
    h: 60,
    scored: false
  });
}

function spawnSpikes(count) {
  const baseX = canvas.width + 350;
  for (let i = 0; i < count; i++) {
    spikes.push({
      x: baseX + i * 26,
      y: canvas.height - groundHeight,
      size: 20
    });
  }
}

/* ---------- UPDATE ---------- */
let wallTimer = 0;
let spikeTimer = 0;

function update() {
  if (gameOver) return;

  snake.vy += 0.7;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  }

  const moveSpeed = demonMode ? speed * 1.25 : speed;

  wallGroups.forEach(w => (w.x -= moveSpeed));
  spikes.forEach(s => (s.x -= moveSpeed));

  wallGroups.forEach(w => {
    if (
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > w.y
    )
      endGame();

    if (!w.scored && w.x + w.w < snake.x) {
      w.scored = true;
      score++;
      money++;
      scoreEl.textContent = "Score: " + score;
      localStorage.setItem("money", money);
    }
  });

  if (++wallTimer > 120) {
    spawnWallGroup();
    wallTimer = 0;
  }

  if (++spikeTimer > 260) {
    spawnSpikes(demonMode ? 6 : 3);
    spikeTimer = 0;
  }

  if (score > topScore) {
    topScore = score;
    localStorage.setItem("topScore", topScore);
  }
}

/* ---------- GAME OVER ---------- */
function endGame() {
  if (gameOver) return;
  gameOver = true;

  leaderboard.push({ name: username, score });
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

/* ---------- DRAW ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  ctx.fillStyle = "gray";
  wallGroups.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  ctx.fillStyle = snakeSkin;
  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }
}

/* ---------- LOOP ---------- */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();
