/**
 * 棋谱回放 - Phase 1 版
 */

let gameRecords = [];
let currentGame = null;
let currentMoveIndex = 0;
let replayBoard = null;
let isPlaying = false;
let playInterval = null;

async function initRecords() {
    // 初始化棋盘
    replayBoard = new GoBoard('replay-board', 19);
    
    // 加载对局记录
    loadGameRecords();
    
    // 渲染列表
    renderGameList();
    
    // 绑定进度条事件
    document.getElementById('progressSlider')?.addEventListener('input', (e) => {
        currentMoveIndex = parseInt(e.target.value);
        updateReplayBoard();
    });
}

function loadGameRecords() {
    // 从 localStorage 加载
    const saved = localStorage.getItem('go_game_records');
    
    if (saved) {
        gameRecords = JSON.parse(saved);
    } else {
        // 添加一个示例对局
        gameRecords = [
            {
                id: 1,
                date: '2026-04-09',
                black: '小明',
                white: 'AI阿呆',
                result: '黑胜',
                moves: generateSampleGame()
            }
        ];
    }
}

function generateSampleGame() {
    // 生成一个简单的示例对局 (9路)
    const moves = [];
    const pattern = [
        [2,2],[2,6],[6,2],[6,6],[4,4],
        [2,4],[4,2],[4,6],[6,4],
        [2,8],[8,2],[8,8],[8,6],
        [0,0]
    ];
    
    pattern.forEach((pos, i) => {
        moves.push({
            player: i % 2 === 0 ? 1 : 2,
            row: pos[0],
            col: pos[1],
            coord: String.fromCharCode(65 + pos[1]) + (9 - pos[0])
        });
    });
    
    return moves;
}

function renderGameList() {
    const listEl = document.getElementById('gameList');
    
    if (gameRecords.length === 0) {
        listEl.innerHTML = '<p class="empty-moves">暂无对局记录</p>';
        return;
    }
    
    let html = '';
    gameRecords.forEach(g => {
        const active = currentGame?.id === g.id ? 'active' : '';
        html += `<div class="game-item ${active}" onclick="selectGame(${g.id})">
            <div class="game-info">
                <span class="game-date">${g.date}</span>
                <span class="game-players">⚫${g.black} vs ⚪${g.white}</span>
            </div>
            <div class="game-result ${g.result.includes('黑') ? 'black-win' : 'white-win'}">
                ${g.result}
            </div>
        </div>`;
    });
    
    listEl.innerHTML = html;
}

function selectGame(id) {
    currentGame = gameRecords.find(g => g.id === id);
    if (!currentGame) return;
    
    currentMoveIndex = 0;
    isPlaying = false;
    if (playInterval) clearInterval(playInterval);
    
    // 更新 UI
    document.getElementById('gameInfo').textContent = 
        `⚫${currentGame.black} vs ⚪${currentGame.white}`;
    
    // 更新进度条
    const slider = document.getElementById('progressSlider');
    slider.max = currentGame.moves.length;
    slider.value = 0;
    
    // 清空棋盘
    replayBoard = new GoBoard('replay-board', 19);
    updateReplayBoard();
    updateGameDetails();
    updateAICommentary();
    renderGameList();
}

function updateReplayBoard() {
    if (!currentGame || !replayBoard) return;
    
    // 创建空棋盘
    const size = 19;
    const board = Array(size).fill(null).map(() => Array(size).fill(0));
    
    // 逐手放置棋子
    for (let i = 0; i <= currentMoveIndex && i < currentGame.moves.length; i++) {
        const m = currentGame.moves[i];
        board[m.row][m.col] = m.player;
    }
    
    replayBoard.setBoard(board);
    
    // 更新最后一手
    if (currentMoveIndex > 0 && currentMoveIndex <= currentGame.moves.length) {
        const lastMove = currentGame.moves[currentMoveIndex - 1];
        replayBoard.setLastMove(lastMove.row, lastMove.col);
    } else {
        replayBoard.clearLastMove();
    }
    
    // 更新进度
    document.getElementById('moveNumber').textContent = currentMoveIndex;
    document.getElementById('progressSlider').value = currentMoveIndex;
    
    updateGameDetails();
}

