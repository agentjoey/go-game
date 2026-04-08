/**
 * 围棋游戏逻辑
 */

// 游戏状态常量
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const BOARD_SIZE = 19;

// 方向向量
const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

class GoGame {
    constructor() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.moves = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.passes = 0;
        this.gameOver = false;
        this.aiEnabled = false;
        this.aiDifficulty = 'medium';
        this.aiColor = WHITE; // AI 执白
        this.lastKoPoint = null;
        
        this.boardView = new GoBoard('board', BOARD_SIZE);
        this.boardView.addClickListener((row, col) => this.handleClick(row, col));
        
        this.updateUI();
    }

    createEmptyBoard() {
        return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    }

    handleClick(row, col) {
        if (this.gameOver) {
            this.showMessage('游戏已结束');
            return;
        }

        // 如果是 AI 回合，忽略点击
        if (this.aiEnabled && this.currentPlayer === this.aiColor) {
            return;
        }

        this.makeMove(row, col);
    }

    makeMove(row, col) {
        // 检查是否为空位
        if (this.board[row][col] !== EMPTY) {
            this.showMessage('该位置已有棋子');
            return false;
        }

        // 检查打劫规则
        if (this.lastKoPoint && this.lastKoPoint[0] === row && this.lastKoPoint[1] === col) {
            this.showMessage('打劫禁着');
            return false;
        }

        // 临时放置棋子
        this.board[row][col] = this.currentPlayer;

        // 检查自杀
        const ownGroup = this.getGroup(row, col);
        const ownLiberties = this.getLiberties(ownGroup);
        if (ownLiberties.size === 0) {
            // 检查是否能提对方的子
            this.board[row][col] = EMPTY;
            const captures = this.checkCaptures(this.currentPlayer === BLACK ? WHITE : BLACK);
            if (captures.length === 0) {
                this.showMessage('不能自杀');
                return false;
            }
            this.board[row][col] = this.currentPlayer;
        }

        // 提子
        const capturedStones = this.checkCaptures(this.currentPlayer === BLACK ? WHITE : BLACK);
        capturedStones.forEach(([r, c]) => {
            this.board[r][c] = EMPTY;
        });

        // 更新提子数
        if (this.currentPlayer === BLACK) {
            this.captures[BLACK] += capturedStones.length;
        } else {
            this.captures[WHITE] += capturedStones.length;
        }

        // 设置打劫点
        if (capturedStones.length === 1) {
            const capturedGroup = this.getGroup(capturedStones[0][0], capturedStones[0][1]);
            const capturedGroupLiberties = this.getLiberties(capturedGroup);
            if (capturedGroupLiberties.size === 1 && ownLiberties.size === 1) {
                this.lastKoPoint = capturedStones[0];
            } else {
                this.lastKoPoint = null;
            }
        } else {
            this.lastKoPoint = null;
        }

        // 记录棋谱
        const playerName = this.currentPlayer === BLACK ? '黑' : '白';
        const coord = this.boardView.coordToString(row, col);
        this.moves.push({
            player: this.currentPlayer,
            row: row,
            col: col,
            coord: coord,
            captures: capturedStones
        });

        // 更新视图
        this.boardView.setBoard(this.board);
        this.boardView.setLastMove(row, col);
        this.passes = 0;

        // 切换玩家
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.updateUI();

        // 如果是 AI 对战，触发 AI 回合
        if (this.aiEnabled && this.currentPlayer === this.aiColor && !this.gameOver) {
            setTimeout(() => this.aiMove(), 500);
        }

        return true;
    }

    checkCaptures(player) {
        const captured = [];
        const checked = new Set();

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === player) {
                    const key = `${row},${col}`;
                    if (!checked.has(key)) {
                        const group = this.getGroup(row, col);
                        const liberties = this.getLiberties(group);
                        if (liberties.size === 0) {
                            group.forEach(([r, c]) => {
                                if (!captured.some(([cr, cc]) => cr === r && cc === c)) {
                                    captured.push([r, c]);
                                }
                            });
                        }
                        group.forEach(([r, c]) => checked.add(`${r},${c}`));
                    }
                }
            }
        }

        return captured;
    }

    getGroup(row, col) {
        const player = this.board[row][col];
        if (player === EMPTY) return [];

        const group = [];
        const visited = new Set();
        const stack = [[row, col]];

        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r},${c}`;
            
            if (visited.has(key)) continue;
            if (this.board[r][c] !== player) continue;

            visited.add(key);
            group.push([r, c]);

            for (const [dr, dc] of DIRECTIONS) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    stack.push([nr, nc]);
                }
            }
        }

        return group;
    }

    getLiberties(group) {
        const liberties = new Set();

        for (const [row, col] of group) {
            for (const [dr, dc] of DIRECTIONS) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (this.board[nr][nc] === EMPTY) {
                        liberties.add(`${nr},${nc}`);
                    }
                }
            }
        }

        return liberties;
    }

    pass() {
        if (this.gameOver) return;

        const playerName = this.currentPlayer === BLACK ? '黑' : '白';
        this.showMessage(`${playerName} Pass`);
        
        this.passes++;
        if (this.passes >= 2) {
            this.endGame();
            return;
        }

        this.moves.push({
            player: this.currentPlayer,
            type: 'pass'
        });

        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.lastKoPoint = null;
        this.updateUI();

        if (this.aiEnabled && this.currentPlayer === this.aiColor) {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    resign() {
        if (this.gameOver) return;

        const winner = this.currentPlayer === BLACK ? '白' : '黑';
        this.gameOver = true;
        this.showMessage(`黑方认输，${winner}方获胜！`);
    }

    endGame() {
        this.gameOver = true;
        this.calculateScore();
    }

    calculateScore() {
        // 简化版：计算地盘
        let blackTerritory = 0;
        let whiteTerritory = 0;

        const visited = new Set();

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === EMPTY && !visited.has(`${row},${col}`)) {
                    const territory = this.floodFillTerritory(row, col, visited);
                    if (territory.owner === BLACK) {
                        blackTerritory += territory.count;
                    } else if (territory.owner === WHITE) {
                        whiteTerritory += territory.count;
                    }
                }
            }
        }

        const blackScore = blackTerritory + this.captures[BLACK];
        const whiteScore = whiteTerritory + this.captures[WHITE] + 6.5; // 贴目

        this.showMessage(`黑方：${blackTerritory} 地 + ${this.captures[BLACK]} 提子 = ${blackScore.toFixed(1)}`);
        this.showMessage(`白方：${whiteTerritory} 地 + ${this.captures[WHITE]} 提子 + 6.5 贴目 = ${whiteScore.toFixed(1)}`);

        if (blackScore > whiteScore) {
            this.showMessage('黑方获胜！');
        } else {
            this.showMessage('白方获胜！');
        }
    }

    floodFillTerritory(startRow, startCol, visited) {
        const territory = [];
        const stack = [[startRow, startCol]];
        let blackBorder = false;
        let whiteBorder = false;

        while (stack.length > 0) {
            const [row, col] = stack.pop();
            const key = `${row},${col}`;

            if (visited.has(key)) continue;

            if (this.board[row][col] === BLACK) {
                blackBorder = true;
                continue;
            }
            if (this.board[row][col] === WHITE) {
                whiteBorder = true;
                continue;
            }

            visited.add(key);
            territory.push([row, col]);

            for (const [dr, dc] of DIRECTIONS) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    stack.push([nr, nc]);
                }
            }
        }

        let owner = EMPTY;
        if (blackBorder && !whiteBorder) owner = BLACK;
        if (whiteBorder && !blackBorder) owner = WHITE;

        return { count: territory.length, owner };
    }

    aiMove() {
        const validMoves = this.getValidMoves();
        if (validMoves.length === 0) {
            this.pass();
            return;
        }

        let move;
        switch (this.aiDifficulty) {
            case 'easy':
                move = this.aiMoveEasy(validMoves);
                break;
            case 'medium':
                move = this.aiMoveMedium(validMoves);
                break;
            case 'hard':
                move = this.aiMoveHard(validMoves);
                break;
            default:
                move = validMoves[Math.floor(Math.random() * validMoves.length)];
        }

        if (move) {
            this.makeMove(move[0], move[1]);
        }
    }

    getValidMoves() {
        const moves = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board[row][col] === EMPTY) {
                    // 简单检查：不是打劫禁着点
                    if (!this.lastKoPoint || this.lastKoPoint[0] !== row || this.lastKoPoint[1] !== col) {
                        moves.push([row, col]);
                    }
                }
            }
        }
        return moves;
    }

    aiMoveEasy(moves) {
        // 随机选择
        return moves[Math.floor(Math.random() * moves.length)];
    }

    aiMoveMedium(moves) {
        // 简单评估：优先吃子、增加自己的气
        let bestMove = moves[0];
        let bestScore = -Infinity;

        for (const [row, col] of moves) {
            let score = 0;
            
            // 检查是否能吃子
            this.board[row][col] = this.aiColor;
            const captures = this.checkCaptures(this.aiColor === BLACK ? WHITE : BLACK);
            score += captures.length * 100;
            this.board[row][col] = EMPTY;

            // 增加自己的气
            const group = this.getGroupWithMove(row, col, this.aiColor);
            const liberties = this.countLibertiesForGroup(group);
            score += liberties * 5;

            // 连接己方棋子
            for (const [dr, dc] of DIRECTIONS) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (this.board[nr][nc] === this.aiColor) {
                        score += 3;
                    }
                }
            }

            // 添加随机性
            score += Math.random() * 10;

            if (score > bestScore) {
                bestScore = score;
                bestMove = [row, col];
            }
        }

        return bestMove;
    }

    aiMoveHard(moves) {
        // 增强版评估
        let bestMove = moves[0];
        let bestScore = -Infinity;

        for (const [row, col] of moves) {
            let score = 0;

            // 吃子分数
            this.board[row][col] = this.aiColor;
            const captures = this.checkCaptures(this.aiColor === BLACK ? WHITE : BLACK);
            score += captures.length * 100;
            this.board[row][col] = EMPTY;

            // 增加自己的气
            const group = this.getGroupWithMove(row, col, this.aiColor);
            const liberties = this.countLibertiesForGroup(group);
            score += liberties * 5;

            // 连接己方棋子
            for (const [dr, dc] of DIRECTIONS) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (this.board[nr][nc] === this.aiColor) {
                        score += 3;
                    }
                }
            }

            // 防守：救自己的危险棋子
            for (const [dr, dc] of DIRECTIONS) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (this.board[nr][nc] === this.aiColor) {
                        const friendGroup = this.getGroup(nr, nc);
                        const friendLibs = this.getLiberties(friendGroup);
                        if (friendLibs.size === 1) {
                            score += 50; // 救危险棋子高分
                        }
                    }
                }
            }

            // 角部优先
            if (row < 4 || row > 14 || col < 4 || col > 14) {
                score += 2;
            }

            // 星位优先
            const starPoints = [[3,3], [3,9], [3,15], [9,3], [9,9], [9,15], [15,3], [15,9], [15,15]];
            if (starPoints.some(([r, c]) => r === row && c === col)) {
                score += 5;
            }

            // 添加随机性
            score += Math.random() * 5;

            if (score > bestScore) {
                bestScore = score;
                bestMove = [row, col];
            }
        }

        return bestMove;
    }

    getGroupWithMove(row, col, player) {
        const group = [[row, col]];
        const visited = new Set([`${row},${col}`]);
        const stack = [[row, col]];

        while (stack.length > 0) {
            const [r, c] = stack.pop();
            for (const [dr, dc] of DIRECTIONS) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;
                if (!visited.has(key) && this.board[nr] && this.board[nr][nc] === player) {
                    visited.add(key);
                    group.push([nr, nc]);
                    stack.push([nr, nc]);
                }
            }
        }

        return group;
    }

    countLibertiesForGroup(group) {
        const liberties = new Set();
        for (const [row, col] of group) {
            for (const [dr, dc] of DIRECTIONS) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (this.board[nr][nc] === EMPTY) {
                        liberties.add(`${nr},${nc}`);
                    }
                }
            }
        }
        return liberties.size;
    }

    updateUI() {
        // 更新当前玩家
        const stoneIndicator = document.getElementById('currentStone');
        const playerText = document.getElementById('currentPlayer');
        if (stoneIndicator && playerText) {
            stoneIndicator.textContent = this.currentPlayer === BLACK ? '⚫' : '⚪';
            playerText.textContent = this.currentPlayer === BLACK ? '黑方回合' : '白方回合';
        }

        // 更新提子数
        const blackCaptures = document.getElementById('blackCaptures');
        const whiteCaptures = document.getElementById('whiteCaptures');
        if (blackCaptures) blackCaptures.textContent = this.captures[BLACK];
        if (whiteCaptures) whiteCaptures.textContent = this.captures[WHITE];

        // 更新棋谱
        this.updateMoveHistory();
    }

    updateMoveHistory() {
        const historyDiv = document.getElementById('moveHistory');
        if (!historyDiv) return;

        if (this.moves.length === 0) {
            historyDiv.innerHTML = '<p class="text-muted small">暂无落子记录</p>';
            return;
        }

        let html = '<div class="list-group list-group-flush">';
        this.moves.forEach((move, index) => {
            const playerName = move.player === BLACK ? '黑' : '白';
            const stone = move.player === BLACK ? '⚫' : '⚪';
            
            if (move.type === 'pass') {
                html += `<div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${index + 1}. ${stone} ${playerName} Pass</span>
                </div>`;
            } else {
                html += `<div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${index + 1}. ${stone} ${playerName}</span>
                    <span class="badge bg-secondary">${move.coord}</span>
                </div>`;
            }
        });
        html += '</div>';
        historyDiv.innerHTML = html;
    }

    showMessage(message) {
        // 创建 toast 提示
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `<div class="toast-body">${message}</div>`;
        
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    newGame(aiEnabled = false, difficulty = 'medium') {
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.moves = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.passes = 0;
        this.gameOver = false;
        this.aiEnabled = aiEnabled;
        this.aiDifficulty = difficulty;
        this.lastKoPoint = null;

        this.boardView.setBoard(this.board);
        this.boardView.clearLastMove();
        this.updateUI();

        if (this.aiEnabled && this.aiColor === WHITE) {
            // AI 执白，等待玩家先手
        }
    }

    saveToSGF() {
        let sgf = '(;GM[1]SZ[19]';
        
        this.moves.forEach(move => {
            const color = move.player === BLACK ? 'B' : 'W';
            if (move.type === 'pass') {
                sgf += `;${color}[]`;
            } else {
                const col = String.fromCharCode(97 + move.col); // SGF 使用 a-t
                const row = String.fromCharCode(97 + move.row);
                sgf += `;${color}[${col}${row}]`;
            }
        });

        sgf += ')';
        return sgf;
    }

    loadFromSGF(sgf) {
        // 简化版：只支持基本格式
        // TODO: 实现完整 SGF 解析
        console.log('SGF 加载功能待实现');
    }
}

// 全局函数
let game;

function initGame() {
    game = new GoGame();
}

function newGame() {
    const difficulty = document.getElementById('aiDifficulty')?.value || 'none';
    const aiEnabled = difficulty !== 'none';
    game.newGame(aiEnabled, difficulty);
}

function passTurn() {
    game.pass();
}

function resign() {
    game.resign();
}

function undoMove() {
    // TODO: 实现悔棋
    game.showMessage('悔棋功能待实现');
}

function saveGame() {
    const sgf = game.saveToSGF();
    const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `go_game_${Date.now()}.sgf`;
    a.click();
    URL.revokeObjectURL(url);
    game.showMessage('棋谱已保存');
}

function showHint() {
    game.showMessage('提示功能待实现');
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initGame);
