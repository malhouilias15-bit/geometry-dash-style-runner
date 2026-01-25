const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= CANVAS ================= */
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

/* ================= USER ================= */
let username = localStorage.getItem("gdUser") || prompt("Username") || "Player";
localStorage.setItem("gdUser", username);

/* ================= BASE ================= */
const groundH = 80;
let speed = 6;
let score = 0;
let money = 0;
let gameOver = false;
let hardest = false;
let spikeShield = 0;

/* ================= PLAYER ================= */
const player = {
  x: 150,
  y: 0,
  r: 14,
  vy: 0,
  onGround: false,
  touchingOrb: false
};

/* ================= STORAGE ================= */
let data = JSON.parse(localStorage.getItem("gdData")) || {
  skins: {
    green: true,
    blue: true,
    purple: false,
    darkred: false,
    rainbow: false
  },
  selected: "green",
  leaderboard: []
};

/* ================= OBJECTS ================= */
let walls = [], spikes = [], platforms = [], orbs = [];

/* ================= RESET ================= */
function reset() {
  score = 0;
  gameOver = false;
  walls = [];
  spikes = [];
  platforms = [];
  orbs = [];
  player.y = canvas.height - groundH - player.r;
  player.vy = 0;
}

/* ================= SPAWN ================= */
function spawnNormal() {
  const x = canvas.width + 40;

  walls.push({ x, w: 30, h: 70 });

  if (Math.random() < 0.5) {
    platforms.push({ x, y: canvas.height - groundH - 90, w: 40, h: 10 });
  }

  const count = [1,2,3][Math.floor(Math.random()*3)];
  for (let i=0;i<count;i++) {
    spikes.push({ x: x + i*24, y: canvas.height-groundH, s: 22 });
  }
}

function spawnHard() {
  spawnNormal();

  const x = canvas.width + 80;
  walls.push({ x, w: 70, h: 150 });

  platforms.push(
    { x: x+10, y: canvas.height-groundH-170, w: 50, h: 10 },
    { x: x+70, y: canvas.height-groundH-200, w: 50, h: 10 }
  );

  orbs.push({ x: x-30, y: canvas.height-groundH-120 });

  for (let i=0;i<6;i++) {
    spikes.push({ x: x+i*24, y: canvas.height-groundH, s: 22 });
  }
}

/* ================= INPUT ================= */
function jump() {
  if (player.touchingOrb) {
    player.vy = -11; // LIMITED BOOST
    player.touchingOrb = false;
    return;
  }
  if (player.onGround) {
    player.vy = -13;
    player.onGround = false;
  }
}
addEventListener("keydown", e => e.code==="Space" && jump());
canvas.addEventListener("mousedown", jump);

/* ================= UPDATE ================= */
function update() {
  if (gameOver) return;

  if (spikeShield>0) spikeShield--;

  player.vy += 0.8;
  player.y += player.vy;

  const gy = canvas.height-groundH-player.r;
  if (player.y>=gy) {
    player.y=gy; player.vy=0; player.onGround=true;
  }

  [...walls,...spikes,...platforms,...orbs].forEach(o=>o.x-=speed);

  player.touchingOrb=false;
  orbs.forEach(o=>{
    if (Math.abs(player.x-o.x)<18 && Math.abs(player.y-o.y)<18)
      player.touchingOrb=true;
  });

  spikes.forEach(s=>{
    if (
      spikeShield<=0 &&
      player.x>s.x && player.x<s.x+s.s &&
      player.y+player.r>s.y
    ) gameOver=true;
  });

  platforms.forEach(p=>{
    if (
      player.vy>=0 &&
      player.y+player.r>=p.y &&
      player.y+player.r<=p.y+p.h &&
      player.x>p.x && player.x<p.x+p.w
    ) {
      player.y=p.y-player.r;
      player.vy=0;
      player.onGround=true;
    }
  });

  if (++timer>120) {
    hardest?spawnHard():spawnNormal();
    timer=0;
    score++;
    money++;
    unlockSkins();
  }
}

/* ================= DRAW ================= */
function drawSpike(s) {
  ctx.beginPath();
  ctx.moveTo(s.x,s.y);
  ctx.lineTo(s.x+s.s/2,s.y-s.s);
  ctx.lineTo(s.x+s.s,s.y);
  ctx.fill();
}

function draw() {
  ctx.fillStyle=hardest?"#300":"#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle="lime";
  ctx.fillRect(0,canvas.height-groundH,canvas.width,groundH);

  ctx.fillStyle="gray";
  walls.forEach(w=>ctx.fillRect(w.x,canvas.height-groundH-w.h,w.w,w.h));

  ctx.fillStyle="white";
  platforms.forEach(p=>ctx.fillRect(p.x,p.y,p.w,p.h));

  ctx.fillStyle="yellow";
  orbs.forEach(o=>{
    ctx.beginPath();
    ctx.arc(o.x,o.y,8,0,Math.PI*2);
    ctx.fill();
  });

  ctx.fillStyle="red";
  spikes.forEach(drawSpike);

  ctx.fillStyle=data.selected;
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
  ctx.fill();
}

/* ================= SKINS ================= */
function unlockSkins() {
  if (score>=20) data.skins.purple=true;
  if (!hardest && score>=100) data.skins.rainbow=true;
  if (hardest && score>=100) data.skins.darkred=true;
  save();
}

function equip(c){
  if(!data.skins[c]) return alert("LOCKED");
  data.selected=c;
  save();
}

/* ================= SHOP ================= */
function buyScoreBoost(){
  if(money>=10){ money-=10; score+=5; }
}
function buyShield(){
  if(money>=20){ money-=20; spikeShield=300; }
}

/* ================= SAVE ================= */
function saveScore(){
  data.leaderboard.push({name:username,score});
  data.leaderboard.sort((a,b)=>b.score-a.score);
  data.leaderboard=data.leaderboard.slice(0,100);
  save();
}
function save(){
  localStorage.setItem("gdData",JSON.stringify(data));
}

/* ================= LOOP ================= */
let timer=0;
reset();
(function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
})();
