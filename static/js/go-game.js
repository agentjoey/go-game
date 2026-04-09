/**
 * 围棋游戏核心逻辑 - Phase 2 费曼学习法 & 响应式增强
 */

class GoGame {
    constructor() {
        this.boardSize = 19;
        this.board = null; 
        this.gameState = []; 
        this.history = []; 
        this.currentPlayer = 1; 
        this.isGameOver = false;
        this.gameId = Date.now().toString();
        this.difficulty = 'medium';
        this.aiEnabled = true;
        this.komi = 6.5; 
        this.captures = { 1: 0, 2: 0 }; 
        
        this.feynmanMode = false;
        this.feynmanCountdown = 0;
        this.feynmanTimer = null;
        this.feynmanSuboptimalMove = null;
        
        // 确保在 DOM 加载完后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        const boardContainer = document.getElementById('go-board');
        if (!boardContainer) {
            console.warn("Board container not found, waiting...");
            setTimeout(() => this.init(), 100);
            return;
        }

        this.boardSize = parseInt(document.getElementById('boardSize')?.value || 19);
        this.difficulty = document.getElementById('aiDifficulty')?.value || 'medium';
        this.aiEnabled = document.getElementById('aiEnabled')?.checked !== false;

        this.gameState = Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(0));
        
        // Initialize the Go engine for rule validation
        this.engine = new GoEngine(this.boardSize);
        this.engine.board = this.gameState;
        
        this.board = new GoBoard('go-board', this.boardSize);
        this.board.addClickListener((r, c) => this.handleMove(r, c));
        
        document.getElementById('btnUndo')?.addEventListener('click', () => this.undo());
        document.getElementById('btnResign')?.addEventListener('click', () => this.resign());
        document.getElementById('btnPass')?.addEventListener('click', () => this.pass());
        
        document.getElementById('boardSize')?.addEventListener('change', (e) => this.resetGame());
        
        console.log("Game initialized", this.gameId);
        
