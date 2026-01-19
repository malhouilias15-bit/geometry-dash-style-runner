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
const snake = { x: 120, y: 0, r: 14, vy: 0, onGround: false };

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

/* ---------- SKINS MENU (IMPORTANT PART) ---------- */
function updateSkinsMenu() {
  skinsMenu.innerHTML = `<button data-skin="green">Green</button>`;

  if (demonMode) {
    const redBtn = document.createElement("button");
    redBtn.dataset.skin = "red";
    redBtn.textContent = redSkinUnlocked
      ? "Dark Red"
      : "Dark Red (100 score)";
    skinsMenu.appendChild(redBtn);
  }

  document.querySelectorAll("#skinsMenu button").forEach(btn => {
    btn.onclick = () => {
      const skin = btn.dataset.skin;
      if (skin === "red" && !redSkinUnlocked) {
        alert("Get 100 score in HARDEST LEVEL");
        return;
      }
      snakeSkin = skin;
      skinsMenu.classList.add("hidden");
    };
  });
}

/* ---------- UI BUTTONS ---------- */
skinsBtn.onclick = () => {
  updateSkinsMenu();
  skinsMenu.classList.toggle("hidden");
};

shopBtn.onclick = () => {
  shopMenu.classList.toggle("hidden");
  shopMenu.innerHTML = `<button>Spike Shield ($25)</button>`;
};

statsBtn.onclick = () => {
  statsMenu.classList.toggle("hidden");
  topScoreText.textContent = "Top Score: " + topScore;
};

/* ---------- DEMON TOGGLE ---------- */
demonBtn.onclick = () => {
  demonMode = !demonMode;
  updateSkinsMenu();
  resetGame();
};

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

/* ---------- SPAWNS ---------- */
function spawnWallGroup() {
  const y = canvas.height - groundHeight - 60;
  const doubleWall = Math.random() < 0.5;
  const group = { walls: [], scored: false };

  group.walls.push({ x: canvas.width + 200, y, w: 26, h: 60 });

  if (doubleWall) {
    group.walls.push({ x: canvas.width + 240, y, w: 26, h: 60 });
    platforms.push({ x: canvas.width + 180, y: y - 30, w: 120, h: 12 });
  }
  wallGroups.push(group);
}

function spawnSpikes() {
  const count = demonMode ? 6 : 1;
  const baseX = canvas.width + 350;
  for (let i = 0; i < count; i++) {
    spikes.push({ x: baseX + i * 26, y: canvas.height - groundHeight, size: 22 });
  }
}

/* ---------- UPDATE ---------- */
let wallTimer = 0;
let spikeTimer = 0;

function update() {
  if (gameOver) return;

  snake.vy += demonMode ? 1 : 0.7;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  } else snake.onGround = false;

  const move = demonMode ? speed * 1.6 : speed;
  wallGroups.forEach(g => g.walls.forEach(w => w.x -= move));
  platforms.forEach(p => p.x -= move);
  spikes.forEach(s => s.x -= move);

  wallGroups.forEach(g => {
    g.walls.forEach(w => {
      const cx = Math.max(w.x, Math.min(snake.x, w.x + w.w));
      const cy = Math.max(w.y, Math.min(snake.y, w.y + w.h));
      if ((snake.x - cx) ** 2 + (snake.y - cy) ** 2 < snake.r ** 2) {
        gameOver = true;
      }
    });
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
      snake.y + snake.r > s.y - s.size
    ) gameOver = true;
  });

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
        updateSkinsMenu();
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

  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.fill();
  });

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
