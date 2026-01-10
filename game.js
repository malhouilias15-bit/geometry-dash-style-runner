const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

const GROUND_Y = 340;

// ================= MUSIC =================
const music = document.getElementById("bgMusic");
let musicStarted = false;

function startMusic() {
    if (!musicStarted) {
        music.volume = 1.0;
        music.play().catch(() => {});
        musicStarted = true;
    }
}

// start music on ANY interaction
document.addEventListener("keydown", startMusic, { once: true });
document.addEventListener("mousedown", startMusic, { once: true });
document.addEventListener("touchstart", startMusic, { once: true });

// ================= GAME =================
let score = 0;
let speed = 5;
let gameOver = false;

// ================= SNAKE =================
const snake = {
    x: 120,
    y: GROUND_Y - 16,
    r: 16,
    vy: 0,
    gravity: 0.9,
    jump: -14
};

let onGround = true;

// ================= OBSTACLE =================
let obstacle = null; // ONLY ONE AT A TIME
let obstacleType = "wall"; // alternates

function spawnObstacle() {
    if (score >= 10 && Math.random() < 0.5) {
        obstacleType = "spike";
    } else {
        obstacleType = "wall";
    }

    if (obstacleType === "wall") {
        obstacle = {
            type: "wall",
            x: canvas.width,
            w: 28,
            h: 70,
            passed: false
        };
    } else {
        obstacle = {
            type: "spike",
            x: canvas.width,
            s: 22
        };
    }
}

// ================= INPUT =================
function jump() {
    if (!musicStarted) {
        music.currentTime = 0;
        music.volume = 1.0;
        music.play().then(() => {
            musicStarted = true;
        }).catch(err => {
            console.log("Audio blocked:", err);
        });
    }

    if (onGround && !gameOver) {
        snake.vy = snake.jump;
        onGround = false;
    }
}

// ================= COLLISION =================
function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const x = Math.max(rx, Math.min(cx, rx + rw));
    const y = Math.max(ry, Math.min(cy, ry + rh));
    return (cx - x) ** 2 + (cy - y) ** 2 < r ** 2;
}

// ================= LOOP =================
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
        // Physics
        snake.vy += snake.gravity;
        snake.y += snake.vy;

        if (snake.y + snake.r >= GROUND_Y) {
            snake.y = GROUND_Y - snake.r;
            snake.vy = 0;
            onGround = true;
        }

        // Move obstacle
        if (obstacle) obstacle.x -= speed;

        // Collision
        if (obstacle) {
            if (obstacle.type === "wall") {
                if (
                    circleRect(
                        snake.x, snake.y, snake.r,
                        obstacle.x, GROUND_Y - obstacle.h,
                        obstacle.w, obstacle.h
                    )
                ) gameOver = true;

                if (!obstacle.passed && obstacle.x + obstacle.w < snake.x) {
                    obstacle.passed = true;
                    score++;
                    if (score >= 10) speed += 0.4;
                }
            } else {
                if (
                    circleRect(
                        snake.x, snake.y, snake.r,
                        obstacle.x, GROUND_Y - obstacle.s,
                        obstacle.s, obstacle.s
                    )
                ) gameOver = true;
            }

            if (obstacle.x + 40 < 0) {
                obstacle = null;
                spawnObstacle();
            }
        }
    }

    // Draw ground
    ctx.fillStyle = "#1e7f1e";
    ctx.fillRect(0, GROUND_Y, canvas.width, 60);

    // Draw obstacle
    if (obstacle) {
        if (obstacle.type === "wall") {
            ctx.fillStyle = "#7a3e1d";
            ctx.fillRect(
                obstacle.x,
                GROUND_Y - obstacle.h,
                obstacle.w,
                obstacle.h
            );
        } else {
            ctx.fillStyle = "#555";
            ctx.beginPath();
            ctx.moveTo(obstacle.x, GROUND_Y);
            ctx.lineTo(obstacle.x + obstacle.s / 2, GROUND_Y - obstacle.s);
            ctx.lineTo(obstacle.x + obstacle.s, GROUND_Y);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Draw snake
    ctx.fillStyle = "#00ff55";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
    ctx.fill();

    // UI
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);

    if (gameOver) {
        ctx.font = "36px Arial";
        ctx.fillText("GAME OVER", 300, 200);
    }

    requestAnimationFrame(loop);
}

// ================= START =================
spawnObstacle();
loop();
