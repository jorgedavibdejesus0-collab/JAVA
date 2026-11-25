const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const remainingElement = document.getElementById("remaining");
const powerInput = document.getElementById("power");
const powerValue = document.getElementById("powerValue");

const restartButton = document.getElementById("restart");

const W = canvas.width;
const H = canvas.height;

const BALL_RADIUS = 12;
const POCKET_RADIUS = 23;

const pockets = [
    { x: 0, y: 0 },
    { x: W / 2, y: 0 },
    { x: W, y: 0 },
    { x: 0, y: H },
    { x: W / 2, y: H },
    { x: W, y: H }
];

const colors = [
    "#f4d03f",
    "#2471a3",
    "#c0392b",
    "#9b59b6",
    "#e67e22",
    "#27ae60",
    "#8e443d",
    "#17202a",
    "#f1c40f",
    "#2980b9",
    "#e74c3c",
    "#8e44ad",
    "#d35400",
    "#2ecc71",
    "#bdc3c7"
];

let balls = [];
let score = 0;
let aiming = false;
let mouse = { x: 0, y: 0 };
let gameOver = false;

function createBalls() {
    balls = [];

    balls.push({
        x: 220,
        y: H / 2,
        vx: 0,
        vy: 0,
        color: "#ffffff",
        cue: true,
        active: true,
        number: 0
    });

    let index = 0;
    const startX = 620;
    const startY = H / 2;

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            balls.push({
                x: startX + row * 23,
                y: startY + (col - row / 2) * 26,
                vx: 0,
                vy: 0,
                color: colors[index],
                cue: false,
                active: true,
                number: index + 1
            });

            index++;
        }
    }

    score = 0;
    gameOver = false;
    updateScore();
}

function updateScore() {
    scoreElement.textContent = score;

    const remaining = balls.filter(
        ball => !ball.cue && ball.active
    ).length;

    remainingElement.textContent = remaining;

    if (remaining === 0) {
        gameOver = true;
    }
}

function drawTable() {
    ctx.fillStyle = "#137346";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#ffffff55";
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, W - 30, H - 30);

    pockets.forEach(pocket => {
        ctx.beginPath();
        ctx.arc(
            pocket.x,
            pocket.y,
            POCKET_RADIUS,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#090909";
        ctx.fill();
    });

    ctx.fillStyle = "#ffffff55";
    ctx.beginPath();
    ctx.moveTo(300, 15);
    ctx.lineTo(300, H - 15);
    ctx.stroke();
}

