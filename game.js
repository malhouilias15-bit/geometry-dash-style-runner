const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ---------- RESIZE ---------- */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ---------- USERNAME ---------- */
let username = localStorage.getItem("username");
if (!username) {
  username = "Snake_" + Math.floor(1000 + Math.random() * 9000);
  localStorage.setItem("username", username);
}

/* ---------- UI ---------- */
const scoreEl = document.getElementById("score");

/* ---------- MODE ---------- */
let demonMode = false;

/* ---------- DEMON BUTTON ---------- */
const demonBtn = document.createElement("button");
demonBtn.textContent = "HARDEST LEVEL";
Object.assign(demonBtn.style, {
  position: "fixed",
  top: "10px",
  right: "20px",
  padding: "10px",
  background: "darkred",
  color: "white",
  border: "none",
  fontWeight: "bold",
  zIndex: 20
});
document.body.appendChild(demonBtn);

demonBtn.onclick = () => {
  demonMode = !demonMode;
  resetGame();
};

/* ---------- SHOP BUTTON ---------- */
const shopBtn = document.createElement("button");
shopBtn.textContent = "SHOP";
Object.assign(shopBtn.style, {
  position: "fixed",
  top: "50px",
  right: "20px",
  padding: "10px",
  zIndex: 20
});
document.body.appendChild(shopBtn);

const shopMenu = document.createElement("div");
Object.assign(shopMenu.style, {
  position: "fixed",
  top: "90px",
  right: "20px",
  background: "#222",
  color: "white",
  padding: "10px",
  display: "none",
  zIndex: 20
});
document.body.appendChild(shopMenu);

shopBtn.onclick = () => {
  shopMenu.style.display = shopMenu.style.display === "none" ? "block" : "none";
};

shopMenu.innerHTML = `
  <button id="buyShield">Spike Shield ($25)</button><br><br>
  <button id="buyBoost">Score Boost ($10)</button>
`;

/* ---------- STATS BUTTON ---------- */
const statsBtn = document.createElement("button");
statsBtn.textContent = "STATS";
Object.assign(statsBtn.style, {
  position: "fixed",
  top: "10px",
  left: "20px",
  padding: "10px",
  zIndex: 20
});
document.body.appendChild(statsBtn);

const statsMenu = document.createElement("div");
Object.assign(statsMenu.style, {
  position: "fixed",
  top: "50px",
  left: "20px",
  background: "#222",
  color: "white",
  padding: "10px",
  display: "none",
  zIndex: 20
});
document.body.appendChild(statsMenu);

statsBtn.onclick = () => {
  statsMenu.style.display = statsMenu.style.display === "none" ? "block" : "none";
  statsMenu.innerHTML = `
    Username: ${username}<br>
    Best Score: ${topScore}<br>
    Cash: $${money}
  `;
};

/* ---------- STORAGE ---------- */
let topScore = +localStorage.getItem("topScore") || 0;
let money = +localStorage.getItem("money") || 0;

let skinUnlocks = JSON.parse(localStorage.getItem("skinUnlocks")) || {
  blue: false,
  yellow: false,
  orange: false,
  rainbow: false
};

/* ---------- GAME STATE ---------- */
let score = 0;
let speed = 4.8;
let gameOver = false;
const groundHeight = 80;

/* ---------- POWERUPS ---------- */
let shieldTimer = 0;
let boostTimer = 0;

/* ---------- SHOP LOGIC ---------- */
document.getElementById("buyShield").onclick = () => {
  if (money >= 25) {
    money -= 25;
    shieldTimer = 300;
    localStorage.setItem("money", money);
  }
};

document.getElementById("buyBoost").onclick = () => {
  if (money >= 10) {
    money -= 10;
    boostTimer = 300;
    localStorage.setItem("money", money);
  }
};

/* ---------- SNAKE ---------- */
let snakeSkin = "green";
const snake = { x: 140, y: 0, r: 14, vy: 0, onGround: false };

/* ---------- OBJECTS ---------- */
let wallGroups = [];
let platforms = [];
let spikes = [];
let orbs = [];

/* ---------- INPUT ---------- */
function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -13 : -11;
    snake.onGround = false;
  }
}
document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

/* ---------- RESET ---------- */
function resetGame() {
  score = 0;
  gameOver = false;
  wallGroups = [];
  platforms = [];
  spikes = [];
  orbs = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
}

/* ---------- WALLS ---------- */
function spawnWallGroup() {
  const y = canvas.height - groundHeight - 60;
  const x = canvas.width + 200;
  wallGroups.push({
    walls: [{ x, y, w: 26, h: 60 }],
    scored: false
  });
}

/* ---------- SPIKES ---------- */
function spawnSpikes(count) {
  const baseX = canvas.width + 360;
  for (let i = 0; i < count; i++) {
    spikes.push({
      x: baseX + i * 26,
      y: canvas.height - groundHeight,
      size: 20
    });
  }

  if (demonMode && count === 6) {
    orbs.push({
      x: baseX + 60,
      y: canvas.height - groundHeight - 90,
      r: 10
    });
  }
}

/* ---------- UPDATE ---------- */
let wallTimer = 0;
let spikeTimer = 0;

function update() {
  if (gameOver) return;

  snake.vy += 0.7;
  snake.y += snake.vy;

  const groundY = canvas.height - groundHeight - snake.r;
  if (snake.y >= groundY) {
    snake.y = groundY;
    snake.vy = 0;
    snake.onGround = true;
  }

  wallGroups.forEach(g => g.walls.forEach(w => w.x -= speed));
  spikes.forEach(s => s.x -= speed);
  orbs.forEach(o => o.x -= speed);

  wallGroups.forEach(g => {
    const w = g.walls[0];
    if (!g.scored && w.x + w.w < snake.x) {
      g.scored = true;
      const gain = boostTimer > 0 ? 2 : 1;
      score += gain;
      money += gain;
      scoreEl.textContent = "Score: " + score;
      localStorage.setItem("money", money);
    }
  });

  spikes.forEach(s => {
    if (
      snake.x + snake.r > s.x &&
      snake.x - snake.r < s.x + s.size &&
      snake.y + snake.r > s.y - s.size
    ) {
      if (shieldTimer <= 0) gameOver = true;
    }
  });

  orbs.forEach((o, i) => {
    if (Math.hypot(snake.x - o.x, snake.y - o.y) < snake.r + o.r) {
      snake.vy = -10;
      orbs.splice(i, 1);
    }
  });

  if (++wallTimer > 120) {
    spawnWallGroup();
    wallTimer = 0;
  }

  if (++spikeTimer > 260) {
    if (demonMode) spawnSpikes(6);
    else if (score >= 20) spawnSpikes(3);
    spikeTimer = 0;
  }

  if (shieldTimer > 0) shieldTimer--;
  if (boostTimer > 0) boostTimer--;

  if (score > topScore) {
    topScore = score;
    localStorage.setItem("topScore", topScore);
  }

  if (score >= 10) skinUnlocks.blue = true;
  if (score >= 30) skinUnlocks.yellow = true;
  if (score >= 40) skinUnlocks.orange = true;
  if (score >= 100) skinUnlocks.rainbow = true;

  localStorage.setItem("skinUnlocks", JSON.stringify(skinUnlocks));
}

/* ---------- DRAW ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  ctx.fillStyle = "gray";
  wallGroups.forEach(g => g.walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h)));

  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle =
    snakeSkin === "rainbow"
      ? `hsl(${Date.now() % 360},100%,50%)`
      : snakeSkin;

  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(username, snake.x, snake.y - 20);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }
}

/* ---------- LOOP ---------- */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();
