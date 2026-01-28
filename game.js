// ================== CANVAS ==================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ================== USER ==================
let username = localStorage.getItem("user");
if (!username) {
  username = prompt("Enter username") || "Player";
  localStorage.setItem("user", username);
}

// ================== BASE ==================
const groundH = 80;
let speed = 6;
let score = 0;
let gameOver = false;
let hardest = false;

let level = Number(localStorage.getItem("level")) || 1;
let money = Number(localStorage.getItem("money")) || 0;

let scoreBoost = 0;
let spikeShield = 0;

// ================== PLAYER ==================
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  touchingOrb: false,
  deadAnim: 0
};

// ================== STORAGE ==================
let data = JSON.parse(localStorage.getItem("data")) || {
  skins: {
    green: true,
    blue: true,
    yellow: true,
    purple: false,
    rainbow: false,
    darkred: false
  },
  selected: "green",
  topScore: 0
};

// ================== UI ==================
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
const statsBtn = makeBtn("Stats", "70px");
const shopBtn = makeBtn("Shop", "100px");
const levelsBtn = makeBtn("Levels", "130px");
const hardBtn = makeBtn("HARDEST", "10px");

// ================== MENUS ==================
function menu(y) {
  const d = document.createElement("div");
  d.style.position = "fixed";
  d.style.left = "10px";
  d.style.top = y;
  d.style.background = "#222";
  d.style.color = "white";
  d.style.padding = "10px";
  d.style.display = "none";
  d.style.zIndex = 10;
  document.body.appendChild(d);
  return d;
}

const skinsMenu = menu("170px");
const statsMenu = menu("170px");
const shopMenu = menu("170px");
const levelsMenu = menu("170px");

function toggle(m, r) {
  [skinsMenu, statsMenu, shopMenu, levelsMenu].forEach(x => x.style.display = "none");
  m.style.display = "block";
  r();
}

skinsBtn.onclick = () => toggle(skinsMenu, renderSkins);
statsBtn.onclick = () => toggle(statsMenu, renderStats);
shopBtn.onclick = () => toggle(shopMenu, renderShop);
levelsBtn.onclick = () => toggle(levelsMenu, renderLevels);

hardBtn.onclick = () => {
  hardest = !hardest;
  reset();
};

// ================== OBJECTS ==================
let walls = [];
let spikes = [];
let platforms = [];
let orbs = [];

// ================== RESET ==================
function reset() {
  score = 0;
  gameOver = false;
  player.deadAnim = 0;
  walls = [];
  spikes = [];
  platforms = [];
  orbs = [];
  player.y = canvas.height - groundH - player.r;
  player.vy = 0;
}

// ================== SPAWN ==================
let timer = 0;

function spawnNormal() {
  const x = canvas.width + 120;

  walls.push({ x, w: 30, h: 70, passed: false });

  platforms.push({
    x: x + 60,
    y: canvas.height - groundH - 100,
    w: 120,
    h: 12
  });

  const count = [1,2,3][Math.floor(Math.random()*3)];
  for (let i = 0; i < count; i++) {
    spikes.push({ x: x + 220 + i*26, y: canvas.height - groundH, s: 26 });
  }
}

function spawnHard() {
  const x = canvas.width + 140;

  walls.push({ x, w: 30, h: 90, passed: false });

  platforms.push({
    x: x + 50,
    y: canvas.height - groundH - 120,
    w: 140,
    h: 12
  });

  for (let i = 0; i < 6; i++) {
    spikes.push({ x: x + 220 + i*26, y: canvas.height - groundH, s: 26 });
  }

  orbs.push({
    x: x + 220 + 3*26,
    y: canvas.height - groundH - 60,
    power: 16
  });
}

// ================== INPUT ==================
function jump() {
  if (player.touchingOrb) {
    player.vy = -16;
    player.touchingOrb = false;
    return;
  }
  if (player.onGround) {
    player.vy = -12;
    player.onGround = false;
  }
}
document.addEventListener("keydown", e => e.code === "Space" && jump());
canvas.addEventListener("mousedown", jump);

