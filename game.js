// -------------------- CANVAS --------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// -------------------- SCORE --------------------
let score = 0;
const scoreEl = document.getElementById("score");

// -------------------- SNAKE --------------------
const snake = {
    x: 100,
    y: 300,
    width: 40,
    height: 20,
    yVel: 0,
    gravity: 0.8,
    jumpPower: -14
};

let onGround = false;
let gameOver = false;

// -------------------- SPEED --------------------
let speed = 4;

// -------------------- WALLS --------------------
let walls = [];

function createWall() {
    return {
        x: WIDTH + Math.random() * 200,
        y: 300,
        width: 30,
        height: 50 + Math.random() * 50
    };
}

walls.push(createWall());

// -------------------- SPIKES --------------------
let spikes = [];

function createSpike(double = false) {
    const arr = [];
    arr.push({
        x: WIDTH + Math.random() * 300,
        y: 320,
        size: 25
    });

    if (double) {
        arr.push({
            x: arr[0].x + 28,
            y: 320,
            size: 25
        });
    }

    return arr;
}

// -------------------- INPUT (PC) --------------------
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        jump();
    }
});

// -------------------- INPUT (MOBILE BUTTON) --------------------
const jumpBtn = document.getElementById("jumpBtn");
if (jumpBtn) {
    jumpBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        jump();
    });
    jumpBtn.addEventListener("click", jump);
}

// -------------------- JUMP FUNCTION --------------------
function jump() {
    if (onGround && !gameOver) {
        snake.yVel = snake.jumpPower;
        onGround = false;
    }
}

// -------------------- GAME LOOP --------------------
function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = "#000";
        ctx.font = "32px Arial";
        ctx.fillText("GAME OVER", WIDTH / 2 - 90, HEIGHT / 2);
        return;
    }

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // SPEED UP AFTER SCORE 10
    if (score >= 10) {
        speed = 4 + (score - 10) * 0.2;
    }

    // -------------------- PHYSICS --------------------
    snake.yVel += snake.gravity;
    snake.y += snake.yVel;

    if (snake.y + snake.height >= 320) {
        snake.y = 320 - snake.height;
        snake.yVel = 0;
        onGround = true;
    }

    // -------------------- MOVE WALLS --------------------
    walls.forEach(w => w.x -= speed);
    spikes.forEach(s => s.x -= speed);

    // -------------------- COLLISIONS --------------------
    for (let w of walls) {
        if (
            snake.x < w.x + w.width &&
            snake.x + snake.width > w.x &&
            snake.y < w.y &&
            snake.y + snake.height > w.y - w.height
        ) {
            gameOver = true;
        }
    }

    for (let s of spikes) {
        if (
            snake.x + snake.width > s.x &&
            snake.x < s.x + s.size &&
            snake.y + snake.height > s.y - s.size
        ) {
            gameOver = true;
        }
    }

    // -------------------- CLEAN --------------------
    walls = walls.filter(w => w.x + w.width > 0);
    spikes = spikes.filter(s => s.x + s.size > 0);

    // -------------------- SPAWN --------------------
    if (walls.length === 0 || walls[walls.length - 1].x < WIDTH - 500) {
        walls.push(createWall());
        score++;
        scoreEl.textContent = score;

        if (score >= 10) {
            const doubleSpike = Math.random() < 0.5;
            spikes.push(...createSpike(doubleSpike));
        }
    }

    // -------------------- DRAW --------------------
    // Ground
    ctx.fillStyle = "#00c800";
    ctx.fillRect(0, 320, WIDTH, 80);

    // Walls
    ctx.fillStyle = "#8b4513";
    walls.forEach(w => {
        ctx.fillRect(w.x, w.y - w.height, w.width, w.height);
    });

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

    // Snake
    ctx.fillStyle = "red";
    ctx.fillRect(snake.x, snake.y, snake.width, snake.height);

    requestAnimationFrame(gameLoop);
}

gameLoop();
