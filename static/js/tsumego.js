/**
 * 死活题练习逻辑
 */

// 死活题数据结构
let puzzles = [];
let currentPuzzle = null;
let hintsRemaining = 3;
let stats = {
    completed: 0,
    correct: 0,
    streak: 0
};

// 棋盘
let puzzleBoard;

// 初始化
async function initTsumego() {
    puzzleBoard = new GoBoard('puzzleBoard', 9);
    puzzleBoard.addClickListener(handlePuzzleClick);
    
    await loadPuzzles();
    renderPuzzleList();
    loadStats();
}

// 加载死活题数据
async function loadPuzzles() {
    try {
        const response = await fetch('/api/tsumego/list');
        const data = await response.json();
        if (data.success) {
            puzzles = data.data.problems;
            renderPuzzleList();
        }
    } catch (error) {
        console.error('加载死活题失败:', error);
        // 使用内置数据
        puzzles = getDefaultPuzzles();
        renderPuzzleList();
    }
}

// 默认死活题数据
function getDefaultPuzzles() {
    return [
        {
            id: 1,
            title: '第一题：黑先吃白',
            type: 'kill',
            difficulty: 'easy',
            description: '黑棋如何吃掉角上的白棋？',
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
            nextPlayer: 1
        },
        {
            id: 2,
            title: '第二题：黑先做活',
            type: 'live',
            difficulty: 'easy',
            description: '黑棋如何在角上做出两只眼？',
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
            nextPlayer: 1
        },
        {
            id: 3,
            title: '第三题：黑先对杀',
            type: 'capture',
            difficulty: 'medium',
            description: '黑棋和白棋对杀，谁先动手？',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,1,0,2,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,4]],
            nextPlayer: 1
        },
        {
            id: 4,
            title: '第四题：紧气吃子',
            type: 'kill',
            difficulty: 'easy',
            description: '黑棋紧气吃掉白棋',
            board: [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,2,0,0,0,0],
                [0,0,0,2,1,2,0,0,0],
                [0,0,0,0,2,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0]
            ],
            solution: [[4,3]],
            nextPlayer: 1
        },
        {
            id: 5,
            title: '第五题：接不归',
            type: 'kill',
            difficulty: 'medium',
            description: '黑棋如何让白棋接不归？',
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
            solution: [[4,4],[5,4]],
            nextPlayer: 1
        }
    ];
}

// 渲染题目列表
function renderPuzzleList() {
    const listEl = document.getElementById('puzzleList');
    const typeFilter = document.getElementById('puzzleType')?.value || 'all';
    const difficultyFilter = document.getElementById('puzzleDifficulty')?.value || 'all';

    let filteredPuzzles = puzzles;
    if (typeFilter !== 'all') {
        filteredPuzzles = filteredPuzzles.filter(p => p.type === typeFilter);
    }
    if (difficultyFilter !== 'all') {
        filteredPuzzles = filteredPuzzles.filter(p => p.difficulty === difficultyFilter);
    }

    if (filteredPuzzles.length === 0) {
        listEl.innerHTML = '<p class="text-muted text-center py-4">没有找到符合条件的题目</p>';
        return;
    }

    let html = '';
    filteredPuzzles.forEach(puzzle => {
        const typeName = { kill: '吃子', live: '做活', capture: '对杀' }[puzzle.type];
        const difficultyClass = { easy: 'success', medium: 'warning', hard: 'danger' }[puzzle.difficulty];
        
        html += `
            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${currentPuzzle?.id === puzzle.id ? 'active' : ''}" onclick="selectPuzzle(${puzzle.id}); return false;">
                <div>
                    <div class="fw-bold">${puzzle.title}</div>
                    <small>${puzzle.description}</small>
                </div>
                <div>
                    <span class="badge bg-${difficultyClass}">${puzzle.difficulty === 'easy' ? '入门' : puzzle.difficulty === 'medium' ? '初级' : '中级'}</span>
                </div>
            </a>
        `;
    });

    listEl.innerHTML = html;
}

// 选择题目
function selectPuzzle(id) {
    currentPuzzle = puzzles.find(p => p.id === id);
    if (!currentPuzzle) return;

    hintsRemaining = 3;
    document.getElementById('hintsLeft').textContent = hintsRemaining;
    document.getElementById('puzzleTitle').textContent = currentPuzzle.title;
    document.getElementById('puzzleDesc').textContent = currentPuzzle.description;

    puzzleBoard = new GoBoard('puzzleBoard', 9);
    puzzleBoard.setBoard(currentPuzzle.board);
    puzzleBoard.addClickListener(handlePuzzleClick);

    renderPuzzleList();
}

// 处理点击
function handlePuzzleClick(row, col) {
    if (!currentPuzzle || !puzzleBoard) return;

    // 检查是否是正确的解法
    const isCorrect = currentPuzzle.solution.some(([r, c]) => r === row && c === col);
    
    if (isCorrect) {
        // 正确：放置黑棋并显示成功
        puzzleBoard.board[row][col] = 1;
        puzzleBoard.render();
        showFeedback(true, '回答正确！🎉');
        
        // 更新统计
        stats.completed++;
        stats.correct++;
        stats.streak++;
        saveStats();
        updateStatsUI();
        
        // 延迟后进入下一题
        setTimeout(() => {
            nextPuzzle();
        }, 1500);
    } else {
        // 错误
        showFeedback(false, '回答错误，请再试试！');
        stats.streak = 0;
        saveStats();
        updateStatsUI();
    }
}

// 显示反馈
function showFeedback(correct, message) {
    const colors = correct ? 'bg-success' : 'bg-danger';
    const feedback = document.createElement('div');
    feedback.className = `toast show ${colors} text-white`;
    feedback.setAttribute('role', 'alert');
    feedback.innerHTML = `<div class="toast-body fs-4 text-center">${message}</div>`;
    
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-50 start-50 translate-middle';
        document.body.appendChild(container);
    }
    container.innerHTML = '';
    container.appendChild(feedback);

    setTimeout(() => feedback.remove(), 1500);
}

// 提示
function showHint() {
    if (!currentPuzzle || hintsRemaining <= 0) return;

    hintsRemaining--;
    document.getElementById('hintsLeft').textContent = hintsRemaining;

    // 显示一个正确解法的位置
    const solution = currentPuzzle.solution[0];
    puzzleBoard.board[solution[0]][solution[1]] = 2; // 临时显示白棋表示位置
    puzzleBoard.render();
    
    setTimeout(() => {
        puzzleBoard.board[solution[0]][solution[1]] = 0;
        puzzleBoard.render();
    }, 1000);
}

// 重置题目
function resetPuzzle() {
    if (!currentPuzzle) return;
    puzzleBoard.setBoard(currentPuzzle.board.map(row => [...row]));
    puzzleBoard.render();
}

// 下一题
function nextPuzzle() {
    if (puzzles.length === 0) return;
    
    const currentIndex = puzzles.findIndex(p => p.id === currentPuzzle?.id);
    const nextIndex = (currentIndex + 1) % puzzles.length;
    selectPuzzle(puzzles[nextIndex].id);
}

// 统计相关
function loadStats() {
    const saved = localStorage.getItem('tsumego_stats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStatsUI();
    }
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

// 绑定筛选事件
document.addEventListener('DOMContentLoaded', () => {
    initTsumego();
    
    document.getElementById('puzzleType')?.addEventListener('change', renderPuzzleList);
    document.getElementById('puzzleDifficulty')?.addEventListener('change', renderPuzzleList);
});
