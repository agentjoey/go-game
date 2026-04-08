/**
 * 围棋教程 - Phase 1 版
 */

const chapters = [
    {
        id: 1,
        title: '第一章：围棋简介',
        icon: '📖',
        objectives: ['了解围棋的起源', '理解围棋的基本目标'],
        content: `
            <h2>📖 围棋简介</h2>
            <div class="chapter-section">
                <h3>围棋的起源</h3>
                <p>围棋起源于中国，已有四千多年的历史。它是一种策略性棋类游戏，两人对弈，各自执黑、白棋子在棋盘上争抢地盘。</p>
            </div>
            <div class="chapter-section">
                <h3>围棋的目标</h3>
                <p>围棋的目标是<span class="highlight">围住更多的地盘（目）</span>。谁围的地盘大，谁就赢。</p>
                <div class="tip-box">
                    <span class="tip-icon">💡</span>
                    <p>围棋谚语："金角银边草肚皮"——角最容易围地，边次之，中腹最难。</p>
                </div>
            </div>
            <div class="chapter-section">
                <h3>基本术语</h3>
                <ul class="term-list">
                    <li><strong>棋盘</strong>：19×19 格（361 个交叉点）</li>
                    <li><strong>棋子</strong>：黑棋和白棋各 180+ 颗</li>
                    <li><strong>落子</strong>：把棋子放在交叉点上</li>
                    <li><strong>气</strong>：棋子周围的空间</li>
                </ul>
            </div>
        `
    },
    {
        id: 2,
        title: '第二章：棋盘与落子',
        icon: '🎯',
        objectives: ['认识棋盘结构', '掌握落子规则'],
        content: `
            <h2>🎯 棋盘与落子</h2>
            <div class="chapter-section">
                <h3>棋盘结构</h3>
                <p>围棋棋盘由 <span class="highlight">19 条横线</span>和 <span class="highlight">19 条竖线</span>交叉组成，共有 361 个交叉点。</p>
                <div class="board-preview" id="boardPreview">
                    <div class="mini-board" id="miniBoard1"></div>
                </div>
            </div>
            <div class="chapter-section">
                <h3>特殊位置</h3>
                <ul class="term-list">
                    <li><strong>星位</strong>：棋盘上的 9 个黑点</li>
                    <li><strong>天元</strong>：棋盘正中心的星位</li>
                    <li><strong>三三</strong>：角上的常见落点</li>
                </ul>
            </div>
            <div class="chapter-section">
                <h3>落子规则</h3>
                <p>棋子落在<span class="highlight">交叉点</span>上，而不是格子里！黑棋先行，双方轮流落子。</p>
            </div>
        `
    },
    {
        id: 3,
        title: '第三章：气的概念',
        icon: '💨',
        objectives: ['理解"气"的含义', '数气的基本方法'],
        content: `
            <h2>💨 气的概念</h2>
            <div class="chapter-section">
                <h3>什么是"气"</h3>
                <p><span class="highlight">气</span>是围棋最重要的概念！气就是棋子周围紧挨着的空交叉点。</p>
            </div>
            <div class="chapter-section">
                <h3>不同位置的气数</h3>
                <div class="liberty-demo">
                    <div class="demo-item">
                        <div class="demo-board" id="cornerBoard"></div>
                        <p>角上：<strong>2 口气</strong></p>
                    </div>
                    <div class="demo-item">
                        <div class="demo-board" id="edgeBoard"></div>
                        <p>边上：<strong>3 口气</strong></p>
                    </div>
                    <div class="demo-item">
                        <div class="demo-board" id="centerBoard"></div>
                        <p>中腹：<strong>4 口气</strong></p>
                    </div>
                </div>
            </div>
            <div class="tip-box">
                <span class="tip-icon">📌</span>
                <p>连接在一起的棋子共享气，形成"棋串"。</p>
            </div>
        `
    },
    {
        id: 4,
        title: '第四章：吃子规则',
        icon: '🍽️',
        objectives: ['掌握提子条件', '理解无气必提'],
        content: `
            <h2>🍽️ 吃子规则</h2>
            <div class="chapter-section">
                <h3>如何吃子</h3>
                <p>当棋子的<span class="highlight">所有气都被堵住</span>时，棋子被提掉（从棋盘上拿走）。</p>
            </div>
            <div class="chapter-section">
                <h3>练习题</h3>
                <p>点击棋盘上正确的位置，吃掉对方的棋子：</p>
                <button class="btn btn-primary btn-sm" onclick="startExercise(4)">开始练习</button>
            </div>
        `
    },
    {
        id: 5,
        title: '第五章：禁着点',
        icon: '🚫',
        objectives: ['理解自杀规则', '识别禁着点'],
        content: `
            <h2>🚫 禁着点</h2>
            <div class="chapter-section">
                <h3>禁止自杀</h3>
                <p><span class="highlight">禁止自杀！</span>不能主动把自己的棋子下死（除非下子能同时吃掉对方）。</p>
                <div class="tip-box warning">
                    <span class="tip-icon">⚠️</span>
                    <p>但如果自杀的同时能吃掉对方的棋子，那就是允许的！</p>
                </div>
            </div>
        `
    },
    {
        id: 6,
        title: '第六章：劫的规则',
        icon: '🔄',
        objectives: ['理解劫的概念', '掌握劫的规则'],
        content: `
            <h2>🔄 劫的规则</h2>
            <div class="chapter-section">
                <h3>什么是劫</h3>
                <p><span class="highlight">劫</span>是围棋中的特殊局面。双方可以轮流提子，但不能立即提回。</p>
            </div>
            <div class="chapter-section">
                <h3>劫的规则</h3>
                <ul class="rule-list">
                    <li>刚被提子的位置，对方不能立即提回</li>
                    <li>必须先在别处下一手"劫材"</li>
                    <li>吃掉劫材后才能再提劫</li>
                </ul>
            </div>
        `
    },
    {
        id: 7,
        title: '第七章：胜负判定',
        icon: '🏆',
        objectives: ['理解目和目的概念', '掌握基本计算方法'],
        content: `
            <h2>🏆 胜负判定</h2>
            <div class="chapter-section">
                <h3>计算方法</h3>
                <p>围棋的目标是围住更多的<span class="highlight">地盘（目）</span>。</p>
                <ul class="rule-list">
                    <li>数一数围住的空点（地）</li>
                    <li>加上吃掉的对方棋子</li>
                    <li>黑棋需要贴 6.5 目给白棋</li>
                </ul>
            </div>
        `
    },
    {
        id: 8,
        title: '第八章：入门总结',
        icon: '🎓',
        objectives: ['回顾所有基础知识', '开始你的围棋之旅'],
        content: `
            <h2>🎓 入门总结</h2>
            <div class="chapter-section">
                <h3>你已经学会</h3>
                <div class="summary-list">
                    <div class="summary-item">✅ 围棋的基本规则</div>
                    <div class="summary-item">✅ 气的概念</div>
                    <div class="summary-item">✅ 吃子规则</div>
                    <div class="summary-item">✅ 禁着点</div>
                    <div class="summary-item">✅ 劫的规则</div>
                </div>
            </div>
            <div class="chapter-section text-center">
                <div class="completion-badge">
                    <span class="badge-icon">🎉</span>
                    <h3>恭喜完成入门教程！</h3>
                </div>
                <a href="/play" class="btn btn-primary btn-lg mt-3">开始对弈 →</a>
            </div>
        `
    }
];