// ================== UPDATE ==================
function update() {
  if (gameOver) {
    player.deadAnim++;
    return;
  }

  player.vy += 0.8;
  player.y += player.vy;

  const groundY = canvas.height - groundH - player.r;
  player.onGround = false;

  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }

  [...walls, ...spikes, ...platforms, ...orbs].forEach(o => o.x -= speed);

  player.touchingOrb = false;
  orbs.forEach(o => {
    if (Math.abs(player.x - o.x) < 12 && Math.abs(player.y - o.y) < 12)
      player.touchingOrb = true;
  });

  platforms.forEach(p => {
    if (
      player.x + player.r > p.x &&
      player.x - player.r < p.x + p.w &&
      player.y + player.r >= p.y &&
      player.y + player.r <= p.y + 12 &&
      player.vy >= 0
    ) {
      player.y = p.y - player.r;
      player.vy = 0;
      player.onGround = true;
    }
  });

  walls.forEach(w => {
    if (
      player.x + player.r > w.x &&
      player.x - player.r < w.x + w.w &&
      player.y + player.r > canvas.height - groundH - w.h
    ) gameOver = true;

    if (!w.passed && player.x > w.x) {
      score++;
      w.passed = true;
    }
  });

  spikes.forEach(s => {
    if (
      player.x > s.x &&
      player.x < s.x + s.s &&
      player.y + player.r > s.y - s.s
    ) gameOver = true;
  });

  timer++;
  if (timer > 120) {
    hardest ? spawnHard() : spawnNormal();
    timer = 0;
  }

  level = Math.min(300, Math.floor(score / 5) + 1);
  if (level === 300) alert("🏆 YOU BEAT THE GAME!");

  data.topScore = Math.max(data.topScore, score);

  localStorage.setItem("level", level);
  localStorage.setItem("money", money);
  localStorage.setItem("data", JSON.stringify(data));

  scoreEl.textContent = `Score: ${score} | Lv: ${level}`;
}

// ================== DRAW ==================
function drawSpike(s) {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x + s.s / 2, s.y - s.s);
  ctx.lineTo(s.x + s.s, s.y);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.fillStyle = hardest ? "#300" : "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - groundH, canvas.width, groundH);

  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, canvas.height - groundH - w.h, w.w, w.h));

  ctx.fillStyle = "white";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  spikes.forEach(drawSpike);

  ctx.fillStyle = "yellow";
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  let c = data.selected;
  if (c === "darkred") c = "#7a0000";
  if (c === "rainbow") c = `hsl(${Date.now()%360},100%,50%)`;

  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(player.x, player.y + player.deadAnim, player.r, 0, Math.PI * 2);
  ctx.fill();
}

// ================== MENUS ==================
function renderLevels() {
  levelsMenu.innerHTML = `Your Level: ${level}<br>Max Level: 300`;
}

function renderStats() {
  statsMenu.innerHTML = `User: ${username}<br>Top Score: ${data.topScore}<br>Money: $${money}`;
}

function renderShop() {
  shopMenu.innerHTML = `
    <button onclick="buyBoost()">Score Boost ($10)</button><br>
    <button onclick="buyShield()">Spike Shield ($25)</button>
  `;
}

function buyBoost(){ if(money>=10){money-=10;scoreBoost=300;} }
function buyShield(){ if(money>=25){money-=25;spikeShield=300;} }

function renderSkins() {
  skinsMenu.innerHTML = Object.keys(data.skins).map(k =>
    data.skins[k]
      ? `<button onclick="equip('${k}')">EQUIP ${k}</button>`
      : `<button disabled>LOCKED ${k}</button>`
  ).join("<br>");
}

function equip(c){ data.selected=c; localStorage.setItem("data",JSON.stringify(data)); }

// ================== OWNER PAD ==================
window.ownerPad = function(name){
  if(name){
    data.skins.darkred = true;
    localStorage.setItem("data",JSON.stringify(data));
  }
};

// ================== LOOP ==================
reset();
(function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
})();


