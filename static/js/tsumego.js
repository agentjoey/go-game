/**
 * 死活题练习 - Phase 1 修复版
 * 集成 AI Coach 系统
 */

let puzzles = [];
let currentPuzzle = null;
let stats = { completed: 0, correct: 0, streak: 0, totalAttempts: 0 };
let tsumegoCoach = null;
let puzzleBoard = null;
let companion = null;

async function initTsumego() {
    // 初始化 AI 棋伴
    const companionType = localStorage.getItem('preferred_companion') || 'adai';
    companion = new AICompanion(companionType);
    tsumegoCoach = new TsumegoCoach(companion);
    
    // 初始化棋盘
    puzzleBoard = new GoBoard('tsumego-board', 9);
    puzzleBoard.addClickListener(handlePuzzleClick);
    
    // 加载题目
    await loadPuzzles();
    
    // 加载统计
    loadStats();
    
    // 绑定筛选事件
    document.getElementById('puzzleType')?.addEventListener('change', renderPuzzleList);
    document.getElementById('puzzleDifficulty')?.addEventListener('change', renderPuzzleList);
    
    // 显示欢迎语
    showWelcomeMessage();
}

function showWelcomeMessage() {
    const bubbleEl = document.getElementById('ai-bubble');
    if (bubbleEl) {
        bubbleEl.innerHTML = `<span class="emoji">${companion.emoji}</span> ${companion.getGreetingMessage()}`;
        bubbleEl.className = 'ai-bubble show';
        setTimeout(() => bubbleEl.classList.remove('show'), 3000);
    }
}

async function loadPuzzles() {
    puzzles = [
        // 入门级 - 吃子
        {
            id: 1, title: '角上吃子', type: 'kill', difficulty: 'easy',
            description: '黑先，吃掉白棋',
            goal: '白棋围成了一个方形，只有2口气。找到紧气的地方！',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,2,2,2,0,0,0,0],
                [0,0,2,0,2,0,0,0,0],
                [0,0,2,2,2,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[3,3]],
            hint: '白棋中间是空的，从这里进攻！'
        },
        {
            id: 2, title: '门吃', type: 'kill', difficulty: 'easy',
            description: '黑先，一步吃子',
            goal: '白棋只有3口气，找到紧气点！',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,2,2,0,0,0,0],
                [0,0,0,2,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,3]],
            hint: '挡住白棋的逃跑路线！'
        },
        {
            id: 3, title: '枷吃', type: 'kill', difficulty: 'easy',
            description: '黑先，枷吃白棋',
            goal: '白棋正在逃跑，拦住它！',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,2,0,0,0,0,0],
                [0,0,0,0,2,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,3]],
            hint: '在白棋逃跑方向的空格落子！'
        },
        // 入门级 - 做活
        {
            id: 4, title: '做出两眼', type: 'live', difficulty: 'easy',
            description: '黑先，做出两只眼',
            goal: '黑棋被围，需要做出两只眼才能活！眼是由空格围成的。',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,1,1,1,1,1,0,0],
                [0,0,1,0,0,0,1,0,0],
                [0,0,1,0,0,0,1,0,0],
                [0,0,1,0,0,0,1,0,0],
                [0,0,1,1,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,4]],
            hint: '在黑棋内部的中心落子，分隔出两个空间！'
        },
        {
            id: 5, title: '扩大眼位', type: 'live', difficulty: 'easy',
            description: '黑先，扩大眼位做活',
            goal: '黑棋需要更多空间来做眼！',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,1,0,1,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,4]],
            hint: '占据中心位置，扩大黑棋的生存空间！'
        },
        // 初级 - 对杀
        {
            id: 6, title: '紧气', type: 'capture', difficulty: 'medium',
            description: '黑先，对杀谁先紧气？',
            goal: '黑白双方互相包围，数数各有多少气？',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,2,2,0,0,0,0],
                [0,0,0,2,1,2,0,0,0],
                [0,0,0,2,1,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,3]],
            hint: '黑棋需要再紧一口气才能吃掉白棋！'
        },
        {
            id: 7, title: '接不归', type: 'kill', difficulty: 'medium',
            description: '黑先，让白棋接不归',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,2,2,2,0,0,0],
                [0,0,0,2,0,0,0,0,0],
                [0,0,0,2,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,4], [5,4]],
            hint: '点击白棋旁边的空格'
        },
        {
            id: 8, title: '滚打包收', type: 'capture', difficulty: 'medium',
            description: '黑先，滚打包收白棋',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,2,2,2,0,0,0,0],
                [0,0,2,1,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[5,3]],
            hint: '利用对方的断点'
        },
        // 更多题目...
        {
            id: 9, title: '倒扑', type: 'kill', difficulty: 'hard',
            description: '黑先，倒扑吃子',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,2,2,2,0,0,0],
                [0,0,0,2,1,2,0,0,0],
                [0,0,0,2,2,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[5,4]],
            hint: '牺牲一子换取更大收获'
        },
        {
            id: 10, title: '征子', type: 'kill', difficulty: 'hard',
            description: '黑先，征吃白棋',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,1,0,0,0,0],
                [0,0,0,0,0,2,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[5,4]],
            hint: '追着跑'
        }
    ];
    
    renderPuzzleList();
}

