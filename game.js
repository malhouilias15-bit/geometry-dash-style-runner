const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ---------------- GAME STATE ----------------
let score = 0;
let speed = 5;
let gameOver = false;

const groundHeight = 80;

// ---------------- SNAKE ----------------
let snake = {
  x: 100,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false
};

// ---------------- SKINS ----------------
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

// ---------------- UI ----------------
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

// ---------------- OBJECTS ----------------
let walls = [];
let platforms = [];
let spikes = [];

// ---------------- SPAWN ----------------
function spawnWalls() {
  const wallY = canvas.height - groundHeight - 60;
  const isDouble = Math.random() < 0.4;

  const wall1 = {
    x: canvas.width,
    y: wallY,
    w: 26,
    h: 60,
    counted: false
  };

  walls.push(wall1);

  if (isDouble) {
    const wall2 = {
      x: canvas.width + 40,
      y: wallY,
      w: 26,
      h: 60,
      counted: false
    };
    walls.push(wall2);

    // PLATFORM (90% chance)
    if (Math.random() < 0.9) {
      platforms.push({
        x: canvas.width - 10,
        y: wallY - 25,
        w: 90,
        h: 10
      });
    }
  }

  // SPIKES after score 10
  if (score >= 10) {
    const spikeCount = Math.random() < 0.5 ? 2 : 1;
    for (let i = 0; i < spikeCount; i++) {
      spikes.push({
        x: canvas.width + i * 30,
        y: canvas.height - groundHeight,
        size: 22
      });
    }
  }
}

// ---------------- INPUT ----------------
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

// ---------------- GAME LOOP ----------------
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

  // Move objects
  walls.forEach(w => w.x -= speed);
  platforms.forEach(p => p.x -= speed);
  spikes.forEach(s => s.x -= speed);

  // WALL collision
  walls.forEach(w => {
    if (
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > w.y
    ) gameOver = true;
  });

  // SPIKE collision
  spikes.forEach(s => {
    if (
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size
    ) gameOver = true;
  });

  // PLATFORM collision
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

  // SCORE FIX (counts ONCE per wall)
  walls.forEach(w => {
    if (!w.counted && w.x + w.w < snake.x) {
      w.counted = true;
      score++;
      scoreEl.textContent = "Score: " + score;
      speed = 5 + Math.floor(score / 10);
    }
  });

  // Cleanup
  walls = walls.filter(w => w.x + w.w > 0);
  platforms = platforms.filter(p => p.x + p.w > 0);
  spikes = spikes.filter(s => s.x + s.size > 0);

  // Spawn timing
  spawnTimer++;
  if (spawnTimer > 90) {
    spawnWalls();
    spawnTimer = 0;
  }
}

// ---------------- DRAW ----------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Walls
  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // Platforms
  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  // Spikes
  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.closePath();
    ctx.fill();
  });

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
