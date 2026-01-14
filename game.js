const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= CONSTANTS =================
const GROUND_HEIGHT = 100;
const GRAVITY = 0.9;
const JUMP_POWER = 15;
const WALL_WIDTH = 40;
const WALL_HEIGHT = 80;
const WALL_GAP = 130;

const PLATFORM_WIDTH = 130;
const PLATFORM_HEIGHT = 14;

// ================= GAME STATE =================
let speed = 6;
let score = 0;
let gameOver = false;
let passedWalls = new Set();

// ================= PLAYER =================
const snake = {
  x: 140,
  y: canvas.height - GROUND_HEIGHT - 12,
  r: 12,
  vy: 0,
  color: "lime"
};

// ================= SKINS =================
const skins = [
  { name: "Green", color: "lime", unlock: 0 },
  { name: "Blue", color: "dodgerblue", unlock: 10 },
  { name: "Purple", color: "purple", unlock: 20 },
  { name: "Yellow", color: "yellow", unlock: 30 },
  { name: "Orange", color: "orange", unlock: 40 },
  { name: "Rainbow", color: "rainbow", unlock: 100 }
];

const skinsMenu = document.getElementById("skinsMenu");
const skinsBtn = document.getElementById("skinsBtn");

// ================= OBJECTS =================
let walls = [];
let platforms = [];

// ================= INPUT =================
window.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});
canvas.addEventListener("click", jump);

function jump() {
  if (snake.y >= groundY() - snake.r - 1 && !gameOver) {
    snake.vy = -JUMP_POWER;
  }
}

// ================= HELPERS =================
function groundY() {
  return canvas.height - GROUND_HEIGHT;
}

function collideCircleRect(c, r) {
  return (
    c.x + c.r > r.x &&
    c.x - c.r < r.x + r.w &&
    c.y + c.r > r.y &&
    c.y - c.r < r.y + r.h
  );
}

// ================= SPAWN =================
function spawnObstacles() {
  const spawnX = canvas.width + 500; // 👈 EARLY SPAWN (IMPORTANT)
  const isDouble = score >= 5 && Math.random() < 0.5;

  if (isDouble) {
    const w1 = { x: spawnX, w: WALL_WIDTH };
    const w2 = { x: spawnX + WALL_GAP, w: WALL_WIDTH };

    walls.push(w1, w2);

    // 90% SAFE PLATFORM ABOVE DOUBLE WALL
    if (Math.random() < 0.9) {
      platforms.push({
        x: spawnX + WALL_GAP / 2 - PLATFORM_WIDTH / 2,
        y: groundY() - 130
      });
    }
  } else {
    walls.push({ x: spawnX, w: WALL_WIDTH });
  }
}

// ================= SKINS UI =================
skinsBtn.onclick = () => {
  skinsMenu.innerHTML = "";
  skinsMenu.style.display =
    skinsMenu.style.display === "block" ? "none" : "block";

  skins.forEach(skin => {
    const btn = document.createElement("button");
    btn.style.display = "block";
    btn.style.margin = "5px 0";

    if (score >= skin.unlock) {
      btn.textContent = `Equip ${skin.name}`;
      btn.onclick = () => {
        snake.color = skin.color;
      };
    } else {
      btn.textContent = `${skin.name} (Score ${skin.unlock})`;
      btn.disabled = true;
    }

    skinsMenu.appendChild(btn);
  });
};

// ================= GAME LOOP =================
function update() {
  if (gameOver) return;

  // Physics
  snake.vy += GRAVITY;
  snake.y += snake.vy;

  if (snake.y > groundY() - snake.r) {
    snake.y = groundY() - snake.r;
    snake.vy = 0;
  }

  // Spawn earlier based on speed
  if (walls.length === 0 || walls[walls.length - 1].x < canvas.width - 600) {
    spawnObstacles();
  }

  // Move objects
  walls.forEach(w => (w.x -= speed));
  platforms.forEach(p => (p.x -= speed));

  // Collisions & scoring
  walls.forEach(w => {
    const rect = { x: w.x, y: groundY() - WALL_HEIGHT, w: w.w, h: WALL_HEIGHT };

    if (collideCircleRect(snake, rect)) {
      gameOver = true;
    }

    if (!passedWalls.has(w) && w.x + w.w < snake.x) {
      passedWalls.add(w);
      score++;
      if (score >= 10) speed += 0.4;
    }
  });

  // Platform landing (SAFE)
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
  walls = walls.filter(w => w.x + w.w > -100);
  platforms = platforms.filter(p => p.x + PLATFORM_WIDTH > -100);
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
  walls.forEach(w =>
    ctx.fillRect(w.x, groundY() - WALL_HEIGHT, w.w, WALL_HEIGHT)
  );

  // Platforms
  ctx.fillStyle = "#00ffff";
  platforms.forEach(p =>
    ctx.fillRect(p.x, p.y, PLATFORM_WIDTH, PLATFORM_HEIGHT)
  );

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
