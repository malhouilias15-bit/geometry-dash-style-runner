// ================== CANVAS ==================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

const GROUND_Y = 340;

// ================== MUSIC ==================
const music = document.getElementById("bgMusic");
let musicStarted = false;

function startMusic() {
    if (!musicStarted) {
        music.volume = 1.0;
        music.play().catch(() => {});
        musicStarted = true;
    }
}

// ================== GAME STATE ==================
let score = 0;
let speed = 5;
let gameOver = false;

// ================== SNAKE ==================
const snake = {
    x: 120,
    y: GROUND_Y - 16,
    radius: 16,
    vy: 0,
    gravity: 0.9,
    jumpPower: -14
};

let onGround = true;

// ================== WALLS ==================
let walls = [];

function spawnWall() {
    walls.push({
        x: canvas.width,
        width: 28,
        height: 70,
        passed: false
    });
}

// ================== SPIKES ==================
let spikes = [];

function spawnSpike() {
    const doubleSpike = Math.random() < 0.5;

    spikes.push({ x: canvas.width, size: 22 });

    if (doubleSpike) {
        spikes.push({ x: canvas.width + 26, size: 22 });
    }
}

// ================== INPUT ==================
function jump() {
    startMusic();

    if (onGround && !gameOver) {
        snake.vy = snake.jumpPower;
        onGround = false;
    }
}

document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    jump();
});

// ================== COLLISION ==================
function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const x = Math.max(rx, Math.min(cx, rx + rw));
    const y = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - x;
    const dy = cy - y;
    return dx * dx + dy * dy < r * r;
}

// ================== GAME LOOP ==================
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
        // Physics
        snake.vy += snake.gravity;
        snake.y += snake.vy;

        if (snake.y + snake.radius >= GROUND_Y) {
            snake.y = GROUND_Y - snake.radius;
            snake.vy = 0;
            onGround = true;
        }

        walls.forEach(w => w.x -= speed);
        spikes.forEach(s => s.x -= speed);

        // Wall collision + scoring
        for (let w of walls) {
            if (
                circleRect(
                    snake.x, snake.y, snake.radius,
                    w.x, GROUND_Y - w.height, w.width, w.height
                )
            ) {
                gameOver = true;
            }

            if (!w.passed && w.x + w.width < snake.x) {
                w.passed = true;
                score++;

                if (score >= 10) speed += 0.4;
            }
        }

        // Spike collision
        for (let s of spikes) {
            if (
                circleRect(
                    snake.x, snake.y, snake.radius,
                    s.x, GROUND_Y - s.size, s.size, s.size
                )
            ) {
                gameOver = true;
            }
        }

        walls = walls.filter(w => w.x + w.width > 0);
        spikes = spikes.filter(s => s.x + s.size > 0);

        if (walls.length === 0 || walls[walls.length - 1].x < canvas.width - 280) {
            spawnWall();

            if (score >= 10) {
                spawnSpike();
            }
        }
    }

    // Draw ground
    ctx.fillStyle = "#1e7f1e";
    ctx.fillRect(0, GROUND_Y, canvas.width, 60);

    // Draw walls
    ctx.fillStyle = "#7a3e1d";
    walls.forEach(w => {
        ctx.fillRect(w.x, GROUND_Y - w.height, w.width, w.height);
    });

    // Draw spikes (SEPARATE)
    ctx.fillStyle = "#555";
    spikes.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(s.x, GROUND_Y);
        ctx.lineTo(s.x + s.size / 2, GROUND_Y - s.size);
        ctx.lineTo(s.x + s.size, GROUND_Y);
        ctx.closePath();
        ctx.fill();
    });

    // Draw snake (green dot)
    ctx.fillStyle = "#00ff55";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.radius, 0, Math.PI * 2);
    ctx.fill();

    // UI
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);

    if (gameOver) {
        ctx.font = "36px Arial";
        ctx.fillText("GAME OVER", 300, 200);
        ctx.font = "18px Arial";
        ctx.fillText("Refresh to retry", 320, 235);
    }

    requestAnimationFrame(loop);
}

// ================== START ==================
spawnWall();
loop();
