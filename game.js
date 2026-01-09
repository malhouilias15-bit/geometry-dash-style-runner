// =======================
// CANVAS SETUP
// =======================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =======================
// AUDIO (100% WORKING)
// =======================
const music = document.getElementById("bgMusic");
let musicUnlocked = false;

function unlockAudio() {
    if (musicUnlocked) return;
    music.volume = 1.0;
    music.muted = false;
    music.currentTime = 0;

    music.play().then(() => {
        musicUnlocked = true;
        console.log("MUSIC STARTED");
    }).catch(() => {});
}

["click", "touchstart", "keydown"].forEach(e =>
    document.addEventListener(e, unlockAudio, { once: true })
);

// =======================
// GAME STATE
// =======================
let gravity = 0.7;
let speed = 6;
let score = 0;
let gameOver = false;

// =======================
// SNAKE
// =======================
const snake = {
    x: 120,
    y: canvas.height - 120,
    r: 20,
    vy: 0,
    jumpPower: -14,
    onGround: true
};

// =======================
// OBSTACLES
// =======================
let walls = [];
let spikes = [];
let spawnTimer = 0;

// =======================
// CONTROLS
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

// MOBILE BUTTON
const jumpBtn = document.getElementById("jumpBtn");
if (jumpBtn) {
    jumpBtn.addEventListener("touchstart", e => {
        e.preventDefault();
        jump();
    });
}

// =======================
// SPAWN FUNCTIONS
// =======================
function spawnWall() {
    walls.push({
        x: canvas.width,
        y: canvas.height - 80,
        w: 60,
        h: 80,
        passed: false
    });
}

function spawnSpike() {
    const doubleSpike = Math.random() < 0.5;
    spikes.push({
        x: canvas.width,
        y: canvas.height - 40,
        size: 40,
        count: doubleSpike ? 2 : 1
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

function spikeCollide(spike) {
    return (
        snake.x + snake.r > spike.x &&
        snake.x - snake.r < spike.x + spike.size * spike.count &&
        snake.y + snake.r > spike.y
    );
}

// =======================
// UPDATE
// =======================
function update() {
    if (gameOver) return;

    // Snake physics
    snake.vy += gravity;
    snake.y += snake.vy;

    if (snake.y >= canvas.height - 100) {
        snake.y = canvas.height - 100;
        snake.vy = 0;
        snake.onGround = true;
    }

    // Spawn logic
    spawnTimer++;
    if (spawnTimer > 90) {
        spawnWall();
        if (score >= 10) spawnSpike();
        spawnTimer = 0;
    }

    // Move walls
    walls.forEach(w => {
        w.x -= speed;

        if (!w.passed && w.x + w.w < snake.x) {
            w.passed = true;
            score++;

            if (score >= 10) speed += 0.3;
        }

        if (rectCircleCollide(w, snake)) gameOver = true;
    });

    // Move spikes
    spikes.forEach(s => {
        s.x -= speed;
        if (spikeCollide(s)) gameOver = true;
    });

    // Cleanup
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
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

    // Snake
    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
    ctx.fill();

    // Walls
    ctx.fillStyle = "gray";
    walls.forEach(w =>
        ctx.fillRect(w.x, w.y, w.w, w.h)
    );

    // Spikes
    ctx.fillStyle = "red";
    spikes.forEach(s => {
        for (let i = 0; i < s.count; i++) {
            ctx.beginPath();
            ctx.moveTo(s.x + i * s.size, s.y + s.size);
            ctx.lineTo(s.x + s.size / 2 + i * s.size, s.y);
            ctx.lineTo(s.x + s.size + i * s.size, s.y + s.size);
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

