const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const skinsButton = document.getElementById("skinsButton");
const skinsMenu = document.getElementById("skinsMenu");

let score = 0;
let gameOver = false;

let snake = {
    x: 80,
    y: 320,
    r: 10,
    vy: 0,
    color: "green"
};

const gravity = 0.6;
const jumpPower = -11;
const groundY = 350;

let walls = [];
let platforms = [];

// ---------- SKINS ----------
const skins = [
    { name: "Green (Starter)", color: "green", unlock: 0 },
    { name: "Blue (10)", color: "blue", unlock: 10 },
    { name: "Purple (20)", color: "purple", unlock: 20 },
    { name: "Yellow (30)", color: "yellow", unlock: 30 },
    { name: "Orange (40)", color: "orange", unlock: 40 },
    { name: "🌈 Rainbow (100 / $1)", color: "rainbow", unlock: 100 }
];

skinsButton.onclick = () => {
    skinsMenu.style.display =
        skinsMenu.style.display === "none" ? "block" : "none";
    updateSkinsMenu();
};

function updateSkinsMenu() {
    skinsMenu.innerHTML = "";
    skins.forEach(s => {
        const div = document.createElement("div");
        div.className = "skin";

        if (score >= s.unlock) {
            div.textContent = "Equip " + s.name;
            div.onclick = () => snake.color = s.color;
        } else {
            div.textContent = s.name + " 🔒";
        }

        skinsMenu.appendChild(div);
    });
}

// ---------- CONTROLS ----------
document.addEventListener("keydown", e => {
    if (e.code === "Space" && snake.y >= groundY) {
        snake.vy = jumpPower;
    }
});

// ---------- WALL SPAWN ----------
function spawnWalls() {
    let double = Math.random() < 0.4;
    let x = canvas.width;

    walls.push({ x, w: 30, h: 80 });
    if (double) walls.push({ x: x + 40, w: 30, h: 80 });

    // SAFE PLATFORM (score >= 5, 90% chance, ONLY if double wall)
    if (double && score >= 5 && Math.random() < 0.9) {
        platforms.push({
            x: x - 10,
            y: groundY - 120,
            w: 90,
            h: 10
        });
    }
}

setInterval(spawnWalls, 1500);

// ---------- GAME LOOP ----------
function update() {
    if (gameOver) return;

    snake.vy += gravity;
    snake.y += snake.vy;

    if (snake.y >= groundY) {
        snake.y = groundY;
        snake.vy = 0;
    }

    walls.forEach(w => w.x -= 5);
    platforms.forEach(p => p.x -= 5);

    walls = walls.filter(w => w.x + w.w > 0);
    platforms = platforms.filter(p => p.x + p.w > 0);

    // Collision with walls
    walls.forEach(w => {
        if (
            snake.x + snake.r > w.x &&
            snake.x - snake.r < w.x + w.w &&
            snake.y + snake.r > groundY - w.h
        ) {
            gameOver = true;
        }
    });

    // Platform landing
    platforms.forEach(p => {
        if (
            snake.x > p.x &&
            snake.x < p.x + p.w &&
            snake.y + snake.r >= p.y &&
            snake.y + snake.r <= p.y + p.h
        ) {
            snake.y = p.y - snake.r;
            snake.vy = 0;
        }
    });

    score += 0.02;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(0, groundY + 10, canvas.width, 100);

    // Snake
    if (snake.color === "rainbow") {
        ctx.fillStyle = `hsl(${Date.now() % 360},100%,50%)`;
    } else {
        ctx.fillStyle = snake.color;
    }
    ctx.beginPath();
    ctx.arc(snake.x, snake.y, snake.r, 0, Math.PI * 2);
    ctx.fill();

    // Walls
    ctx.fillStyle = "#888";
    walls.forEach(w => {
        ctx.fillRect(w.x, groundY - w.h, w.w, w.h);
    });

    // SAFE PLATFORM (VISIBLE)
    ctx.fillStyle = "#00ffcc";
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    // Score
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + Math.floor(score), 10, 25);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
 
   