function updateGameDetails() {
    const el = document.getElementById('gameDetails');
    if (!currentGame) {
        el.innerHTML = '<p class="text-muted">选择对局查看详情</p>';
        return;
    }
    
    const total = currentGame.moves.length;
    el.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">日期</span>
            <span class="detail-value">${currentGame.date}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">黑方</span>
            <span class="detail-value">⚫ ${currentGame.black}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">白方</span>
            <span class="detail-value">⚪ ${currentGame.white}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">结果</span>
            <span class="detail-value">${currentGame.result}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">总手数</span>
            <span class="detail-value">${total} 手</span>
        </div>
        ${currentMoveIndex > 0 ? `
        <div class="detail-item">
            <span class="detail-label">当前手</span>
            <span class="detail-value">⚫/${currentGame.moves[currentMoveIndex-1]?.coord || '-'}</span>
        </div>
        ` : ''}
    `;
}

function updateAICommentary() {
    const el = document.getElementById('ai-commentary');
    if (!currentGame || currentMoveIndex === 0) {
        el.innerHTML = '<p class="text-muted">开始播放后显示 AI 点评</p>';
        return;
    }
    
    // 简单的 AI 点评生成
    const moveNum = currentMoveIndex;
    const player = currentMoveIndex % 2 === 1 ? '黑' : '白';
    const coord = currentGame.moves[currentMoveIndex - 1]?.coord || '-';
    
    let commentary = '';
    if (moveNum <= 5) {
        commentary = `${player}在${coord}落子，布局阶段。`;
    } else if (moveNum <= 20) {
        commentary = `${player}在${coord}落子，中盘战斗正在进行。`;
    } else {
        commentary = `${player}在${coord}落子，官子阶段。`;
    }
    
    el.innerHTML = `<div class="commentary-text">💬 ${commentary}</div>`;
}

function goToStart() {
    if (!currentGame) return;
    currentMoveIndex = 0;
    updateReplayBoard();
}

function goToEnd() {
    if (!currentGame) return;
    currentMoveIndex = currentGame.moves.length;
    updateReplayBoard();
}

function prevMove() {
    if (!currentGame || currentMoveIndex <= 0) return;
    currentMoveIndex--;
    updateReplayBoard();
}

function nextMove() {
    if (!currentGame || currentMoveIndex >= currentGame.moves.length) return;
    currentMoveIndex++;
    updateReplayBoard();
    updateAICommentary();
}

function playPause() {
    if (!currentGame) return;
    
    if (isPlaying) {
        isPlaying = false;
        if (playInterval) clearInterval(playInterval);
    } else {
        if (currentMoveIndex >= currentGame.moves.length) {
            currentMoveIndex = 0;
        }
        isPlaying = true;
        playInterval = setInterval(() => {
            if (currentMoveIndex < currentGame.moves.length) {
                currentMoveIndex++;
                updateReplayBoard();
                updateAICommentary();
            } else {
                isPlaying = false;
                clearInterval(playInterval);
            }
        }, 800);
    }
}

// 保存对局
function saveCurrentGame() {
    if (!currentGame) return;
    
    // 从 go-game.js 的游戏结果中保存
    const gameData = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        black: '玩家',
        white: 'AI',
        result: '进行中',
        moves: []
    };
    
    gameRecords.unshift(gameData);
    localStorage.setItem('go_game_records', JSON.stringify(gameRecords));
    renderGameList();
}

// 页面加载
document.addEventListener('DOMContentLoaded', initRecords);

// 暴露给全局
window.saveCurrentGame = saveCurrentGame;
