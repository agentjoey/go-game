/**
 * Dashboard 页面逻辑 - Phase 2
 */

const AI_COMPANION = {
    adai: { name: '阿呆', emoji: '🐼', greeting: '今天想挑战什么难度的棋局？' },
    xiaozhi: { name: '小智', emoji: '🦊', greeting: '来啊！我已经热身好了！' },
    youyou: { name: '悠悠', emoji: '🐱', greeting: '今日，手谈一局。' }
};

// 每日任务定义
const DAILY_QUESTS = [
    { id: 'game', title: '完成对弈', desc: '下一盘棋', icon: '🎮', link: '/play', type: 'game' },
    { id: 'tsumego', title: '练习死活题', desc: '完成3道题', icon: '🎯', link: '/tsumego', type: 'tsumego' },
    { id: 'tutorial', title: '学习教程', desc: '完成1章节', icon: '📚', link: '/tutorial', type: 'tutorial' }
];

function initDashboard() {
    loadUserData();
    updateGreeting();
    renderQuests();
    renderRecentGames();
    updateStreak();
}

// 更新问候语
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '你好';
    
    if (hour < 12) greeting = '早上好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';
    
    const userName = localStorage.getItem('user_name') || '小明';
    document.getElementById('greetingText').textContent = `${greeting}，${userName}！`;
    
    // 更新日期
    const now = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
    document.getElementById('dateText').textContent = dateStr;
}

// 加载用户数据
function loadUserData() {
    const companionType = localStorage.getItem('preferred_companion') || 'adai';
    const companion = AI_COMPANION[companionType];
    
    // 更新 AI 伙伴信息
    document.getElementById('aiAvatarLarge').textContent = companion.emoji;
    document.getElementById('aiNameLarge').textContent = companion.name;
    document.getElementById('aiGreeting').textContent = companion.greeting;
    document.getElementById('userAvatar').textContent = companion.emoji;
    
    // 加载最后对局信息
    const lastGame = localStorage.getItem('last_game');
    if (lastGame) {
        const game = JSON.parse(lastGame);
        document.getElementById('lastGameInfo').textContent = 
            `上局：${game.size}路 · ${game.result}`;
    }
}

// 渲染每日任务
function renderQuests() {
    const questGrid = document.getElementById('questGrid');
    const todayQuests = getTodayQuests();
    const completedCount = todayQuests.filter(q => q.completed).length;
    
    // 更新 badge
    document.getElementById('questBadge').textContent = `${completedCount}/3 完成`;
    
    let html = '';
    DAILY_QUESTS.forEach(quest => {
        const isCompleted = todayQuests.find(q => q.id === quest.id)?.completed || false;
        const cls = isCompleted ? 'quest-card completed' : 'quest-card';
        
        html += `<a href="${quest.link}" class="${cls}">
            <div class="quest-icon">${quest.icon}</div>
            <div class="quest-title">${quest.title}</div>
            <div class="quest-desc">${quest.desc}</div>
        </a>`;
    });
    
    questGrid.innerHTML = html;
    
    // 更新连胜进度
    document.getElementById('streakProgressBar').style.width = `${(completedCount / 3) * 100}%`;
    document.getElementById('streakProgressText').textContent = `${completedCount} / 3 任务`;
}

// 获取今日任务状态
function getTodayQuests() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('daily_quests');
    
    if (saved) {
        const data = JSON.parse(saved);
        if (data.date !== today) {
            // 新的一天，重置任务
            return DAILY_QUESTS.map(q => ({ id: q.id, completed: false }));
        }
        return data.quests;
    }
    
    return DAILY_QUESTS.map(q => ({ id: q.id, completed: false }));
}

// 完成任务
function completeQuest(questId) {
    const today = new Date().toDateString();
    const quests = getTodayQuests();
    
    const quest = quests.find(q => q.id === questId);
    if (quest) {
        quest.completed = true;
        localStorage.setItem('daily_quests', JSON.stringify({
            date: today,
            quests: quests
        }));
        
        // 更新连胜
        const completedCount = quests.filter(q => q.completed).length;
        if (completedCount === 3) {
            incrementStreak();
        }
        
        renderQuests();
        updateStreak();
    }
}

