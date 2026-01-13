const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const groundHeight = 80;
let score = 0;
let speed = 6;
let gameOver = false;

// ===== SNAKE =====
const snake = {
  x: 120,
  y: canvas.height - groundHeight - 20,
  radius: 16,
  vy: 0,
  gravity: 0.8,
  jumpPower: -14,
  onGround: true
};

// ===== SKINS =====
const skins = [
  { name: "Green", color: "lime", unlock: 0 },
  { name: "Blue", color: "blue", unlock: 10 },
  { name: "Purple", color: "purple", unlock: 20 },
  { name: "Yellow", color: "yellow", unlock: 30 },
  { name: "Orange", color: "orange", unlock: 50 },
  { name: "Rainbow", color: "rainbow", unlock: 100 }
];

let currentSkin = "Green";
let unlockedSkins = ["Green"];

const skinsBtn = document.getElementById("skinsBtn");
const skinsContainer = document.getElementById("skinsContainer");

skinsBtn.onclick = () => {
  skinsContainer.style.display =
    skinsContainer.style.display === "none" ? "block" : "none";
};

// ===== WALLS =====
let walls = [];

function spawnWall() {
  walls.push({
    x: canvas.width,
    width: 30,
    height: 60,
    passed: false
  });
}

setInterval(spawnWall, 1800);

// ===== INPUT =====
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = snake.jumpPower;
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

canvas.addEventListener("touchstart", jump);

// ===== SKINS UI =====
function renderSkins() {
  skinsContainer.innerHTML = "";

  skins.forEach(skin => {
    const btn = document.createElement("button");
    btn.style.display = "block";
    btn.style.margin = "6px";
    btn.style.padding = "6px";

    if (!unlockedSkins.includes(skin.name)) {
      btn.textContent = `${skin.name} 🔒 (${skin.unlock})`;
      btn.disabled = true;
    } else if (currentSkin === skin.name) {
      btn.textContent = `${skin.name} ✅ Equipped`;
      btn.disabled = true;
    } else {
      btn.textContent = `Equip ${skin.name}`;
      btn.onclick = () => {
        currentSkin = skin.name;
        renderSkins();
      };
    }

    skinsContainer.appendChild(btn);
  });
}

renderSkins();

// ===== GAME LOOP =====
function update() {
  if (gameOver) return;

  // Snake physics
  snake.vy += snake.gravity;
  snake.y += snake.vy;

  if (snake.y >= canvas.height - groundHeight - snake.radius) {
    snake.y = canvas.height - groundHeight - snake.radius;
    snake.vy = 0;
    snake.onGround = true;
  }

  // Walls
  walls.forEach(w => {
    w.x -= speed;

    // Score
    if (!w.passed && w.x + w.width < snake.x) {
      w.passed = true;
      score++;
      document.getElementById("score").textContent = "Score: " + score;

      if (score % 10 === 0) speed += 0.8;

      skins.forEach(s => {
        if (score >= s.unlock && !unlockedSkins.includes(s.name)) {
          unlockedSkins.push(s.name);
          renderSkins();
        }
      });
    }

    // Collision
    if (
      snake.x + snake.radius > w.x &&
      snake.x - snake.radius < w.x + w.width &&
      snake.y + snake.radius > canvas.height - groundHeight - w.height
    ) {
      gameOver = true;
    }
  });

  walls = walls.filter(w => w.x + w.width > 0);
}

function drawSnake() {
  ctx.beginPath();

  if (currentSkin === "Rainbow") {
    const g = ctx.createLinearGradient(
      snake.x - snake.radius,
      snake.y,
      snake.x + snake.radius,
      snake.y
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

  ctx.arc(snake.x, snake.y, snake.radius, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Walls
  ctx.fillStyle = "gray";
  walls.forEach(w => {
    ctx.fillRect(
      w.x,
      canvas.height - groundHeight - w.height,
      w.width,
      w.height
    );
  });

  drawSnake();

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
