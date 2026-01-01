// ==================== SETUP ====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let score = 0;
document.getElementById("score").textContent = score;

let gameOver = false;

// ==================== SNAKE ====================
const snake = {
    x: 100,
    y: 300,
    width: 40,
    height: 20,
    yVel: 0,
    gravity: 1,
    jump: -15
};

let onGround = false;

// ==================== WALLS ====================
let walls = [];
const SPEED = 5;

function createWall() {
    const h = Math.floor(Math.random() * 40) + 40;
    return {
        x: WIDTH + 50,
        y: 350 - h,
        width: 30,
        height: h
    };
}

walls.push(createWall());

// ==================== SPIKES ====================
let spikes = [];

function createSpike() {
    const isDouble = Math.random() < 0.5; // 50% chance
    return {
        x: WIDTH + 50,
        size: 20,
        count: isDouble ? 2 : 1
    };
}

// ==================== INPUT ====================
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && onGround && !gameOver) {
        snake.yVel = snake.jump;
    }
});

// ==================== GAME LOOP ====================
function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (gameOver) {
        ctx.fillStyle = "#000";
        ctx.font = "36px Arial";
        ctx.fillText("GAME OVER - Refresh", 200, 200);
        return;
    }

    // ----- PHYSICS -----
    snake.yVel += snake.gravity;
    snake.y += snake.yVel;

    if (snake.y + snake.height >= 350) {
        snake.y = 350 - snake.height;
        snake.yVel = 0;
        onGround = true;
    } else {
        onGround = false;
    }

    // ----- MOVE OBJECTS -----
    walls.forEach(w => w.x -= SPEED);
    spikes.forEach(s => s.x -= SPEED);

    // ----- WALL COLLISION -----
    for (let w of walls) {
        if (
            snake.x < w.x + w.width &&
            snake.x + snake.width > w.x &&
            snake.y < w.y + w.height &&
            snake.y + snake.height > w.y
        ) {
            gameOver = true;
        }
    }

    // ----- SPIKE COLLISION -----
    for (let s of spikes) {
        const spikeWidth = s.count * s.size;
        const spikeHeight = s.size;

        if (
            snake.x + snake.width > s.x &&
            snake.x < s.x + spikeWidth &&
            snake.y + snake.height > 350 - spikeHeight
        ) {
            gameOver = true;
        }
    }

    // ----- CLEANUP -----
    walls = walls.filter(w => w.x + w.width > 0);
    spikes = spikes.filter(s => s.x + s.size * s.count > 0);

    // ----- SPAWN WALLS -----
    if (walls.length === 0 || walls[walls.length - 1].x < WIDTH - 300) {
        walls.push(createWall());
        score++;
        document.getElementById("score").textContent = score;

        // Spawn spike separately AFTER score 10
        if (score >= 10 && Math.random() < 0.7) {
            spikes.push(createSpike());
        }
    }

    // ==================== DRAW ====================

    // Ground
    ctx.fillStyle = "#00c800";
    ctx.fillRect(0, 350, WIDTH, 50);

    // Walls
    ctx.fillStyle = "#8b4513";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));

    // Spikes (triangle style)
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "black";

    spikes.forEach(s => {
        for (let i = 0; i < s.count; i++) {
            const x = s.x + i * s.size;
            const y = 350;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + s.size / 2, y - s.size);
            ctx.lineTo(x + s.size, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    });

    ctx.shadowBlur = 0;

    // Snake
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(snake.x, snake.y, snake.width, snake.height);

    requestAnimationFrame(gameLoop);
}

gameLoop();
