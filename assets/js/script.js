// Default game settings
let rows = 10;
let cols = 10;
let totalMines = 15;

let board = [];
let gameOver = false;
let gameWon = false;
let flagsPlaced = 0;
let tagsPlaced = 0;
let tagMode = false;
let soundEnabled = true;

// DOM Elements
const gameBoard = document.getElementById('game-board');
const restartBtn = document.getElementById('restart-btn');
const tagToggleBtn = document.getElementById('tag-toggle');
const soundToggleBtn = document.getElementById('sound-toggle');
const minesCount = document.getElementById('mines-count');
const flagsCount = document.getElementById('flags-count');
const tagsCount = document.getElementById('tags-count');
const messageEl = document.getElementById('message');
const difficultySelect = document.getElementById('difficulty');

// Sounds
const clickSound = document.getElementById('click-sound');
const flagSound = document.getElementById('flag-sound');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');
const revealSound = document.getElementById('reveal-sound');

// Apply difficulty settings
function setDifficulty(level) {
    if (level === "easy") {
        rows = 8; cols = 8; totalMines = 10;
    } else if (level === "medium") {
        rows = 10; cols = 10; totalMines = 15;
    } else if (level === "hard") {
        rows = 16; cols = 16; totalMines = 40;
    }

    // Update grid size in CSS
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 35px)`;
    gameBoard.style.gridTemplateRows = `repeat(${rows}, 35px)`;
}

// Show a message in UI
function showMessage(text, type = "") {
    messageEl.textContent = text;
    messageEl.className = type;
}

// Generate a blank board
function generateBoard() {
    messageEl.textContent = "";
    board = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
            mine: false,
            flagged: false,
            tagged: false,
            opened: false,
            adjacentMines: 0
        }))
    );

    placeMines();
    calculateAdjacentMines();
    renderBoard();
    gameOver = false;
    gameWon = false;
    flagsPlaced = 0;
    tagsPlaced = 0;
    updateCounters();
}

// Place mines randomly
function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < totalMines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!board[r][c].mine) {
            board[r][c].mine = true;
            minesPlaced++;
        }
    }
}

// Calculate adjacent mines
function calculateAdjacentMines() {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].mine) continue;
            let count = 0;
            for (const [dx, dy] of directions) {
                const nr = r + dx, nc = c + dy;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
                    count++;
                }
            }
            board[r][c].adjacentMines = count;
        }
    }
}

// Render board
function renderBoard() {
    gameBoard.innerHTML = "";
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.dataset.row = r;
            tile.dataset.col = c;

            if (board[r][c].opened) {
                tile.classList.add("opened");
                if (board[r][c].mine) {
                    tile.classList.add("mine");
                    tile.textContent = "💣";
                } else if (board[r][c].adjacentMines > 0) {
                    tile.textContent = board[r][c].adjacentMines;
                    tile.classList.add(`number-${board[r][c].adjacentMines}`);
                }
            } else if (board[r][c].flagged) {
                tile.classList.add("flagged");
                tile.textContent = "🚩";
            } else if (board[r][c].tagged) {
                tile.classList.add("question");
                tile.textContent = "?";
            }

            if (!gameOver && !gameWon) {
                tile.addEventListener("click", () => handleClick(r, c));
                tile.addEventListener("contextmenu", (e) => handleRightClick(e, r, c));
            }

            gameBoard.appendChild(tile);
        }
    }

    if (gameOver) gameBoard.classList.add("game-over");
    else if (gameWon) gameBoard.classList.add("win");
    else gameBoard.classList.remove("game-over", "win");
}

// Handle left-click
function handleClick(r, c) {
    if (gameOver || gameWon || board[r][c].opened || board[r][c].flagged) return;

    playSound(revealSound);
    board[r][c].opened = true;

    if (board[r][c].mine) {
        gameOver = true;
        playSound(loseSound);
        revealAllMines();
        renderBoard();
        showMessage("💥 Game Over! Click restart to try again.", "lose");
    } else {
        if (board[r][c].adjacentMines === 0) openAdjacentCells(r, c);
        checkWinCondition();
        renderBoard();
    }
}

// Handle right-click (flag or tag)
function handleRightClick(e, r, c) {
    e.preventDefault();
    if (gameOver || gameWon || board[r][c].opened) return;

    if (tagMode) {
        // Tag mode → toggle ?
        if (board[r][c].tagged) {
            board[r][c].tagged = false;
            tagsPlaced--;
        } else if (!board[r][c].flagged) {
            board[r][c].tagged = true;
            tagsPlaced++;
        }
        playSound(clickSound);
    } else {
        // Normal mode → toggle 🚩
        if (board[r][c].flagged) {
            board[r][c].flagged = false;
            flagsPlaced--;
        } else if (!board[r][c].tagged) {
            board[r][c].flagged = true;
            flagsPlaced++;
        }
        playSound(flagSound);
    }

    updateCounters();
    renderBoard();
}

// Open adjacent empty cells
function openAdjacentCells(r, c) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (const [dx, dy] of directions) {
        const nr = r + dx, nc = c + dy;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
            !board[nr][nc].opened && !board[nr][nc].flagged) {
            board[nr][nc].opened = true;
            if (board[nr][nc].adjacentMines === 0) openAdjacentCells(nr, nc);
        }
    }
}

// Check win condition
function checkWinCondition() {
    let allNonMinesOpened = true;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!board[r][c].mine && !board[r][c].opened) {
                allNonMinesOpened = false;
                break;
            }
        }
        if (!allNonMinesOpened) break;
    }

    if (allNonMinesOpened) {
        gameWon = true;
        playSound(winSound);
        showMessage("🎉 Congratulations! You won!", "win");
    }
}

// Reveal all mines
function revealAllMines() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].mine) board[r][c].opened = true;
        }
    }
}

// Update counters
function updateCounters() {
    minesCount.textContent = totalMines - flagsPlaced;
    flagsCount.textContent = flagsPlaced;
    tagsCount.textContent = tagsPlaced;
}

// Play sound
function playSound(sound) {
    if (!soundEnabled) return;
    const clone = sound.cloneNode();
    clone.volume = 0.7;
    clone.play().catch(() => {});
}

// Toggle tag mode
function toggleTagMode() {
    tagMode = !tagMode;
    tagToggleBtn.textContent = `Tag Mode: ${tagMode ? 'On' : 'Off'}`;
    playSound(clickSound);
}

// Toggle sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = `Sound: ${soundEnabled ? 'On' : 'Off'}`;
    soundToggleBtn.classList.toggle("sound-on", soundEnabled);
    soundToggleBtn.classList.toggle("sound-off", !soundEnabled);
    if (soundEnabled) playSound(clickSound);
}

// Event listeners
restartBtn.addEventListener("click", () => {
    playSound(clickSound);
    setDifficulty(difficultySelect.value); // ✅ Fix restart
    generateBoard();
});
tagToggleBtn.addEventListener("click", toggleTagMode);
soundToggleBtn.addEventListener("click", toggleSound);
difficultySelect.addEventListener("change", (e) => {
    setDifficulty(e.target.value);
    generateBoard();
});

// Init
setDifficulty(difficultySelect.value);
generateBoard();
