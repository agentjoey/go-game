/**
 * 围棋游戏 - 简化版
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
        
        // 创建棋盘
        this.boardView = new GoBoard('board', BOARD_SIZE);
        this.boardView.addClickListener((row, col) => {
            console.log('Game received click:', row, col);
            this.handleMove(row, col);
        });
        
        this.updateUI();
        console.log('GoGame ready!');
    }
    
    createEmptyBoard() {
        const b = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            b.push(new Array(BOARD_SIZE).fill(EMPTY));
        }
        return b;
    }
    
    handleMove(row, col) {
        if (this.gameOver) {
            this.toast('游戏已结束');
            return;
        }
        this.makeMove(row, col);
    }
    
    makeMove(row, col) {
        console.log('makeMove:', row, col, 'player:', this.currentPlayer === BLACK ? '黑' : '白');
        
        // 验证
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            return;
        }
        
        if (this.board[row][col] !== EMPTY) {
            this.toast('已有棋子');
            return;
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
        
        // 记录
        const coord = this.boardView.coordToString(row, col);
        this.moves.push({ player: this.currentPlayer, row, col, coord });
        
        // 更新视图
        this.boardView.setBoard(this.board);
        this.boardView.setLastMove(row, col);
        
        // 换人
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.updateUI();
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
        this.moves.push({ player: this.currentPlayer, type: 'pass' });
        this.toast(`${this.currentPlayer === BLACK ? '黑' : '白'} Pass`);
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.updateUI();
    }
    
    resign() {
        this.gameOver = true;
        this.toast(`${this.currentPlayer === BLACK ? '白' : '黑'}获胜！`);
    }
    
    updateUI() {
        const stone = document.getElementById('currentStone');
        const player = document.getElementById('currentPlayer');
        if (stone) stone.textContent = this.currentPlayer === BLACK ? '⚫' : '⚪';
        if (player) player.textContent = this.currentPlayer === BLACK ? '黑方回合' : '白方回合';
        
        const blackCap = document.getElementById('blackCaptures');
        const whiteCap = document.getElementById('whiteCaptures');
        if (blackCap) blackCap.textContent = this.captures[BLACK];
        if (whiteCap) whiteCap.textContent = this.captures[WHITE];
        
        this.updateHistory();
    }
    
    updateHistory() {
        const el = document.getElementById('moveHistory');
        if (!el) return;
        
        if (this.moves.length === 0) {
            el.innerHTML = '<p class="text-muted small p-2">暂无记录</p>';
            return;
        }
        
        let html = '<div class="list-group list-group-flush" style="max-height:400px;overflow-y:auto;">';
        this.moves.forEach((m, i) => {
            const s = m.player === BLACK ? '⚫' : '⚪';
            const n = m.player === BLACK ? '黑' : '白';
            if (m.type === 'pass') {
                html += `<div class="list-group-item p-2">${i+1}. ${s} ${n} Pass</div>`;
            } else {
                html += `<div class="list-group-item p-2 d-flex justify-content-between">${i+1}. ${s} ${n}<span class="badge bg-secondary">${m.coord}</span></div>`;
            }
        });
        html += '</div>';
        el.innerHTML = html;
    }
    
    toast(msg) {
        const t = document.createElement('div');
        t.className = 'toast show';
        t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:16px 32px;border-radius:8px;font-size:18px;z-index:9999;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2000);
    }
    
    newGame() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.moves = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.gameOver = false;
        this.boardView.setBoard(this.board);
        this.boardView.clearLastMove();
        this.updateUI();
        this.toast('新游戏开始！');
    }
}

// 全局函数
function initGame() {
    console.log('initGame');
    game = new GoGame();
}

function newGame() { game && game.newGame(); }
function passTurn() { game && game.pass(); }
function resign() { game && game.resign(); }

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
    setTimeout(initGame, 200);
});
