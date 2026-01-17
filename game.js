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

if (skinsBtn && skinsMenu)
  skinsBtn.onclick = () => skinsMenu.classList.toggle("hidden");

if (shopBtn && shopMenu)
  shopBtn.onclick = () => {
    shopMenu.classList.toggle("hidden");
    shopMenu.innerHTML = `
      <button id="buyShield">Spike Shield ($25)</button>
      <button id="buyBoost">Score Boost ($10)</button>
      <button id="buySkin">Unlock Skin Early ($50)</button>
    `;

    document.getElementById("buyShield").onclick = buySpikeShield;
    document.getElementById("buyBoost").onclick = buyScoreBoost;
    document.getElementById("buySkin").onclick = buyEarlySkin;
  };

if (statsBtn && statsMenu && topScoreText)
  statsBtn.onclick = () => {
    statsMenu.classList.toggle("hidden");
    topScoreText.textContent = "Top Score: " + topScore;
  };

/* ---------- STORAGE ---------- */
let topScore = parseInt(localStorage.getItem("topScore")) || 0;
let money = parseInt(localStorage.getItem("money")) || 0;
let earlySkins = JSON.parse(localStorage.getItem("earlySkins")) || [];

/* ---------- GAME STATE ---------- */
let score = 0;
let speed = 5;
let gameOver = false;
const groundHeight = 80;

/* ---------- POWER UPS ---------- */
let spikeShield = false;
let spikeShieldTimer = 0;

let scoreBoost = false;
let scoreBoostTimer = 0;

/* ---------- SNAKE ---------- */
let snakeSkin = "green";

const snake = {
  x: 120,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false
};

/* ---------- OBJECTS ---------- */
let wallGroups = [];
let platforms = [];
let spikes = [];

/* ---------- INPUT ---------- */
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = -14;
    snake.onGround = false;

    if (scoreBoost) {
      score += 2;
      scoreEl.textContent = "Score: " + score;
    }
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

/* ===== MOBILE HOLD AUTO-JUMP (ADDED ONLY THIS) ===== */
let holdingJump = false;
let holdInterval = null;

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  if (gameOver) return;

  holdingJump = true;
  jump();

  holdInterval = setInterval(() => {
    if (holdingJump) jump();
  }, 180); // jump rate while holding
}, { passive: false });

canvas.addEventListener("touchend", () => {
  holdingJump = false;
  clearInterval(holdInterval);
});

canvas.addEventListener("touchcancel", () => {
  holdingJump = false;
  clearInterval(holdInterval);
});
/* ===== END ADDITION ===== */

/* ---------- SKINS ---------- */
function skinUnlocked(skin) {
  if (earlySkins.includes(skin)) return true;
  if (skin === "green") return true;
  if (skin === "blue") return score >= 10;
  if (skin === "purple") return score >= 20;
  if (skin === "yellow") return score >= 30;
  if (skin === "orange") return score >= 40;
  if (skin === "rainbow") return score >= 100;
  return false;
}

document.querySelectorAll("#skinsMenu button").forEach(btn => {
  btn.onclick = () => {
    const skin = btn.dataset.skin;
    if (skinUnlocked(skin)) {
      snakeSkin = skin;
      skinsMenu.classList.add("hidden");
    } else {
      alert("Locked!");
    }
  };
});

/* ---------- SHOP LOGIC ---------- */
function buySpikeShield() {
  if (money >= 25) {
    money -= 25;
    spikeShield = true;
    spikeShieldTimer = 300;
    localStorage.setItem("money", money);
  }
}

function buyScoreBoost() {
  if (money >= 10) {
    money -= 10;
    scoreBoost = true;
    scoreBoostTimer = 300;
    localStorage.setItem("money", money);
  }
}

function buyEarlySkin() {
  if (money >= 50) {
    const order = ["blue", "purple", "yellow", "orange", "rainbow"];
    for (let s of order) {
      if (!earlySkins.includes(s)) {
        earlySkins.push(s);
        localStorage.setItem("earlySkins", JSON.stringify(earlySkins));
        break;
      }
    }
    money -= 50;
    localStorage.setItem("money", money);
  }
}

/* ---------- SPAWN WALLS ---------- */
function spawnWallGroup() {
  const y = canvas.height - groundHeight - 60;
  const isDouble = Math.random() < 0.5;

  const group = { walls: [], scored: false };
  group.walls.push({ x: canvas.width + 200, y, w: 26, h: 60 });

  if (isDouble) {
    group.walls.push({ x: canvas.width + 240, y, w: 26, h: 60 });
    platforms.push({
      x: canvas.width + 180,
      y: y - 30,
      w: 120,
      h: 12
    });
  }

  wallGroups.push(group);
}

/* ---------- SPAWN SPIKES ---------- */
function spawnSpikes() {
  spikes.push({
    x: canvas.width + 200,
    y: canvas.height - groundHeight,
    size: 22
  });
}

/* ---------- LOOP ---------- */
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

  wallGroups.forEach(g => g.walls.forEach(w => w.x -= speed));
  platforms.forEach(p => p.x -= speed);
  spikes.forEach(s => s.x -= speed);

  wallGroups.forEach(g => {
    g.walls.forEach(w => {
      if (
        snake.x + snake.r > w.x &&
        snake.x - snake.r < w.x + w.w &&
        snake.y + snake.r > w.y
      ) gameOver = true;
    });
  });

  spikes.forEach(s => {
    if (
      !spikeShield &&
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size
    ) gameOver = true;
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

  wallGroups.forEach(g => {
    const last = g.walls[g.walls.length - 1];
    if (!g.scored && last.x + last.w < snake.x) {
      g.scored = true;
      score++;
      speed = 5 + Math.floor(score / 10);
      scoreEl.textContent = "Score: " + score;

      if (score % 10 === 0) {
        money += 20;
        localStorage.setItem("money", money);
      }

      if (score > topScore) {
        topScore = score;
        localStorage.setItem("topScore", topScore);
      }
    }
  });

  if (spikeShield && --spikeShieldTimer <= 0) spikeShield = false;
  if (scoreBoost && --scoreBoostTimer <= 0) scoreBoost = false;

  if (++wallTimer > 90) {
    spawnWallGroup();
    wallTimer = 0;
  }

  if (score >= 10 && ++spikeTimer > 140) {
    spawnSpikes();
    spikeTimer = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  ctx.fillStyle = "gray";
  wallGroups.forEach(g => g.walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h)));

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = snakeSkin === "rainbow"
    ? `hsl(${Date.now() / 10 % 360},100%,50%)`
    : snakeSkin;

  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.fillText("Money: $" + money, 20, canvas.height - 20);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

snake.y = canvas.height - groundHeight - snake.r;
loop();
