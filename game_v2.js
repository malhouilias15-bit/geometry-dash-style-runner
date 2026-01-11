// ====== CANVAS SETUP ======
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ====== MUSIC ======
const music = document.getElementById("bgMusic");
let musicStarted = false;

function startMusic() {
    if (!musicStarted) {
        music.volume = 1.0;
        music.play().catch(() => {});
        musicStarted = true;
    }
}

// ====== GAME VARIABLES ======
let gravity = 0.6;
let jumpPower = -12;
let speed = 5;
let score = 0;
let gameOver = false;

// ====== PLAYER ======
const snake = {
    x: 100,
    y: canvas.height - 120,
    radius: 15,
    velocityY: 0,
    onGround: true
};

// ====== OBSTACLES ======
let walls = [];
let spikes = [];

function createWall() {
    const gap = 140;
    const wallWidth = 60;
    const topHeight = Math.random() * 200 + 80;

    walls.push({
        x: canvas.width,
        topHeight,
        bottomY: topHeight + gap,
        passed: false
    });
}

function createSpike() {
    spikes.push({
        x: canvas.width,
        y: canvas.height - 60,
        size: 30
    });
}

// ====== INPUT ======
function jump() {
    if (snake.onGround && !gameOver) {
        snake.velocityY = jumpPower;
        snake.onGround = false;
        startMusic();
    }
}

document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

document.addEventListener("click", jump);
document.addEventListener("touchstart", jump);

// ====== GAME LOOP ======
function update() {
    if (gameOver) return;

    // Snake physics
    snake.velocityY += gravity;
    snake.y += snake.velocityY;

    if (snake.y + snake.radius >= canvas.height - 40) {
        snake.y = canvas.height - 40 - snake.radius;
        snake.velocityY = 0;
        snake.onGround = true;
    }

    // Walls
    walls.forEach(wall => {
        wall.x -= speed;

        // Score
        if (!wall.passed && wall.x + 60 < snake.x) {
            score++;
            wall.passed = true;

            if (score >= 10) speed += 0.5;

            if (score % 5 === 0) createSpike();
        }

        // Collision
        if (
            snake.x + snake.radius > wall.x &&
            snake.x - snake.radius < wall.x + 60 &&
            (snake.y - snake.radius < wall.topHeight ||
             snake.y + snake.radius > wall.bottomY)
        ) {
            gameOver = true;
        }
    });

    // Spikes
    spikes.forEach(spike => {
        spike.x -= speed;

        if (
            snake.x + snake.radius > spike.x &&
            snake.x - snake.radius < spike.x + spike.size &&
            snake.y + snake.radius > spike.y
        ) {
            gameOver = true;
        }
    });

    // Cleanup
    walls = walls.filter(w => w.x > -100);
    spikes = spikes.filter(s => s.x > -100);
}

// ====== DRAW ======
function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = "#222";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // Snake
    ctx.fillStyle = "#00ff66";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.radius, 0, Math.PI * 2);
    ctx.fill();

    // Walls
    ctx.fillStyle = "#555";
    walls.forEach(wall => {
        ctx.fillRect(wall.x, 0, 60, wall.topHeight);
        ctx.fillRect(wall.x, wall.bottomY, 60, canvas.height);
    });

    // Spikes
    ctx.fillStyle = "red";
    spikes.forEach(spike => {
        ctx.beginPath();
        ctx.moveTo(spike.x, spike.y);
        ctx.lineTo(spike.x + spike.size / 2, spike.y - spike.size);
        ctx.lineTo(spike.x + spike.size, spike.y);
        ctx.fill();
    });

    // Score
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 40);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "60px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 180, canvas.height / 2);
    }
}

// ====== LOOP ======
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// ====== START ======
createWall();
setInterval(createWall, 2000);
loop();
