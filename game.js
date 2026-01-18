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
let redSkinUnlocked = localStorage.getItem("redSkin") === "true";

/* ---------- GAME STATE ---------- */
let score = 0;
let speed = 4.6; // 🔽 slightly slower
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

/* ---------- INPUT ---------- */
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -15 : -13; // 🔽 slightly slower
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

/* ---------- RESET ---------- */
function resetGame() {
  score = 0;
  speed = demonMode ? 6.8 : 4.6; // 🔽 slower overall
  gameOver = false;
  wallGroups = [];
  platforms = [];
  spikes = [];
  orbs = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
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

/* ---------- SPIKES + ORB (HARD MODE ONLY) ---------- */
function spawnSpikes() {
  const count = demonMode ? 6 : 1;
  let baseX = canvas.width + 350;

  for (let i = 0; i < count; i++) {
    spikes.push({
      x: baseX + i * 26,
      y: canvas.height - groundHeight,
      size: 22
    });
  }

  // 🟡 ONLY ORBS BOOST
  if (demonMode) {
    orbs = [];
    orbs.push({
      x: baseX + 65,
      y: canvas.height - groundHeight - 120,
      r: 10
    });
  }
}

/* ---------- LOOP ---------- */
let wallTimer = 0;
let spikeTimer = 0;

function update() {
  if (gameOver) return;

  snake.vy += demonMode ? 1.0 : 0.7; // 🔽 gravity slower
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

  /* ---------- COLLISIONS ---------- */
  spikes.forEach(s => {
    if (
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size
    ) gameOver = true;
  });

  // 🟡 ORBS = ONLY BOOST
  orbs.forEach((o, i) => {
    const dx = snake.x - o.x;
    const dy = snake.y - o.y;
    if (Math.hypot(dx, dy) < snake.r + o.r) {
      snake.vy = -15;
      orbs.splice(i, 1);
    }
  });

  wallGroups.forEach(g => {
    const last = g.walls[g.walls.length - 1];
    if (!g.scored && last.x + last.w < snake.x) {
      g.scored = true;
      score++;
      scoreEl.textContent = "Score: " + score;

      // 🔴 RED SKIN UNLOCK — HARD MODE ONLY
      if (demonMode && score >= 100 && !redSkinUnlocked) {
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
