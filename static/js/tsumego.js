/**
 * 死活题练习 - Phase 1 版
 */

let puzzles = [];
let currentPuzzle = null;
let hintsRemaining = 3;
let stats = { completed: 0, correct: 0, streak: 0 };
let puzzleBoard = null;

async function initTsumego() {
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
}

async function loadPuzzles() {
    // 内置题目
    puzzles = [
        {
            id: 1, title: '角上吃子', type: 'kill', difficulty: 'easy',
            description: '黑先吃白，一步即可',
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
            solution: [[3,3]]
        },
        {
            id: 2, title: '做活', type: 'live', difficulty: 'easy',
            description: '黑先，做出两只眼',
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
            solution: [[4,4]]
        },
        {
            id: 3, title: '紧气', type: 'capture', difficulty: 'easy',
            description: '黑先，紧气吃白',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,2,0,0,0,0],
                [0,0,0,2,1,2,0,0,0],
                [0,0,0,0,2,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,3]]
        },
        {
            id: 4, title: '接不归', type: 'kill', difficulty: 'medium',
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
            solution: [[4,4], [5,4]]
        },
        {
            id: 5, title: '对杀', type: 'capture', difficulty: 'medium',
            description: '黑先对杀，谁先动手？',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,1,0,2,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,4]]
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

    hintsRemaining = 3;
    document.getElementById('hintsLeft').textContent = hintsRemaining;
    document.getElementById('puzzleTitle').textContent = `第${id}题: ${currentPuzzle.title}`;
    document.getElementById('puzzleDesc').innerHTML = `<p>${currentPuzzle.description}</p>`;

    // 重置棋盘
    puzzleBoard.board = currentPuzzle.board.map(row => [...row]);
    puzzleBoard.render();
    puzzleBoard.addClickListener(handlePuzzleClick);

    renderPuzzleList();
}

function handlePuzzleClick(row, col) {
    if (!currentPuzzle || !puzzleBoard) return;

    const isCorrect = currentPuzzle.solution.some(([r, c]) => r === row && c === col);
    
    if (isCorrect) {
        // 放置棋子
        puzzleBoard.board[row][col] = 1;
        puzzleBoard.render();
        
        showToast('🎉 正确！', 'success');
        
        stats.completed++;
        stats.correct++;
        stats.streak++;
        saveStats();
        updateStatsUI();
        
        setTimeout(nextPuzzle, 1500);
    } else {
        showToast('再想想...', 'error');
        stats.streak = 0;
        saveStats();
        updateStatsUI();
    }
}

function showHint() {
    if (!currentPuzzle || hintsRemaining <= 0) return;
    
    hintsRemaining--;
    document.getElementById('hintsLeft').textContent = hintsRemaining;
    
    const sol = currentPuzzle.solution[0];
    showToast(`提示: 位置 ${String.fromCharCode(65 + sol[1])}${9 - sol[0]}`, 'info');
}

function resetPuzzle() {
    if (!currentPuzzle) return;
    puzzleBoard.board = currentPuzzle.board.map(row => [...row]);
    puzzleBoard.render();
}

function nextPuzzle() {
    if (puzzles.length === 0) return;
    const idx = puzzles.findIndex(p => p.id === currentPuzzle?.id);
    const nextIdx = (idx + 1) % puzzles.length;
    selectPuzzle(puzzles[nextIdx].id);
}

function loadStats() {
    const saved = localStorage.getItem('tsumego_stats');
    if (saved) stats = JSON.parse(saved);
    updateStatsUI();
}

function saveStats() {
    localStorage.setItem('tsumego_stats', JSON.stringify(stats));
}

function updateStatsUI() {
    document.getElementById('completedCount').textContent = stats.completed;
    document.getElementById('correctCount').textContent = stats.correct;
    document.getElementById('streakCount').textContent = stats.streak;
    const rate = stats.completed > 0 ? Math.round(stats.correct / stats.completed * 100) : 0;
    document.getElementById('accuracyRate').textContent = `${rate}%`;
}

function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast show toast-${type}`;
    t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#fff;padding:16px 32px;border-radius:8px;font-size:18px;z-index:9999;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

document.addEventListener('DOMContentLoaded', initTsumego);
