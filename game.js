const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* MUSIC */
const music = document.getElementById("bgMusic");
let musicStarted = false;

function startMusic() {
    if (!musicStarted) {
        music.volume = 0.5;
        music.play().catch(() => {});
        musicStarted = true;
    }
}

/* GAME SETTINGS */
const gravity = 0.8;
const jumpForce = -15;
let speed = 6;
let score = 0;
let gameOver = false;

/* SNAKE (GREEN DOT) */
const snake = {
    x: 150,
    y: canvas.height - 120,
    r: 14,
    vy: 0
};

/* GROUND */
const groundHeight = 80;

/* OBSTACLES */
let obstacles = [];
let frame = 0;

/* SPAWN WALL (GROUND ONLY) */
function spawnWall() {
    obstacles.push({
        type: "wall",
        x: canvas.width,
        width: 40,
        height: 120
    });
}

/* SPAWN SPIKES (AFTER SCORE 10) */
function spawnSpike() {
    const doubleSpike = Math.random() < 0.5;

    obstacles.push({
        type: "spike",
        x: canvas.width,
        size: 30
    });

    if (doubleSpike) {
        obstacles.push({
            type: "spike",
            x: canvas.width + 35,
            size: 30
        });
    }
}

/* INPUT */
function jump() {
    if (gameOver) return;
    snake.vy = jumpForce;
    startMusic();
}

document.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});
document.addEventListener("mousedown", jump);
document.getElementById("jumpBtn").addEventListener("touchstart", jump);

/* GAME LOOP */
function update() {
    if (gameOver) return;

    frame++;

    /* PHYSICS */
    snake.vy += gravity;
    snake.y += snake.vy;

    const groundY = canvas.height - groundHeight - snake.r;

    if (snake.y > groundY) {
        snake.y = groundY;
        snake.vy = 0;
    }

    /* SPAWNING */
    if (frame % 90 === 0) {
        if (score < 10) {
            spawnWall();
        } else {
            spawnSpike();
        }
    }

    /* MOVE OBSTACLES */
    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x > -100);

    /* COLLISIONS */
    obstacles.forEach(o => {
        if (o.type === "wall") {
            if (
                snake.x + snake.r > o.x &&
                snake.x - snake.r < o.x + o.width &&
                snake.y + snake.r > canvas.height - groundHeight - o.height
            ) {
                gameOver = true;
            }
        }

        if (o.type === "spike") {
            if (
                snake.x + snake.r > o.x &&
                snake.x - snake.r < o.x + o.size &&
                snake.y + snake.r > canvas.height - groundHeight
            ) {
                gameOver = true;
            }
        }
    });

    /* SCORE + SPEED */
    if (frame % 120 === 0) {
        score++;
        if (score >= 10) speed += 0.3;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* SNAKE */
    ctx.fillStyle = "#00ff6a";
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
    ctx.fill();

    /* GROUND */
    ctx.fillStyle = "#111";
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    /* OBSTACLES */
    obstacles.forEach(o => {
        if (o.type === "wall") {
            ctx.fillStyle = "#666";
            ctx.fillRect(
                o.x,
                canvas.height - groundHeight - o.height,
                o.width,
                o.height
            );
        }

        if (o.type === "spike") {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.moveTo(o.x, canvas.height - groundHeight);
            ctx.lineTo(o.x + o.size / 2, canvas.height - groundHeight - o.size);
            ctx.lineTo(o.x + o.size, canvas.height - groundHeight);
            ctx.closePath();
            ctx.fill();
        }
    });

    /* SCORE */
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "48px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 160, canvas.height / 2);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

