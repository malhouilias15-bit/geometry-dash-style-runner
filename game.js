const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= CONFIG ================= */
const OWNER_USERNAME = "SlitherySerpent734";
const groundHeight = 80;

/* ================= RESIZE ================= */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ================= USER ================= */
let username = localStorage.getItem("username");
if (!username) {
  username = "Snake_" + Math.floor(Math.random() * 9000 + 1000);
  localStorage.setItem("username", username);
}

/* ================= STORAGE ================= */
let money = +localStorage.getItem("money") || 0;
let topScore = +localStorage.getItem("topScore") || 0;
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

let unlockedSkins = JSON.parse(localStorage.getItem("unlockedSkins")) || {
  green: true,
  selected: "green"
};

/* ================= BOOSTS ================= */
let spikeShieldUntil = 0;
let scoreBoostUntil = 0;

/* ================= GAME STATE ================= */
let demonMode = false;
let score = 0;
let speed = 6;
let gameOver = false;

/* ================= UI ================= */
const scoreEl = document.getElementById("score");

function makeBtn(text, top, right = "20px", bottom = null) {
  const b = document.createElement("button");
  b.textContent = text;
  Object.assign(b.style, {
    position: "fixed",
    top,
    right,
    bottom,
    padding: "10px",
    zIndex: 20
  });
  document.body.appendChild(b);
  return b;
}

const demonBtn = makeBtn("HARDEST LEVEL", "10px");
demonBtn.onclick = () => { demonMode = !demonMode; resetGame(); };

const statsBtn = makeBtn("STATS", "50px");
const skinsBtn = makeBtn("SKINS", "90px");
const shopBtn  = makeBtn("SHOP", "130px");

/* ================= MENUS ================= */
function makeMenu(top) {
  const d = document.createElement("div");
  Object.assign(d.style, {
    position: "fixed",
    top,
    right: "20px",
    background: "#222",
    color: "white",
    padding: "12px",
    display: "none",
    zIndex: 20
  });
  document.body.appendChild(d);
  return d;
}

const statsMenu = makeMenu("170px");
const skinsMenu = makeMenu("170px");
const shopMenu  = makeMenu("170px");

statsBtn.onclick = () => { statsMenu.style.display="block"; skinsMenu.style.display="none"; shopMenu.style.display="none"; updateStats(); };
skinsBtn.onclick = () => { skinsMenu.style.display="block"; statsMenu.style.display="none"; shopMenu.style.display="none"; renderSkins(); };
shopBtn.onclick  = () => { shopMenu.style.display="block"; statsMenu.style.display="none"; skinsMenu.style.display="none"; renderShop(); };

/* ================= SHOP ================= */
function renderShop() {
  shopMenu.innerHTML = `
  <b>SHOP</b><br><br>
  Money: $${money}<br><br>
  <button onclick="buyShield()">Spike Shield ($20)</button><br>
  <button onclick="buyBoost()">Score Boost ($10)</button>
  `;
}

window.buyShield = () => {
  if (money < 20) return;
  money -= 20;
  spikeShieldUntil = Date.now() + 5000;
  save();
};

window.buyBoost = () => {
  if (money < 10) return;
  money -= 10;
  scoreBoostUntil = Date.now() + 5000;
  save();
};

/* ================= SKINS ================= */
const skinReqs = {
  green: 0,
  blue: 10,
  purple: 20,
  yellow: 30,
  orange: 40,
  rainbow: 100
};

function renderSkins() {
  skinsMenu.innerHTML = Object.keys(skinReqs).map(s => {
    if (!unlockedSkins[s]) {
      return `<div>${s.toUpperCase()} — Score ${skinReqs[s]} for this</div>`;
    }
    if (unlockedSkins.selected === s) {
      return `<button disabled>EQUIPPED (${s})</button>`;
    }
    return `<button onclick="equipSkin('${s}')">EQUIP ${s}</button>`;
  }).join("<br>");
}

window.equipSkin = s => {
  unlockedSkins.selected = s;
  save();
  renderSkins();
};

/* ================= STATS ================= */
function updateStats() {
  const top = leaderboard.map((e,i)=>`#${i+1} ${e.name} — ${e.score}`).join("<br>") || "No scores";
  statsMenu.innerHTML = `<b>${username}</b><br>Best: ${topScore}<hr>${top}`;
}

/* ================= PLAYER ================= */
const snake = { x:150, y:0, r:14, vy:0, onGround:false };

function jump() {
  if (snake.onGround && !gameOver) {
    snake.vy = demonMode ? -14 : -12;
    snake.onGround = false;
  }
}

document.addEventListener("keydown", e => e.code==="Space" && jump());
canvas.addEventListener("mousedown", jump);