let currentChapter = 0;
let completedChapters = new Set();
let exerciseBoard = null;
let exerciseCallback = null;

function initTutorial() {
    loadProgress();
    renderChapterList();
    initMiniBoards();
    updateProgress();
}

function loadProgress() {
    const saved = localStorage.getItem('tutorial_progress');
    if (saved) {
        completedChapters = new Set(JSON.parse(saved));
    }
}

function saveProgress() {
    localStorage.setItem('tutorial_progress', JSON.stringify([...completedChapters]));
}

function renderChapterList() {
    const listEl = document.getElementById('chapterList');
    
    let html = '';
    chapters.forEach((ch, i) => {
        const isCompleted = completedChapters.has(ch.id);
        const isActive = i === currentChapter;
        const isLocked = i > 0 && !completedChapters.has(chapters[i-1].id) && i !== currentChapter;
        
        let cls = 'chapter-item';
        if (isActive) cls += ' active';
        if (isCompleted) cls += ' completed';
        if (isLocked) cls += ' locked';
        
        const lockIcon = isLocked ? '🔒' : (isCompleted ? '✅' : '📖');
        
        html += `<div class="${cls}" onclick="${isLocked ? '' : `selectChapter(${i})`}">
            <span class="chapter-icon">${lockIcon}</span>
            <span class="chapter-title">${ch.title}</span>
        </div>`;
    });
    
    listEl.innerHTML = html;
}