        setTimeout(() => {
            if (window.aiCompanion) {
                window.aiCompanion.speak("opening");
            }
        }, 1000);
    }

    handleMove(row, col) {
        if (this.isGameOver || this.feynmanMode) return;
        if (this.gameState[row][col] !== 0) return;

        // Use the engine for rule validation
        const result = this.engine.isValidMove(row, col, this.currentPlayer, this.engine.koState);
        if (!result.valid) {
            console.warn('Invalid move:', result.reason);
            return;
        }
        
        const { newBoard, captured, koState } = this.engine.simulateMove(row, col, this.currentPlayer);
        this.engine.board = newBoard;
        this.gameState = newBoard;
        this.engine.koState = koState;

        this.history.push({
            player: this.currentPlayer,
            row: row,
            col: col,
            board: JSON.parse(JSON.stringify(this.gameState))
        });

        if (captured.length > 0) {
            this.captures[this.currentPlayer] += captured.length;
            this.board.playCaptureAnimation(captured);
        }

        this.board.setBoard(this.gameState);
        this.board.setLastMove(row, col);
        this.board.playPlaceAnimation(row, col);
        
        this.currentPlayer = 3 - this.currentPlayer;
        this.updateUI();

        if (this.aiEnabled && this.currentPlayer === 2 && !this.isGameOver) {
            setTimeout(() => this.makeAIMove(), 600);
        }
    }

    placeStone(row, col, player) {
        const tempBoard = JSON.parse(JSON.stringify(this.gameState));
        tempBoard[row][col] = player;

        const captures = this.checkCaptures(tempBoard, row, col, player);
        if (captures.length > 0) {
            captures.forEach(([r, c]) => {
                tempBoard[r][c] = 0;
            });
            this.captures[player] += captures.length;
            this.board.playCaptureAnimation(captures);
        } else {
            if (!this.hasLiberties(tempBoard, row, col)) {
                return false;
            }
        }
        this.gameState = tempBoard;
        return true;
    }

    checkCaptures(board, row, col, player) {
        const opponent = 3 - player;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let allCaptures = [];

        directions.forEach(([dr, dc]) => {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                if (board[r][c] === opponent) {
                    if (!this.hasLiberties(board, r, c)) {
                        allCaptures = allCaptures.concat(this.getGroup(board, r, c));
                    }
                }
            }
        });
        return allCaptures;
    }

    hasLiberties(board, row, col) {
        const group = this.getGroup(board, row, col);
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [r, c] of group) {
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                    if (board[nr][nc] === 0) return true;
                }
            }
        }
        return false;
    }

    getGroup(board, row, col) {
        const color = board[row][col];
        const group = [];
        const queue = [[row, col]];
        const visited = new Set();
        visited.add(`${row},${col}`);

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            group.push([r, c]);

            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                    const key = `${nr},${nc}`;
                    if (board[nr][nc] === color && !visited.has(key)) {
                        visited.add(key);
                        queue.push([nr, nc]);
                    }
                }
            }
        }
        return group;
    }

    async makeAIMove() {
        if (this.isGameOver) return;
        if (window.aiCompanion) window.aiCompanion.setThinking(true);
        
        const triggerFeynman = Math.random() < 0.15;
        
        if (triggerFeynman) {
            const lastMove = this.history[this.history.length - 1];
            const optimalMove = this.findBetterMove(lastMove.row, lastMove.col);
            if (window.aiCompanion) window.aiCompanion.setThinking(false);
            this.startFeynmanMode(lastMove.row, lastMove.col, optimalMove.row, optimalMove.col);
            return;
        }

        try {
            const response = await fetch('/api/game/ai-move?difficulty=' + this.difficulty);
            const move = await response.json();
            if (move && move.row !== undefined && move.col !== undefined) {
                this.handleMove(move.row, move.col);
            }
        } catch (err) {
            console.error('AI move failed:', err);
            // Fallback to basic move
            const move = this.getBasicAIMove();
            if (move) this.handleMove(move.row, move.col);
        }
        
        if (window.aiCompanion) window.aiCompanion.setThinking(false);
    }

    getBasicAIMove() {
        const emptySpots = [];
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.gameState[r][c] === 0) emptySpots.push({ row: r, col: c });
            }
        }
        return emptySpots.length === 0 ? null : emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }

    findBetterMove(row, col) {
        const center = Math.floor(this.boardSize / 2);
        return { row: center, col: center };
    }

    updateUI() {
        const blackCaptures = document.getElementById('blackCaptures');
        const whiteCaptures = document.getElementById('whiteCaptures');
        if (blackCaptures) blackCaptures.innerText = this.captures[1];
        if (whiteCaptures) whiteCaptures.innerText = this.captures[2];
        
        const currentTurn = document.getElementById('currentTurn');
        if (currentTurn) {
            currentTurn.innerText = this.currentPlayer === 1 ? '黑棋' : '白棋';
            currentTurn.className = 'player-name ' + (this.currentPlayer === 1 ? 'black' : 'white');
        }
    }

    undo() {
        if (this.history.length < 2) return;
        this.history.pop();
        this.history.pop();
        const lastState = this.history.length > 0 ? 
            this.history[this.history.length - 1].board : 
            Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(0));
        
        this.gameState = JSON.parse(JSON.stringify(lastState));
        this.engine.board = this.gameState;
        this.engine.koState = null;
        this.board.setBoard(this.gameState);
        this.board.clearLastMove();
        this.currentPlayer = 1;
        this.updateUI();
    }

    resign() {
        this.isGameOver = true;
        alert("认输成功，白中盘胜。");
    }

    pass() {
        this.currentPlayer = 3 - this.currentPlayer;
        this.updateUI();
        if (this.aiEnabled && this.currentPlayer === 2) setTimeout(() => this.makeAIMove(), 600);
    }

    resetGame() { this.init(); }

    startFeynmanMode(suboptimalRow, suboptimalCol, optimalRow, optimalCol) {
        this.feynmanMode = true;
        this.feynmanSuboptimalMove = { suboptimal: [suboptimalRow, suboptimalCol], optimal: [optimalRow, optimalCol] };
        this.feynmanCountdown = 10;
        
        const wrapper = document.getElementById('boardWrapper');
        if (wrapper) {
            wrapper.classList.add('feynman-active');
            setTimeout(() => wrapper.classList.remove('feynman-active'), 1000);
        }
        
        const banner = document.getElementById('feynmanBanner');
        if (banner) {
            banner.style.display = 'flex';
            const countdownEl = document.getElementById('feynmanTimer');
            if (countdownEl) countdownEl.innerText = this.feynmanCountdown;
        }

        if (window.aiCompanion) window.aiCompanion.speak("feynman_start");

        this.feynmanTimer = setInterval(() => {
            this.feynmanCountdown--;
            const countdownEl = document.getElementById('feynmanTimer');
            if (countdownEl) countdownEl.innerText = this.feynmanCountdown;
            if (this.feynmanCountdown <= 0) this.exitFeynmanMode();
        }, 1000);
    }

    exitFeynmanMode() {
        clearInterval(this.feynmanTimer);
        this.feynmanMode = false;
        const banner = document.getElementById('feynmanBanner');
        if (banner) banner.style.display = 'none';
        if (window.board) window.board.clearFeynmanMarks();
        const move = this.getBasicAIMove();
        if (move) this.handleMove(move.row, move.col);
    }

    triggerSocraticQuestion() {
        if (!this.feynmanMode) return;
        const questions = [
            { type: 'goal', question: '在棋盘上红色标记的位置落子，你想要达到什么目的？', focus: [4, 4] },
            { type: 'consequence', question: '如果对手在红色标记的位置落子，你觉得会发生什么？', focus: [4, 5] },
            { type: 'compare', question: '红色标记的两个位置，哪个更好？为什么？', focus: [[4, 4], [4, 6]] },
            { type: 'reverse', question: '如果你是黑棋，在红色标记的位置会怎么下？', focus: [3, 4] }
        ];

        const q = questions[Math.floor(Math.random() * questions.length)];
        clearInterval(this.feynmanTimer);
        if (q.focus) {
            if (Array.isArray(q.focus[0])) this.board.setSocraticFocus(q.focus[0][0], q.focus[0][1]);
            else this.board.setSocraticFocus(q.focus[0], q.focus[1]);
        }

        if (window.aiCompanion) {
            window.aiCompanion.askSocratic(q, (answer) => { this.exitFeynmanMode(); });
        }
    }
}

window.GoGame = GoGame;
