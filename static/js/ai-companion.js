/**
 * AI 棋伴系统 - Phase 1 增强版
 * 基于 P020_AI_Coaching_System_v1.0 设计
 */

class AICompanion {
    constructor(type = 'adai') {
        this.type = type;
        this.name = this.getName();
        this.emoji = this.getEmoji();
        this.messages = this.getMessages();
        this.lastMessage = null;
        this.thinking = false;
        this.sessionStats = this.loadSessionStats();
    }
    
    getName() {
        const names = { adai: '阿呆', xiaozhi: '小智', youyou: '悠悠' };
        return names[this.type] || '阿呆';
    }
    
    getEmoji() {
        const emojis = { adai: '🐼', xiaozhi: '🦊', youyou: '🐱' };
        return emojis[this.type] || '🐼';
    }
    
    loadSessionStats() {
        const saved = localStorage.getItem('ai_companion_stats');
        return saved ? JSON.parse(saved) : {
            consecutiveWins: 0,
            consecutiveLosses: 0,
            totalGames: 0,
            brilliantMoves: 0,
            sloppyMoves: 0,
            undoCount: 0,
            lastGameMargin: 0
        };
    }
    
    saveSessionStats() {
        localStorage.setItem('ai_companion_stats', JSON.stringify(this.sessionStats));
    }
    
    // ============================================
    // 完整话术库 - 基于 AI Coaching System 文档
    // ============================================
    
