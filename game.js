const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= CANVAS ================= */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ================= GAME VARS ================= */
const groundHeight = 80;
let speed = 6;
let score = 0;
let money = 0;
let gameOver = false;
let hardest = false;

/* ================= PLAYER ================= */
const snake = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  color: "green"
};

/* ================= STORAGE ================= */
let unlockedSkins = JSON.parse(localStorage.getItem("skins")) || {
  green: true,
  selected: "green"
};

/* ================= UI ================= */
const scoreEl = document.getElementById("score");

function makeBtn(text, top) {
  const b = document.createElement("button");
  b.textContent = text;
  b.style.position = "fixed";
  b.style.left = "10px";
  b.style.top = top;
  b.style.zIndex = 10;
  document.body.appendChild(b);
  return b;
}

const skinsBtn = makeBtn("Skins", "40px");
const shopBtn  = makeBtn("Shop", "70px");
const statsBtn = makeBtn("Stats", "100px");
const hardBtn  = makeBtn("HARDEST LEVEL", "10px");

/* ================= MENUS ================= */
function makeMenu(top) {
  const d = document.createElement("div");
  d.style.position = "fixed";
  d.style.left = "10px";
  d.style.top = top;
  d.style.background = "#222";
  d.style.color = "white";
  d.style.padding = "10px";
  d.style.display = "none";
  d.style.zIndex = 10;
  document.body.appendChild(d);
  return d;
}

const skinsMenu = makeMenu("140px");
const shopMenu  = makeMenu("140px");
const statsMenu = makeMenu("140px");

skinsBtn.onclick = () => toggleMenu(skinsMenu, renderSkins);
shopBtn.onclick  = () => toggleMenu(shopMenu, renderShop);
statsBtn.onclick = () => toggleMenu(statsMenu, renderStats);

hardBtn.onclick = () => {
  hardest = !hardest;
  resetGame();
};

function toggleMenu(menu, render) {
  skinsMenu.style.display = "none";
  shopMenu.style.display = "none";
  statsMenu.style.display = "none";
  menu.style.display = "block";
  render();
}

/* ================= OBJECTS ================= */
let walls = [];
let spikes = [];
let platforms = [];

/* ================= RESET ================= */
function resetGame() {
  score = 0;
  money = 0;
  gameOver = false;
  walls = [];
  spikes = [];
  platforms = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
}

/* ================= SPAWN ================= */
let wallTimer = 0;
let spikeTimer = 0;

function spawnWall() {
  const x = canvas.width + 40;
  const h = 60;
  const y = canvas.height - groundHeight - h;

  walls.push({ x, y, w: 25, h, scored: false });

  if (Math.random() < 0.4) {
    walls.push({ x: x + 40, y, w: 25, h, scored: false });
    platforms.push({ x: x + 10, y: y - 35, w: 80, h: 10 });
  }
}

function spawnSpikes() {
  const x = canvas.width + 60;
  const count = hardest ? 3 : 2;

  for (let i = 0; i < count; i++) {
    spikes.push({
      x: x + i * 25,
      y: canvas.height - groundHeight,
      s: 20
    });
  }
}

/* ================= INPUT ================= */
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = -13;
    snake.onGround = false;
  }
}
document.addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("mousedown", jump);

/* ================= UPDATE ================= */
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

  [...walls, ...spikes, ...platforms].forEach(o => o.x -= speed);

  platforms.forEach(p => {
    if (
      snake.y + snake.r >= p.y &&
      snake.y + snake.r <= p.y + p.h &&
      snake.x > p.x &&
      snake.x < p.x + p.w &&
      snake.vy >= 0
    ) {
      snake.y = p.y - snake.r;
      snake.vy = 0;
      snake.onGround = true;
    }
  });

  walls.forEach(w => {
    if (
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > w.y
    ) gameOver = true;

    if (!w.scored && w.x + w.w < snake.x) {
      w.scored = true;
      score++;
    }
  });

  spikes.forEach(s => {
    if (
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.s &&
      snake.y + snake.r > s.y
    ) gameOver = true;
  });

  wallTimer++;
  spikeTimer++;

  if (wallTimer > 90) {
    spawnWall();
    wallTimer = 0;
  }

  if (spikeTimer > 160) {
    spawnSpikes();
    spikeTimer = 0;
  }

  scoreEl.textContent = "Score: " + score;
}

/* ================= DRAW ================= */
function draw() {
  ctx.fillStyle = hardest ? "#300" : "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = "red";
  spikes.forEach(s => ctx.fillRect(s.x, s.y, s.s, 20));

  ctx.fillStyle = unlockedSkins.selected;
  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= MENUS ================= */
function renderSkins() {
  skinsMenu.innerHTML = `
    <button onclick="equip('green')">EQUIP GREEN (FREE)</button>
  `;
}

function renderShop() {
  shopMenu.innerHTML = `Money: $${money}<br>Coming soon`;
}

function renderStats() {
  statsMenu.innerHTML = `Score: ${score}`;
}

window.equip = c => {
  unlockedSkins.selected = c;
  localStorage.setItem("skins", JSON.stringify(unlockedSkins));
};

/* ================= LOOP ================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();
