const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== CONSTANTS =====
const GROUND_HEIGHT = 100;
const GRAVITY = 0.8;
const JUMP_POWER = 14;
const WALL_WIDTH = 40;
const WALL_GAP = 120;
const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 15;

// ===== GAME STATE =====
let speed = 6;
let score = 0;
let gameOver = false;
let passedWalls = new Set();

// ===== PLAYER =====
const snake = {
  x: 120,
  y: canvas.height - GROUND_HEIGHT - 20,
  r: 12,
  vy: 0,
  color: "lime"
};

// ===== OBJECTS =====
let walls = [];
let platforms = [];

// ===== INPUT =====
window.addEventListener("keydown", e => {
  if (e.code === "Space" && snake.y >= groundY() - snake.r - 1) {
    snake.vy = -JUMP_POWER;
  }
});

canvas.addEventListener("click", () => {
  if (snake.y >= groundY() - snake.r - 1) {
    snake.vy = -JUMP_POWER;
  }
});

// ===== UI =====
const skinsBtn = document.getElementById("skinsBtn");
const skinsMenu = document.getElementById("skinsMenu");

skinsBtn.onclick = () => {
  skinsMenu.style.display =
    skinsMenu.style.display === "block" ? "none" : "block";
};

// ===== HELPERS =====
function groundY() {
  return canvas.height - GROUND_HEIGHT;
}

function spawnWalls() {
  const x = canvas.width + 50;
  const doubleWall = score >= 5 && Math.random() < 0.5;

  if (doubleWall) {
    walls.push({ x, w: WALL_WIDTH });
    walls.push({ x: x + WALL_GAP, w: WALL_WIDTH });

    // 90% chance platform ABOVE double wall
    if (Math.random() < 0.9) {
      platforms.push({
        x: x + WALL_GAP / 2 - PLATFORM_WIDTH / 2,
        y: groundY() - 120
      });
    }
  } else {
    walls.push({ x, w: WALL_WIDTH });
  }
}

function collideCircleRect(c, r) {
  return (
    c.x + c.r > r.x &&
    c.x - c.r < r.x + r.w &&
    c.y + c.r > r.y &&
    c.y - c.r < r.y + r.h
  );
}

// ===== GAME LOOP =====
function update() {
  if (gameOver) return;

  // Physics
  snake.vy += GRAVITY;
  snake.y += snake.vy;

  if (snake.y > groundY() - snake.r) {
    snake.y = groundY() - snake.r;
    snake.vy = 0;
  }

  // Spawn walls
  if (walls.length === 0 || walls[walls.length - 1].x < canvas.width - 300) {
    spawnWalls();
  }

  // Move walls
  walls.forEach(w => w.x -= speed);
  platforms.forEach(p => p.x -= speed);

  // Wall collisions + score
  walls.forEach((w, i) => {
    const rect = { x: w.x, y: groundY() - 80, w: w.w, h: 80 };

    if (collideCircleRect(snake, rect)) {
      gameOver = true;
    }

    if (!passedWalls.has(w) && w.x + w.w < snake.x) {
      passedWalls.add(w);
      score++;
      if (score >= 10) speed += 0.5;
    }
  });

  // Platform collision (SAFE)
  platforms.forEach(p => {
    const rect = { x: p.x, y: p.y, w: PLATFORM_WIDTH, h: PLATFORM_HEIGHT };
    if (
      snake.vy > 0 &&
      snake.x > rect.x &&
      snake.x < rect.x + rect.w &&
      snake.y + snake.r > rect.y &&
      snake.y + snake.r < rect.y + rect.h
    ) {
      snake.y = rect.y - snake.r;
      snake.vy = 0;
    }
  });

  // Cleanup
  walls = walls.filter(w => w.x + w.w > -50);
  platforms = platforms.filter(p => p.x + PLATFORM_WIDTH > -50);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "lime";
  ctx.fillRect(0, groundY(), canvas.width, GROUND_HEIGHT);

  // Walls
  ctx.fillStyle = "#888";
  walls.forEach(w => {
    ctx.fillRect(w.x, groundY() - 80, w.w, 80);
  });

  // Platforms
  ctx.fillStyle = "#00ffff";
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, PLATFORM_WIDTH, PLATFORM_HEIGHT);
  });

  // Snake
  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fillStyle = snake.color;
  ctx.fill();

  // Game over
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }

  document.getElementById("score").innerText = "Score: " + score;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