    getMessages() {
        return {
            // ========== 阿呆 (温和型) ==========
            adai: {
                // 开场白
                preGame: [
                    "今天想下几路的？9路轻松一下，还是19路挑战一下？",
                    "昨天那盘棋我复盘了，你的中盘战斗进步好大！",
                    "我昨晚偷偷练了死活题，今天可不会输给你哦~",
                    "今天心情怎么样？想下盘轻松的，还是认真的？",
                    "好久不见！最近围棋有没有练习呀？"
                ],
                // 开局引导
                opening: [
                    { condition: 'corner', messages: ["好开局！金角银边草肚皮，先占角是对的~", "你也先占角呀？我们想的一样呢！"] },
                    { condition: 'center', messages: ["哇，直接下中间！这是要和大空作战吗？", "中央开局，气势足，不过要小心哦~"] },
                    { condition: 'joseki', messages: ["这是「星位一间跳」定式对吧？我也学过！", "哇，会定式呢！厉害厉害~"] }
                ],
                // 妙手反应
                brilliantMove: [
                    "哇！！这手棋太厉害了！我怎么没想到！",
                    "这手棋太妙了！你怎么想出来的呀？",
                    "啊啊啊！我完全没注意到！你太厉害了！"
                ],
                // 大失着反应
                bigMistake: [
                    "这里...可能有点问题。你看，如果我下这里呢？",
                    "没关系没关系，这种地方我也经常搞混~",
                    "这步棋可以再想想，不过别着急哦~"
                ],
                // 吃子反应
                capture: [
                    "啊！我的子！",
                    "被你吃掉了呢~",
                    "没关系，再来~"
                ],
                // 鼓励
                encourage: [
                    "这步棋下得很好呢！我都没想到~",
                    "没关系没关系，我刚开始学的时候也这样",
                    "你看，这样是不是就活了？很简单对吧！",
                    "继续保持！你越来越厉害了！"
                ],
                // 示弱 (费曼模式)
                feynman: [
                    "这里我有点迷糊了...你能教教我吗？",
                    "我觉得下A点不错，但B点好像也可以？",
                    "诶？你为什么下这里呀？"
                ],
                // 苏格拉底提问
                socratic: [
                    "你觉得黑棋最怕什么？",
                    "如果我们不下这里，还有别的办法吗？",
                    "这手棋和昨天学的「双打吃」是不是有点像？",
                    "你想在这块棋达到什么目的呀？"
                ],
                // 劣势安抚
                losing: [
                    "现在有点落后呢...不过还有机会！",
                    "别着急，围棋嘛，不到最后一刻不知道结果~",
                    "我以前也经常大比分落后翻盘的！"
                ],
                // 连败安抚
                'losing streak': [
                    "我知道输棋很难受...我昨天也被小智虐了5盘呢",
                    "要不要我们先下盘9路的？轻松一下~",
                    "你上个月的这时候，还下不过我让5子的棋呢，现在只让3子了！"
                ],
                // 胜利
                win: [
                    "你赢了！好厉害~",
                    "这盘棋下得很棒！",
                    "我学到了很多！",
                    "虽然输了，但你那手棋真的很妙！"
                ],
                // 失败
                lose: [
                    "这盘我赢了，但你下得很认真！",
                    "这次我认真了一点~",
                    "再来一盘吧！"
                ],
                // 连胜膨胀提醒
                winningStreak: [
                    "最近好厉害！不过...这手棋是不是有点随意？",
                    "要是对手下这里，可能就麻烦了哦",
                    "你今天状态真好！不过别大意哦~"
                ],
                // 结尾语
                postGame: [
                    "今天辛苦了！明天继续加油~",
                    "这盘棋有好几手我都学到了，谢谢！",
                    "今天很愉快，下次再一起下棋呀！"
                ],
                // 思考中
                thinking: ['让我想想...', '这一步...有意思', '嗯...'],
                // 日常
                greeting: ['你好呀！', '今天想下棋吗？', '来一盘？'],
            },
            
            // ========== 小智 (挑战型) ==========
            xiaozhi: {
                preGame: [
                    "哟，来了？今天几子让起？",
                    "连胜{streak}盘了？飘了吧？",
                    "昨天输的那盘我想了一晚上，今天复仇！",
                    "来！我已经热身好了！",
                    "嘿嘿，终于来了！我可等很久了~"
                ],
                opening: [
                    { condition: 'corner', messages: ["占角是吧？那我也要抢！看谁快！", "哦？先占角？有点意思~"] },
                    { condition: 'center', messages: ["哈？第一手下中间？看不起我吗！", "中央开局？有胆量！"] },
                    { condition: 'joseki', messages: ["哦？会定式？那看看谁变得好！", "定式是吧？那我要出招了！"] }
                ],
                brilliantMove: [
                    "可恶...这都被你看穿了？",
                    "什么！？我没看错吧！",
                    "这步棋...有点东西！"
                ],
                bigMistake: [
                    "嘿嘿，中计了吧！这叫「请君入瓮」！",
                    "哈？这步可不太行哦~",
                    "在想什么呢？让我给你挖个坑~"
                ],
                capture: [
                    "哈哈！中计了吧！",
                    "这叫战术！",
                    "落在我手里了吧~"
                ],
                encourage: [
                    "不错不错，能看穿我的陷阱了！",
                    "有点意思！",
                    "这步棋有点水平！",
                    "不错不错！"
                ],
                feynman: [
                    "这里有个破绽，你看不看得出？",
                    "我觉得你不敢下这里，敢不敢试试？",
                    "这步棋，聂卫平当年也下过类似的"
                ],
                socratic: [
                    "这里有个破绽，你看不看得出？",
                    "我觉得你不敢下这里，敢不敢试试？",
                    "A点和B点，你觉得哪个更好？为什么？"
                ],
                losing: [
                    "哼，现在领先不代表什么！",
                    "别得意太早，中盘才是关键！",
                    "等着瞧吧，我要开始认真了！"
                ],
                losingStreak: [
                    "喂喂，这就放弃了？不像你啊！",
                    "来，我让你4子，敢不敢再来一盘？",
                    "你看，这手棋就比刚才好多了，有进步！"
                ],
                win: [
                    "哈！我赢了！",
                    "说了要认真起来的吧~",
                    "这盘我状态不错！",
                    "算你厉害...下次我不会轻敌了！"
                ],
                lose: [
                    "这次算你狠！",
                    "下次我不会再让着你了！",
                    "好，你赢了，但只是这次！"
                ],
                winningStreak: [
                    "连胜这么多，飘了吧？",
                    "这手棋我看不懂，认真的吗？",
                    "来，我认真了，接招！"
                ],
                postGame: [
                    "再来！我就不信了！",
                    "今天状态不好，明天再来！",
                    "这盘有学到东西吗？"
                ],
                thinking: ['哼哼...', '这步我看到了！', '让我好好想想~'],
                greeting: ['嘿！', '来了？', '准备好了吗？'],
            },
            
            // ========== 悠悠 (冷静型) ==========
            youyou: {
                preGame: [
                    "请。",
                    "今日，手谈一局。",
                    "棋道漫漫，今日何如？",
                    "观汝近日棋谱，有进境。",
                    "。"
                ],
                opening: [
                    { condition: 'corner', messages: ["先角后边，基本。", "金角。不错。"] },
                    { condition: 'center', messages: ["中央开局，气势足，但需后续配合。", "中腹。需厚势配合。"] },
                    { condition: 'joseki', messages: ["定式。有理可循，但不可拘泥。", "常见应对。"] }
                ],
                brilliantMove: [
                    "妙手。",
                    "局势逆转。",
                    "善。",
                    "此手，精彩。"
                ],
                bigMistake: [
                    "这手棋，薄。黑棋有手段。",
                    "此处，值得斟酌。",
                    "问题较大。"
                ],
                capture: [
                    "得。",
                    "简明。",
                    "。"
                ],
                encourage: [
                    "善。",
                    "这步棋不错。",
                    "有棋理。",
                    "进步明显。"
                ],
                feynman: [
                    "如果白棋下在这里，黑棋的眼位还在吗？",
                    "这步棋的价值，不止于此。",
                    "再想想，还有更狠的手段。"
                ],
                socratic: [
                    "你想在这块棋达到什么目的？",
                    "这手棋，是为了进攻还是防守？",
                    "如果对手下在这里，你会怎么办？",
                    "A点和B点，哪个更好？"
                ],
                losing: [
                    "局势不利。但未至终局。",
                    "尚可挽回。",
                    "静待时机。"
                ],
                losingStreak: [
                    "胜败乃兵家常事。",
                    "今日之失，明日之得。",
                    "复盘此局，可见三处可改进。"
                ],
                win: [
                    "我胜。",
                    "形势如此。",
                    "大局已定。",
                    "承让。"
                ],
                lose: [
                    "你赢了。",
                    "此局，你更优。",
                    "善战者胜。"
                ],
                winningStreak: [
                    "骄兵必败。",
                    "这手棋，不像你平时的水平。",
                    "谨言慎行。"
                ],
                postGame: [
                    "善。",
                    "今日之局，可记。",
                    "去后思之，必有得。"
                ],
                thinking: ['嗯...', '让余思考片刻', '...'],
                greeting: ['。', '善。', '请。'],
            }
        };
    }
    
