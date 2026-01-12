/* ========= HARD SAFETY CHECK ========= */
console.log("game_v2.js loaded");

const canvas = document.getElementById("game");
if (!canvas) {
    alert("Canvas is NULL. Check index.html");
    throw new Error("Canvas not found");
}
const ctx = canvas.getContext("2d");

/* ========= CANVAS ========= */
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* ========= MUSIC ========= */
const music = document.getElementById("bgMusic");
let musicStarted = false;

function startMusic() {
    if (!musicStarted && music) {
        music.volume = 1;
        music.play().catch(() => {});
        musicStarted = true;
    }
}

/* ========= GAME CONSTANTS ========= */
const groundHeight = 120;
const gravity = 0.7;
const jumpPower = -14;

/* ========= PLAYER ========= */
const snake = {
    x: 120,
    y: canvas.height - groundHeight - 20,
    r: 16,
    vy: 0
};

/* ========= GAME STATE ========= */
let obstacles = [];
let spikes = [];
let speed = 4;
let score = 0;
let gameOver = false;

/* ========= INPUT ========= */
function jump() {
    if (snake.y >= canvas.height - groundHeight - snake.r) {
        snake.vy = jumpPower;
        startMusic();
    }
}

window.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});
window.addEventListener("touchstart", jump);
window.addEventListener("mousedown", jump);

/* ========= SPAWN WALL ========= */
function spawnWall() {
    obstacles.push({
        x: canvas.width,
        w: 40,
        h: 80,
        passed: false
    });

    // Spikes unlock at score 10+
    if (score >= 10 && Math.random() < 0.7) {
        spikes.push({
            x: canvas.width + 50,
            size: 28
        });
    }
}

/* ========= COLLISION ========= */
function hitCircleRect(cx, cy, r, rx, ry, rw, rh) {
    const tx = Math.max(rx, Math.min(cx, rx + rw));
    const ty = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - tx;
    const dy = cy - ty;
    return dx * dx + dy * dy < r * r;
}

/* ========= GAME LOOP ========= */
let spawnTimer = 0;

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* BACKGROUND */
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* GROUND */
    ctx.fillStyle = "#1aff00";
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    if (!gameOver) {
        /* PLAYER */
        snake.vy += gravity;
        snake.y += snake.vy;

        if (snake.y > canvas.height - groundHeight - snake.r) {
            snake.y = canvas.height - groundHeight - snake.r;
            snake.vy = 0;
        }

        ctx.fillStyle = "lime";
        ctx.beginPath();
        ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
        ctx.fill();

        /* SPAWN */
        spawnTimer++;
        if (spawnTimer > 120) {
            spawnWall();
            spawnTimer = 0;
        }

        /* WALLS */
        ctx.fillStyle = "#777";
        obstacles.forEach(o => {
            o.x -= speed;
            const y = canvas.height - groundHeight - o.h;

            ctx.fillRect(o.x, y, o.w, o.h);

            if (
                hitCircleRect(
                    snake.x,
                    snake.y,
                    snake.r,
                    o.x,
                    y,
                    o.w,
                    o.h
                )
            ) gameOver = true;

            if (!o.passed && o.x + o.w < snake.x) {
                o.passed = true;
                score++;
                if (score >= 10) speed += 0.3;
            }
        });

        /* SPIKES (SEPARATE) */
        ctx.fillStyle = "red";
        spikes.forEach(s => {
            s.x -= speed;
            const baseY = canvas.height - groundHeight;

            ctx.beginPath();
            ctx.moveTo(s.x, baseY);
            ctx.lineTo(s.x + s.size / 2, baseY - s.size);
            ctx.lineTo(s.x + s.size, baseY);
            ctx.closePath();
            ctx.fill();

            if (
                hitCircleRect(
                    snake.x,
                    snake.y,
                    snake.r,
                    s.x,
                    baseY - s.size,
                    s.size,
                    s.size
                )
            ) gameOver = true;
        });
    }

    /* SCORE */
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 30, 40);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "60px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 180, canvas.height / 2);
    }

    requestAnimationFrame(update);
}

/* ========= START ========= */
update();
