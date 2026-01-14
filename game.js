const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ---------- GAME STATE ----------
let score = 0;
let speed = 5;
let gameOver = false;

const groundHeight = 80;

// ---------- SNAKE ----------
let snake = {
  x: 100,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false
};

// ---------- SKINS ----------
const skins = [
  { name: "Green", color: "lime", unlock: 0 },
  { name: "Blue", color: "deepskyblue", unlock: 10 },
  { name: "Purple", color: "purple", unlock: 20 },
  { name: "Yellow", color: "yellow", unlock: 30 },
  { name: "Orange", color: "orange", unlock: 40 },
  { name: "Rainbow", color: "rainbow", unlock: 100 }
];

let unlocked = JSON.parse(localStorage.getItem("skins")) || ["Green"];
let currentSkin = localStorage.getItem("currentSkin") || "Green";

// ---------- UI ----------
const scoreEl = document.getElementById("score");
const skinsBtn = document.getElementById("skinsBtn");
const skinsMenu = document.getElementById("skinsMenu");

skinsBtn.onclick = () => {
  skinsMenu.classList.toggle("hidden");
  renderSkins();
};

function renderSkins() {
  skinsMenu.innerHTML = "";
  skins.forEach(s => {
    const btn = document.createElement("button");

    if (unlocked.includes(s.name)) {
      btn.textContent = "Equip " + s.name;
      btn.onclick = () => {
        currentSkin = s.name;
        localStorage.setItem("currentSkin", s.name);
      };
    } else {
      btn.textContent = s.name + " (score " + s.unlock + ")";
      btn.disabled = score < s.unlock;
      btn.onclick = () => {
        unlocked.push(s.name);
        localStorage.setItem("skins", JSON.stringify(unlocked));
      };
    }

    skinsMenu.appendChild(btn);
  });
}

// ---------- WALLS ----------
let walls = [];
let platforms = [];

function spawnWalls() {
  const doubleWall = Math.random() < 0.4;

  const h = 60;
  const y = canvas.height - groundHeight - h;

  walls.push({ x: canvas.width, y, w: 25, h });

  if (doubleWall) {
    walls.push({ x: canvas.width + 35, y, w: 25, h });

    if (Math.random() < 0.9) {
      platforms.push({
        x: canvas.width,
        y: y - 25,
        w: 80,
        h: 10
      });
    }
  }
}

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

// ---------- GAME LOOP ----------
let spawnTimer = 0;

function update() {
  if (gameOver) return;

  // Gravity
  snake.vy += 0.8;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;

  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  }

  // Move walls
  walls.forEach(w => w.x -= speed);
  platforms.forEach(p => p.x -= speed);

  // Collisions
  walls.forEach(w => {
    if (
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > w.y
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

  // Cleanup & scoring
  walls = walls.filter(w => w.x + w.w > 0);
  platforms = platforms.filter(p => p.x + p.w > 0);

  if (walls.length && walls[0].x + walls[0].w < snake.x) {
    score++;
    scoreEl.textContent = "Score: " + score;
    speed = 5 + Math.floor(score / 10);

    skins.forEach(s => {
      if (score >= s.unlock && !unlocked.includes(s.name)) {
        unlocked.push(s.name);
        localStorage.setItem("skins", JSON.stringify(unlocked));
      }
    });
  }

  spawnTimer++;
  if (spawnTimer > 90) {
    spawnWalls();
    spawnTimer = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Walls
  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // Platform
  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  // Snake
  if (currentSkin === "Rainbow") {
    const g = ctx.createLinearGradient(
      snake.x - snake.r, 0,
      snake.x + snake.r, 0
    );
    g.addColorStop(0, "red");
    g.addColorStop(0.2, "orange");
    g.addColorStop(0.4, "yellow");
    g.addColorStop(0.6, "green");
    g.addColorStop(0.8, "blue");
    g.addColorStop(1, "purple");
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = skins.find(s => s.name === currentSkin).color;
  }

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

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

snake.y = canvas.height - groundHeight - snake.r;
loop();
