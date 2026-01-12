const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let speed = 4;
let gameOver = false;

// ---------- SAVE SYSTEM ----------
let selectedSkin = localStorage.getItem("snakeSkin") || "green";

// ---------- SNAKE ----------
const snake = {
  x: 100,
  y: 300,
  r: 15,
  vy: 0,
  gravity: 0.8,
  jump: -12
};

let onGround = false;
let hue = 0;

// ---------- WALL ----------
let wall = {
  x: canvas.width,
  y: 280,
  w: 30,
  h: 70
};

// ---------- INPUT ----------
document.addEventListener("keydown", e => {
  if (e.code === "Space" && onGround && !gameOver) {
    snake.vy = snake.jump;
  }
});

// ---------- UI ----------
document.getElementById("skinsBtn").onclick = () =>
  document.getElementById("skinsMenu").classList.remove("hidden");

document.getElementById("closeSkins").onclick = () =>
  document.getElementById("skinsMenu").classList.add("hidden");

document.querySelectorAll(".skins button").forEach(btn => {
  btn.onclick = () => {
    const skin = btn.dataset.skin;
    if (canUseSkin(skin)) {
      selectedSkin = skin;
      localStorage.setItem("snakeSkin", skin);
    } else {
      alert("Not unlocked yet!");
    }
  };
});

function canUseSkin(skin) {
  const unlocks = {
    green: 0,
    blue: 10,
    purple: 20,
    yellow: 30,
    orange: 40,
    rainbow: 100
  };
  return score >= unlocks[skin];
}

// ---------- GAME LOOP ----------
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    ctx.fillText("GAME OVER", 350, 200);
    return;
  }

  // Gravity
  snake.vy += snake.gravity;
  snake.y += snake.vy;

  if (snake.y + snake.r >= 330) {
    snake.y = 330 - snake.r;
    snake.vy = 0;
    onGround = true;
  } else onGround = false;

  wall.x -= speed;
  if (wall.x + wall.w < 0) {
    wall.x = canvas.width;
    score++;
    document.getElementById("scoreText").textContent = "Score: " + score;

    if (score >= 10) speed += 0.3;
  }

  // Collision
  if (
    snake.x + snake.r > wall.x &&
    snake.x - snake.r < wall.x + wall.w &&
    snake.y + snake.r > wall.y
  ) {
    gameOver = true;
  }

  // Draw wall
  ctx.fillStyle = "brown";
  ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

  // Draw snake
  if (selectedSkin === "rainbow") {
    hue += 5;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
  } else {
    ctx.fillStyle = selectedSkin;
  }

  ctx.beginPath();
  ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
  ctx.fill();

  requestAnimationFrame(loop);
}

loop();
