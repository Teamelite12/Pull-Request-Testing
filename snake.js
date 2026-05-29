(function () {
    "use strict";

    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");
    const highScoreEl = document.getElementById("high-score");
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayMessage = document.getElementById("overlay-message");
    const startBtn = document.getElementById("start-btn");

    const GRID_SIZE = 20;
    const TILE_COUNT = canvas.width / GRID_SIZE;
    const INITIAL_SPEED = 8;
    const SPEED_INCREMENT = 0.5;
    const MAX_SPEED = 18;

    let snake = [];
    let food = { x: 0, y: 0 };
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let score = 0;
    let highScore = parseInt(localStorage.getItem("snakeHighScore")) || 0;
    let speed = INITIAL_SPEED;
    let gameLoop = null;
    let isRunning = false;
    let isPaused = false;

    highScoreEl.textContent = highScore;

    function init() {
        snake = [
            { x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 2) },
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        speed = INITIAL_SPEED;
        isPaused = false;
        scoreEl.textContent = score;
        placeFood();
    }

    function placeFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * TILE_COUNT),
                y: Math.floor(Math.random() * TILE_COUNT),
            };
        } while (snake.some((seg) => seg.x === newFood.x && seg.y === newFood.y));
        food = newFood;
    }

    function update() {
        if (isPaused) return;

        direction = { ...nextDirection };

        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y,
        };

        // Wall collision
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
            gameOver();
            return;
        }

        // Self collision
        if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
            gameOver();
            return;
        }

        snake.unshift(head);

        // Eat food
        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreEl.textContent = score;
            speed = Math.min(INITIAL_SPEED + score * SPEED_INCREMENT, MAX_SPEED);
            clearInterval(gameLoop);
            gameLoop = setInterval(update, 1000 / speed);
            placeFood();
        } else {
            snake.pop();
        }

        draw();
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = "#16213e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines (subtle)
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 0.5;
        for (let i = 0; i < TILE_COUNT; i++) {
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, 0);
            ctx.lineTo(i * GRID_SIZE, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * GRID_SIZE);
            ctx.lineTo(canvas.width, i * GRID_SIZE);
            ctx.stroke();
        }

        // Draw food
        ctx.fillStyle = "#ff6b6b";
        ctx.shadowColor = "#ff6b6b";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE / 2,
            food.y * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw snake
        snake.forEach((seg, i) => {
            const ratio = 1 - i / snake.length;
            const green = Math.floor(180 + 75 * ratio);
            ctx.fillStyle = `rgb(0, ${green}, ${Math.floor(60 + 56 * ratio)})`;
            ctx.shadowColor = i === 0 ? "#00d474" : "transparent";
            ctx.shadowBlur = i === 0 ? 8 : 0;

            const padding = i === 0 ? 1 : 2;
            ctx.beginPath();
            ctx.roundRect(
                seg.x * GRID_SIZE + padding,
                seg.y * GRID_SIZE + padding,
                GRID_SIZE - padding * 2,
                GRID_SIZE - padding * 2,
                4
            );
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Pause text
        if (isPaused) {
            ctx.fillStyle = "rgba(22, 33, 62, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#00d474";
            ctx.font = "bold 28px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
        }
    }

    function gameOver() {
        clearInterval(gameLoop);
        isRunning = false;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
            highScoreEl.textContent = highScore;
        }

        overlayTitle.textContent = "Game Over";
        overlayMessage.textContent = `Score: ${score}`;
        startBtn.textContent = "Play Again";
        overlay.classList.remove("hidden");
    }

    function startGame() {
        overlay.classList.add("hidden");
        init();
        draw();
        isRunning = true;
        gameLoop = setInterval(update, 1000 / speed);
    }

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
        if (e.key === "p" || e.key === "P") {
            if (isRunning) {
                isPaused = !isPaused;
                draw();
            }
            return;
        }

        if (!isRunning) return;

        switch (e.key) {
            case "ArrowUp":
            case "w":
            case "W":
                if (direction.y === 0) nextDirection = { x: 0, y: -1 };
                break;
            case "ArrowDown":
            case "s":
            case "S":
                if (direction.y === 0) nextDirection = { x: 0, y: 1 };
                break;
            case "ArrowLeft":
            case "a":
            case "A":
                if (direction.x === 0) nextDirection = { x: -1, y: 0 };
                break;
            case "ArrowRight":
            case "d":
            case "D":
                if (direction.x === 0) nextDirection = { x: 1, y: 0 };
                break;
        }

        // Prevent scrolling with arrow keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Mobile controls
    function setupMobileButton(id, dir) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            if (!isRunning || isPaused) return;
            if (dir.x !== 0 && direction.x === 0) nextDirection = dir;
            if (dir.y !== 0 && direction.y === 0) nextDirection = dir;
        });
        btn.addEventListener("click", () => {
            if (!isRunning || isPaused) return;
            if (dir.x !== 0 && direction.x === 0) nextDirection = dir;
            if (dir.y !== 0 && direction.y === 0) nextDirection = dir;
        });
    }

    setupMobileButton("btn-up", { x: 0, y: -1 });
    setupMobileButton("btn-down", { x: 0, y: 1 });
    setupMobileButton("btn-left", { x: -1, y: 0 });
    setupMobileButton("btn-right", { x: 1, y: 0 });

    // Start button
    startBtn.addEventListener("click", startGame);

    // Initial draw
    init();
    draw();
})();
