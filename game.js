// =======================
// CANVAS
// =======================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =======================
// CONSTANTS
// =======================
const GROUND_HEIGHT = 80;
const GROUND_Y = canvas.height - GROUND_HEIGHT;

// =======================
// AUDIO
// =======================
const music = document.getElementById("bgMusic");
let musicUnlocked = false;

function unlockAudio() {
    if (musicUnlocked) return;
    music.volume = 1.0;
    music.muted = false;
    music.currentTime = 0;
    music.play().then(() => musicUnlocked = true).catch(() => {});
}

["click", "touchstart", "keydown"].forEach(e =>
    document.addEventListener(e, unlockAudio, { once: true })
);

// =======================
// GAME STATE
// =======================
let gravity = 0.8;
let speed = 6;
let score = 0;
let gameOver = false;

// =======================
// SNAKE (BIG GREEN DOT)
// =======================
const snake = {
    x: 120,
    y: GROUND_Y - 20,
    r: 20,
    vy: 0,
    jumpPower: -15,
    onGround: true
};

// =======================
// OBSTACLES
// =======================
let walls = [];
let spikes = [];
let spawnTimer = 0;

// =======================
// INPUT
// =======================
function jump() {
    if (snake.onGround && !gameOver) {
        snake.vy = snake.jumpPower;
        snake.onGround = false;
    }
}

document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

const jumpBtn = document.getElementById("jumpBtn");
if (jumpBtn) {
    jumpBtn.addEventListener("touchstart", e => {
        e.preventDefault();
        jump();
    });
}

// =======================
// SPAWN
// =======================
function spawnWall() {
    walls.push({
        x: canvas.width,
        y: GROUND_Y - 70,
        w: 55,
        h: 70,
        passed: false
    });
}

function spawnSpike() {
    spikes.push({
        x: canvas.width,
        y: GROUND_Y,
        size: 35,
        count: Math.random() < 0.5 ? 2 : 1
    });
}

// =======================
// COLLISION
// =======================
function rectCircleCollide(rect, circle) {
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    return dx * dx + dy * dy < circle.r * circle.r;
}

function spikeHit(s) {
    return (
        snake.x + snake.r > s.x &&
        snake.x - snake.r < s.x + s.size * s.count &&
        snake.y + snake.r >= GROUND_Y
    );
}

// =======================
// UPDATE
// =======================
function update() {
    if (gameOver) return;

    snake.vy += gravity;
    snake.y += snake.vy;

    if (snake.y + snake.r >= GROUND_Y) {
        snake.y = GROUND_Y - snake.r;
        snake.vy = 0;
        snake.onGround = true;
    }

    spawnTimer++;
    if (spawnTimer > 90) {
        spawnWall();
        if (score >= 10) spawnSpike();
        spawnTimer = 0;
    }

    walls.forEach(w => {
        w.x -= speed;

        if (!w.passed && w.x + w.w < snake.x) {
            w.passed = true;
            score++;
            if (score >= 10) speed += 0.3;
        }

        if (rectCircleCollide(w, snake)) gameOver = true;
    });

    spikes.forEach(s => {
        s.x -= speed;
        if (spikeHit(s)) gameOver = true;
    });

    walls = walls.filter(w => w.x + w.w > 0);
    spikes = spikes.filter(s => s.x + s.size * s.count > 0);
}

// =======================
// DRAW
// =======================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = "#222";
    ctx.fillRect(0, GROUND_Y, canvas.width, GROUND_HEIGHT);

    // Snake
    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
    ctx.fill();

    // Walls
    ctx.fillStyle = "#777";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

    // Spikes
    ctx.fillStyle = "red";
    spikes.forEach(s => {
        for (let i = 0; i < s.count; i++) {
            ctx.beginPath();
            ctx.moveTo(s.x + i * s.size, GROUND_Y);
            ctx.lineTo(s.x + s.size / 2 + i * s.size, GROUND_Y - s.size);
            ctx.lineTo(s.x + s.size + i * s.size, GROUND_Y);
            ctx.fill();
        }
    });

    // Score
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText("Score: " + score, 30, 50);

    if (gameOver) {
        ctx.font = "60px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 180, canvas.height / 2);
    }
}

// =======================
// LOOP
// =======================
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
