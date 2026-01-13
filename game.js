// -------------------- SETUP --------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let score = 0;
let gameOver = false;

const GROUND_Y = 360;

// -------------------- SNAKE --------------------
const snake = {
    x: 80,
    y: GROUND_Y - 20,
    radius: 12,
    vy: 0,
    gravity: 0.9,
    jump: -14,
    onGround: true,
    color: "lime"
};

// -------------------- WALLS --------------------
let walls = [];
let platforms = [];
const WALL_SPEED = 4;

function spawnDoubleWalls() {
    const gap = 50;
    const wallWidth = 25;
    const wallHeight = 60;

    const baseX = WIDTH + 50;

    const wall1 = {
        x: baseX,
        y: GROUND_Y - wallHeight,
        w: wallWidth,
        h: wallHeight
    };

    const wall2 = {
        x: baseX + wallWidth + gap,
        y: GROUND_Y - wallHeight,
        w: wallWidth,
        h: wallHeight
    };

    walls.push(wall1, wall2);

    // PLATFORM (score >= 5, 90% chance)
    if (score >= 5 && Math.random() < 0.9) {
        platforms.push({
            x: baseX - 10,
            y: wall1.y - 25,
            w: wallWidth * 2 + gap + 20,
            h: 10
        });
    }
}

// -------------------- INPUT --------------------
document.addEventListener("keydown", e => {
    if (e.code === "Space" && snake.onGround && !gameOver) {
        snake.vy = snake.jump;
        snake.onGround = false;
    }
});

// -------------------- COLLISION HELPERS --------------------
function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);

    if (distX > (rect.w / 2 + circle.radius)) return false;
    if (distY > (rect.h / 2 + circle.radius)) return false;

    return true;
}

// -------------------- GAME LOOP --------------------
function loop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // BACKGROUND
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // SCORE
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + score, 20, 30);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", WIDTH / 2 - 120, HEIGHT / 2);
        return;
    }

    // -------------------- SNAKE PHYSICS --------------------
    snake.vy += snake.gravity;
    snake.y += snake.vy;
    snake.onGround = false;

    // GROUND COLLISION
    if (snake.y + snake.radius >= GROUND_Y) {
        snake.y = GROUND_Y - snake.radius;
        snake.vy = 0;
        snake.onGround = true;
    }

    // -------------------- MOVE WALLS & PLATFORMS --------------------
    walls.forEach(w => w.x -= WALL_SPEED);
    platforms.forEach(p => p.x -= WALL_SPEED);

    // -------------------- COLLISIONS --------------------
    // WALLS = DEATH
    for (let w of walls) {
        if (rectCircleCollide(w, { x: snake.x, y: snake.y, radius: snake.radius })) {
            gameOver = true;
        }
    }

    // PLATFORMS = SAFE
    for (let p of platforms) {
        if (
            snake.y + snake.radius <= p.y + 5 &&
            snake.y + snake.radius + snake.vy >= p.y &&
            snake.x > p.x &&
            snake.x < p.x + p.w
        ) {
            snake.y = p.y - snake.radius;
            snake.vy = 0;
            snake.onGround = true;
        }
    }

    // -------------------- CLEANUP --------------------
    walls = walls.filter(w => w.x + w.w > 0);
    platforms = platforms.filter(p => p.x + p.w > 0);

    // -------------------- SPAWN LOGIC --------------------
    if (walls.length === 0 || walls[walls.length - 1].x < WIDTH - 350) {
        spawnDoubleWalls();
        score++;
    }

    // -------------------- DRAW --------------------
    // GROUND
    ctx.fillStyle = "lime";
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    // WALLS
    ctx.fillStyle = "#888";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

    // PLATFORM
    ctx.fillStyle = "#00ff99";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // SNAKE
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.radius, 0, Math.PI * 2);
    ctx.fillStyle = snake.color;
    ctx.fill();

    requestAnimationFrame(loop);
}

loop();
