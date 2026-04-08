/**
 * 复盘回放功能 - Phase 2
 */

// 从 localStorage 加载最后对局数据
const gameData = JSON.parse(localStorage.getItem('last_game_data') || '{}');

let reviewBoard = null;
let currentMoveIndex = 0;
let isPlaying = false;
let playbackInterval = null;
let moves = [];

// 初始化
function initReview() {
    // 如果没有数据，使用演示数据
    if (!gameData.moves || gameData.moves.length === 0) {
        useDemoData();
    } else {
        moves = gameData.moves;
    }
    
    // 初始化棋盘
    reviewBoard = new GoBoard('review-board', gameData.boardSize || 9);
    
    // 设置 AI 信息
    const companionType = localStorage.getItem('preferred_companion') || 'adai';
    const companions = {
        adai: { name: '阿呆', emoji: '🐼' },
        xiaozhi: { name: '小智', emoji: '🦊' },
        youyou: { name: '悠悠', emoji: '🐱' }
    };
    document.getElementById('reviewAiAvatar').textContent = companions[companionType].emoji;
    document.getElementById('reviewAiName').textContent = companions[companionType].name;
    
    // 更新UI
    document.getElementById('totalMoves').textContent = moves.length;
    document.getElementById('moveSlider').max = moves.length;
    
    // 生成胜率图
    generateWinrateChart();
    
    // 生成精彩时刻
    generateHighlights();
    
    // 生成 AI 点评
    generateAIReview();
    
    // 更新任务完成卡片
    updateTaskCard();
    
    // 渲染第一步
    renderMove(0);
}

function useDemoData() {
    // 演示数据
    moves = [
        { player: 1, row: 2, col: 2 },
        { player: 2, row: 2, col: 4 },
        { player: 1, row: 4, col: 2 },
        { player: 2, row: 4, col: 4 },
        { player: 1, row: 6, col: 2 },
        { player: 2, row: 6, col: 4 },
        { player: 1, row: 4, col: 3 },
        { player: 2, row: 3, col: 3 },
        { player: 1, row: 5, col: 5 },
        { player: 2, row: 5, col: 3 }
    ];
    
    gameData.boardSize = 9;
    gameData.result = '胜';
}

// 渲染指定步数
function renderMove(index) {
    if (index < 0 || index > moves.length) return;
    
    currentMoveIndex = index;
    
    // 清空棋盘
    const size = gameData.boardSize || 9;
    reviewBoard.board = [];
    for (let i = 0; i < size; i++) {
        reviewBoard.board.push(new Array(size).fill(0));
    }
    
    // 逐步放置棋子
    for (let i = 0; i <= index; i++) {
        const m = moves[i];
        if (m.player && m.row !== undefined && m.col !== undefined) {
            reviewBoard.board[m.row][m.col] = m.player;
        }
    }
    
    // 设置最后一手标记
    if (index > 0) {
        const lastMove = moves[index];
        reviewBoard.setLastMove(lastMove.row, lastMove.col);
    } else {
        reviewBoard.clearLastMove();
    }
    
    reviewBoard.render();
    
    // 更新 UI
    document.getElementById('currentMoveNum').textContent = index;
    document.getElementById('moveSlider').value = index;
}

// 播放控制
function togglePlayback() {
    if (isPlaying) {
        pausePlayback();
    } else {
        startPlayback();
    }
}

function startPlayback() {
    if (currentMoveIndex >= moves.length) {
        currentMoveIndex = 0;
    }
    
    isPlaying = true;
    document.getElementById('playBtn').textContent = '⏸';
    
    playbackInterval = setInterval(() => {
        if (currentMoveIndex < moves.length - 1) {
            renderMove(currentMoveIndex + 1);
        } else {
            pausePlayback();
        }
    }, 800);
}

function pausePlayback() {
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶';
    clearInterval(playbackInterval);
}

function stepForward() {
    pausePlayback();
    if (currentMoveIndex < moves.length) {
        renderMove(currentMoveIndex + 1);
    }
}

function stepBack() {
    pausePlayback();
    if (currentMoveIndex > 0) {
        renderMove(currentMoveIndex - 1);
    }
}

function jumpToStart() {
    pausePlayback();
    renderMove(0);
}

function jumpToEnd() {
    pausePlayback();
    renderMove(moves.length - 1);
}

