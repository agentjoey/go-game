/**
 * 围棋教程逻辑
 */

// 教程章节数据
const tutorials = [
    {
        id: 1,
        title: '第一章：围棋简介',
        icon: '📖',
        content: `
            <h3>围棋简介</h3>
            <p>围棋起源于中国，有着四千多年的历史，是世界上最古老的棋类游戏之一。</p>
            
            <div class="alert alert-info">
                <strong>📌 围棋的意义</strong>
                <ul class="mb-0 mt-2">
                    <li>围棋可以锻炼逻辑思维能力</li>
                    <li>培养专注力和全局观</li>
                    <li>学会思考和决策</li>
                </ul>
            </div>
            
            <h5>围棋的基本规则</h5>
            <ul>
                <li>围棋使用 19×19 的棋盘（初学者也可用 9×9 或 13×13）</li>
                <li>黑白双方轮流在棋盘上放置棋子</li>
                <li>棋子落子后不能移动</li>
                <li>目标是围住更多的地盘</li>
            </ul>
            
            <div class="text-center my-4">
                <div class="go-board" id="introBoard"></div>
            </div>
        `,
        board: null
    },
    {
        id: 2,
        title: '第二章：棋盘与落子',
        icon: '🎯',
        content: `
            <h3>棋盘与落子</h3>
            <p>围棋棋盘由 19 条横线和 19 条竖线交叉组成，共有 361 个交叉点。</p>
            
            <div class="alert alert-warning">
                <strong>💡 棋子落在交叉点上，而不是格子里！</strong>
            </div>
            
            <h5>棋盘上的特殊位置</h5>
            <ul>
                <li><strong>星位</strong>：棋盘上的 9 个黑点，用于定位</li>
                <li><strong>天元</strong>：棋盘正中心的星位</li>
                <li><strong>角</strong>：四个角的区域</li>
                <li><strong>边</strong>：四条边的区域</li>
                <li><strong>中腹</strong>：棋盘中央的区域</li>
            </ul>
            
            <h5>如何落子</h5>
            <ol>
                <li>黑棋先手</li>
                <li>双方轮流落子</li>
                <li>点击交叉点放置棋子</li>
            </ol>
        `,
        board: null
    },
    {
        id: 3,
        title: '第三章：气的概念',
        icon: '💨',
        content: `
            <h3>气的概念</h3>
            <p><strong>气</strong>是围棋最重要的概念之一。棋子周围紧挨着的空交叉点，就是这颗棋子的"气"。</p>
            
            <div class="alert alert-success">
                <strong>📝 气的计算规则</strong>
                <ul class="mb-0 mt-2">
                    <li>角上的棋子最多有 2 口气</li>
                    <li>边上的棋子最多有 3 口气</li>
                    <li>中腹的棋子最多有 4 口气</li>
                </ul>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-4 text-center">
                    <div class="go-board" id="cornerBoard"></div>
                    <p class="small mt-2">角上：2 口气</p>
                </div>
                <div class="col-md-4 text-center">
                    <div class="go-board" id="edgeBoard"></div>
                    <p class="small mt-2">边上：3 口气</p>
                </div>
                <div class="col-md-4 text-center">
                    <div class="go-board" id="centerBoard"></div>
                    <p class="small mt-2">中腹：4 口气</p>
                </div>
            </div>
        `,
        board: null
    },
    {
        id: 4,
        title: '第四章：吃子规则',
        icon: '🎯',
        content: `
            <h3>吃子规则</h3>
            <p>当一颗棋子的所有气都被对方堵住时，这颗棋子就被"提掉"（吃掉）了。</p>
            
            <div class="alert alert-danger">
                <strong>🚫 没有气的棋子必须被提掉！</strong>
            </div>
            
            <h5>吃子的条件</h5>
            <ul>
                <li>棋子的所有气都被对方占领</li>
                <li>被堵住气的棋子从棋盘上移除</li>
                <li>被提掉的棋子成为对方的"俘虏"</li>
            </ul>
            
            <div class="text-center my-4">
                <div class="go-board" id="captureBoard"></div>
                <p class="small mt-2">黑棋走 A 位即可吃掉白棋</p>
            </div>
            
            <div class="alert alert-info">
                <strong>💡 小提示</strong>：在实战中，通常不会等到只剩一口气才跑，要提前学会"逃跑"！
            </div>
        `,
        board: null
    },
    {
        id: 5,
        title: '第五章：禁着点',
        icon: '🚫',
        content: `
            <h3>禁着点（禁止落子）</h3>
            <p>围棋有一条重要规则：<strong>禁止自杀</strong>。也就是说，你不能主动把自己的棋子下死。</p>
            
            <div class="alert alert-warning">
                <strong>🚫 自杀是禁止的！</strong>
                <p class="mb-0 mt-2">除非自杀的同时能吃掉对方的棋子。</p>
            </div>
            
            <h5>禁着点的两种情况</h5>
            <ol>
                <li><strong>无气禁着</strong>：落子后自己没气，且不能提对方子</li>
                <li><strong>打劫禁着</strong>：刚被提子的位置不能立即提回（下一回合才能提）</li>
            </ol>
            
            <div class="text-center my-4">
                <div class="go-board" id="suicideBoard"></div>
                <p class="small mt-2">白棋位置是禁着点，黑棋不能在此处落子</p>
            </div>
        `,
        board: null
    },
    {
        id: 6,
        title: '第六章：劫的规则',
        icon: '🔄',
        content: `
            <h3>劫</h3>
            <p><strong>劫</strong>是围棋中的特殊局面。当双方可以反复互相提子时，为了避免无限循环，规定了一个特殊规则。</p>
            
            <div class="alert alert-info">
                <strong>📌 打劫规则</strong>
                <ul class="mb-0 mt-2">
                    <li>刚被提子的位置，对方不能立即提回</li>
                    <li>必须先在别处下一手"劫材"</li>
                    <li>对方应劫后，才能提回</li>
                </ul>
            </div>
            
            <h5>劫的种类</h5>
            <ul>
                <li><strong>紧劫</strong>：只有一处可打的劫</li>
                <li><strong>宽劫</strong>：有多处可打的劫</li>
                <li><strong>连环劫</strong>：多个劫在一起</li>
            </ul>
            
            <div class="text-center my-4">
                <div class="go-board" id="koBoard"></div>
                <p class="small mt-2">经典劫形 - 黑先走 A，白走 B 后黑才能提回</p>
            </div>
        `,
        board: null
    },
    {
        id: 7,
        title: '第七章：胜负判定',
        icon: '🏆',
        content: `
            <h3>胜负判定</h3>
            <p>围棋的目标是围住更多的地盘（目）。当双方都认为没有更多可争的地方时，游戏结束。</p>
            
            <div class="alert alert-success">
                <strong>📊 计算方法</strong>
                <ul class="mb-0 mt-2">
                    <li>数一数围住的空点（地）</li>
                    <li>加上吃掉的对方棋子</li>
                    <li>黑棋需要贴 6.5 目给白棋（因为黑先走有优势）</li>
                </ul>
            </div>
            
            <h5>常见的胜负情况</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>结果</th>
                        <th>说明</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>黑胜</td>
                        <td>黑方子数 + 地数 - 贴目 > 白方子数 + 地数</td>
                    </tr>
                    <tr>
                        <td>白胜</td>
                        <td>白方子数 + 地数 + 贴目 > 黑方子数 + 地数</td>
                    </tr>
                    <tr>
                        <td>中盘胜</td>
                        <td>一方认输或被吃掉大龙</td>
                    </tr>
                </tbody>
            </table>
        `,
        board: null
    },
    {
        id: 8,
        title: '第八章：基本棋型',
        icon: '♟️',
        content: `
            <h3>基本棋型</h3>
            <p>了解一些常见的棋型名称，可以帮助你更好地理解围棋。</p>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h5>布局常用点</h5>
                    <ul>
                        <li><strong>星位</strong>：快速占据角部</li>
                        <li><strong>小目</strong>：注重角部实地</li>
                        <li><strong>三三</strong>：注重角部侵入</li>
                        <li><strong>天元</strong>：中心战略点</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h5>常见棋形</h5>
                    <ul>
                        <li><strong>棋形</strong>：棋子排列的形状</li>
                        <li><strong>厚势</strong>：外势强壮的棋</li>
                        <li><strong>模样</strong>：有发展潜力的地方</li>
                        <li><strong>死活</strong>：棋子的生存能力</li>
                    </ul>
                </div>
            </div>
            
            <div class="alert alert-primary mt-4">
                <strong>🎉 恭喜完成入门教程！</strong>
                <p class="mb-0 mt-2">现在你已经掌握了围棋的基本规则，可以开始对弈练习了！</p>
            </div>
            
            <div class="text-center mt-4">
                <a href="/play" class="btn btn-primary btn-lg">开始对弈 →</a>
            </div>
        `,
        board: null
    }
];