/* ================= OBJECTS ================= */
let walls=[], platforms=[], spikes=[], orbs=[], bossWalls=[], escapeBlocks=[];

/* ================= RESET ================= */
function resetGame() {
  score=0; gameOver=false;
  walls=[]; platforms=[]; spikes=[]; orbs=[]; bossWalls=[]; escapeBlocks=[];
  snake.y = canvas.height - groundHeight - snake.r;
  snake.vy = 0;
}

/* ================= SPAWN ================= */
function spawnWalls() {
  const x = canvas.width + 200;
  const y = canvas.height - groundHeight - 60;
  walls.push({x,y,w:26,h:60,scored:false});
  if (Math.random()<0.4) walls.push({x:x+40,y,w:26,h:60,scored:false});
}

function spawnSpikes() {
  const baseX = canvas.width + 300;
  const count = demonMode ? 6 : Math.floor(Math.random()*3)+1;
  for (let i=0;i<count;i++)
    spikes.push({x:baseX+i*26,y:canvas.height-groundHeight,size:20});
  if (demonMode) orbs.push({x:baseX+65,y:canvas.height-groundHeight-90,r:10});
}

function spawnBossWall() {
  const x=canvas.width+300,h=220,y=canvas.height-groundHeight-h;
  bossWalls.push({x,y,w:60,h});
  orbs.push({x:x+20,y:y-80,r:10},{x:x+40,y:y-140,r:10});
}

/* ================= UPDATE ================= */
let wallTimer=0, spikeTimer=0, bossTimer=0;

function update() {
  if (gameOver) return;

  snake.vy+=0.8; snake.y+=snake.vy;
  const groundY = canvas.height-groundHeight-snake.r;
  if (snake.y>=groundY){snake.y=groundY;snake.vy=0;snake.onGround=true;}

  [...walls,...spikes,...orbs,...bossWalls].forEach(o=>o.x-=speed);

  walls.forEach(w=>{
    if (snake.x+snake.r>w.x && snake.x-snake.r<w.x+w.w &&
        snake.y+snake.r>w.y) gameOver=true;

    if (!w.scored && w.x+w.w<snake.x) {
      w.scored=true;
      score += (Date.now()<scoreBoostUntil?2:1);
      money++; updateLeaderboard(); unlockSkins(); save();
    }
  });

  spikes.forEach(s=>{
    if (snake.x+snake.r>s.x && snake.x-snake.r<s.x+s.size &&
        snake.y+snake.r>s.y && Date.now()>spikeShieldUntil) gameOver=true;
  });

  orbs.forEach(o=>{
    if (Math.hypot(snake.x-o.x,snake.y-o.y)<snake.r+o.r){
      snake.vy=-18; o.x=-9999;
    }
  });

  if (++wallTimer>120) spawnWalls(),wallTimer=0;
  if (++spikeTimer>260) spawnSpikes(),spikeTimer=0;
  if (demonMode && ++bossTimer>900) spawnBossWall(),bossTimer=0;

  topScore=Math.max(topScore,score);
  scoreEl.textContent="Score: "+score;
}

/* ================= DRAW ================= */
function draw() {
  ctx.fillStyle=demonMode?"#550000":"#87ceeb";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle="lime";
  ctx.fillRect(0,canvas.height-groundHeight,canvas.width,groundHeight);

  ctx.fillStyle="gray";
  walls.forEach(w=>ctx.fillRect(w.x,w.y,w.w,w.h));

  ctx.fillStyle="red";
  spikes.forEach(s=>ctx.fillRect(s.x,s.y,s.size,20));

  ctx.fillStyle="purple";
  orbs.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();});

  ctx.fillStyle=unlockedSkins.selected;
  ctx.beginPath(); ctx.arc(snake.x,snake.y,snake.r,0,Math.PI*2); ctx.fill();
}

/* ================= SAVE ================= */
function save(){
  localStorage.setItem("money",money);
  localStorage.setItem("topScore",topScore);
  localStorage.setItem("leaderboard",JSON.stringify(leaderboard));
  localStorage.setItem("unlockedSkins",JSON.stringify(unlockedSkins));
}

function unlockSkins(){
  for(let s in skinReqs)
    if(!unlockedSkins[s] && score>=skinReqs[s]) unlockedSkins[s]=true;
}

function updateLeaderboard(){
  leaderboard.push({name:username,score});
  leaderboard.sort((a,b)=>b.score-a.score);
  leaderboard=leaderboard.slice(0,10);
}

/* ================= LOOP ================= */
function loop(){ update(); draw(); requestAnimationFrame(loop); }
resetGame(); loop();