    // ============================================
    // 情绪检测系统
    // ============================================
    
    calculateFrustration() {
        const s = this.sessionStats;
        let score = 0;
        score += s.consecutiveLosses * 15;
        if (s.lastGameMargin > 20) score += 20;
        score += s.sloppyMoves * 10;
        score += s.undoCount * 5;
        return Math.min(score, 100);
    }
    
    calculateConfidence() {
        const s = this.sessionStats;
        let score = 50;
        score += s.consecutiveWins * 10;
        score += s.brilliantMoves * 15;
        if (s.consecutiveWins >= 3) score += 20;
        score -= s.sloppyMoves * 10;
        return Math.max(0, Math.min(score, 100));
    }
    
    selectStrategy() {
        const frustration = this.calculateFrustration();
        const confidence = this.calculateConfidence();
        
        if (frustration > 70) return 'comfort';
        if (confidence > 80) return 'challenge';
        if (frustration > 40) return 'encourage';
        return 'normal';
    }
    
    // ============================================
    // 场景化消息获取
    // ============================================
    
    getPreGameMessage() {
        const msgs = this.messages[this.type].preGame;
        let msg = msgs[Math.floor(Math.random() * msgs.length)];
        // 替换变量
        return msg.replace('{streak}', this.sessionStats.consecutiveWins);
    }
    