let currentChapter = 0;
let completedChapters = new Set();

// 初始化
function initTutorial() {
    loadProgress();
    renderChapterList();
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
    
    tutorials.forEach((tutorial, index) => {
        const isCompleted = completedChapters.has(tutorial.id);
        const isActive = index === currentChapter;
        
        html += `
            <a href="#" class="list-group-item list-group-item-action d-flex align-items-center ${isActive ? 'active' : ''}" onclick="goToChapter(${index}); return false;">
                <span class="me-3 fs-5">${tutorial.icon}</span>
                <div class="flex-grow-1">
                    <div class="fw-bold">${tutorial.title}</div>
                </div>
                ${isCompleted ? '<span class="badge bg-success">✓</span>' : ''}
            </a>
        `;
    });
    
    listEl.innerHTML = html;
}

function goToChapter(index) {
    if (index < 0 || index >= tutorials.length) return;
    
    currentChapter = index;
    renderChapterList();
    renderContent();
    updateNavigationButtons();
    updateProgress();
}

function renderContent() {
    const contentEl = document.getElementById('tutorialContent');
    const tutorial = tutorials[currentChapter];
    
    contentEl.innerHTML = tutorial.content;
    
    // 标记当前章节为已阅读
    completedChapters.add(tutorial.id);
    saveProgress();
    renderChapterList();
    updateProgress();
    
    // 初始化棋盘示例
    setTimeout(() => {
        initTutorialBoards();
    }, 100);
}