// 更新连胜状态
function updateStreak() {
    const streak = parseInt(localStorage.getItem('streak_days') || '0');
    const lastPlayed = localStorage.getItem('last_played_date');
    const today = new Date().toDateString();
    
    // 检查是否需要重置连胜
    if (lastPlayed && lastPlayed !== today) {
        const lastDate = new Date(lastPlayed);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            // 超过1天没玩，重置连胜
            streak = 0;
            localStorage.setItem('streak_days', '0');
        }
    }
    
    document.getElementById('streakTitle').textContent = `连胜 ${streak} 天`;
    
    if (streak >= 3) {
        document.getElementById('streakSubtitle').textContent = '太厉害了！继续保持！';
        document.getElementById('streakBanner').style.background = 'linear-gradient(135deg, #ff6b6b, #ff4757)';
    } else if (streak > 0) {
        document.getElementById('streakSubtitle').textContent = `再坚持 ${7 - streak} 天解锁新皮肤`;
    } else {
        document.getElementById('streakSubtitle').textContent = '完成今日任务，保持连胜！';
    }
}

// 增加连胜
function incrementStreak() {
    const today = new Date().toDateString();
    let streak = parseInt(localStorage.getItem('streak_days') || '0');
    streak++;
    localStorage.setItem('streak_days', streak.toString());
    localStorage.setItem('last_played_date', today);
    
    // 显示庆祝动画
    showStreakCelebration(streak);
}

// 连胜庆祝动画
function showStreakCelebration(streak) {
    const banner = document.getElementById('streakBanner');
    
    // 添加庆祝类
    banner.classList.add('celebrating');
    
    // 创建粒子效果
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            font-size: 1.5rem;
            animation: floatUp 1s ease-out forwards;
            animation-delay: ${i * 0.05}s;
            pointer-events: none;
            z-index: 9999;
        `;
        particle.textContent = ['🔥', '⭐', '✨', '🎉'][Math.floor(Math.random() * 4)];
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${banner.getBoundingClientRect().top}px`;
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
    }
    
    // 3秒后移除庆祝状态
    setTimeout(() => {
        banner.classList.remove('celebrating');
    }, 3000);
}

// 渲染最近对局
function renderRecentGames() {
    const gameList = document.getElementById('gameList');
    const games = JSON.parse(localStorage.getItem('game_history') || '[]');
    
    if (games.length === 0) {
        gameList.innerHTML = `
            <div class="no-games">
                <div class="icon">🎮</div>
                <p>还没有对局记录</p>
                <a href="/play" class="btn btn-primary btn-sm">开始第一局</a>
            </div>
        `;
        return;
    }
    
    // 只显示最近5局
    const recentGames = games.slice(-5).reverse();
    
    let html = '';
    recentGames.forEach(game => {
        const isWin = game.result === '胜';
        html += `<div class="game-item" onclick="viewGame(${game.id})">
            <div class="game-info">
                <span class="game-icon">${isWin ? '🏆' : '⚪'}</span>
                <div class="game-details">
                    <h4>${game.size}路对局</h4>
                    <p>${game.date} · ${game.opponent}</p>
                </div>
            </div>
            <span class="game-result ${isWin ? 'win' : 'lose'}">${game.result}</span>
        </div>`;
    });
    
    gameList.innerHTML = html;
}

// 查看对局详情
function viewGame(gameId) {
    // TODO: 跳转到对局详情页
    console.log('View game:', gameId);
}

// 显示通知
function showNotifications() {
    // TODO: 实现通知列表
    alert('暂无新通知');
}

// 记录对局结果
function recordGame(size, opponent, result) {
    const games = JSON.parse(localStorage.getItem('game_history') || '[]');
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    games.push({
        id: Date.now(),
        date: dateStr,
        size: size,
        opponent: opponent,
        result: result
    });
    
    localStorage.setItem('game_history', JSON.stringify(games));
    localStorage.setItem('last_game', JSON.stringify({
        size: size,
        result: result
    }));
    
    // 完成对局任务
    completeQuest('game');
    
    // 更新显示
    document.getElementById('lastGameInfo').textContent = `上局：${size}路 · ${result}`;
    renderRecentGames();
}

// 页面加载
document.addEventListener('DOMContentLoaded', initDashboard);

// 添加浮动动画
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
        }
    }
    
    .streak-banner.celebrating {
        animation: pulse 0.5s ease-in-out;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);

// 全局暴露
window.recordGame = recordGame;
