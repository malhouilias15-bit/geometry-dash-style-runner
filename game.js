const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GROUND_Y = 340;
let speed = 5;
let score = 0;
let money = Number(localStorage.getItem("money")) || 0;

const scoreEl = document.getElementById("score");
const moneyEl = document.getElementById("money");

const snake = {
  x: 100,
  y: GROUND_Y,
  r: 12,
  vy: 0,
  color: localStorage.getItem("skin") || "green"
};

let walls = [];
let spikes = [];
let platforms = [];

let onGround = true;
let gameOver = false;

// ---------- SKINS ----------
const skins = [
  { name: "Green", color: "green", unlock: 0 },
  { name: "Blue", color: "blue", unlock: 10 },
  { name: "Purple", color: "purple", unlock: 20 },
  { name: "Yellow", color: "yellow", unlock: 30 },
  { name: "Rainbow", color: "rainbow", unlock: 100 }
];

const skinsBtn = document.getElementById("skinsBtn");
const skinsMenu = document.getElementById("skinsMenu");

skinsBtn.onclick = () => {
  skinsMenu.classList.toggle("hidden");
  renderSkins();
};

function renderSkins() {
  skinsMenu.innerHTML = "";
  skins.forEach(s => {
    const div = document.createElement("div");
    div.className = "skin";
    if (score >= s.unlock) {
      div.textContent = `Equip ${s.name}`;
      div.onclick = () => {
        snake.color = s.color;
        localStorage.setItem("skin", s.color);
      };
    } else {
      div.textContent = `${s.name} (Locked)`;
    }
    skinsMenu.appendChild(div);
  });
}

// ---------- SHOP ----------
document.getElementById("skip10").onclick = () => {
  if (money >= 20) {
    money -= 20;
    score += 10;
    updateUI();
  }
};

// ---------- INPUT ----------
document.addEventListener("keydown", e => {
  if (e.code === "Space" && onGround) {
    snake.vy = -15;
    onGround = false;
  }
});

// ---------- SPAWN ----------
function spawnWall() {
  const isDouble = Math.random() < 0.3 && score >= 5;
  const x = canvas.width;

  walls.push({ x, w: 30, double: isDouble });

  if (isDouble && Math.random() < 0.9) {
    platforms.push({ x: x + 15, y: GROUND_Y - 80 });
  }

  if (score >= 10 && Math.random() < 0.4) {
    spikes.push({ x: x + 50 });
  }
}

// ---------- UPDATE ----------
function update() {
  if (gameOver) return;

  snake.vy += 1;
  snake.y += snake.vy;

  if (snake.y >= GROUND_Y) {
    snake.y = GROUND_Y;
    snake.vy = 0;
    onGround = true;
  }

  walls.forEach(w => w.x -= speed);
  spikes.forEach(s => s.x -= speed);
  platforms.forEach(p => p.x -= speed);

  if (walls.length === 0 || walls[walls.length - 1].x < canvas.width - 300) {
    spawnWall();
  }

  walls = walls.filter(w => {
    if (w.x + w.w < snake.x && !w.passed) {
      w.passed = true;
      score++;
      if (score % 10 === 0) money += 20;
      if (score >= 10) speed += 0.3;
      updateUI();
    }
    return w.x + w.w > 0;
  });

  // COLLISIONS
  walls.forEach(w => {
    if (
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > GROUND_Y - 40
    ) gameOver = true;
  });

  spikes.forEach(s => {
    if (
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + 20 &&
      snake.y + snake.r > GROUND_Y - 20
    ) gameOver = true;
  });
}

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = "#0a0";
  ctx.fillRect(0, GROUND_Y + 12, canvas.width, 50);

  // snake
  ctx.fillStyle = snake.color === "rainbow"
    ? `hsl(${Date.now() / 5 % 360},100%,50%)`
    : snake.color;
  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  // walls
  ctx.fillStyle = "#964B00";
  walls.forEach(w => {
    ctx.fillRect(w.x, GROUND_Y - 40, w.w, 40);
    if (w.double) ctx.fillRect(w.x + 40, GROUND_Y - 40, w.w, 40);
  });

  // platforms
  ctx.fillStyle = "#aaa";
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, 50, 8);
  });

  // spikes
  ctx.fillStyle = "red";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, GROUND_Y);
    ctx.lineTo(s.x + 10, GROUND_Y - 20);
    ctx.lineTo(s.x + 20, GROUND_Y);
    ctx.fill();
  });

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("GAME OVER - Refresh", 300, 200);
  }
}

// ---------- UI ----------
function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  moneyEl.textContent = `$${money}`;
  localStorage.setItem("money", money);
}

// ---------- LOOP ----------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

updateUI();
loop();
