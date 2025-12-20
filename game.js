// -------------------- SETUP --------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Music
const music = new Audio('assets/music.mp3');
music.loop = true;
music.volume = 0.5;
music.play().catch(() => console.log("Music autoplay blocked"));

let score = 0;
document.getElementById('score').textContent = score;

// -------------------- SNAKE --------------------
const snake = {
    x: 100,
    y: 300,
    width: 40,
    height: 20,
    yVelocity: 0,
    gravity: 1,
    jumpPower: -15
};

let onGround = false;

// -------------------- WALLS --------------------
let walls = [];
const WALL_SPEED = 5;

function createWall() {
    const height = Math.floor(Math.random() * 40) + 40; // 40-80
    return { x: WIDTH + 50, y: 350 - height, width: 30, height: height };
}

for (let i = 0; i < 3; i++) {
    walls.push(createWall());
}

// -------------------- INPUT --------------------
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && onGround) {
        snake.yVelocity = snake.jumpPower;
    }
});

// -------------------- GAME LOOP --------------------
let gameOver = false;

function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // GRAVITY
    snake.yVelocity += snake.gravity;
    snake.y += snake.yVelocity;

    // GROUND COLLISION
    if (snake.y + snake.height >= 350) {
        snake.y = 350 - snake.height;
        snake.yVelocity = 0;
        onGround = true;
    } else {
        onGround = false;
    }

    // MOVE WALLS
    walls.forEach(w => w.x -= WALL_SPEED);

    // COLLISION
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

    // REMOVE OFFSCREEN WALLS + ADD NEW
    walls = walls.filter(w => w.x + w.width > 0);
    if (walls.length === 0 || walls[walls.length - 1].x < WIDTH - 300) {
        walls.push(createWall());
        score++;
        document.getElementById('score').textContent = score;
    }

    // -------------------- DRAW --------------------
    // Ground
    ctx.fillStyle = "#00c800";
    ctx.fillRect(0, 350, WIDTH, 50);

    // Walls
    ctx.fillStyle = "#8b4513";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));

    // Snake
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(snake.x, snake.y, snake.width, snake.height);

    // Game over
    if (gameOver) {
        ctx.fillStyle = "#000";
        ctx.font = "36px Arial";
        ctx.fillText("GAME OVER - Refresh to Restart", 150, 200);
        return; // stop game loop
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