function selectChapter(index) {
    currentChapter = index;
    const ch = chapters[index];
    
    // 更新内容
    document.getElementById('tutorialContent').innerHTML = ch.content;
    
    // 更新目标
    const objEl = document.getElementById('learningObjectives');
    objEl.innerHTML = ch.objectives.map(o => `<div class="objective-item">• ${o}</div>`).join('');
    
    // 标记完成
    completedChapters.add(ch.id);
    saveProgress();
    
    renderChapterList();
    updateProgress();
    
    // 初始化小型棋盘
    setTimeout(initChapterBoards, 100);
}

function initMiniBoards() {
    // 角上棋子
    setTimeout(() => {
        const cornerBoard = new GoBoard('cornerBoard', 9);
        const cornerData = [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ];
        cornerData[0][0] = 1;
        cornerBoard.setBoard(cornerData);
        
        // 边上棋子
        const edgeBoard = new GoBoard('edgeBoard', 9);
        const edgeData = cornerData.map(r => [...r]);
        edgeData[0][4] = 1;
        edgeBoard.setBoard(edgeData);
        
        // 中腹棋子
        const centerBoard = new GoBoard('centerBoard', 9);
        const centerData = cornerData.map(r => [...r]);
        centerData[4][4] = 1;
        centerBoard.setBoard(centerData);
    }, 200);
}

function initChapterBoards() {
    if (currentChapter === 2) {
        initMiniBoards();
    }
}

function updateProgress() {
    const total = chapters.length;
    const completed = completedChapters.size;
    const pct = Math.round(completed / total * 100);
    
    document.getElementById('progressFill').style.width = `${pct}%`;
    document.getElementById('progressText').textContent = `${completed} / ${total} 章节`;
}

function startExercise(chapterId) {
    const contentEl = document.getElementById('tutorialContent');
    const exerciseEl = document.getElementById('exerciseArea');
    const instrEl = document.getElementById('exerciseInstructions');
    
    contentEl.style.display = 'none';
    exerciseEl.style.display = 'block';
    
    // 初始化练习棋盘
    if (!exerciseBoard) {
        exerciseBoard = new GoBoard('exercise-board', 9);
    }
    
    // 根据章节设置不同的练习
    if (chapterId === 4) {
        instrEl.innerHTML = '<p>黑先，点击白棋旁边的位置将其吃掉</p>';
        exerciseBoard.board = [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,2,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ];
        exerciseBoard.render();
        
        exerciseBoard.listeners = [];
        exerciseBoard.addClickListener((row, col) => {
            // 吃子逻辑
            if (exerciseBoard.board[row][col] === 0) {
                exerciseBoard.board[row][col] = 1;
                exerciseBoard.render();
            }
        });
        
        exerciseCallback = () => {
            // 检查是否吃掉白棋
            return exerciseBoard.board[3][3] === 0;
        };
    }
}

function resetExercise() {
    if (exerciseBoard) {
        exerciseBoard.render();
    }
}

function checkExercise() {
    if (exerciseCallback && exerciseCallback()) {
        showToast('🎉 正确！太棒了！', 'success');
        completedChapters.add(currentChapter + 1);
        saveProgress();
        renderChapterList();
        updateProgress();
        
        setTimeout(() => {
            document.getElementById('tutorialContent').style.display = 'block';
            document.getElementById('exerciseArea').style.display = 'none';
        }, 1500);
    } else {
        showToast('再想想...', 'error');
    }
}

function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast show toast-${type}`;
    t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#fff;padding:16px 32px;border-radius:8px;font-size:18px;z-index:9999;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

// 页面加载
document.addEventListener('DOMContentLoaded', initTutorial);
