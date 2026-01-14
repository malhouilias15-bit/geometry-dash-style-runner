const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ---------- RESIZE ----------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ---------- UI ----------
const scoreEl = document.getElementById("score");
const moneyEl = document.getElementById("money");
const skinsBtn = document.getElementById("skinsBtn");
const shopBtn = document.getElementById("shopBtn");
const skinsMenu = document.getElementById("skinsMenu");
const shopMenu = document.getElementById("shopMenu");

// ---------- STORAGE ----------
let money = Number(localStorage.getItem("money")) || 0;
let snakeSkin = localStorage.getItem("skin") || "green";

// ---------- GAME STATE ----------
let score = 0;
let speed = 5;
let gameOver = false;
const groundHeight = 80;

// ---------- SNAKE ----------
const snake = {
  x: 120,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false
};

// ---------- OBJECTS ----------
let wallGroups = [];
let platforms = [];
let spikes = [];

// ---------- UI BUTTONS ----------
skinsBtn.onclick = () => {
  skinsMenu.classList.toggle("hidden");
  shopMenu.classList.add("hidden");
};

shopBtn.onclick = () => {
  shopMenu.classList.toggle("hidden");
  skinsMenu.classList.add("hidden");
};

document.getElementById("skip10").onclick = () => {
  if (money >= 20) {
    money -= 20;
    score += 10;
    updateUI();
  }
};

// ---------- INPUT ----------
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = -14;
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  jump();
}, { passive: false });

// ---------- SKINS ----------
function skinUnlocked(skin) {
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
      localStorage.setItem("skin", skin);
      skinsMenu.classList.add("hidden");
    } else {
      alert("Locked! Reach higher score.");
    }
  };
});

// ---------- SPAWN ----------
function spawnWallGroup() {
  const y = canvas.height - groundHeight - 60;
  const isDouble = Math.random() < 0.4;

  const group = { walls: [], scored: false };
  group.walls.push({ x: canvas.width, y, w: 26, h: 60 });

  if (isDouble) {
    group.walls.push({ x: canvas.width + 40, y, w: 26, h: 60 });

    if (Math.random() < 0.9) {
      platforms.push({
        x: canvas.width - 10,
        y: y - 25,
        w: 90,
        h: 10
      });
    }
  }

  wallGroups.push(group);
}

function spawnSpikes() {
  const count = Math.random() < 0.5 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    spikes.push({
      x: canvas.width + i * 30,
      y: canvas.height - groundHeight,
      size: 22
    });
  }
}

// ---------- LOOP ----------
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

      if (score % 10 === 0) {
        money += 20;
      }

      speed = 5 + Math.floor(score / 10);
      updateUI();
    }
  });

  wallGroups = wallGroups.filter(g => g.walls[g.walls.length - 1].x > -50);
  platforms = platforms.filter(p => p.x > -100);
  spikes = spikes.filter(s => s.x > -50);

  wallTimer++;
  spikeTimer++;

  if (wallTimer > 90) {
    spawnWallGroup();
    wallTimer = 0;
  }

  if (score >= 10 && spikeTimer > 140) {
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

  ctx.fillStyle =
    snakeSkin === "rainbow"
      ? `hsl(${Date.now() / 10 % 360},100%,50%)`
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

function updateUI() {
  scoreEl.textContent = "Score: " + score;
  moneyEl.textContent = "$" + money;
  localStorage.setItem("money", money);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

snake.y = canvas.height - groundHeight - snake.r;
updateUI();
loop();