    getOpeningMessage(gameContext) {
        const openingData = this.messages[this.type].opening;
        let candidates = [];
        
        for (const item of openingData) {
            if (item.condition === 'joseki' && gameContext?.isJoseki) {
                candidates.push(...item.messages);
            } else if (item.condition === 'corner' && gameContext?.occupiedCorner) {
                candidates.push(...item.messages);
            } else if (item.condition === 'center' && gameContext?.centerFirst) {
                candidates.push(...item.messages);
            }
        }
        
        if (candidates.length === 0) {
            candidates = openingData.flatMap(item => item.messages);
        }
        
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    getBrilliantMoveMessage() {
        const msgs = this.messages[this.type].brilliantMove;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getBigMistakeMessage() {
        const msgs = this.messages[this.type].bigMistake;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getEncourageMessage() {
        const msgs = this.messages[this.type].encourage;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getLosingMessage() {
        const msgs = this.messages[this.type].losing;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getLosingStreakMessage() {
        const msgs = this.messages[this.type]['losing streak'];
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getWinMessage() {
        const msgs = this.messages[this.type].win;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getLoseMessage() {
        const msgs = this.messages[this.type].lose;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getWinningStreakMessage() {
        const msgs = this.messages[this.type].winningStreak;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getPostGameMessage() {
        const msgs = this.messages[this.type].postGame;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getThinkingMessage() {
        const msgs = this.messages[this.type].thinking;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    getGreetingMessage() {
        const msgs = this.messages[this.type].greeting;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    // ============================================
    // 消息显示
    // ============================================
    
    showMessage(type) {
        let msg;
        
        switch(type) {
            case 'brilliant': msg = this.getBrilliantMoveMessage(); break;
            case 'mistake': msg = this.getBigMistakeMessage(); break;
            case 'encourage': msg = this.getEncourageMessage(); break;
            case 'losing': msg = this.getLosingMessage(); break;
            case 'losingStreak': msg = this.getLosingStreakMessage(); break;
            case 'win': msg = this.getWinMessage(); break;
            case 'lose': msg = this.getLoseMessage(); break;
            case 'winningStreak': msg = this.getWinningStreakMessage(); break;
            case 'thinking': msg = this.getThinkingMessage(); break;
            default: msg = this.getEncourageMessage();
        }
        
        this.lastMessage = { text: msg, type: type, time: Date.now() };
        return msg;
    }
    
    showBubble(type) {
        const msg = this.showMessage(type);
        const bubbleEl = document.getElementById('ai-bubble');
        if (bubbleEl) {
            bubbleEl.innerHTML = `<span class="emoji">${this.emoji}</span> ${msg}`;
            bubbleEl.className = `ai-bubble show ${type}`;
            setTimeout(() => bubbleEl.classList.remove('show'), 3500);
        }
        return msg;
    }
    
    // ============================================
    // 统计更新
    // ============================================
    
    recordBrilliantMove() {
        this.sessionStats.brilliantMoves++;
        this.saveSessionStats();
    }
    
    recordSloppyMove() {
        this.sessionStats.sloppyMoves++;
        this.saveSessionStats();
    }
    
    recordUndo() {
        this.sessionStats.undoCount++;
        this.saveSessionStats();
    }
    
    recordGameEnd(won, margin = 0) {
        this.sessionStats.totalGames++;
        this.sessionStats.lastGameMargin = margin;
        
        if (won) {
            this.sessionStats.consecutiveWins++;
            this.sessionStats.consecutiveLosses = 0;
        } else {
            this.sessionStats.consecutiveLosses++;
            this.sessionStats.consecutiveWins = 0;
        }
        
        this.saveSessionStats();
    }
    
    resetSession() {
        this.sessionStats = {
            consecutiveWins: 0,
            consecutiveLosses: 0,
            totalGames: 0,
            brilliantMoves: 0,
            sloppyMoves: 0,
            undoCount: 0,
            lastGameMargin: 0
        };
        this.saveSessionStats();
    }
}

// ============================================
// 死活题 AI 教练
// ============================================

class TsumegoCoach {
    constructor(companion) {
        this.companion = companion;
        this.hintsUsed = 0;
        this.maxHints = 3;
        this.currentHintLevel = 0; // 0=无, 1=方向, 2=位置, 3=答案
    }
    
    getHint(puzzle) {
        if (this.hintsUsed >= this.maxHints) {
            return { level: 3, text: '已经没有提示次数了哦~', coord: puzzle.solution[0] };
        }
        
        this.hintsUsed++;
        this.currentHintLevel = Math.min(this.hintsUsed, 3);
        
        const row = puzzle.solution[0][0];
        const col = puzzle.solution[0][1];
        const coordStr = String.fromCharCode(65 + col) + (9 - row);
        
        let hint = { level: this.currentHintLevel };
        
        switch (this.currentHintLevel) {
            case 1:
                // 方向提示
                const directions = this.getDirectionHint(puzzle);
                hint.text = `提示：这个方向试试？${directions}`;
                hint.coord = null;
                break;
            case 2:
                // 位置提示
                hint.text = `提示：大概在这个区域~`;
                hint.coord = this.getRoughCoord(puzzle.solution[0]);
                break;
            case 3:
                // 答案
                hint.text = `答案是：${coordStr}`;
                hint.coord = puzzle.solution[0];
                break;
        }
        
        return hint;
    }
    
    getDirectionHint(puzzle) {
        const [r, c] = puzzle.solution[0];
        if (r < 3) return '上方';
        if (r > 5) return '下方';
        if (c < 3) return '左侧';
        if (c > 5) return '右侧';
        return '中间区域';
    }
    
    getRoughCoord([row, col]) {
        // 返回大概区域
        const r = Math.floor(row / 3) * 3;
        const c = Math.floor(col / 3) * 3;
        return [r + 1, c + 1]; // 区域中心
    }
    
    onCorrect(puzzle) {
        const messages = [
            '🎉 正确！太棒了！',
            '✨ 答对了！你真厉害！',
            '👍 正确！继续加油~'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    onWrong() {
        this.companion.showBubble('encourage');
        const messages = [
            '再想想~',
            '别灰心，再试一次！',
            '这道题有点难，慢慢来~'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    onComplete() {
        this.companion.showBubble('win');
        return '🎊 恭喜完成所有题目！';
    }
    
    reset() {
        this.hintsUsed = 0;
        this.currentHintLevel = 0;
    }
}

// AI 对手逻辑
class GoAI {
    constructor(game, difficulty = 'medium') {
        this.game = game;
        this.difficulty = difficulty;
    }
    
    getMove() {
        const validMoves = this.getValidMoves();
        if (validMoves.length === 0) return null;
        
        switch (this.difficulty) {
            case 'easy': return this.easyMove(validMoves);
            case 'medium': return this.mediumMove(validMoves);
            case 'hard': return this.hardMove(validMoves);
            default: return validMoves[0];
        }
    }
    
    getValidMoves() {
        const moves = [];
        for (let r = 0; r < 19; r++) {
            for (let c = 0; c < 19; c++) {
                if (this.game.board[r][c] === 0) {
                    if (!this.isSuicide(r, c, this.game.currentPlayer)) {
                        moves.push([r, c]);
                    }
                }
            }
        }
        return moves;
    }
    
    isSuicide(row, col, player) {
        // 临时落子
        this.game.board[row][col] = player;
        
        // 检查是否能提子
        const opponent = player === 1 ? 2 : 1;
        const captures = this.game.checkCaptures(opponent);
        
        // 提子后检查自己的棋是否有气
        const ownGroup = this.game.getGroup(row, col);
        const ownLibs = this.game.getLiberties(ownGroup);
        
        this.game.board[row][col] = 0;
        
        // 如果没被提子且自己也没气，是禁着
        if (captures.length === 0 && ownLibs.size === 0) {
            return true;
        }
        
        return false;
    }
    
    easyMove(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    }
    
    mediumMove(moves) {
        let best = moves[0];
        let bestScore = -9999;
        
        for (const [r, c] of moves) {
            let score = 0;
            
            // 吃子优先
            const tempBoard = this.game.board.map(row => [...row]);
            this.game.board[r][c] = this.game.currentPlayer;
            const captures = this.game.checkCaptures(
                this.game.currentPlayer === 1 ? 2 : 1
            );
            score += captures.length * 100;
            this.game.board = tempBoard;
            
            // 增加自己的气
            const libs = this.countLiberties(r, c, this.game.currentPlayer);
            score += libs * 5;
            
            // 连接己方棋子
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < 19 && nc >= 0 && nc < 19) {
                    if (this.game.board[nr][nc] === this.game.currentPlayer) {
                        score += 3;
                    }
                }
            }
            
            // 随机性
            score += Math.random() * 10;
            
            if (score > bestScore) {
                bestScore = score;
                best = [r, c];
            }
        }
        return best;
    }
    
    hardMove(moves) {
        // 简单策略：优先占角
        const cornerMoves = moves.filter(([r, c]) => 
            (r < 3 && c < 3) || (r < 3 && c > 15) || 
            (r > 15 && c < 3) || (r > 15 && c > 15)
        );
        if (cornerMoves.length > 0) {
            return cornerMoves[Math.floor(Math.random() * cornerMoves.length)];
        }
        return this.mediumMove(moves);
    }
    
    countLiberties(row, col, player) {
        const visited = new Set();
        const group = [[row, col]];
        visited.add(`${row},${col}`);
        
        for (const [r, c] of group) {
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr, nc = c + dc;
                const key = `${nr},${nc}`;
                if (nr >= 0 && nr < 19 && nc >= 0 && nc < 19) {
                    if (this.game.board[nr][nc] === 0 && !visited.has(key)) {
                        visited.add(key);
                    }
                }
            }
        }
        
        const libs = new Set();
        for (const [r, c] of group) {
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < 19 && nc >= 0 && nc < 19) {
                    if (this.game.board[nr][nc] === 0) {
                        libs.add(`${nr},${nc}`);
                    }
                }
            }
        }
        return libs.size;
    }
}

window.AICompanion = AICompanion;
window.GoAI = GoAI;
window.TsumegoCoach = TsumegoCoach;
