const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ---------- RESIZE ---------- */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ---------- UI ---------- */
const scoreEl = document.getElementById("score");
const skinsBtn = document.getElementById("skinsBtn");
const skinsMenu = document.getElementById("skinsMenu");
const shopBtn = document.getElementById("shopBtn");
const shopMenu = document.getElementById("shopMenu");
const statsBtn = document.getElementById("statsBtn");
const statsMenu = document.getElementById("statsMenu");
const topScoreText = document.getElementById("topScoreText");
const moneyText = document.getElementById("moneyText");
const darkRedSkinBtn = document.getElementById("darkRedSkinBtn");

/* ---------- DEMON MODE ---------- */
let demonMode = false;

/* ---------- DEMON BUTTON ---------- */
const demonBtn = document.createElement("button");
demonBtn.textContent = "HARDEST LEVEL";
Object.assign(demonBtn.style, {
  position: "fixed",
  top: "10px",
  right: "20px",
  padding: "10px",
  background: "darkred",
  color: "white",
  border: "none",
  fontWeight: "bold",
  zIndex: 20
});
document.body.appendChild(demonBtn);

demonBtn.onclick = () => {
  demonMode = !demonMode;
  resetGame();
};

/* ---------- STORAGE ---------- */
let topScore = +localStorage.getItem("topScore") || 0;
let money = +localStorage.getItem("money") || 0;

let skinUnlocks = JSON.parse(localStorage.getItem("skinUnlocks")) || {
  blue: false,
  purple: false,
  orange: false,
  rainbow: false,
  darkred: false
};

/* ---------- GAME STATE ---------- */
let score = 0;
let speed = 4.8;
let gameOver = false;
const groundHeight = 80;

/* ---------- SNAKE ---------- */
let snakeSkin = "green";
const snake = { x: 140, y: 0, r: 14, vy: 0, onGround: false };

/* ---------- OBJECTS ---------- */
let wallGroups = [];
let platforms = [];
let spikes = [];
let orbs = [];

/* ---------- INPUT ---------- */
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -15 : -13;
    snake.onGround = false;
  }
}
document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

/* ---------- MENUS ---------- */
skinsBtn.onclick = () => skinsMenu.classList.toggle("hidden");

shopBtn.onclick = () => {
  shopMenu.classList.toggle("hidden");
  shopMenu.innerHTML = `
    <button id="buyShield">Spike Shield ($25)</button><br>
    <button id="buyScoreBoost">Score Boost ($10)</button>
  `;

  document.getElementById("buyShield").onclick = () => {
    if (money >= 25) {
      money -= 25;
      shieldTimer = 300;
      localStorage.setItem("money", money);
    }
  };

  document.getElementById("buyScoreBoost").onclick = () => {
    if (money >= 10) {
      money -= 10;
      scoreBoostTimer = 300;
      localStorage.setItem("money", money);
    }
  };
};

statsBtn.onclick = () => {
  statsMenu.classList.toggle("hidden");
  topScoreText.textContent = "Top Score: " + topScore;
  moneyText.textContent = "Money: $" + money;
};

/* ---------- SKINS ---------- */
document.querySelectorAll("#skinsMenu button").forEach(btn => {
  btn.onclick = () => {
    const skin = btn.dataset.skin;
    if (skin !== "green" && !skinUnlocks[skin]) return;
    if (skin === "darkred" && !demonMode) return;
    snakeSkin = skin;
  };
});

/* ---------- POWERUPS ---------- */
let shieldTimer = 0;
let scoreBoostTimer = 0;

/* ---------- RESET ---------- */
function resetGame() {
  score = 0;
  speed = demonMode ? 6.5 : 4.8;
  gameOver = false;
  wallGroups = [];
  platforms = [];
  spikes = [];
  orbs = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
}

/* ---------- WALLS + PLATFORM ---------- */
function spawnWallGroup() {
  const y = canvas.height - groundHeight - 60;
  const doubleWall = Math.random() < 0.5;

  const group = { walls: [], scored: false };
  group.walls.push({ x: canvas.width + 200, y, w: 26, h: 60 });

  if (doubleWall) {
    group.walls.push({ x: canvas.width + 260, y, w: 26, h: 60 });
    platforms.push({
      x: canvas.width + 180,
      y: y - 40,
      w: 160,
      h: 12
    });
  }

  wallGroups.push(group);
}

/* ---------- ORBS (YELLOW ONLY) ---------- */
function spawnOrb() {
  orbs.push({
    x: canvas.width + 400,
    y: canvas.height - groundHeight - 120,
    r: 10
  });
}

/* ---------- UPDATE ---------- */
let wallTimer = 0;
let orbTimer = 0;

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

  const moveSpeed = demonMode ? speed * 1.5 : speed;

  wallGroups.forEach(g => g.walls.forEach(w => w.x -= moveSpeed));
  platforms.forEach(p => p.x -= moveSpeed);
  orbs.forEach(o => o.x -= moveSpeed);

  wallGroups.forEach(g => {
    g.walls.forEach(w => {
      if (
        snake.x + snake.r > w.x &&
        snake.x - snake.r < w.x + w.w &&
        snake.y + snake.r > w.y
      ) gameOver = true;
    });
  });

  platforms.forEach(p => {
    if (
      snake.x + snake.r > p.x &&
      snake.x - snake.r < p.x + p.w &&
      snake.y + snake.r >= p.y &&
      snake.vy >= 0
    ) {
      snake.y = p.y - snake.r;
      snake.vy = 0;
      snake.onGround = true;
    }
  });

  orbs.forEach((o, i) => {
    if (Math.hypot(snake.x - o.x, snake.y - o.y) < snake.r + o.r) {
      snake.vy = -12; // SMALL BOOST
      orbs.splice(i, 1);
    }
  });

  if (++wallTimer > 90) {
    spawnWallGroup();
    wallTimer = 0;
  }

  if (++orbTimer > 200) {
    spawnOrb();
    orbTimer = 0;
  }

  score++;
  scoreEl.textContent = "Score: " + score;

  if (score > topScore) {
    topScore = score;
    localStorage.setItem("topScore", topScore);
  }

  if (score >= 10) skinUnlocks.blue = true;
  if (score >= 20) skinUnlocks.purple = true;
  if (score >= 40) skinUnlocks.orange = true;
  if (score >= 100) skinUnlocks.rainbow = true;
  if (demonMode && score >= 100) skinUnlocks.darkred = true;

  localStorage.setItem("skinUnlocks", JSON.stringify(skinUnlocks));

  darkRedSkinBtn.classList.toggle("hidden", !demonMode);
}

/* ---------- DRAW ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (demonMode) {
    ctx.fillStyle = "#550000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  ctx.fillStyle = "gray";
  wallGroups.forEach(g => g.walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h)));

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = snakeSkin === "rainbow"
    ? `hsl(${Date.now() % 360},100%,50%)`
    : snakeSkin;

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
