window.onload = () => {
    console.log("GAME JS LOADED");

    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // ⬇️ EVERYTHING ELSE GOES BELOW ⬇️

// ===== CANVAS =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== MUSIC =====
const music = document.getElementById("bgMusic");
let musicStarted = false;

function startMusic() {
    if (!musicStarted) {
        music.volume = 1;
        music.play().catch(() => {});
        musicStarted = true;
    }
}

// ===== GAME STATE =====
let gravity = 0.7;
let jumpPower = -14;
let speed = 5;
let score = 0;
let gameOver = false;

// ===== PLAYER =====
const snake = {
    x: 120,
    y: canvas.height - 100,
    r: 15,
    vy: 0,
    onGround: true
};

// ===== WALLS =====
let walls = [];

function spawnWall() {
    const gap = 160;
    const w = 60;
    const top = Math.random() * 200 + 50;

    walls.push({
        x: canvas.width,
        top,
        bottom: top + gap,
        passed: false
    });
}

// ===== INPUT =====
function jump() {
    if (snake.onGround && !gameOver) {
        snake.vy = jumpPower;
        snake.onGround = false;
        startMusic();
    }
}

addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});
addEventListener("click", jump);
addEventListener("touchstart", jump);

// ===== UPDATE =====
function update() {
    if (gameOver) return;

    snake.vy += gravity;
    snake.y += snake.vy;

    if (snake.y + snake.r >= canvas.height - 40) {
        snake.y = canvas.height - 40 - snake.r;
        snake.vy = 0;
        snake.onGround = true;
    }

    walls.forEach(w => {
        w.x -= speed;

        if (!w.passed && w.x + 60 < snake.x) {
            score++;
            w.passed = true;
            if (score >= 10) speed += 0.5;
        }

        if (
            snake.x + snake.r > w.x &&
            snake.x - snake.r < w.x + 60 &&
            (snake.y - snake.r < w.top || snake.y + snake.r > w.bottom)
        ) {
            gameOver = true;
        }
    });

    walls = walls.filter(w => w.x > -100);
}

// ===== DRAW =====
function draw() {
    // BACKGROUND
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // GROUND
    ctx.fillStyle = "#222";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // SNAKE
    ctx.fillStyle = "#00ff66";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
    ctx.fill();

    // WALLS
    ctx.fillStyle = "#666";
    walls.forEach(w => {
        ctx.fillRect(w.x, 0, 60, w.top);
        ctx.fillRect(w.x, w.bottom, 60, canvas.height);
    });

    // SCORE
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "50px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 170, canvas.height / 2);
    }
}

// ===== LOOP =====
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// ===== START =====
spawnWall();
setInterval(spawnWall, 2000);
loop();
