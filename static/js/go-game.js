/**
 * 围棋游戏 - Phase 1 增强版
 * 集成 AI Coach 系统
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
        this.undoUsed = false;
        
        // AI 设置
        this.aiEnabled = options.aiEnabled || false;
        this.aiDifficulty = options.aiDifficulty || 'medium';
        this.aiColor = options.aiColor || WHITE;
        
        // AI 棋伴
        this.companion = new AICompanion(options.companionType || 'adai');
        
        // 创建棋盘
        this.boardSize = options.boardSize || BOARD_SIZE;
        this.boardView = new GoBoard('go-board', this.boardSize);
        this.boardView.addClickListener((row, col) => {
            this.handleMove(row, col);
        });
        
        this.updateUI();
        this.updateCompanion();
        
        // 显示开场白
        setTimeout(() => {
            this.companion.showBubble('normal');
        }, 500);
    }
    
    createEmptyBoard() {
        const b = [];
        for (let i = 0; i < this.boardSize; i++) {
            b.push(new Array(this.boardSize).fill(EMPTY));
        }
        return b;
    }
    
    handleMove(row, col) {
        if (this.gameOver) return;
        
        // AI 回合不响应
        if (this.aiEnabled && this.currentPlayer === this.aiColor) return;
        
        const success = this.makeMove(row, col);
        if (success) {
            this.triggerCompanionFeedback(row, col);
            
            // AI 回合
            if (this.aiEnabled && !this.gameOver) {
                setTimeout(() => this.aiTurn(), 500);
            }
        }
    }
    
    makeMove(row, col) {
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) return false;
        if (this.board[row][col] !== EMPTY) {
            this.showToast('已有棋子');
            return false;
        }
        
        // 检查禁着（自杀）
        if (this.isSuicide(row, col, this.currentPlayer)) {
            this.showToast('禁着点，不能落子');
            return false;
        }
        
        // 提子
        const captured = this.checkCaptures(this.currentPlayer === BLACK ? WHITE : BLACK);
        
        // 执行落子
        this.board[row][col] = this.currentPlayer;
        
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
    
    isSuicide(row, col, player) {
        // 临时落子
        this.board[row][col] = player;
        
        // 检查是否能提子
        const opponent = player === BLACK ? WHITE : BLACK;
        const captures = this.checkCaptures(opponent);
        
        // 检查自己是否有气
        const ownGroup = this.getGroup(row, col);
        const ownLibs = this.getLiberties(ownGroup);
        
        this.board[row][col] = EMPTY;
        
        // 如果能提子，则允许（提子后必有气）
        if (captures.length > 0) return false;
        
        // 如果没提子，则检查自己是否有气
        return ownLibs.size === 0;
    }
    
    checkCaptures(player) {
        const captured = [];
        const checked = new Set();
        
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
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
                if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
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
                if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
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
        this.companion.showBubble('thinking');
        
        setTimeout(() => {
            const ai = new GoAI(this, this.aiDifficulty);
            const move = ai.getMove();
            
            if (move) {
                this.makeMove(move[0], move[1]);
                this.triggerCompanionFeedback(move[0], move[1]);
            } else {
                this.pass();
            }
        }, 800 + Math.random() * 700);
    }
    
    triggerCompanionFeedback(row, col) {
        if (!this.aiEnabled) return;
        
        const lastMove = this.moves[this.moves.length - 1];
        if (!lastMove) return;
        
        // 检查是否被吃子
        if (lastMove.captured > 0) {
            if (lastMove.player === this.aiColor) {
                this.companion.showBubble('capture');
            } else {
                this.companion.showBubble('mistake');
            }
            return;
        }
        
        // 开局（前10手）特殊反馈
        if (this.moves.length <= 10) {
            this.triggerOpeningFeedback(row, col);
            return;
        }
        
        // 随机正面反馈
        if (Math.random() > 0.6) {
            this.companion.showBubble('encourage');
        }
    }
    
    triggerOpeningFeedback(row, col) {
        // 检测占角
        const isCorner = (row < 3 || row > this.boardSize - 4) && 
                        (col < 3 || col > this.boardSize - 4);
        // 检测天元
        const center = Math.floor(this.boardSize / 2);
        const isCenter = Math.abs(row - center) <= 1 && Math.abs(col - center) <= 1;
        
        const context = {
            occupiedCorner: isCorner,
            centerFirst: isCenter,
            moveNumber: this.moves.length
        };
        
        this.companion.showBubble('opening');
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
        
        // 更新统计
        const won = (this.aiEnabled && this.aiColor === WHITE) || (!this.aiEnabled && this.currentPlayer === BLACK);
        this.companion.recordGameEnd(won);
        
        this.companion.showBubble(won ? 'lose' : 'win');
    }
    
    undo() {
        if (this.moves.length < 2) {
            this.showToast('没有可以悔的棋');
            return;
        }
        
        // 移除最后两步（用户+AI）
        for (let i = 0; i < 2; i++) {
            const lastMove = this.moves.pop();
            if (lastMove) {
                if (lastMove.player === BLACK) {
                    this.captures[BLACK] -= lastMove.captured;
                } else {
                    this.captures[WHITE] -= lastMove.captured;
                }
            }
        }
        
        // 重建棋盘
        this.board = this.createEmptyBoard();
        this.moves.forEach(m => {
            if (m.type !== 'pass') {
                this.board[m.row][m.col] = m.player;
            }
        });
        
        this.currentPlayer = this.moves.length > 0 ? 
            (this.moves[this.moves.length - 1].player === BLACK ? WHITE : BLACK) : BLACK;
        
        this.boardView.setBoard(this.board);
        this.updateUI();
        
        this.companion.recordUndo();
        this.companion.showBubble('encourage');
        this.showToast('已悔棋');
    }
    
    endGame() {
        this.gameOver = true;
        this.showToast('游戏结束！双方Pass');
        
        // 简单计算胜负
        const winner = this.currentPlayer === BLACK ? '白' : '黑';
        const won = (this.aiEnabled && this.aiColor === WHITE) || (!this.aiEnabled && this.currentPlayer === BLACK);
        this.companion.recordGameEnd(won);
        this.companion.showBubble(won ? 'lose' : 'win');
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
    
    updateCompanion() {
        const emojiEl = document.getElementById('ai-emoji');
        const nameEl = document.getElementById('ai-name');
        if (emojiEl) emojiEl.textContent = this.companion.emoji;
        if (nameEl) nameEl.textContent = this.companion.name;
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
        this.companion.showBubble('normal');
    }
}

// 全局函数
function initGame() {
    const difficulty = document.getElementById('aiDifficulty')?.value || 'none';
    const boardSize = parseInt(document.getElementById('boardSize')?.value || '19');
    const companionType = document.getElementById('companionType')?.value || 'adai';
    
    game = new GoGame({
        aiEnabled: difficulty !== 'none',
        aiDifficulty: difficulty || 'medium',
        boardSize: boardSize,
        companionType: companionType
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
function undo() { game && game.undo(); }

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGame, 200);
});