function renderPuzzleList() {
    const listEl = document.getElementById('puzzleList');
    const typeFilter = document.getElementById('puzzleType')?.value || 'all';
    const diffFilter = document.getElementById('puzzleDifficulty')?.value || 'all';

    let filtered = puzzles;
    if (typeFilter !== 'all') filtered = filtered.filter(p => p.type === typeFilter);
    if (diffFilter !== 'all') filtered = filtered.filter(p => p.difficulty === diffFilter);

    if (filtered.length === 0) {
        listEl.innerHTML = '<p class="empty-moves">没有符合条件的题目</p>';
        return;
    }

    const typeName = { kill: '吃子', live: '做活', capture: '对杀' };
    const diffName = { easy: '入门', medium: '初级', hard: '中级' };
    const diffClass = { easy: 'easy', medium: 'medium', hard: 'hard' };

    let html = '';
    filtered.forEach(p => {
        const active = currentPuzzle?.id === p.id ? 'active' : '';
        html += `<div class="puzzle-item ${active}" onclick="selectPuzzle(${p.id})">
            <div class="puzzle-info">
                <span class="puzzle-title">${p.title}</span>
                <span class="puzzle-desc">${p.description}</span>
            </div>
            <div class="puzzle-tags">
                <span class="tag tag-${p.type}">${typeName[p.type]}</span>
                <span class="tag tag-${diffClass[p.difficulty]}">${diffName[p.difficulty]}</span>
            </div>
        </div>`;
    });

    listEl.innerHTML = html;
}

function selectPuzzle(id) {
    currentPuzzle = puzzles.find(p => p.id === id);
    if (!currentPuzzle) return;

    tsumegoCoach.reset();
    document.getElementById('hintsLeft').textContent = tsumegoCoach.maxHints;
    document.getElementById('puzzleTitle').textContent = `第${id}题: ${currentPuzzle.title}`;
    
    // 显示描述和目标
    let descHtml = `<p><strong>${currentPuzzle.description}</strong></p>`;
    if (currentPuzzle.goal) {
        descHtml += `<p class="puzzle-goal">💡 ${currentPuzzle.goal}</p>`;
    }
    document.getElementById('puzzleDesc').innerHTML = descHtml;

    // 重置棋盘
    puzzleBoard.board = currentPuzzle.board.map(row => [...row]);
    puzzleBoard.render();
    
    // 更新AI气泡
    companion.showBubble('encourage');

    renderPuzzleList();
}

function handlePuzzleClick(row, col) {
    if (!currentPuzzle || !puzzleBoard) return;
    
    // 检查是否已落子
    if (puzzleBoard.board[row][col] !== 0) {
        showToast('这里已经有棋子了~', 'warning');
        return;
    }

    // 检查是否正解
    const isCorrect = currentPuzzle.solution.some(([r, c]) => r === row && c === col);
    
    if (isCorrect) {
        // 落子
        puzzleBoard.board[row][col] = 1;
        puzzleBoard.render();
        
        stats.completed++;
        stats.correct++;
        stats.streak++;
        stats.totalAttempts++;
        saveStats();
        updateStatsUI();
        
        // AI 反馈
        const msg = tsumegoCoach.onCorrect(currentPuzzle);
        showToast(msg, 'success');
        companion.showBubble('brilliant');
        
        setTimeout(nextPuzzle, 1500);
    } else {
        // 错误
        stats.totalAttempts++;
        stats.streak = 0;
        saveStats();
        updateStatsUI();
        
        const msg = tsumegoCoach.onWrong();
        showToast(msg, 'error');
    }
}

function showHint() {
    if (!currentPuzzle || !tsumegoCoach) return;
    
    const hint = tsumegoCoach.getHint(currentPuzzle);
    document.getElementById('hintsLeft').textContent = tsumegoCoach.maxHints - tsumegoCoach.hintsUsed;
    
    if (hint.coord) {
        // 标记提示位置
        puzzleBoard.board[hint.coord[0]][hint.coord[1]] = 3; // 3 = 提示标记
        puzzleBoard.render();
        setTimeout(() => {
            puzzleBoard.board[hint.coord[0]][hint.coord[1]] = 0;
            puzzleBoard.render();
        }, 2000);
    }
    
    showToast(hint.text, 'info');
    companion.showBubble('socratic');
}

function resetPuzzle() {
    if (!currentPuzzle || !puzzleBoard) return;
    puzzleBoard.board = currentPuzzle.board.map(row => [...row]);
    puzzleBoard.render();
    companion.recordUndo();
    companion.showBubble('encourage');
}

function nextPuzzle() {
    if (puzzles.length === 0) return;
    const idx = puzzles.findIndex(p => p.id === currentPuzzle?.id);
    const nextIdx = (idx + 1) % puzzles.length;
    selectPuzzle(puzzles[nextIdx].id);
}

function loadStats() {
    const saved = localStorage.getItem('tsumego_stats');
    if (saved) {
        const parsed = JSON.parse(saved);
        stats = { ...stats, ...parsed };
    }
    updateStatsUI();
}

function saveStats() {
    localStorage.setItem('tsumego_stats', JSON.stringify(stats));
}

function updateStatsUI() {
    document.getElementById('completedCount').textContent = stats.completed;
    document.getElementById('correctCount').textContent = stats.correct;
    document.getElementById('streakCount').textContent = stats.streak;
    const rate = stats.totalAttempts > 0 ? Math.round(stats.correct / stats.totalAttempts * 100) : 0;
    document.getElementById('accuracyRate').textContent = `${rate}%`;
}

function showToast(msg, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.tsumego-toast').forEach(t => t.remove());
    
    const colors = {
        success: 'rgba(90, 143, 90, 0.95)',
        error: 'rgba(196, 92, 72, 0.95)',
        info: 'rgba(90, 122, 156, 0.95)',
        warning: 'rgba(212, 160, 61, 0.95)'
    };
    
    const t = document.createElement('div');
    t.className = 'tsumego-toast show';
    t.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: #fff;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 15px;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        max-width: 90%;
        text-align: center;
        animation: toastSlideUp 0.3s ease;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    
    // Auto remove
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.3s';
        t.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => t.remove(), 300);
    }, 2000);
}

document.addEventListener('DOMContentLoaded', initTsumego);
