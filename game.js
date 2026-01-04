// ---------------- CANVAS ----------------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ---------------- UI ----------------
const scoreEl = document.getElementById("score");
const jumpBtn = document.getElementById("jumpBtn");
const music = document.getElementById("bgMusic");

// ---------------- CONSTANTS ----------------
const GROUND_Y = 330;

// ---------------- GAME STATE ----------------
let score = 0;
let speed = 5;
let gameOver = false;

// ---------------- MUSIC (MOBILE SAFE) ----------------
function startMusic() {
    if (!music) return;
    music.volume = 1.0;      // MAX volume
    music.muted = false;

    if (music.paused) {
        music.play().catch(() => {});
    }
}

// ---------------- SNAKE ----------------
const snake = {
    x: 120,
    y: GROUND_Y - 16,
    r: 16,            // size (big green dot)
    vy: 0,
    gravity: 1,
    jump: -15,
    onGround: true
};

// ---------------- OBSTACLES ----------------
let obstacles = [];

function spawnWall() {
    obstacles.push({
        type: "wall",
        x: canvas.width,
        w: 28,
        h: 65
    });
}

function spawnSpike() {
    obstacles.push({
        type: "spike",
        x: canvas.width,
        w: 30,
        h: 30
    });
}

// ---------------- INPUT ----------------
function jump() {
    if (snake.onGround && !gameOver) {
        startMusic();             // MUSIC STARTS HERE (USER ACTION)
        snake.vy = snake.jump;
        snake.onGround = false;
    }
}

// PC
document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

// MOBILE
jumpBtn.addEventListener("touchstart", e => {
    e.preventDefault();
    jump();
});

// show button only on mobile
if ("ontouchstart" in window) {
    jumpBtn.style.display = "block";
}

// ---------------- GAME LOOP ----------------
function loop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // SPEED UP AFTER SCORE 10
    if (score >= 10) speed += 0.01;

    // GRAVITY
    snake.vy += snake.gravity;
    snake.y += snake.vy;

    if (snake.y >= GROUND_Y - snake.r) {
        snake.y = GROUND_Y - snake.r;
        snake.vy = 0;
        snake.onGround = true;
    }

    // SPAWN OBSTACLES
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300) {
        if (score >= 10 && Math.random() < 0.5) {
            spawnSpike();
        } else {
            spawnWall();
        }
    }

    // MOVE OBSTACLES
    for (let o of obstacles) o.x -= speed;
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // COLLISION
    for (let o of obstacles) {
        if (o.type === "wall") {
            if (
                snake.x + snake.r > o.x &&
                snake.x - snake.r < o.x + o.w &&
                snake.y + snake.r > GROUND_Y - o.h
            ) {
                endGame();
            }
        }

        if (o.type === "spike") {
            if (
                snake.x + snake.r > o.x &&
                snake.x - snake.r < o.x + o.w &&
                snake.y + snake.r >= GROUND_Y
            ) {
                endGame();
            }
        }
    }

    // SCORE
    score += 0.03;
    scoreEl.textContent = Math.floor(score);

    draw();
    requestAnimationFrame(loop);
}

// ---------------- DRAW ----------------
function draw() {
    // ground
    ctx.fillStyle = "#00aa00";
    ctx.fillRect(0, GROUND_Y, canvas.width, 70);

    // snake (green dot)
    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
    ctx.fill();

    // obstacles
    for (let o of obstacles) {
        if (o.type === "wall") {
            ctx.fillStyle = "#777";
            ctx.fillRect(o.x, GROUND_Y - o.h, o.w, o.h);
        }

        if (o.type === "spike") {
            ctx.fillStyle = "#ccc";
            ctx.beginPath();
            ctx.moveTo(o.x, GROUND_Y);
            ctx.lineTo(o.x + o.w / 2, GROUND_Y - o.h);
            ctx.lineTo(o.x + o.w, GROUND_Y);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// ---------------- GAME OVER ----------------
function endGame() {
    gameOver = true;
    music.pause();
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", 330, 200);
}

// ---------------- START ----------------
loop();
