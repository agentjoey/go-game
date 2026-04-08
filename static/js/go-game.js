/**
 * 围棋游戏逻辑 - 简化版 MVP
 */

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const BOARD_SIZE = 19;

let game = null;

class GoGame {
    constructor() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.moves = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.gameOver = false;
        this.aiEnabled = false;
        this.aiDifficulty = 'medium';
        this.lastKo = null;
        
        // 初始化棋盘
        this.boardView = new GoBoard('board', BOARD_SIZE);
        this.boardView.addClickListener((row, col) => this.handleClick(row, col));
        
        this.updateUI();
        console.log('GoGame initialized');
    }
    
    createEmptyBoard() {
        const b = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            b.push(new Array(BOARD_SIZE).fill(EMPTY));
        }
        return b;
    }
    
    handleClick(row, col) {
        if (this.gameOver) {
            this.showToast('游戏已结束');
            return;
        }
        this.makeMove(row, col);
    }
    
    makeMove(row, col) {
        console.log('makeMove:', row, col, 'player:', this.currentPlayer);
        
        // 检查空位
        if (this.board[row][col] !== EMPTY) {
            this.showToast('该位置已有棋子');
            return false;
        }
        
        // 检查打劫
        if (this.lastKo && this.lastKo[0] === row && this.lastKo[1] === col) {
            this.showToast('打劫禁着');
            return false;
        }
        
        // 落子
        this.board[row][col] = this.currentPlayer;
        
        // 提子
        const captured = this.checkCaptures(this.currentPlayer === BLACK ? WHITE : BLACK);
        captured.forEach(([r, c]) => {
            this.board[r][c] = EMPTY;
        });
        
        // 更新提子数
        if (this.currentPlayer === BLACK) {
            this.captures[BLACK] += captured.length;
        } else {
            this.captures[WHITE] += captured.length;
        }
        
        // 记录棋谱
        const coord = this.boardView.coordToString(row, col);
        this.moves.push({
            player: this.currentPlayer,
            row: row,
            col: col,
            coord: coord,
            captured: captured
        });
        
        // 更新视图
        this.boardView.setBoard(this.board);
        this.boardView.setLastMove(row, col);
        
        // 切换玩家
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.updateUI();
        
        return true;
    }
    
    checkCaptures(player) {
        const captured = [];
        const checked = new Set();
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.board[r][c] === player) {
                    const key = `${r},${c}`;
                    if (!checked.has(key)) {
                        const group = this.getGroup(r, c);
                        const libs = this.getLiberties(group);
                        if (libs.size === 0) {
                            group.forEach(([gr, gc]) => {
                                if (!captured.some(([cr, cc]) => cr === gr && cc === gc)) {
                                    captured.push([gr, gc]);
                                }
                            });
                        }
                        group.forEach(([gr, gc]) => checked.add(`${gr},${gc}`));
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
            
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    stack.push([nr, nc]);
                }
            });
        }
        return group;
    }
    
    getLiberties(group) {
        const libs = new Set();
        group.forEach(([r, c]) => {
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (this.board[nr][nc] === EMPTY) {
                        libs.add(`${nr},${nc}`);
                    }
                }
            });
        });
        return libs;
    }
    
    pass() {
        if (this.gameOver) return;
        this.moves.push({ player: this.currentPlayer, type: 'pass' });
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.showToast(`${this.currentPlayer === BLACK ? '黑' : '白'}方 Pass`);
        this.updateUI();
    }
    
    resign() {
        this.gameOver = true;
        const winner = this.currentPlayer === BLACK ? '白' : '黑';
        this.showToast(`${winner}方获胜！`);
    }
    
    updateUI() {
        // 更新当前玩家
        const stone = document.getElementById('currentStone');
        const player = document.getElementById('currentPlayer');
        if (stone) stone.textContent = this.currentPlayer === BLACK ? '⚫' : '⚪';
        if (player) player.textContent = this.currentPlayer === BLACK ? '黑方回合' : '白方回合';
        
        // 更新提子
        const blackCap = document.getElementById('blackCaptures');
        const whiteCap = document.getElementById('whiteCaptures');
        if (blackCap) blackCap.textContent = this.captures[BLACK];
        if (whiteCap) whiteCap.textContent = this.captures[WHITE];
        
        // 更新历史
        this.updateHistory();
    }
    
    updateHistory() {
        const history = document.getElementById('moveHistory');
        if (!history) return;
        
        if (this.moves.length === 0) {
            history.innerHTML = '<p class="text-muted small">暂无落子记录</p>';
            return;
        }
        
        let html = '<div style="max-height:400px;overflow-y:auto;">';
        this.moves.forEach((m, i) => {
            const stone = m.player === BLACK ? '⚫' : '⚪';
            const name = m.player === BLACK ? '黑' : '白';
            if (m.type === 'pass') {
                html += `<div class="p-2 border-bottom">${i+1}. ${stone} ${name} Pass</div>`;
            } else {
                html += `<div class="p-2 border-bottom d-flex justify-content-between">${i+1}. ${stone} ${name}<span class="badge bg-secondary">${m.coord}</span></div>`;
            }
        });
        html += '</div>';
        history.innerHTML = html;
    }
    
    showToast(msg) {
        let toast = document.createElement('div');
        toast.className = 'toast show';
        toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#333;color:#fff;padding:20px 40px;border-radius:10px;z-index:9999;';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    newGame(aiEnabled = false, difficulty = 'medium') {
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.moves = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.gameOver = false;
        this.aiEnabled = aiEnabled;
        this.aiDifficulty = difficulty;
        this.lastKo = null;
        
        this.boardView.setBoard(this.board);
        this.boardView.clearLastMove();
        this.updateUI();
    }
}

// 全局函数
function initGame() {
    console.log('initGame called');
    game = new GoGame();
}

function newGame() {
    const diff = document.getElementById('aiDifficulty')?.value || 'none';
    game.newGame(diff !== 'none', diff);
}

function passTurn() {
    game.pass();
}

function resign() {
    game.resign();
}

function undoMove() {
    game.showToast('悔棋功能开发中');
}

function saveGame() {
    game.showToast('保存功能开发中');
}

function showHint() {
    game.showToast('提示功能开发中');
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    setTimeout(initGame, 100);
});
