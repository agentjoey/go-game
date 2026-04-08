/**
 * 棋谱管理逻辑
 */

let records = [];
let currentRecord = null;
let replayBoard = null;
let replayIndex = 0;

// 初始化
function initRecords() {
    loadRecords();
    renderRecordList();
}

// 加载棋谱
function loadRecords() {
    const saved = localStorage.getItem('go_records');
    if (saved) {
        records = JSON.parse(saved);
    }
}

// 保存棋谱
function saveRecords() {
    localStorage.setItem('go_records', JSON.stringify(records));
}

// 渲染棋谱列表
function renderRecordList() {
    const listEl = document.getElementById('recordList');
    
    if (records.length === 0) {
        listEl.innerHTML = '<p class="text-muted text-center py-4">暂无保存的棋谱</p>';
        return;
    }

    let html = '';
    records.forEach((record, index) => {
        const date = new Date(record.date).toLocaleDateString('zh-CN');
        const resultText = record.result ? `结果: ${record.result}` : '';
        
        html += `
            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${currentRecord?.id === record.id ? 'active' : ''}" onclick="openRecord(${index}); return false;">
                <div>
                    <div class="fw-bold">${record.name || '对局 ' + (index + 1)}</div>
                    <small>${date} · ${record.moves?.length || 0} 手 ${resultText}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord(${index}); event.stopPropagation();">×</button>
            </a>
        `;
    });

    listEl.innerHTML = html;
}

// 打开棋谱
function openRecord(index) {
    if (index < 0 || index >= records.length) return;
    
    currentRecord = records[index];
    replayIndex = 0;
    
    renderRecordList();
    renderReplay();
}

// 渲染回放界面
function renderReplay() {
    const contentEl = document.getElementById('replayContent');
    
    if (!currentRecord) {
        contentEl.innerHTML = `
            <div class="text-center py-5">
                <h3>📖 棋谱回放</h3>
                <p class="text-muted mt-3">从左侧选择一个棋谱开始回放</p>
            </div>
        `;
        return;
    }

    const totalMoves = currentRecord.moves?.length || 0;
    
    contentEl.innerHTML = `
        <div class="text-center mb-3">
            <h4>${currentRecord.name || '棋谱回放'}</h4>
            <p class="text-muted mb-0">共 ${totalMoves} 手</p>
        </div>
        
        <div class="go-board" id="replayBoard"></div>
        
        <!-- 进度条 -->
        <div class="mt-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>第 <span id="currentMoveNum">0</span> 手</span>
                <span>共 ${totalMoves} 手</span>
            </div>
            <input type="range" class="form-range" id="replaySlider" min="0" max="${totalMoves}" value="0" onchange="jumpToMove(this.value)">
        </div>
        
        <!-- 控制按钮 -->
        <div class="text-center mt-3">
            <div class="btn-group" role="group">
                <button class="btn btn-outline-primary" onclick="replayFirst()">⏮</button>
                <button class="btn btn-outline-primary" onclick="replayPrev()">◀</button>
                <button class="btn btn-primary" id="playPauseBtn" onclick="togglePlayPause()">▶</button>
                <button class="btn btn-outline-primary" onclick="replayNext()">▶</button>
                <button class="btn btn-outline-primary" onclick="replayLast()">⏭</button>
            </div>
        </div>
        
        <!-- 落子记录 -->
        <div class="mt-4">
            <h6>落子记录</h6>
            <div id="replayMoves" class="move-history" style="max-height: 200px; overflow-y: auto;">
            </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="mt-4 d-flex justify-content-between">
            <button class="btn btn-outline-success" onclick="exportSGF()">导出 SGF</button>
            <button class="btn btn-outline-primary" onclick="replayAuto()">自动播放</button>
        </div>
    `;

    // 初始化棋盘
    setTimeout(() => {
        replayBoard = new GoBoard('replayBoard', 19);
        updateReplayBoard();
    }, 100);
}

// 更新棋盘
function updateReplayBoard() {
    if (!replayBoard || !currentRecord) return;
    
    const board = Array(19).fill(null).map(() => Array(19).fill(0));
    
    // 回放所有落子
    for (let i = 0; i <= replayIndex; i++) {
        const move = currentRecord.moves[i];
        if (move && move.row !== undefined) {
            board[move.row][move.col] = move.player;
        }
    }
    
    replayBoard.setBoard(board);
    
    // 标记最后一手
    if (replayIndex > 0 && currentRecord.moves[replayIndex]) {
        const lastMove = currentRecord.moves[replayIndex];
        if (lastMove.row !== undefined) {
            replayBoard.setLastMove(lastMove.row, lastMove.col);
        }
    } else {
        replayBoard.clearLastMove();
    }
    
    // 更新 UI
    document.getElementById('currentMoveNum').textContent = replayIndex;
    document.getElementById('replaySlider').value = replayIndex;
    
    // 更新落子记录
    renderReplayMoves();
}

