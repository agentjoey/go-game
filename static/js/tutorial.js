/**
 * 围棋教程 - 简化版
 */

// 教程数据
const tutorials = [
    {
        id: 1,
        title: "第一章：围棋简介",
        content: `<h3>围棋简介</h3>
<p>围棋起源于中国，有着四千多年的历史。</p>
<p>围棋可以锻炼逻辑思维能力，培养专注力和全局观。</p>
<h4>基本规则</h4>
<ul>
<li>使用 19×19 棋盘</li>
<li>黑白双方轮流落子</li>
<li>目标是围住更多的地盘</li>
</ul>`
    },
    {
        id: 2,
        title: "第二章：棋盘与落子",
        content: `<h3>棋盘与落子</h3>
<p>围棋棋盘由 19 条横线和 19 条竖线交叉组成，共有 361 个交叉点。</p>
<div class="alert alert-info">棋子落在交叉点上，而不是格子里！</div>
<h4>特殊位置</h4>
<ul>
<li><strong>星位</strong>：棋盘上的 9 个黑点</li>
<li><strong>天元</strong>：棋盘正中心</li>
</ul>`
    },
    {
        id: 3,
        title: "第三章：气的概念",
        content: `<h3>气的概念</h3>
<p><strong>气</strong>是围棋最重要的概念。棋子周围紧挨着的空交叉点，就是这颗棋子的"气"。</p>
<ul>
<li>角上的棋子最多有 2 口气</li>
<li>边上的棋子最多有 3 口气</li>
<li>中腹的棋子最多有 4 口气</li>
</ul>`
    },
    {
        id: 4,
        title: "第四章：吃子规则",
        content: `<h3>吃子规则</h3>
<p>当棋子的所有气都被堵住时，棋子被提掉。</p>
<div class="alert alert-danger">没有气的棋子必须被提掉！</div>`
    },
    {
        id: 5,
        title: "第五章：禁着点",
        content: `<h3>禁着点</h3>
<p>禁止自杀！不能主动把自己的棋子下死。</p>
<div class="alert alert-warning">除非自杀的同时能吃掉对方的棋子。</div>`
    },
    {
        id: 6,
        title: "第六章：劫的规则",
        content: `<h3>劫</h3>
<p>劫是围棋中的特殊局面。刚被提子的位置，对方不能立即提回。</p>
<p>必须先在别处下一手"劫材"。</p>`
    },
    {
        id: 7,
        title: "第七章：胜负判定",
        content: `<h3>胜负判定</h3>
<p>围棋的目标是围住更多的地盘（目）。</p>
<h4>计算方法</h4>
<ul>
<li>数一数围住的空点（地）</li>
<li>加上吃掉的对方棋子</li>
<li>黑棋需要贴 6.5 目给白棋</li>
</ul>`
    },
    {
        id: 8,
        title: "第八章：基本棋型",
        content: `<h3>基本棋型</h3>
<h4>布局常用点</h4>
<ul>
<li><strong>星位</strong>：快速占据角部</li>
<li><strong>小目</strong>：注重角部实地</li>
<li><strong>天元</strong>：中心战略点</li>
</ul>
<div class="alert alert-success mt-4">恭喜完成入门教程！</div>
<div class="text-center mt-3">
<a href="/play" class="btn btn-primary btn-lg">开始对弈 →</a>
</div>`
    }
];

let currentTutorial = 0;
let completedTutorials = new Set();
let exerciseBoard = null;

function init() {
    loadProgress();
    renderTutorialList();
    showTutorial(0);
}

function loadProgress() {
    const saved = localStorage.getItem('tutorial_progress');
    if (saved) {
        completedTutorials = new Set(JSON.parse(saved));
    }
}

function saveProgress() {
    localStorage.setItem('tutorial_progress', JSON.stringify([...completedTutorials]));
}

function renderTutorialList() {
    const listEl = document.getElementById('tutorial-list');
    if (!listEl) return;
    
    let html = '';
    tutorials.forEach((t, i) => {
        const done = completedTutorials.has(t.id);
        const active = i === currentTutorial;
        html += `<a href="#" class="list-group-item list-group-item-action ${active ? 'active' : ''}" onclick="showTutorial(${i}); return false;">
            <span class="me-2">${done ? '✅' : '📖'}</span>
            <span class="fw-bold">${t.title}</span>
        </a>`;
    });
    listEl.innerHTML = html;
    
    // 更新进度
    const completedEl = document.getElementById('completed-tutorials');
    if (completedEl) completedEl.textContent = completedTutorials.size;
}

function showTutorial(index) {
    currentTutorial = index;
    const t = tutorials[index];
    
    const contentEl = document.getElementById('tutorial-content');
    if (contentEl) {
        contentEl.innerHTML = `
            <h2 class="mb-4">${t.title}</h2>
            ${t.content}
        `;
    }
    
    completedTutorials.add(t.id);
    saveProgress();
    renderTutorialList();
    
    // 更新按钮状态
    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === tutorials.length - 1;
}

function prevStep() {
    if (currentTutorial > 0) {
        showTutorial(currentTutorial - 1);
    }
}

function nextStep() {
    if (currentTutorial < tutorials.length - 1) {
        showTutorial(currentTutorial + 1);
    }
}

function showExercise() {
    // 初始化练习棋盘
    const boardEl = document.getElementById('exercise-board');
    if (boardEl && !exerciseBoard) {
        exerciseBoard = new GoBoard('exercise-board', 9);
        exerciseBoard.addClickListener((row, col) => {
            console.log('Exercise click:', row, col);
            // 简单处理：放置黑棋
            exerciseBoard.board[row][col] = 1;
            exerciseBoard.setBoard(exerciseBoard.board);
        });
    }
    
    // 显示模态框
    const modal = document.getElementById('exercise-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeExercise() {
    const modal = document.getElementById('exercise-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', init);
