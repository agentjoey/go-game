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

        // 费曼模式标记模式
        if (this.markingMode) {
            this.handleFeynmanMark(row, col);
            return;
        }

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
    
    // ==================== 费曼模式 ====================
    
    feynmanActive = false;
    feynmanTimer = null;
    feynmanCountdown = 10;
    feynmanSuboptimalMove = null; // AI的次优手下在这里
    markingMode = false;
    
    triggerFeynmanMode(suboptimalRow, suboptimalCol, optimalRow, optimalCol) {
        if (this.feynmanActive) return;
        
        this.feynmanActive = true;
        this.feynmanSuboptimalMove = { suboptimal: [suboptimalRow, suboptimalCol], optimal: [optimalRow, optimalCol] };
        this.feynmanCountdown = 10;
        
        // 1. 棋盘边缘闪烁金色边框
        const wrapper = document.getElementById('boardWrapper');
        if (wrapper) {
            wrapper.classList.add('feynman-active');
            setTimeout(() => wrapper.classList.remove('feynman-active'), 1000);
        }
        
        // 2. 显示费曼模式 banner
        const banner = document.getElementById('feynmanBanner');
        const actions = document.getElementById('feynmanActions');
        const controls = document.getElementById('boardControls');
        
        if (banner) {
            banner.style.display = 'flex';
            document.getElementById('feynmanText').textContent = '⚡ 费曼模式 - 找出AI的错误！';
        }
        if (actions) actions.style.display = 'flex';
        if (controls) controls.style.display = 'none';
        
        // 3. AI气泡示弱
        this.companion.showBubble('feynman');
        
        // 4. 在AI最后手上显示问号标记
        this.boardView.setQuestionMark(suboptimalRow, suboptimalCol);
        
        // 5. 开始倒计时
        this.startFeynmanTimer();
    }
    
    startFeynmanTimer() {
        const timerEl = document.getElementById('feynmanTimer');
        if (timerEl) {
            timerEl.textContent = `⏱️ ${this.feynmanCountdown}s`;
        }
        
        this.feynmanTimer = setInterval(() => {
            this.feynmanCountdown--;
            if (timerEl) {
                timerEl.textContent = `⏱️ ${this.feynmanCountdown}s`;
            }
            
            if (this.feynmanCountdown <= 0) {
                this.feynmanSkip();
            }
        }, 1000);
    }
    
    feynmanHint() {
        if (!this.feynmanActive) return;
        
        const optimal = this.feynmanSuboptimalMove?.optimal;
        if (!optimal) return;
        
        // 显示渐进式提示
        const [row, col] = optimal;
        const coord = this.boardView.coordToString(row, col);
        
        // 高亮提示区域
        this.boardView.highlightArea(row, col);
        
        // 根据难度给出不同层次的提示
        const hints = [
            '试着用另一种思路来思考这个问题~',
            `也许可以关注棋盘的这个区域：${coord}`,
            `正确答案是：${coord}，想想为什么？`
        ];
        
        const hintLevel = 3 - this.feynmanCountdown; // 剩余时间越少，提示越明确
        const hint = hints[Math.min(hintLevel, 2)];
        
        this.showToast(hint);
    }
    
    feynmanMarkBetter() {
        if (!this.feynmanActive) return;
        
        this.markingMode = true;
        this.boardView.setMarkingMode(true);
        
        // 显示提示
        const wrapper = document.getElementById('boardWrapper');
        if (wrapper) wrapper.classList.add('marking-mode');
        
        // 修改 banner 文字
        document.getElementById('feynmanText').textContent = '🎯 标记模式 - 点击你认为更好的位置';
        
        // 添加提示文字
        const hint = document.createElement('div');
        hint.className = 'marking-hint';
        hint.id = 'markingHint';
        hint.textContent = '点击棋盘上你认为比AI更好的位置';
        wrapper?.parentElement?.appendChild(hint);
    }
    
    handleFeynmanMark(row, col) {
        if (!this.markingMode || !this.feynmanActive) return false;
        
        const optimal = this.feynmanSuboptimalMove?.optimal;
        if (!optimal) return false;
        
        const [optRow, optCol] = optimal;
        const isCorrect = row === optRow && col === optCol;
        
        this.markingMode = false;
        this.boardView.setMarkingMode(false);
        
        const wrapper = document.getElementById('boardWrapper');
        if (wrapper) wrapper.classList.remove('marking-mode');
        
        document.getElementById('markingHint')?.remove();
        document.getElementById('feynmanText').textContent = isCorrect ? '🎉 正确！' : '❌ 不对哦~';
        
        if (isCorrect) {
            // 显示正确位置标记
            this.boardView.showCorrectMark(row, col);
            this.companion.showBubble('brilliant');
            this.companion.rapport += 10; // 增加羁绊值
            this.showToast('太棒了！你发现了AI的错误！羁绊值+10 💕');
        } else {
            // 显示AI的次优手标记
            this.companion.showBubble('encourage');
            this.showToast('再想想看~ 不着急');
        }
        
        // 3秒后结束费曼模式
        setTimeout(() => this.endFeynmanMode(), 2000);
        
        return true;
    }
    
    feynmanSkip() {
        if (!this.feynmanActive) return;
        
        clearInterval(this.feynmanTimer);
        this.endFeynmanMode();
        this.showToast('费曼模式已跳过');
    }
    
    endFeynmanMode() {
        if (!this.feynmanActive) return;

        this.feynmanActive = false;
        this.markingMode = false;
        clearInterval(this.feynmanTimer);

        // 隐藏UI
        const banner = document.getElementById('feynmanBanner');
        const actions = document.getElementById('feynmanActions');
        const controls = document.getElementById('boardControls');

        if (banner) banner.style.display = 'none';
        if (actions) actions.style.display = 'none';
        if (controls) controls.style.display = 'flex';

        // 清除标记
        this.boardView.clearFeynmanMarks();

        const wrapper = document.getElementById('boardWrapper');
        if (wrapper) wrapper.classList.remove('marking-mode', 'feynman-active');

        document.getElementById('markingHint')?.remove();
    }

    // ==================== 苏格拉底模式 ====================

    socraticActive = false;
    socraticQuestionType = 0;
    socraticQuestions = [
        {
            type: 'goal',
            question: '你想在这块棋达到什么目的？',
            options: [
                { text: '进攻', emoji: '⚔️' },
                { text: '防守', emoji: '🛡️' },
                { text: '围地', emoji: '🏔️' },
                { text: '切断', emoji: '✂️' }
            ]
        },
        {
            type: 'consequence',
            question: '如果对手在这里落子，会发生什么？',
            options: [
                { text: '被我吃掉', emoji: '😮' },
                { text: '逃跑成功', emoji: '🏃' },
                { text: '形成对杀', emoji: '⚔️' },
                { text: '我不确定', emoji: '🤔' }
            ]
        },
        {
            type: 'compare',
            question: '这两个位置，哪个更好？为什么？',
            highlight: [[4, 4], [4, 5]],
            options: [
                { text: '左边那个', emoji: '⬅️' },
                { text: '右边那个', emoji: '➡️' },
                { text: '差不多', emoji: '⚖️' }
            ]
        },
        {
            type: 'reverse',
            question: '如果你是黑棋，会怎么下？',
            options: [
                { text: '进攻这块', emoji: '⚔️' },
                { text: '防守自己的棋', emoji: '🛡️' },
                { text: '扩大地盘', emoji: '🏔️' }
            ]
        }
    ];

    triggerSocraticMode() {
        if (this.socraticActive || this.feynmanActive) return;

        this.socraticActive = true;
        this.socraticQuestionType = Math.floor(Math.random() * this.socraticQuestions.length);
        this.showSocraticQuestion();

        // 显示 UI
        const panel = document.getElementById('socraticPanel');
        const controls = document.getElementById('boardControls');
        if (panel) panel.style.display = 'block';
        if (controls) controls.style.display = 'none';

        // AI 气泡
        this.companion.showBubble('socratic');
    }

    showSocraticQuestion() {
        const q = this.socraticQuestions[this.socraticQuestionType];
        const titleEl = document.getElementById('socraticTitle');
        const questionEl = document.getElementById('socraticQuestion');
        const optionsEl = document.getElementById('socraticOptions');

        if (titleEl) titleEl.textContent = '苏格拉底模式 - 一起思考...';
        if (questionEl) questionEl.innerHTML = `<strong>${q.question}</strong>`;
        if (questionEl) questionEl.className = `socratic-question socratic-type-${q.type}`;

        // 高亮相关区域
        if (q.highlight) {
            q.highlight.forEach(([r, c]) => {
                this.boardView.highlightArea(r, c);
            });
        }

        // 渲染选项
        if (optionsEl) {
            let html = '';
            q.options.forEach((opt, i) => {
                html += `<div class="socratic-option" onclick="selectSocraticOption(${i})">
                    <span>${opt.emoji}</span><br>${opt.text}
                </div>`;
            });
            optionsEl.innerHTML = html;
        }
    }

    selectSocraticOption(index) {
        const q = this.socraticQuestions[this.socraticQuestionType];
        const opt = q.options[index];

        // 标记选中
        document.querySelectorAll('.socratic-option').forEach((el, i) => {
            if (i === index) el.classList.add('selected');
        });

        // AI 反馈
        const responses = [
            '这个角度很有趣！还有别的想法吗？',
            '有意思！能说说为什么这么选吗？',
            '很好！再想想还有没有其他可能？',
            '你的思路不错，试试从这个角度思考？'
        ];
        this.showToast(responses[Math.floor(Math.random() * responses.length)]);

        // 2秒后关闭
        setTimeout(() => this.endSocraticMode(), 2000);
    }

    socraticSkip() {
        this.endSocraticMode();
        this.showToast('随时可以继续思考哦~');
    }

    socraticVoiceInput() {
        // TODO: 实现语音输入
        this.showToast('语音功能开发中...');
    }

    endSocraticMode() {
        if (!this.socraticActive) return;

        this.socraticActive = false;

        // 隐藏 UI
        const panel = document.getElementById('socraticPanel');
        const controls = document.getElementById('boardControls');
        if (panel) panel.style.display = 'none';
        if (controls) controls.style.display = 'flex';

        // 清除高亮
        this.boardView.highlightCells = [];
        this.boardView.render();
    }

    // 长考检测 (30秒)
    thinkingStartTime = null;

    startThinkingTimer() {
        this.thinkingStartTime = Date.now();
        this.thinkingTimer = setInterval(() => {
            if (this.thinkingStartTime && Date.now() - this.thinkingStartTime > 30000) {
                // 长考超过30秒，提示苏格拉底模式
                if (!this.socraticActive && !this.feynmanActive) {
                    this.companion.showBubble('encourage');
                    const hint = document.createElement('div');
                    hint.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(90,122,156,0.95);color:#fff;padding:12px 24px;border-radius:24px;font-size:15px;z-index:9999;';
                    hint.textContent = '💡 思考太久了？试试点击"求助"按钮~';
                    document.body.appendChild(hint);
                    setTimeout(() => hint.remove(), 3000);
                }
                this.thinkingStartTime = null; // 只提示一次
            }
        }, 5000);
    }

    resetThinkingTimer() {
        this.thinkingStartTime = null;
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

// 费曼模式全局方法
function feynmanHint() { game && game.feynmanHint(); }
function feynmanMarkBetter() { game && game.feynmanMarkBetter(); }
function feynmanSkip() { game && game.feynmanSkip(); }

// 苏格拉底模式全局方法
function triggerSocraticMode() { game && game.triggerSocraticMode(); }
function selectSocraticOption(index) { game && game.selectSocraticOption(index); }
function socraticSkip() { game && game.socraticSkip(); }
function socraticVoiceInput() { game && game.socraticVoiceInput(); }

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGame, 200);
});