// 渲染落子记录
function renderReplayMoves() {
    const movesEl = document.getElementById('replayMoves');
    if (!movesEl || !currentRecord) return;
    
    let html = '<div class="row g-2">';
    for (let i = 0; i < currentRecord.moves.length; i++) {
        const move = currentRecord.moves[i];
        if (move.type === 'pass') {
            html += `<div class="col-auto"><span class="badge ${i === replayIndex ? 'bg-primary' : 'bg-secondary'}">${i + 1}. PASS</span></div>`;
        } else {
            const stone = move.player === 1 ? '⚫' : '⚪';
            const coord = move.coord || `${String.fromCharCode(65 + move.col)}${19 - move.row}`;
            html += `<div class="col-auto"><span class="badge ${i === replayIndex ? 'bg-primary' : 'bg-secondary'}">${i + 1}. ${stone} ${coord}</span></div>`;
        }
    }
    html += '</div>';
    movesEl.innerHTML = html;
}

// 回放控制
function replayFirst() {
    replayIndex = 0;
    updateReplayBoard();
}

function replayPrev() {
    if (replayIndex > 0) {
        replayIndex--;
        updateReplayBoard();
    }
}

function replayNext() {
    const total = currentRecord?.moves?.length || 0;
    if (replayIndex < total) {
        replayIndex++;
        updateReplayBoard();
    }
}

function replayLast() {
    replayIndex = currentRecord?.moves?.length || 0;
    updateReplayBoard();
}

function jumpToMove(index) {
    replayIndex = parseInt(index);
    updateReplayBoard();
}

// 自动播放
let isPlaying = false;
let playInterval = null;

function togglePlayPause() {
    if (isPlaying) {
        stopPlay();
    } else {
        startPlay();
    }
}

function startPlay() {
    isPlaying = true;
    document.getElementById('playPauseBtn').textContent = '⏸';
    
    playInterval = setInterval(() => {
        const total = currentRecord?.moves?.length || 0;
        if (replayIndex >= total) {
            stopPlay();
            return;
        }
        replayNext();
    }, 800);
}

function stopPlay() {
    isPlaying = false;
    document.getElementById('playPauseBtn').textContent = '▶';
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

function replayAuto() {
    replayFirst();
    startPlay();
}

// 删除棋谱
function deleteRecord(index) {
    if (confirm('确定要删除这个棋谱吗？')) {
        records.splice(index, 1);
        saveRecords();
        
        if (currentRecord && records.findIndex(r => r.id === currentRecord.id) === -1) {
            currentRecord = null;
            renderReplay();
        }
        
        renderRecordList();
    }
}

// 导入 SGF
function importSGF() {
    document.getElementById('sgfFileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseAndSaveSGF(content, file.name);
    };
    reader.readAsText(file);
    
    // 清空 input 以允许重复导入同一文件
    event.target.value = '';
}

function parseAndSaveSGF(content, name) {
    // 简化版 SGF 解析
    const moves = [];
    
    // 提取所有 B[] 和 W[] 
    const moveRegex = /;([BW])\[([a-t]{2})\]/gi;
    let match;
    
    while ((match = moveRegex.exec(content)) !== null) {
        const player = match[1] === 'B' ? 1 : 2;
        const col = match[2].charCodeAt(0) - 97;
        const row = match[2].charCodeAt(1) - 97;
        moves.push({
            player: player,
            row: row,
            col: col,
            coord: `${String.fromCharCode(65 + col)}${19 - row}`
        });
    }
    
    if (moves.length === 0) {
        alert('无法解析 SGF 文件');
        return;
    }
    
    const record = {
        id: Date.now(),
        name: name.replace('.sgf', ''),
        date: new Date().toISOString(),
        moves: moves,
        result: null
    };
    
    records.unshift(record);
    saveRecords();
    renderRecordList();
    openRecord(0);
}

// 导出 SGF
function exportSGF() {
    if (!currentRecord) return;
    
    let sgf = '(;GM[1]SZ[19]FF[4]';
    sgf += `CA[UTF-8]GN[${currentRecord.name || 'Go Game'}]`;
    
    currentRecord.moves.forEach(move => {
        if (move.type === 'pass') {
            sgf += `;${move.player === 1 ? 'B' : 'W'}[]`;
        } else {
            const col = String.fromCharCode(97 + move.col);
            const row = String.fromCharCode(97 + move.row);
            sgf += `;${move.player === 1 ? 'B' : 'W'}[${col}${row}]`;
        }
    });
    
    sgf += ')';
    
    const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentRecord.name || 'go_game'}.sgf`;
    a.click();
    URL.revokeObjectURL(url);
}

// 添加新棋谱（从对弈中调用）
function addRecord(moves, name) {
    const record = {
        id: Date.now(),
        name: name || `对局 ${records.length + 1}`,
        date: new Date().toISOString(),
        moves: moves,
        result: null
    };
    
    records.unshift(record);
    saveRecords();
    renderRecordList();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initRecords);
