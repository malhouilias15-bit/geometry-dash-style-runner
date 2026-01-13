const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const groundHeight = 80;

// ===== GAME STATE =====
let score = 0;
let speed = 6;
let gameOver = false;

// ===== SNAKE =====
const snake = {
  x: 120,
  y: canvas.height - groundHeight - 16,
  r: 16,
  vy: 0,
  gravity: 0.8,
  jump: -14,
  onGround: true
};

// ===== WALLS & PLATFORMS =====
let obstacles = [];

function spawnObstacle() {
  const isDouble = Math.random() < 0.35; // chance for double wall

  if (!isDouble) {
    obstacles.push({
      type: "wall",
      x: canvas.width,
      w: 30,
      h: 60,
      passed: false
    });
    return;
  }

  // DOUBLE WALL
  const gap = 90;
  const wallHeight = 60;

  const leftWall = {
    type: "wall",
    x: canvas.width,
    w: 30,
    h: wallHeight,
    passed: false
  };

  const rightWall = {
    type: "wall",
    x: canvas.width + gap,
    w: 30,
    h: wallHeight,
    passed: false
  };

  obstacles.push(leftWall, rightWall);

  // PLATFORM (score >= 5 and 90% chance)
  if (score >= 5 && Math.random() < 0.9) {
    obstacles.push({
      type: "platform",
      x: canvas.width + 30,
      w: gap - 30,
      h: 16,
      yOffset: wallHeight + 10
    });
  }
}

setInterval(spawnObstacle, 1700);

// ===== INPUT =====
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = snake.jump;
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

canvas.addEventListener("touchstart", jump);

// ===== UPDATE =====
function update() {
  if (gameOver) return;

  // Snake physics
  snake.vy += snake.gravity;
  snake.y += snake.vy;

  snake.onGround = false;

  if (snake.y >= canvas.height - groundHeight - snake.r) {
    snake.y = canvas.height - groundHeight - snake.r;
    snake.vy = 0;
    snake.onGround = true;
  }

  obstacles.forEach(o => {
    o.x -= speed;

    if (o.type === "wall") {
      // Score
      if (!o.passed && o.x + o.w < snake.x) {
        o.passed = true;
        score++;
        document.getElementById("score").textContent = "Score: " + score;
        if (score % 10 === 0) speed += 0.8;
      }

      // Collision
      if (
        snake.x + snake.r > o.x &&
        snake.x - snake.r < o.x + o.w &&
        snake.y + snake.r > canvas.height - groundHeight - o.h
      ) {
        gameOver = true;
      }
    }

    // PLATFORM COLLISION (SAFE)
    if (o.type === "platform") {
      const platformY =
        canvas.height - groundHeight - o.yOffset;

      if (
        snake.x + snake.r > o.x &&
        snake.x - snake.r < o.x + o.w &&
        snake.y + snake.r > platformY &&
        snake.y + snake.r < platformY + 20 &&
        snake.vy >= 0
      ) {
        snake.y = platformY - snake.r;
        snake.vy = 0;
        snake.onGround = true;
      }
    }
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);
}

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Obstacles
  obstacles.forEach(o => {
    if (o.type === "wall") {
      ctx.fillStyle = "gray";
      ctx.fillRect(
        o.x,
        canvas.height - groundHeight - o.h,
        o.w,
        o.h
      );
    }

    if (o.type === "platform") {
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(
        o.x,
        canvas.height - groundHeight - o.yOffset,
        o.w,
        o.h
      );
    }
  });

  // Snake
  ctx.beginPath();
  ctx.fillStyle = "lime";
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);
  }
}

// ===== LOOP =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
