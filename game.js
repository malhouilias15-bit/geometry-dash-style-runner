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

/* ---------- STORAGE ---------- */
let topScore = +localStorage.getItem("topScore") || 0;
let money = +localStorage.getItem("money") || 0;

let skinUnlocks = JSON.parse(localStorage.getItem("skinUnlocks")) || {
  blue: false,
  yellow: false,
  purple: false,
  orange: false,
  rainbow: false
};

let snakeSkin = localStorage.getItem("snakeSkin") || "green";

/* ---------- GAME STATE ---------- */
let score = 0;
let speed = 4.8;
let gameOver = false;
const groundHeight = 80;

/* ---------- POWERUPS ---------- */
let shieldTimer = 0;
let boostTimer = 0;

/* ---------- BUTTONS ---------- */
function makeBtn(text, top, right, left) {
  const b = document.createElement("button");
  b.textContent = text;
  Object.assign(b.style, {
    position: "fixed",
    top,
    right,
    left,
    padding: "10px",
    zIndex: 20
  });
  document.body.appendChild(b);
  return b;
}

const demonBtn = makeBtn("HARDEST LEVEL", "10px", "20px");
demonBtn.style.background = "darkred";
demonBtn.style.color = "white";
demonBtn.onclick = () => {
  demonMode = !demonMode;
  resetGame();
};

const shopBtn = makeBtn("SHOP", "50px", "20px");
const skinsBtn = makeBtn("SKINS", "90px", "20px");
const statsBtn = makeBtn("STATS", "10px", null, "20px");

/* ---------- MENUS ---------- */
function makeMenu(top, right, left, center = false) {
  const d = document.createElement("div");
  Object.assign(d.style, {
    position: "fixed",
    top,
    right,
    left,
    background: "#222",
    color: "white",
    padding: "12px",
    display: "none",
    zIndex: 20,
    textAlign: "center",
    transform: center ? "translateX(-50%)" : "none"
  });
  document.body.appendChild(d);
  return d;
}

const shopMenu = makeMenu("130px", "20px");
const skinsMenu = makeMenu("130px", "20px");
const statsMenu = makeMenu("50%", null, "50%", true);

shopBtn.onclick = () =>
  shopMenu.style.display = shopMenu.style.display === "none" ? "block" : "none";
skinsBtn.onclick = () =>
  skinsMenu.style.display = skinsMenu.style.display === "none" ? "block" : "none";
statsBtn.onclick = () => {
  statsMenu.style.display = statsMenu.style.display === "none" ? "block" : "none";
  statsMenu.innerHTML = `
    <h3>${username}</h3>
    <p>Best Score: ${topScore}</p>
    <p>Cash: $${money}</p>
  `;
};

/* ---------- SHOP ---------- */
shopMenu.innerHTML = `
<button id="buyShield">Spike Shield ($25)</button><br><br>
<button id="buyBoost">Score Boost ($10)</button>
`;

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

/* ---------- SKINS ---------- */
function skinBtn(name, color, need) {
  const b = document.createElement("button");
  b.textContent = `${name} (${need})`;
  b.onclick = () => {
    if (skinUnlocks[name]) {
      snakeSkin = color;
      localStorage.setItem("snakeSkin", snakeSkin);
    }
  };
  skinsMenu.appendChild(b);
  skinsMenu.appendChild(document.createElement("br"));
}

function refreshSkins() {
  skinsMenu.innerHTML = "";
  skinBtn("blue", "blue", 10);
  skinBtn("yellow", "yellow", 20);
  skinBtn("purple", "purple", 30);
  skinBtn("orange", "orange", 40);
  skinBtn("rainbow", "rainbow", 100);
}
refreshSkins();

/* ---------- SNAKE ---------- */
const snake = { x: 140, y: 0, r: 14, vy: 0, onGround: false };

/* ---------- OBJECTS ---------- */
let wallGroups = [];
let spikes = [];
let orbs = [];

/* ---------- INPUT ---------- */
document.addEventListener("keydown", e => {
  if (e.code === "Space" && snake.onGround && !gameOver) {
    snake.vy = demonMode ? -13 : -11;
    snake.onGround = false;
  }
});

/* ---------- RESET ---------- */
function resetGame() {
  score = 0;
  gameOver = false;
  wallGroups = [];
  spikes = [];
  orbs = [];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
}

/* ---------- SPAWN ---------- */
function spawnWallGroup() {
  wallGroups.push({
    x: canvas.width + 200,
    y: canvas.height - groundHeight - 60,
    w: 26,
    h: 60,
    scored: false
  });
}

function spawnSpikes(count) {
  const baseX = canvas.width + 350;
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
      y: canvas.height - groundHeight - 80,
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

  wallGroups.forEach(w => w.x -= speed);
  spikes.forEach(s => s.x -= speed);
  orbs.forEach(o => o.x -= speed);

  wallGroups.forEach(w => {
    if (
      snake.x + snake.r > w.x &&
      snake.x - snake.r < w.x + w.w &&
      snake.y + snake.r > w.y
    ) {
      gameOver = true;
    }

    if (!w.scored && w.x + w.w < snake.x) {
      w.scored = true;
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
      snake.vy = -8;
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

  shieldTimer && shieldTimer--;
  boostTimer && boostTimer--;

  if (score > topScore) {
    topScore = score;
    localStorage.setItem("topScore", topScore);
  }

  if (score >= 10) skinUnlocks.blue = true;
  if (score >= 20) skinUnlocks.yellow = true;
  if (score >= 30) skinUnlocks.purple = true;
  if (score >= 40) skinUnlocks.orange = true;
  if (score >= 100) skinUnlocks.rainbow = true;

  localStorage.setItem("skinUnlocks", JSON.stringify(skinUnlocks));
  refreshSkins();
}

/* ---------- DRAW ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  ctx.fillStyle = "gray";
  wallGroups.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  ctx.fillStyle = "#555";
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.size / 2, s.y - s.size);
    ctx.lineTo(s.x + s.size, s.y);
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

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
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
