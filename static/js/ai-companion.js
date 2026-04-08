/**
 * AI 棋伴系统 - Phase 1
 */

class AICompanion {
    constructor(type = 'adai') {
        this.type = type;
        this.name = this.getName();
        this.emoji = this.getEmoji();
        this.messages = this.getMessages();
        this.lastMessage = null;
        this.thinking = false;
    }
    
    getName() {
        const names = {
            adai: '阿呆',
            xiaozhi: '小智',
            youyou: '悠悠'
        };
        return names[this.type] || '阿呆';
    }
    
    getEmoji() {
        const emojis = {
            adai: '🐼',
            xiaozhi: '🦊',
            youyou: '🐱'
        };
        return emojis[this.type] || '🐼';
    }
    
    getMessages() {
        return {
            // 阿呆 - 温和鼓励型
            adai: {
                thinking: ['让我想想...', '这一步...有意思', '嗯...'],
                surprise: ['哇！这步棋我没注意到！', '哎呀，你好厉害！', '这手棋教教我呗~'],
                good: ['这步棋不错！', '你比昨天又进步了呢~', '继续保持！'],
                bad: ['没关系，慢慢来~', '这步棋可以再想想', '别灰心，我们一起加油！'],
                capture: ['啊！我的子！', '被你吃掉了呢~', '没关系，再来~'],
                lose: ['你赢了！好厉害~', '这盘棋下得很棒！', '我学到了很多！'],
                win: ['这盘我赢了，但你下得很认真！', '这次我认真了一点~', '再来一盘吧！'],
                encourage: ['今天状态不错！', '我们慢慢下，享受围棋~', '每一步都在进步呢~']
            },
            // 小智 - 挑战型
            xiaozhi: {
                thinking: ['哼哼...', '这步我看到了！', '让我好好想想~'],
                surprise: ['什么！？我没看错吧！', '这步...有点东西', '嘿，还挺有两下子！'],
                good: ['不错不错，能看穿我的陷阱了！', '有点意思！', '这步棋有点水平！'],
                bad: ['嘿嘿，这步可不太行哦~', '在想什么呢？', '让我给你挖个坑~'],
                capture: ['哈哈！中计了吧！', '这叫战术！', '落在我手里了吧~'],
                lose: ['这次算你狠！', '下次我不会再让着你了！', '好，你赢了，但只是这次！'],
                win: ['哈！我赢了！', '说了要认真起来的吧~', '这盘我状态不错！'],
                encourage: ['不错不错！', '再来挑战我！', '有点意思~']
            },
            // 悠悠 - 冷静型
            youyou: {
                thinking: ['嗯...', '让我思考一下', '...'],
                surprise: ['妙手。', '这一步，有些意思。', '有趣。'],
                good: ['善。', '这步棋不错。', '有棋理。'],
                bad: ['还需斟酌。', '此处值得思考。', '...'],
                capture: ['.', '得。', '简明。'],
                lose: ['你赢了。', '承让。', '此局，你更优。'],
                win: ['我胜。', '形势如此。', '大局已定。'],
                encourage: ['善战者，求之于势。', '不急不躁，方为正道。', '棋如人生，需细细品味。']
            }
        };
    }
    
    showMessage(type) {
        const msgList = this.messages[type];
        if (!msgList || msgList.length === 0) return '';
        
        const msg = msgList[Math.floor(Math.random() * msgList.length)];
        this.lastMessage = { text: msg, type: type, time: Date.now() };
        return msg;
    }
    
    getBubbleHTML() {
        if (!this.lastMessage) return '';
        return `<div class="ai-bubble ${this.lastMessage.type}">${this.emoji} ${this.lastMessage.text}</div>`;
    }
    
    getThinkingHTML() {
        return `<div class="ai-bubble thinking">${this.emoji} 思考中... <span class="dots">...</span></div>`;
    }
}

// AI 对手逻辑
class GoAI {
    constructor(game, difficulty = 'easy') {
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
                    if (!this.isKo(r, c)) {
                        moves.push([r, c]);
                    }
                }
            }
        }
        return moves;
    }
    
    isKo(r, c) {
        // 简化打劫检测
        return false;
    }
    
    easyMove(moves) {
        // 随机选择
        return moves[Math.floor(Math.random() * moves.length)];
    }
    
    mediumMove(moves) {
        let best = moves[0];
        let bestScore = -9999;
        
        for (const [r, c] of moves) {
            let score = 0;
            
            // 吃子优先
            const captures = this.game.checkCaptures(3 - this.game.currentPlayer);
            score += captures.length * 100;
            
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
            
            // 添加随机性
            score += Math.random() * 10;
            
            if (score > bestScore) {
                bestScore = score;
                best = [r, c];
            }
        }
        return best;
    }
    
    hardMove(moves) {
        // 在 medium 基础上增加防守评估
        const move = this.mediumMove(moves);
        return move;
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
                        group.push([nr, nc]);
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
