const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ---------------- CANVAS ----------------
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

document.getElementById("score").textContent = "Score: 0";

// ---------------- SNAKE ----------------
const snake = {
  x: 120,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false
};

// ---------------- OBJECTS ----------------
let wallGroups = [];   // each group = single OR double wall
let platforms = [];
let spikes = [];

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

// ---------------- SPAWN WALLS ----------------
function spawnWallGroup() {
  const y = canvas.height - groundHeight - 60;
  const isDouble = Math.random() < 0.4;

  const group = {
    walls: [],
    scored: false
  };

  group.walls.push({
    x: canvas.width,
    y,
    w: 26,
    h: 60
  });

  if (isDouble) {
    group.walls.push({
      x: canvas.width + 40,
      y,
      w: 26,
      h: 60
    });

    // platform (90% chance)
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

// ---------------- SPAWN SPIKES ----------------
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

// ---------------- GAME LOOP ----------------
let spawnTimer = 0;
let spikeTimer = 0;

function update() {
  if (gameOver) return;

  // gravity
  snake.vy += 0.8;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  }

  // move walls
  wallGroups.forEach(g =>
    g.walls.forEach(w => w.x -= speed)
  );

  // move platforms
  platforms.forEach(p => p.x -= speed);

  // move spikes
  spikes.forEach(s => s.x -= speed);

  // wall collision
  wallGroups.forEach(g => {
    g.walls.forEach(w => {
      if (
        snake.x + snake.r > w.x &&
        snake.x - snake.r < w.x + w.w &&
        snake.y + snake.r > w.y
      ) gameOver = true;
    });
  });

  // spike collision
  spikes.forEach(s => {
    if (
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size
    ) gameOver = true;
  });

  // platform collision
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

  // scoring (ONCE per wall group)
  wallGroups.forEach(g => {
    const lastWall = g.walls[g.walls.length - 1];
    if (!g.scored && lastWall.x + lastWall.w < snake.x) {
      g.scored = true;
      score++;
      speed = 5 + Math.floor(score / 10);
      document.getElementById("score").textContent = "Score: " + score;
    }
  });

  // cleanup
  wallGroups = wallGroups.filter(
    g => g.walls[g.walls.length - 1].x + 30 > 0
  );
  platforms = platforms.filter(p => p.x + p.w > 0);
  spikes = spikes.filter(s => s.x + s.size > 0);

  // spawn timing
  spawnTimer++;
  spikeTimer++;

  if (spawnTimer > 90) {
    spawnWallGroup();
    spawnTimer = 0;
  }

  if (score >= 10 && spikeTimer > 140) {
    spawnSpikes();
    spikeTimer = 0;
  }
}

// ---------------- DRAW ----------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // walls
  ctx.fillStyle = "gray";
  wallGroups.forEach(g =>
    g.walls.forEach(w =>
      ctx.fillRect(w.x, w.y, w.w, w.h)
    )
  );

  // platforms
  ctx.fillStyle = "white";
  platforms.forEach(p =>
    ctx.fillRect(p.x, p.y, p.w, p.h)
  );

  // spikes
  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.closePath();
    ctx.fill();
  });

  // snake (green dot)
  ctx.fillStyle = "lime";
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

// ---------------- LOOP ----------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

snake.y = canvas.height - groundHeight - snake.r;
loop();