function drawBalls() {
    balls.forEach(ball => {
        if (!ball.active) return;

        ctx.beginPath();
        ctx.arc(
            ball.x,
            ball.y,
            BALL_RADIUS,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = ball.color;
        ctx.fill();

        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (!ball.cue) {
            ctx.beginPath();
            ctx.arc(
                ball.x - 4,
                ball.y - 4,
                3,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = "#ffffff99";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#f7f7f2";
            ctx.fill();

            ctx.fillStyle = "#111";
            ctx.font = "bold 7px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ball.number, ball.x, ball.y + 0.5);
        }
    });
}

function drawAim() {
    const cueBall = balls[0];

    if (!cueBall.active || gameOver) return;

    if (!ballsMoving()) {
        const dx = mouse.x - cueBall.x;
        const dy = mouse.y - cueBall.y;

        const distance = Math.hypot(dx, dy);

        if (distance > 5) {
            const nx = dx / distance;
            const ny = dy / distance;

            ctx.beginPath();
            ctx.moveTo(cueBall.x, cueBall.y);
            ctx.lineTo(
                cueBall.x + nx * 130,
                cueBall.y + ny * 130
            );

            ctx.strokeStyle = "#ffffffaa";
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(
                cueBall.x - nx * 100,
                cueBall.y - ny * 100
            );

            ctx.lineTo(
                cueBall.x - nx * 15,
                cueBall.y - ny * 15
            );

            ctx.strokeStyle = "#d6a84c";
            ctx.lineWidth = 6;
            ctx.stroke();
        }
    }
}

function ballsMoving() {
    return balls.some(ball =>
        ball.active &&
        (Math.abs(ball.vx) > 0.1 ||
         Math.abs(ball.vy) > 0.1)
    );
}

function applyPhysics() {
    balls.forEach(ball => {
        if (!ball.active) return;

        ball.x += ball.vx;
        ball.y += ball.vy;

        ball.vx *= 0.985;
        ball.vy *= 0.985;

        if (Math.abs(ball.vx) < 0.03) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.03) ball.vy = 0;

        // Bordas da mesa
        if (ball.x < BALL_RADIUS + 5) {
            ball.x = BALL_RADIUS + 5;
            ball.vx = Math.abs(ball.vx) * 0.85;
        }

        if (ball.x > W - BALL_RADIUS - 5) {
            ball.x = W - BALL_RADIUS - 5;
            ball.vx = -Math.abs(ball.vx) * 0.85;
        }

        if (ball.y < BALL_RADIUS + 5) {
            ball.y = BALL_RADIUS + 5;
            ball.vy = Math.abs(ball.vy) * 0.85;
        }

        if (ball.y > H - BALL_RADIUS - 5) {
            ball.y = H - BALL_RADIUS - 5;
            ball.vy = -Math.abs(ball.vy) * 0.85;
        }

        // Verificar caçapas
        pockets.forEach(pocket => {
            const distance = Math.hypot(
                ball.x - pocket.x,
                ball.y - pocket.y
            );

            if (distance < POCKET_RADIUS) {
                if (ball.cue) {
                    ball.active = false;

                    setTimeout(() => {
                        ball.x = 220;
                        ball.y = H / 2;
                        ball.vx = 0;
                        ball.vy = 0;
                        ball.active = true;
                    }, 700);
                } else {
                    ball.active = false;
                    score += 10;
                    updateScore();
                }
            }
        });
    });

    // Colisões entre bolas
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i];
            const b = balls[j];

            if (!a.active || !b.active) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy);

            const minDistance = BALL_RADIUS * 2;

            if (distance < minDistance && distance > 0) {
                const nx = dx / distance;
                const ny = dy / distance;

                const overlap = minDistance - distance;

                a.x -= nx * overlap / 2;
                a.y -= ny * overlap / 2;

                b.x += nx * overlap / 2;
                b.y += ny * overlap / 2;

                const relativeVelocity =
                    (a.vx - b.vx) * nx +
                    (a.vy - b.vy) * ny;

                if (relativeVelocity > 0) {
                    const impulse = relativeVelocity;

                    a.vx -= impulse * nx;
                    a.vy -= impulse * ny;

                    b.vx += impulse * nx;
                    b.vy += impulse * ny;
                }
            }
        }
    }
}

function shoot() {
    const cueBall = balls[0];

    if (!cueBall.active || ballsMoving() || gameOver) return;

    const dx = mouse.x - cueBall.x;
    const dy = mouse.y - cueBall.y;

    const distance = Math.hypot(dx, dy);

    if (distance < 5) return;

    const power = Number(powerInput.value) / 100;

    const speed = power * 16;

    cueBall.vx = (dx / distance) * speed;
    cueBall.vy = (dy / distance) * speed;
}

function draw() {
    drawTable();
    drawBalls();
    drawAim();

    if (gameOver) {
        ctx.fillStyle = "#00000099";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 38px Arial";
        ctx.textAlign = "center";
        ctx.fillText("VOCÊ VENCEU!", W / 2, H / 2);
    }
}

function gameLoop() {
    applyPhysics();
    draw();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("mousemove", event => {
    const rect = canvas.getBoundingClientRect();

    mouse.x = (event.clientX - rect.left) *
        (W / rect.width);

    mouse.y = (event.clientY - rect.top) *
        (H / rect.height);
});

canvas.addEventListener("click", () => {
    shoot();
});

powerInput.addEventListener("input", () => {
    powerValue.textContent = powerInput.value + "%";
});

restartButton.addEventListener("click", () => {
    createBalls();
});

createBalls();
gameLoop();