function initTutorialBoards() {
    // 简介页棋盘
    const introBoardEl = document.getElementById('introBoard');
    if (introBoardEl) {
        const board = new GoBoard('introBoard', 9);
        const sampleBoard = [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,1,0,0,0,2,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ];
        board.setBoard(sampleBoard);
    }
    
    // 角上的棋子
    const cornerBoardEl = document.getElementById('cornerBoard');
    if (cornerBoardEl) {
        const board = new GoBoard('cornerBoard', 9);
        const boardData = [
            [1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ];
        board.setBoard(boardData);
    }
    
    // 边上的棋子
    const edgeBoardEl = document.getElementById('edgeBoard');
    if (edgeBoardEl) {
        const board = new GoBoard('edgeBoard', 9);
        const boardData = [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ];
        board.setBoard(boardData);
    }
    
    // 中腹的棋子
    const centerBoardEl = document.getElementById('centerBoard');
    if (centerBoardEl) {
        const board = new GoBoard('centerBoard', 9);
        const boardData = [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ];
        board.setBoard(boardData);
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentChapter === 0;
    }
    if (nextBtn) {
        nextBtn.disabled = currentChapter === tutorials.length - 1;
    }
}

function updateProgress() {
    const completed = completedChapters.size;
    const total = tutorials.length;
    const percentage = Math.round(completed / total * 100);
    
    const progressBar = document.getElementById('progressBar');
    const completedEl = document.getElementById('completedChapters');
    const totalEl = document.getElementById('totalChapters');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${percentage}%`;
    }
    if (completedEl) completedEl.textContent = completed;
    if (totalEl) totalEl.textContent = total;
}

function prevChapter() {
    goToChapter(currentChapter - 1);
}

function nextChapter() {
    goToChapter(currentChapter + 1);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initTutorial);
