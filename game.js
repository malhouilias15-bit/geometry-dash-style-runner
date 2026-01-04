const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const jumpBtn = document.getElementById("jumpBtn");
const music = document.getElementById("bgMusic");

// ---------------- MUSIC ----------------
function startMusic() {
    if (music.paused) {
        music.volume = 100;
        music.play().catch(() => {});
    }
}

// ---------------- GAME VARS ----------------
let score = 0;
let speed = 5;
let gameOver = false;

const groundY = canvas.height - 60;

// ---------------- SNAKE ----------------
const snake = {
    x: 120,
    y: groundY - 20,
    size: 20,
    velY: 0,
    gravity: 1,
    jump: -16,
    onGround: true
};

// ---------------- OBSTACLES ----------------
let obstacles = [];

function spawnWall() {
    obstacles.push({
        type: "wall",
        x: canvas.width,
        width: 30,
        height: 80
    });
}

function spawnSpike() {
    obstacles.push({
        type: "spike",
        x: canvas.width,
        width: 30,
        height: 30
    });
}

// ---------------- INPUT ----------------
function jump() {
    if (snake.onGround && !gameOver) {
        snake.velY = snake.jump;
        snake.onGround = false;
        startMusic();
    }
}

document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

jumpBtn.addEventListener("touchstart", e => {
    e.preventDefault();
    jump();
});

// mobile detect
if ("ontouchstart" in window) {
    jumpBtn.style.display = "block";
}

// ---------------- GAME LOOP ----------------
function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // speed scaling
    if (score >= 10) speed += 0.002;

    // snake physics
    snake.velY += snake.gravity;
    snake.y += snake.velY;

    if (snake.y >= groundY - snake.size) {
        snake.y = groundY - snake.size;
        snake.velY = 0;
        snake.onGround = true;
    }

    // spawn obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300) {
        if (score >= 10 && Math.random() < 0.5) {
            spawnSpike();
        } else {
            spawnWall();
        }
    }

    // move obstacles
    for (let o of obstacles) o.x -= speed;
    obstacles = obstacles.filter(o => o.x + o.width > 0);

    // ---------------- COLLISION ----------------
    for (let o of obstacles) {
        if (o.type === "wall") {
            if (
                snake.x + snake.size > o.x &&
                snake.x < o.x + o.width &&
                snake.y + snake.size > groundY - o.height
            ) {
                endGame();
            }
        }

        if (o.type === "spike") {
            if (
                snake.x + snake.size > o.x &&
                snake.x < o.x + o.width &&
                snake.y + snake.size >= groundY - 5
            ) {
                endGame();
            }
        }
    }

    // score
    score += 0.02;
    scoreEl.textContent = Math.floor(score);

    draw();
    requestAnimationFrame(update);
}

// ---------------- DRAW ----------------
function draw() {
    // ground
    ctx.fillStyle = "#00aa00";
    ctx.fillRect(0, groundY, canvas.width, 60);

    // snake (BIG GREEN DOT)
    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y + snake.size / 2, snake.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // obstacles
    for (let o of obstacles) {
        if (o.type === "wall") {
            ctx.fillStyle = "#666";
            ctx.fillRect(o.x, groundY - o.height, o.width, o.height);
        }

        if (o.type === "spike") {
            ctx.fillStyle = "#ccc";
            ctx.beginPath();
            ctx.moveTo(o.x, groundY);
            ctx.lineTo(o.x + o.width / 2, groundY - o.height);
            ctx.lineTo(o.x + o.width, groundY);
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
    ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2);
}

// START
update();