function seekTo(value) {
    pausePlayback();
    renderMove(parseInt(value));
}

// 生成胜率图
function generateWinrateChart() {
    const path = document.getElementById('winratePath');
    const area = document.getElementById('winrateArea');
    
    if (!path || !area || moves.length < 2) return;
    
    // 模拟胜率数据
    let winrate = 50;
    const points = [];
    const areaPoints = [];
    
    moves.forEach((m, i) => {
        // 随机波动
        winrate += (Math.random() - 0.5) * 15;
        winrate = Math.max(10, Math.min(90, winrate));
        points.push({ x: (i / (moves.length - 1)) * 300, y: 100 - winrate });
    });
    
    // 绘制线
    let linePath = `M ${points[0].x} ${points[0].y}`;
    points.forEach((p, i) => {
        if (i > 0) {
            linePath += ` L ${p.x} ${p.y}`;
        }
    });
    path.setAttribute('d', linePath);
    
    // 绘制区域
    let areaPath = linePath + ` L 300 100 L 0 100 Z`;
    area.setAttribute('d', areaPath);
    
    // 更新统计数据
    document.getElementById('brilliantCount').textContent = '2';
    document.getElementById('mistakeCount').textContent = '1';
    document.getElementById('maxLead').textContent = '+15目';
    document.getElementById('turningPoint').textContent = '第47手';
}

// 生成精彩时刻
function generateHighlights() {
    const container = document.getElementById('highlightCards');
    
    // 模拟精彩时刻
    const highlights = [
        { move: 3, type: 'brilliant', label: '妙手!', desc: '精彩的枷吃' },
        { move: 7, type: 'turning', label: '转折点', desc: '局势逆转' },
        { move: 12, type: 'key', label: '胜势确立', desc: '奠定胜局' }
    ].filter(h => h.move < moves.length);
    
    if (highlights.length === 0) {
        container.innerHTML = '<p style="color: var(--mist-gray);">暂无精彩时刻</p>';
        return;
    }
    
    let html = '';
    highlights.forEach(h => {
        html += `
            <div class="highlight-card" onclick="jumpToMove(${h.move})">
                <div class="move-num">第 ${h.move} 手</div>
                <div class="move-type ${h.type}">${h.label}</div>
                <div style="font-size: 0.75rem; color: var(--mist-gray); margin-bottom: 8px;">${h.desc}</div>
                <button class="play-btn">▶ 播放</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function jumpToMove(moveIndex) {
    pausePlayback();
    renderMove(moveIndex);
}

// 生成 AI 点评
function generateAIReview() {
    const companionType = localStorage.getItem('preferred_companion') || 'adai';
    
    const reviews = {
        adai: '这盘棋前半盘很胶着，中盘的战斗很精彩。最后的官子还可以再精确一点，建议练习一下官子题~',
        xiaozhi: '你的棋很有攻击性！第47手的断很有想法，不过后面有些急了。冷静一点会更厉害！',
        youyou: '棋局整体平稳，防守做得不错。如果能在中盘更积极一点，胜率会更高。加油~'
    };
    
    document.getElementById('aiReviewContent').textContent = reviews[companionType];
}

// 更新任务卡片
function updateTaskCard() {
    const streak = parseInt(localStorage.getItem('streak_days') || '0');
    const todayQuests = JSON.parse(localStorage.getItem('daily_quests') || '{"quests":[]}');
    const completedCount = todayQuests.quests?.filter(q => q.completed).length || 0;
    
    if (completedCount >= 3) {
        document.getElementById('taskCompleteCard').style.display = 'block';
        document.getElementById('streakInfo').textContent = `🔥 连胜 ${streak} 天！再坚持 ${7 - streak} 天解锁新皮肤`;
    } else {
        document.getElementById('taskCompleteCard').style.display = 'none';
    }
}

// 分享
function shareReview() {
    if (navigator.share) {
        navigator.share({
            title: '围棋复盘',
            text: `我刚刚下了一盘围棋，结果是${gameData.result || '未知'}！来看看我的复盘吧~`,
            url: window.location.href
        });
    } else {
        // 复制链接
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('复盘链接已复制到剪贴板！');
        });
    }
}

// 页面加载
document.addEventListener('DOMContentLoaded', initReview);

// 清理
window.addEventListener('beforeunload', () => {
    pausePlayback();
});
