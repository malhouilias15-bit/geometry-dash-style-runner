// ---------------- CANVAS ----------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 330;

// ---------------- SCORE ----------------
let score = 0;
const scoreEl = document.getElementById("score");

// ---------------- SNAKE ----------------
const snake = {
    x: 100,
    y: GROUND_Y - 30,
    w: 32,
    h: 24,
    vy: 0
};

const GRAVITY = 1;
const JUMP_POWER = -15;
let onGround = true;
let gameOver = false;

// ---------------- SPEED ----------------
let speed = 5;

// ---------------- OBSTACLES ----------------
let walls = [];
let spikes = [];

function createWall() {
    return {
        type: "wall",
        x: WIDTH,
        w: 30,
        h: 60,
        y: GROUND_Y - 60
    };
}

function createSpike(double = false) {
    return {
        type: "spike",
        x: WIDTH,
        size: 30,
        double: double
    };
}

// ---------------- INPUT ----------------
function jump() {
    if (onGround && !gameOver) {
        snake.vy = JUMP_POWER;
        onGround = false;
    }
}

document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

document.getElementById("jumpBtn").addEventListener("click", jump);

// ---------------- COLLISION ----------------
function rectHit(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

// ---------------- GAME LOOP ----------------
function loop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (gameOver) {
        ctx.fillStyle = "#000";
        ctx.font = "36px Arial";
        ctx.fillText("GAME OVER", WIDTH / 2 - 110, HEIGHT / 2);
        return;
    }

    // SPEED UP AFTER SCORE 10
    if (score >= 10) {
        speed = 5 + Math.floor(score / 5);
    }

    // GRAVITY
    snake.vy += GRAVITY;
    snake.y += snake.vy;

    // GROUND
    if (snake.y + snake.h >= GROUND_Y) {
        snake.y = GROUND_Y - snake.h;
        snake.vy = 0;
        onGround = true;
    }

    // MOVE OBSTACLES
    walls.forEach(o => o.x -= speed);
    spikes.forEach(o => o.x -= speed);

    // CLEAN
    walls = walls.filter(o => o.x + o.w > 0);
    spikes = spikes.filter(o => o.x + o.size * (o.double ? 2 : 1) > 0);

    // SPAWN LOGIC
    if (walls.length === 0 && spikes.length === 0) {
        if (score >= 10) {
            const doubleSpike = Math.random() < 0.5;
            spikes.push(createSpike(doubleSpike));
        } else {
            walls.push(createWall());
        }
        score++;
        scoreEl.textContent = score;
    }

    // COLLISIONS
    walls.forEach(w => {
        if (rectHit(snake, { x: w.x, y: w.y, w: w.w, h: w.h })) {
            gameOver = true;
        }
    });

    spikes.forEach(s => {
        const hitbox = {
            x: s.x,
            y: GROUND_Y - s.size,
            w: s.size * (s.double ? 2 : 1),
            h: s.size
        };
        if (rectHit(snake, hitbox)) {
            gameOver = true;
        }
    });

    // ---------------- DRAW ----------------
    // Ground
   ctx.fillStyle = "#2ecc71"; // green
ctx.beginPath();
ctx.roundRect(snake.x, snake.y, snake.w, snake.h, 10);
ctx.fill();

    // Snake
    ctx.drawImage(snakeImg, snake.x, snake.y, snake.w, snake.h);

    // Walls
    ctx.fillStyle = "#8b4513";
    walls.forEach(w => {
        ctx.fillRect(w.x, w.y, w.w, w.h);
    });

    // Spikes (triangle style)
    ctx.fillStyle = "#000";
    spikes.forEach(s => {
        const count = s.double ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const x = s.x + i * s.size;
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y);
            ctx.lineTo(x + s.size / 2, GROUND_Y - s.size);
            ctx.lineTo(x + s.size, GROUND_Y);
            ctx.closePath();
            ctx.fill();
        }
    });

    requestAnimationFrame(loop);
}

loop();
