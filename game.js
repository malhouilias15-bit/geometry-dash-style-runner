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

/* ---------- DEMON MODE ---------- */
let demonMode = false;

/* ---------- DEMON BUTTON ---------- */
const demonBtn = document.createElement("button");
demonBtn.textContent = "HARDEST LEVEL";
Object.assign(demonBtn.style, {
  position: "fixed",
  top: "10px",
  right: "20px",
  padding: "10px 16px",
  background: "darkred",
  color: "white",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  zIndex: 999
});
document.body.appendChild(demonBtn);

demonBtn.onclick = () => {
  demonMode = !demonMode;
  resetGame();
};

/* ---------- STORAGE ---------- */
let topScore = parseInt(localStorage.getItem("topScore")) || 0;
let money = parseInt(localStorage.getItem("money")) || 0;
let redSkinUnlocked = localStorage.getItem("redSkin") === "true";

/* ---------- GAME STATE ---------- */
let score = 0;
let speed = 4.8;
let gameOver = false;
const groundHeight = 80;

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
let orbs = [];

/* ---------- INPUT (NO DOUBLE JUMP) ---------- */
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -15 : -13;
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

/* ---------- UI ---------- */
skinsBtn.onclick = () => skinsMenu.classList.toggle("hidden");

shopBtn.onclick = () => {
  shopMenu.classList.toggle("hidden");
  shopMenu.innerHTML = `<button id="buyShield">Spike Shield ($25)</button>`;
  document.getElementById("buyShield").onclick = () => {
    if (money >= 25) {
      money -= 25;
      localStorage.setItem("money", money);
    }
  };
};

statsBtn.onclick = () => {
  statsMenu.classList.toggle("hidden");
  topScoreText.textContent = "Top Score: " + topScore;
};

/* ---------- SKINS ---------- */
document.querySelectorAll("#skinsMenu button").forEach(btn => {
  btn.onclick = () => {
    const skin = btn.dataset.skin;
    if (skin === "red" && !redSkinUnlocked) return alert("Beat Hard Mode!");
    snakeSkin = skin;
    skinsMenu.classList.add("hidden");
  };
});

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

/* ---------- SPIKES + ORB ---------- */
function spawnSpikes() {
  const count = demonMode ? 6 : 1;
  const baseX = canvas.width + 350;

  for (let i = 0; i < count; i++) {
    spikes.push({
      x: baseX + i * 26,
      y: canvas.height - groundHeight,
      size: 22
    });
  }

  if (demonMode) {
    orbs.push({
      x: baseX + 65,
      y: canvas.height - groundHeight - 120,
      r: 10
    });
  }
}

/* ---------- UPDATE ---------- */
let wallTimer = 0;
let spikeTimer = 0;

function update() {
  if (gameOver) return;

  snake.vy += demonMode ? 1.0 : 0.7;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  } else {
    snake.onGround = false;
  }

  const moveSpeed = demonMode ? speed * 1.6 : speed;

  wallGroups.forEach(g => g.walls.forEach(w => w.x -= moveSpeed));
  platforms.forEach(p => p.x -= moveSpeed);
  spikes.forEach(s => s.x -= moveSpeed);
  orbs.forEach(o => o.x -= moveSpeed);

  /* ---------- WALL COLLISION (FIXED) ---------- */
  wallGroups.forEach(g => {
    g.walls.forEach(w => {
      const closestX = Math.max(w.x, Math.min(snake.x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(snake.y, w.y + w.h));
      const dx = snake.x - closestX;
      const dy = snake.y - closestY;
      if (dx * dx + dy * dy < snake.r * snake.r) {
        gameOver = true;
      }
    });
  });

  /* ---------- PLATFORM ---------- */
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

  /* ---------- SPIKES ---------- */
  spikes.forEach(s => {
    if (
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size
    ) gameOver = true;
  });

  /* ---------- ORB BOOST ---------- */
  orbs.forEach((o, i) => {
    if (Math.hypot(snake.x - o.x, snake.y - o.y) < snake.r + o.r) {
      snake.vy = -16;
      orbs.splice(i, 1);
    }
  });

  /* ---------- SCORE ---------- */
  wallGroups.forEach(g => {
    const last = g.walls[g.walls.length - 1];
    if (!g.scored && last.x + last.w < snake.x) {
      g.scored = true;
      score++;
      money += 5;
      scoreEl.textContent = "Score: " + score;
      localStorage.setItem("money", money);

      if (score > topScore) {
        topScore = score;
        localStorage.setItem("topScore", topScore);
      }

      if (demonMode && score >= 100) {
        redSkinUnlocked = true;
        localStorage.setItem("redSkin", "true");
      }
    }
  });

  if (++wallTimer > (demonMode ? 60 : 100)) {
    spawnWallGroup();
    wallTimer = 0;
  }

  if (++spikeTimer > (demonMode ? 140 : 240)) {
    spawnSpikes();
    spikeTimer = 0;
  }
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

  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = redSkinUnlocked && demonMode ? "red" : snakeSkin;
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
