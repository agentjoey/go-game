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
        console.log('GoGame constructor starting...');
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.moves = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.gameOver = false;
        
        // 检查GoBoard类是否存在
        if (typeof GoBoard === 'undefined') {
            console.error('GoGame ERROR: GoBoard class not found! Make sure go-board.js is loaded first.');
            return;
        }
        
        // 创建棋盘
        console.log('GoGame: Creating GoBoard with containerId=go-board, size=', BOARD_SIZE);
        this.boardView = new GoBoard('go-board', BOARD_SIZE);
        
        if (!this.boardView.container) {
            console.error('GoGame ERROR: Board view failed to initialize - container not found');
            return;
        }
        
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
        const player = document.getElementById('current-player');
        if (player) {
            player.textContent = this.currentPlayer === BLACK ? '黑棋' : '白棋';
            player.className = 'turn-indicator ' + (this.currentPlayer === BLACK ? 'black' : 'white');
        }
        
        const blackCap = document.getElementById('black-captures');
        const whiteCap = document.getElementById('white-captures');
        if (blackCap) blackCap.textContent = this.captures[BLACK];
        if (whiteCap) whiteCap.textContent = this.captures[WHITE];
        
        this.updateHistory();
    }
    
    updateHistory() {
        const el = document.getElementById('moves-list');
        if (!el) return;
        
        if (this.moves.length === 0) {
            el.innerHTML = '<p class="empty-moves">暂无落子</p>';
            return;
        }
        
        let html = '';
        this.moves.forEach((m, i) => {
            const s = m.player === BLACK ? '⚫' : '⚪';
            const n = m.player === BLACK ? '黑' : '白';
            if (m.type === 'pass') {
                html += `<div class="move-item">${i+1}. ${s} ${n} 停一手</div>`;
            } else {
                html += `<div class="move-item">${i+1}. ${s} ${n} ${m.coord}</div>`;
            }
        });
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
