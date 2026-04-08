/**
 * 围棋游戏 - Phase 1 完善版
 */

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const BOARD_SIZE = 19;

let game = null;

class GoGame {
    constructor(options = {}) {
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.moves = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.gameOver = false;
        this.passes = 0;
        
        // AI 设置
        this.aiEnabled = options.aiEnabled || false;
        this.aiDifficulty = options.aiDifficulty || 'medium';
        this.aiColor = options.aiColor || WHITE;
        
        // AI 棋伴
        this.companion = new AICompanion(options.companionType || 'adai');
        
        // 创建棋盘
        this.boardView = new GoBoard('go-board', options.boardSize || BOARD_SIZE);
        this.boardView.addClickListener((row, col) => {
            this.handleMove(row, col);
        });
        
        this.updateUI();
        this.updateCompanion();
    }
    
    createEmptyBoard() {
        const b = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            b.push(new Array(BOARD_SIZE).fill(EMPTY));
        }
        return b;
    }
    
    handleMove(row, col) {
        if (this.gameOver) return;
        
        // AI 回合不响应
        if (this.aiEnabled && this.currentPlayer === this.aiColor) return;
        
        const success = this.makeMove(row, col);
        if (success) {
            // 检查是否触发 AI 反馈
            this.triggerCompanionFeedback(row, col);
            
            // 如果是 AI 对战，触发 AI 回合
            if (this.aiEnabled && !this.gameOver) {
                setTimeout(() => this.aiTurn(), 500);
            }
        }
    }
    
    makeMove(row, col) {
        // 验证坐标
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
        if (this.board[row][col] !== EMPTY) {
            this.showToast('已有棋子');
            return false;
        }
        
        // 临时落子
        this.board[row][col] = this.currentPlayer;
        
        // 检查自杀（提子后仍无气）
        const ownGroup = this.getGroup(row, col);
        const ownLibs = this.getLiberties(ownGroup);
        
        // 提子
        const captured = this.checkCaptures(this.currentPlayer === BLACK ? WHITE : BLACK);
        
        // 再次检查是否自杀
        this.board[row][col] = EMPTY;
        this.board[row][col] = this.currentPlayer;
        const afterCapture = this.getGroup(row, col);
        const afterLibs = this.getLiberties(afterCapture);
        
        if (afterLibs.size === 0 && captured.length === 0) {
            this.board[row][col] = EMPTY;
            this.showToast('禁着点，不能落子');
            return false;
        }
        
        // 执行落子
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
        this.moves.push({
            player: this.currentPlayer,
            row, col, coord,
            captured: captured.length
        });
        
        // 更新视图
        this.boardView.setBoard(this.board);
        this.boardView.setLastMove(row, col);
        
        // 换人
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.passes = 0;
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
    
    aiTurn() {
        if (this.gameOver || this.currentPlayer !== this.aiColor) return;
        
        // 显示思考中
        this.showCompanionBubble('thinking');
        
        setTimeout(() => {
            const ai = new GoAI(this, this.aiDifficulty);
            const move = ai.getMove();
            
            if (move) {
                this.makeMove(move[0], move[1]);
                this.triggerCompanionFeedback(move[0], move[1]);
            } else {
                this.pass();
            }
        }, 1000 + Math.random() * 500);
    }
    
    triggerCompanionFeedback(row, col) {
        // 简化反馈逻辑
        if (!this.aiEnabled) return;
        
        // 检查是否被吃子
        const lastMove = this.moves[this.moves.length - 1];
        if (lastMove && lastMove.captured > 0) {
            if (lastMove.player === this.aiColor) {
                this.showCompanionBubble('capture');
            } else {
                this.showCompanionBubble('bad');
            }
        } else {
            // 随机好反馈
            if (Math.random() > 0.7) {
                this.showCompanionBubble('good');
            }
        }
    }
    
    showCompanionBubble(type) {
        const msg = this.companion.showMessage(type);
        const bubbleEl = document.getElementById('ai-bubble');
        if (bubbleEl) {
            bubbleEl.innerHTML = `<span class="emoji">${this.companion.emoji}</span> ${msg}`;
            bubbleEl.className = `ai-bubble show ${type}`;
            setTimeout(() => {
                bubbleEl.classList.remove('show');
            }, 3000);
        }
    }
    
    updateCompanion() {
        const emojiEl = document.getElementById('ai-emoji');
        const nameEl = document.getElementById('ai-name');
        if (emojiEl) emojiEl.textContent = this.companion.emoji;
        if (nameEl) nameEl.textContent = this.companion.name;
    }
    
    pass() {
        if (this.gameOver) return;
        this.moves.push({ player: this.currentPlayer, type: 'pass' });
        this.passes++;
        this.showToast(`${this.currentPlayer === BLACK ? '黑' : '白'} Pass`);
        
        if (this.passes >= 2) {
            this.endGame();
            return;
        }
        
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.updateUI();
        
        if (this.aiEnabled && !this.gameOver) {
            setTimeout(() => this.aiTurn(), 500);
        }
    }
    
    resign() {
        if (this.gameOver) return;
        this.gameOver = true;
        const winner = this.currentPlayer === BLACK ? '白' : '黑';
        this.showToast(`${winner}方获胜！`);
        this.showCompanionBubble(this.currentPlayer === this.aiColor ? 'lose' : 'win');
    }
    
    endGame() {
        this.gameOver = true;
        this.showToast('游戏结束！');
    }
    
    updateUI() {
        // 当前玩家
        const stone = document.getElementById('currentStone');
        const player = document.getElementById('currentPlayer');
        if (stone) stone.textContent = this.currentPlayer === BLACK ? '⚫' : '⚪';
        if (player) player.textContent = this.currentPlayer === BLACK ? '黑方回合' : '白方回合';
        
        // 提子
        const blackCap = document.getElementById('blackCaptures');
        const whiteCap = document.getElementById('whiteCaptures');
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
                html += `<div class="move-item">${i+1}. ${s} ${n} Pass</div>`;
            } else {
                html += `<div class="move-item"><span class="move-num">${i+1}.</span> ${s} ${n} <span class="move-coord">${m.coord}</span></div>`;
            }
        });
        el.innerHTML = html;
    }
    
    showToast(msg) {
        const t = document.createElement('div');
        t.className = 'toast show';
        t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#fff;padding:16px 32px;border-radius:8px;font-size:18px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    }
    
    newGame() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.moves = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.gameOver = false;
        this.passes = 0;
        
        this.boardView.setBoard(this.board);
        this.boardView.clearLastMove();
        this.updateUI();
        
        this.showToast('新游戏开始！');
    }
}

// 全局函数
function initGame() {
    const difficulty = document.getElementById('aiDifficulty')?.value || 'none';
    const boardSize = parseInt(document.getElementById('boardSize')?.value || '19');
    const companion = document.getElementById('companionType')?.value || 'adai';
    
    game = new GoGame({
        aiEnabled: difficulty !== 'none',
        aiDifficulty: difficulty || 'medium',
        boardSize: boardSize,
        companionType: companion
    });
}

function newGame() {
    if (game) {
        const difficulty = document.getElementById('aiDifficulty')?.value || 'none';
        game.aiEnabled = difficulty !== 'none';
        game.aiDifficulty = difficulty || 'medium';
        game.newGame();
    }
}

function passTurn() { game && game.pass(); }
function resign() { game && game.resign(); }

// 页面加载
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGame, 200);
});
