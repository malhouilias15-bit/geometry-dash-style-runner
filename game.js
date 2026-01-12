// ---------------- CANVAS ----------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 330;

// ---------------- GAME STATE ----------------
let score = 0;
let speed = 5;
let gameOver = false;

const scoreText = document.getElementById("score");

// ---------------- SNAKE ----------------
const snake = {
    x: 100,
    y: GROUND_Y - 30,
    radius: 18,
    velocityY: 0,
    gravity: 1,
    jumpPower: -16,
    onGround: true
};

// ---------------- WALLS ----------------
let walls = [];

function createWall() {
    return {
        x: WIDTH,
        y: GROUND_Y - 60,
        width: 30,
        height: 60,
        passed: false
    };
}

walls.push(createWall());

// ---------------- SPIKES ----------------
let spikes = [];

function createSpike() {
    return {
        x: WIDTH,
        y: GROUND_Y,
        size: 25
    };
}

// ---------------- INPUT ----------------
function jump() {
    if (snake.onGround && !gameOver) {
        snake.velocityY = snake.jumpPower;
        snake.onGround = false;
    }
}

document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

document.getElementById("jumpBtn").addEventListener("click", jump);

// ---------------- COLLISION ----------------
function circleRectCollision(c, r) {
    const closestX = Math.max(r.x, Math.min(c.x, r.x + r.width));
    const closestY = Math.max(r.y, Math.min(c.y, r.y + r.height));
    const dx = c.x - closestX;
    const dy = c.y - closestY;
    return dx * dx + dy * dy < c.radius * c.radius;
}

// ---------------- GAME LOOP ----------------
function update() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (gameOver) {
        ctx.fillStyle = "#000";
        ctx.font = "32px Arial";
        ctx.fillText("GAME OVER - Refresh", 250, 200);
        return;
    }

    // Gravity
    snake.velocityY += snake.gravity;
    snake.y += snake.velocityY;

    if (snake.y >= GROUND_Y - snake.radius) {
        snake.y = GROUND_Y - snake.radius;
        snake.velocityY = 0;
        snake.onGround = true;
    }

    // Move walls
    walls.forEach(w => w.x -= speed);
    spikes.forEach(s => s.x -= speed);

    // Wall collision + scoring
    for (let w of walls) {
        if (circleRectCollision(snake, w)) gameOver = true;

        if (!w.passed && w.x + w.width < snake.x) {
            w.passed = true;
            score++;
            scoreText.textContent = "Score: " + score;

            if (score >= 10) speed += 0.3;
        }
    }

    // Spike collision
    for (let s of spikes) {
        if (
            snake.x + snake.radius > s.x &&
            snake.x - snake.radius < s.x + s.size &&
            snake.y + snake.radius > s.y - s.size
        ) {
            gameOver = true;
        }
    }

    // Cleanup
    walls = walls.filter(w => w.x + w.width > 0);
    spikes = spikes.filter(s => s.x + s.size > 0);

    // Spawn walls
    if (walls.length === 0 || walls[walls.length - 1].x < WIDTH - 300) {
        walls.push(createWall());
    }

    // Spawn spikes after score 10 (NO WALL AT SAME TIME)
    if (score >= 10 && Math.random() < 0.02 && spikes.length === 0) {
        spikes.push(createSpike());
    }

    // ---------------- DRAW ----------------
    // Ground
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    // Walls
    ctx.fillStyle = "#8b4513";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));

    // Spikes
    ctx.fillStyle = "#555";
    spikes.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.size / 2, s.y - s.size);
        ctx.lineTo(s.x + s.size, s.y);
        ctx.closePath();
        ctx.fill();
    });

    // Snake (BIG GREEN DOT)
    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.radius, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(update);
}

update();
