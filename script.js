const cells = [...document.querySelectorAll(".cell")];
const statusText = document.getElementById("statusText");
const roundText = document.getElementById("roundText");
const scoreX = document.getElementById("scoreX");
const scoreO = document.getElementById("scoreO");
const scoreDraw = document.getElementById("scoreDraw");
const newRoundBtn = document.getElementById("newRoundBtn");
const resetScoresBtn = document.getElementById("resetScoresBtn");
const swapStarterBtn = document.getElementById("swapStarterBtn");
const difficultySelect = document.getElementById("difficulty");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const xPreview = document.querySelector(".x-mark");
const oPreview = document.querySelector(".o-mark");

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

let board = Array(9).fill("");
let currentPlayer = "X";
let starter = "X";
let mode = "pvp";
let gameOver = false;
let round = 1;
let aiMoveTimer = null;
let scores = {
    X: 0,
    O: 0,
    draw: 0,
};

function setStatus(message) {
    statusText.textContent = message;
}

function updateScoreboard() {
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
    scoreDraw.textContent = scores.draw;
    roundText.textContent = `Round ${round}`;
}

function updateTurnPreview() {
    xPreview.classList.toggle("active", currentPlayer === "X" && !gameOver);
    oPreview.classList.toggle("active", currentPlayer === "O" && !gameOver);
}

function renderBoard() {
    cells.forEach((cell, index) => {
        const value = board[index];
        cell.textContent = value;
        cell.className = "cell";
        if (value) {
            cell.classList.add(value.toLowerCase());
        }
        cell.disabled = gameOver || Boolean(value) || (mode === "ai" && currentPlayer === "O");
    });
    updateTurnPreview();
}

function clearAiMove() {
    if (aiMoveTimer) {
        window.clearTimeout(aiMoveTimer);
        aiMoveTimer = null;
    }
}

function scheduleAiMove() {
    clearAiMove();
    aiMoveTimer = window.setTimeout(() => {
        aiMoveTimer = null;
        makeAiMove();
    }, 420);
}

function getWinner(squares) {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return {
                player: squares[a],
                pattern,
            };
        }
    }

    if (squares.every(Boolean)) {
        return {
            player: "draw",
            pattern: [],
        };
    }

    return null;
}

function finishGame(result) {
    clearAiMove();
    gameOver = true;

    if (result.player === "draw") {
        scores.draw += 1;
        setStatus("It's a draw");
    } else {
        scores[result.player] += 1;
        result.pattern.forEach((index) => cells[index].classList.add("win"));
        setStatus(`${result.player} wins the round`);
    }

    updateScoreboard();
    renderBoard();
    result.pattern.forEach((index) => cells[index].classList.add("win"));
}

function switchPlayer() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    setStatus(mode === "ai" && currentPlayer === "O" ? "AI is thinking..." : `Player ${currentPlayer}'s turn`);
    renderBoard();

    if (mode === "ai" && currentPlayer === "O" && !gameOver) {
        scheduleAiMove();
    }
}

function playMove(index) {
    if (board[index] || gameOver) {
        return;
    }

    board[index] = currentPlayer;
    const result = getWinner(board);

    if (result) {
        finishGame(result);
        return;
    }

    switchPlayer();
}

function getAvailableMoves(squares) {
    return squares
        .map((value, index) => (value ? null : index))
        .filter((index) => index !== null);
}

function getEasyMove() {
    const moves = getAvailableMoves(board);
    return moves[Math.floor(Math.random() * moves.length)];
}

function minimax(squares, player) {
    const result = getWinner(squares);

    if (result?.player === "O") {
        return { score: 10 };
    }

    if (result?.player === "X") {
        return { score: -10 };
    }

    if (result?.player === "draw") {
        return { score: 0 };
    }

    const moves = getAvailableMoves(squares).map((index) => {
        const nextSquares = [...squares];
        nextSquares[index] = player;
        const nextPlayer = player === "O" ? "X" : "O";
        const move = minimax(nextSquares, nextPlayer);
        return {
            index,
            score: move.score,
        };
    });

    if (player === "O") {
        return moves.reduce((best, move) => (move.score > best.score ? move : best));
    }

    return moves.reduce((best, move) => (move.score < best.score ? move : best));
}

function getHardMove() {
    return minimax(board, "O").index;
}

function makeAiMove() {
    if (gameOver || mode !== "ai" || currentPlayer !== "O") {
        return;
    }

    const move = difficultySelect.value === "easy" ? getEasyMove() : getHardMove();
    playMove(move);
}

function startNewRound(keepStarter = true) {
    clearAiMove();
    board = Array(9).fill("");
    currentPlayer = keepStarter ? starter : currentPlayer;
    gameOver = false;
    round += 1;
    setStatus(`Player ${currentPlayer}'s turn`);
    updateScoreboard();
    renderBoard();

    if (mode === "ai" && currentPlayer === "O") {
        setStatus("AI is thinking...");
        scheduleAiMove();
    }
}

function changeMode(nextMode) {
    mode = nextMode;
    difficultySelect.disabled = mode !== "ai";
    modeButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.mode === mode);
    });
    scores = { X: 0, O: 0, draw: 0 };
    round = 0;
    startNewRound();
}

cells.forEach((cell) => {
    cell.addEventListener("click", () => {
        if (mode === "ai" && currentPlayer === "O") {
            return;
        }

        playMove(Number(cell.dataset.index));
    });
});

modeButtons.forEach((button) => {
    button.addEventListener("click", () => changeMode(button.dataset.mode));
});

newRoundBtn.addEventListener("click", () => startNewRound());

resetScoresBtn.addEventListener("click", () => {
    scores = { X: 0, O: 0, draw: 0 };
    round = 0;
    startNewRound();
});

swapStarterBtn.addEventListener("click", () => {
    starter = starter === "X" ? "O" : "X";
    swapStarterBtn.textContent = starter === "X" ? "O Starts" : "X Starts";
    round = 0;
    startNewRound();
});

updateScoreboard();
renderBoard();
