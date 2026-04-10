# Phase A: 围棋规则引擎 (go-engine.js) 实施计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 创建独立的前端围棋规则引擎 `go-engine.js`，消除 `go-game.js` 中的规则 bug，并为 AI 策略层提供可靠的规则 API。

**Architecture:** 将围棋规则完全独立为纯 JS 模块，暴露标准化 API（isValidMove、getValidMoves、simulateMove、score），前端游戏逻辑和 AI 策略均调用此引擎。同时在 Flask 后端添加 `/api/game/*` 验证路由作为双保险。

**Tech Stack:** Vanilla JavaScript (ES6+), Flask/Python

---

## 任务清单

| # | 任务 | 文件 | 预计行数 |
|---|------|------|----------|
| 1 | 创建 go-engine.js 骨架 | `static/js/go-engine.js` | ~30 |
| 2 | 实现 getNeighbors + getGroup | `static/js/go-engine.js` | ~25 |
| 3 | 实现 countLiberties | `static/js/go-engine.js` | ~10 |
| 4 | 实现 isValidMove（含自杀+打劫） | `static/js/go-engine.js` | ~30 |
| 5 | 实现 getValidMoves | `static/js/go-engine.js` | ~10 |
| 6 | 实现 simulateMove（返回新棋盘+提子） | `static/js/go-engine.js` | ~35 |
| 7 | 实现 score（终局计算） | `static/js/go-engine.js` | ~30 |
| 8 | 添加 Flask /api/game/* 路由 | `app.py` | ~50 |
| 9 | 重写 go-game.js 使用 go-engine | `static/js/go-game.js` | ~40 |
| 10 | 验证测试 + Git 提交 | - | - |

---

### Task 1: 创建 go-engine.js 骨架

**Objective:** 创建空壳模块，定义常量，导出全局对象。

**Files:**
- Create: `static/js/go-engine.js`

**Step 1: Write skeleton code**

```javascript
/**
 * go-engine.js - 围棋规则引擎
 * Phase A: 独立规则引擎
 * 约定: 1=黑棋, 2=白棋, 0=空
 */

class GoEngine {
    static EMPTY = 0;
    static BLACK = 1;
    static WHITE = 2;
    static DIRECTIONS = [[-1,0],[1,0],[0,-1],[0,1]];

    constructor(boardSize = 19) {
        this.boardSize = boardSize;
    }

    // 方法将在后续任务中实现
}

window.GoEngine = GoEngine;
```

**Step 2: Commit**

```bash
git add static/js/go-engine.js
git commit -m "feat(engine): create go-engine.js skeleton with constants"
```

---

### Task 2: 实现 getNeighbors + getGroup

**Objective:** 提供获取邻居坐标和棋子组的工具方法。

**Files:**
- Modify: `static/js/go-engine.js` — 在 constructor 后添加方法

**Step 1: Write test**

```javascript
// 在浏览器控制台或 test file 中运行:
const engine = new GoEngine(9);
const board = [
    [0,0,0,0,0],
    [0,1,1,0,0],
    [0,1,0,2,0],
    [0,0,0,0,0],
];
engine.board = board;
engine.boardSize = 5;

// 测试 getNeighbors
const neighbors = engine.getNeighbors(2, 2); // 应返回4个邻居坐标

// 测试 getGroup — 黑棋在(1,1)处
const group = engine.getGroup(1, 1); // 应返回{(1,1),(1,2)}
```

**Step 2: Write implementation — 在 `static/js/go-engine.js` 中添加:**

```javascript
    getNeighbors(row, col) {
        const neighbors = [];
        for (const [dr, dc] of this.constructor.DIRECTIONS) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                neighbors.push([r, c]);
            }
        }
        return neighbors;
    }

    getGroup(row, col) {
        const color = this.board[row][col];
        if (color === this.constructor.EMPTY) return [];

        const group = [];
        const queue = [[row, col]];
        const visited = new Set();
        visited.add(`${row},${col}`);

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            group.push([r, c]);

            for (const [nr, nc] of this.getNeighbors(r, c)) {
                const key = `${nr},${nc}`;
                if (!visited.has(key) && this.board[nr][nc] === color) {
                    visited.add(key);
                    queue.push([nr, nc]);
                }
            }
        }
        return group;
    }
```

**Step 3: Commit**

```bash
git add static/js/go-engine.js
git commit -m "feat(engine): add getNeighbors and getGroup methods"
```

---

### Task 3: 实现 countLiberties

**Objective:** 计算指定棋子组的气数。

**Files:**
- Modify: `static/js/go-engine.js`

**Step 1: Write implementation — 添加方法:**

```javascript
    /**
     * 计算棋子组的气数
     * @param {Array} group - getGroup() 返回的棋子组 [[r,c], ...]
     * @returns {Set} 气坐标集合
     */
    countLiberties(group) {
        const liberties = new Set();
        for (const [r, c] of group) {
            for (const [nr, nc] of this.getNeighbors(r, c)) {
                if (this.board[nr][nc] === this.constructor.EMPTY) {
                    liberties.add(`${nr},${nc}`);
                }
            }
        }
        return liberties;
    }

    /**
     * 获取单颗棋子的气数（便捷方法）
     */
    getLiberties(row, col) {
        if (this.board[row][col] === this.constructor.EMPTY) return 0;
        const group = this.getGroup(row, col);
        return this.countLiberties(group).size;
    }
```

**Step 2: Commit**

```bash
git add static/js/go-engine.js
git commit -m "feat(engine): add countLiberties and getLiberties"
```

---

### Task 4: 实现 isValidMove（含自杀 + 打劫检测）

**Objective:** 判断落子是否合法，正确处理自杀禁着和打劫禁着。

**Files:**
- Modify: `static/js/go-engine.js`
- Modify: `src/go_game.py` — 获取 ko_state 用于打劫检测

**重要规则说明:**
1. **自杀禁着**: 落子后若无气且未提子，则非法
2. **打劫禁着**: 落子只提一子，且恢复到上一手棋盘状态，则非法

**Step 1: Write implementation — 添加方法:**

```javascript
    /**
     * 检查落子是否为自杀
     * @param {number} row
     * @param {number} col
     * @param {number} player - BLACK=1 或 WHITE=2
     * @returns {boolean}
     */
    _isSuicide(row, col, player) {
        // 临时落子
        this.board[row][col] = player;

        // 检查自己棋子组是否有气
        const ownGroup = this.getGroup(row, col);
        const ownLibs = this.countLiberties(ownGroup);

        // 检查是否提了对方的子
        const opponent = player === this.constructor.BLACK
            ? this.constructor.WHITE
            : this.constructor.BLACK;
        let captured = false;

        for (const [nr, nc] of this.getNeighbors(row, col)) {
            if (this.board[nr][nc] === opponent) {
                const oppGroup = this.getGroup(nr, nc);
                if (this.countLiberties(oppGroup).size === 0) {
                    captured = true;
                    break;
                }
            }
        }

        // 恢复棋盘
        this.board[row][col] = this.constructor.EMPTY;

        // 无气且未提子 = 自杀
        return !captured && ownLibs.size === 0;
    }

    /**
     * 检查落子是否为打劫（需要 koState 历史状态）
     * @param {number} row
     * @param {number} col
     * @param {Array} koState - 上一手棋盘状态（2D数组），无打劫时为 null
     * @returns {boolean}
     */
    _isKo(row, col, koState) {
        if (!koState) return false;
        // 模拟落子后是否恢复到 koState
        const temp = this.board[row][col];
        this.board[row][col] = 1; // 任意非空值模拟落子
        const afterMove = this.board.map(row => [...row]);
        this.board[row][col] = temp;

        // 比较 afterMove 和 koState
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (afterMove[r][c] !== koState[r][c]) return false;
            }
        }
        return true;
    }

    /**
     * 判断落子是否合法
     * @param {number} row
     * @param {number} col
     * @param {number} player
     * @param {Array} koState - 上一手棋盘状态
     * @returns {{valid: boolean, reason: string}}
     */
    isValidMove(row, col, player, koState = null) {
        // 边界检查
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
            return { valid: false, reason: '超出棋盘范围' };
        }
        // 位置非空
        if (this.board[row][col] !== this.constructor.EMPTY) {
            return { valid: false, reason: '该位置已有棋子' };
        }
        // 打劫检测
        if (this._isKo(row, col, koState)) {
            return { valid: false, reason: '打劫禁着' };
        }
        // 自杀检测
        if (this._isSuicide(row, col, player)) {
            return { valid: false, reason: '自杀禁着' };
        }
        return { valid: true, reason: '' };
    }
```

**Step 2: 更新 GoEngine 构造函数保存 koState:**

```javascript
    constructor(boardSize = 19) {
        this.boardSize = boardSize;
        this.board = Array.from({ length: boardSize }, () => Array(boardSize).fill(GoEngine.EMPTY));
        this.koState = null;  // 打劫状态
    }
```

**Step 3: Commit**

```bash
git add static/js/go-engine.js
git commit -m "feat(engine): add isValidMove with suicide and ko detection"
```

---

### Task 5: 实现 getValidMoves

**Objective:** 返回所有合法落子位置的列表。

**Files:**
- Modify: `static/js/go-engine.js`

**Step 1: Write implementation — 添加方法:**

```javascript
    /**
     * 获取所有合法走法
     * @param {number} player
     * @returns {Array} [[row,col], ...]
     */
    getValidMoves(player) {
        const moves = [];
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.isValidMove(r, c, player, this.koState).valid) {
                    moves.push([r, c]);
                }
            }
        }
        return moves;
    }
```

**Step 2: Commit**

```bash
git add static/js/go-engine.js
git commit -m "feat(engine): add getValidMoves"
```

---

### Task 6: 实现 simulateMove

**Objective:** 模拟落子，返回新棋盘状态和提子信息（不修改原始棋盘）。

**Files:**
- Modify: `static/js/go-engine.js`

**Step 1: Write implementation — 添加方法:**

```javascript
    /**
     * 模拟落子，返回结果（不修改原始棋盘）
     * @param {number} row
     * @param {number} col
     * @param {number} player
     * @returns {{newBoard: Array, captured: Array, koState: Array|null}}
     *   - newBoard: 落子后的棋盘副本
     *   - captured: 被提掉的棋子坐标 [[r,c], ...]
     *   - koState: 打劫状态（若无则为 null）
     */
    simulateMove(row, col, player) {
        // 深拷贝棋盘
        const newBoard = this.board.map(r => [...r]);

        // 落子
        newBoard[row][col] = player;

        // 提子
        const captured = [];
        const opponent = player === this.constructor.BLACK
            ? this.constructor.WHITE
            : this.constructor.BLACK;
        const koCandidates = [];

        for (const [nr, nc] of this.getNeighbors(row, col)) {
            if (newBoard[nr][nc] === opponent) {
                // 临时模拟检查是否无气
                const saved = newBoard[nr][nc];
                newBoard[nr][nc] = this.constructor.EMPTY;
                const tempEngine = this._createEngineWithBoard(newBoard);
                const libs = tempEngine.countLiberties(tempEngine.getGroup(nr, nc));
                newBoard[nr][nc] = saved;

                if (this._wouldHaveNoLiberties(newBoard, nr, nc, opponent)) {
                    const group = this._getGroupOnBoard(newBoard, nr, nc);
                    for (const [gr, gc] of group) {
                        captured.push([gr, gc]);
                        newBoard[gr][gc] = this.constructor.EMPTY;
                    }
                }
            }
        }

        // 检查打劫
        let koState = null;
        if (captured.length === 1) {
            // 只有一个子被提，检查是否回到上一步
            if (this.koState && this._boardsEqual(newBoard, this.koState)) {
                koState = this.board.map(r => [...r]); // 落子前的状态作为新 koState
            }
        }

        return { newBoard, captured, koState };
    }

    // --- 私有辅助方法 ---

    _boardsEqual(a, b) {
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (a[r][c] !== b[r][c]) return false;
            }
        }
        return true;
    }

    _wouldHaveNoLiberties(board, row, col, color) {
        const engine = this._createEngineWithBoard(board);
        const group = engine.getGroup(row, col);
        return engine.countLiberties(group).size === 0;
    }

    _getGroupOnBoard(board, row, col) {
        const engine = this._createEngineWithBoard(board);
        return engine.getGroup(row, col);
    }

    _createEngineWithBoard(board) {
        const e = new GoEngine(this.boardSize);
        e.board = board;
        return e;
    }
```

**Step 2: Commit**

```bash
git add static/js/go-engine.js
git commit -m "feat(engine): add simulateMove with capture and ko detection"
```

---

### Task 7: 实现 score（终局计算）

**Objective:** 实现洪水填充算法计算领地，统计终局分数。

**Files:**
- Modify: `static/js/go-engine.js`

**Step 1: Write implementation — 添加方法:**

```javascript
    /**
     * 终局计分（中国规则 + 贴 6.5 目）
     * @param {number} komi - 贴目数（默认 6.5）
     * @returns {{black: number, white: number, territory: {black: number, white: number}, winner: string}}
     */
    score(komi = 6.5) {
        const visited = Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(false));
        const territory = { [this.constructor.BLACK]: 0, [this.constructor.WHITE]: 0 };
        const stones = { [this.constructor.BLACK]: 0, [this.constructor.WHITE]: 0 };

        // 统计活子
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] !== this.constructor.EMPTY) {
                    stones[this.board[r][c]]++;
                }
            }
        }

        // 洪水填充找领地
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] === this.constructor.EMPTY && !visited[r][c]) {
                    const { territory: terr, owner } = this._floodFill(r, c, visited);
                    if (owner !== null) {
                        territory[owner] += terr.size;
                    }
                }
            }
        }

        const blackTotal = stones[this.constructor.BLACK] + territory[this.constructor.BLACK];
        const whiteTotal = stones[this.constructor.WHITE] + territory[this.constructor.WHITE] + komi;

        return {
            black: blackTotal,
            white: whiteTotal,
            territory,
            stones,
            winner: blackTotal > whiteTotal ? 'black' : 'white',
            margin: Math.abs(blackTotal - whiteTotal)
        };
    }

    /**
     * 洪水填充：找出一片空白区域及其所属颜色
     */
    _floodFill(startRow, startCol, visited) {
        const territory = new Set();
        const boundary = new Set(); // 接触的颜色
        const queue = [[startRow, startCol]];

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const key = `${r},${c}`;

            if (visited[r][c]) continue;
            if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) continue;

            if (this.board[r][c] !== this.constructor.EMPTY) {
                boundary.add(this.board[r][c]);
                continue;
            }

            visited[r][c] = true;
            territory.add(key);

            for (const [nr, nc] of this.getNeighbors(r, c)) {
                if (!visited[nr][nc]) {
                    queue.push([nr, nc]);
                }
            }
        }

        // 只被一种颜色包围则归属该颜色，否则中立
        const boundaryArr = [...boundary];
        const owner = boundaryArr.length === 1 ? boundaryArr[0] : null;

        // 将 Set 转为坐标数组
        const territoryArr = [...territory].map(k => k.split(',').map(Number));

        return { territory: new Set(territoryArr), owner };
    }
```

**Step 2: Commit**

```bash
git add static/js/go-engine.js
git commit -m "feat(engine): add score with flood-fill territory calculation"
```

---

### Task 8: 添加 Flask /api/game/* 验证路由

**Objective:** 在后端添加验证 API，前端落子前可先请求后端验证（双保险）。

**Files:**
- Modify: `app.py`

**Step 1: Write implementation — 在 app.py 末尾添加:**

```python
import json
from flask import jsonify, request

# 围棋规则引擎（复用 src/go_game.py）
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from go_game import GoGame

# 存储活跃游戏（生产环境用 Redis）
active_games = {}

@app.route('/api/game/validate', methods=['POST'])
def api_validate():
    """验证落子是否合法"""
    data = request.json
    game_id = data.get('gameId', 'default')

    if game_id not in active_games:
        active_games[game_id] = GoGame()

    game = active_games[game_id]
    row, col = data.get('row'), data.get('col')
    player = data.get('player')  # 1=black, 2=white

    # 临时落子检查
    game.board[row][col] = player
    valid = game.is_valid_move(row, col)
    game.board[row][col] = 0  # 恢复

    return jsonify({
        'valid': valid,
        'gameId': game_id,
        'currentPlayer': game.current_player
    })

@app.route('/api/game/move', methods=['POST'])
def api_move():
    """执行落子"""
    data = request.json
    game_id = data.get('gameId', 'default')

    if game_id not in active_games:
        active_games[game_id] = GoGame()

    game = active_games[game_id]
    row, col = data.get('row'), data.get('col')

    success, msg = game.make_move(row, col)
    return jsonify({
        'success': success,
        'message': msg,
        'board': game.board,
        'captured': game.captured,
        'currentPlayer': game.current_player,
        'moveHistory': game.move_history
    })

@app.route('/api/game/valid-moves', methods=['GET'])
def api_valid_moves():
    """获取所有合法走法"""
    game_id = request.args.get('gameId', 'default')

    if game_id not in active_games:
        active_games[game_id] = GoGame()

    game = active_games[game_id]
    moves = game.get_valid_moves()
    return jsonify({'moves': moves, 'player': game.current_player})

@app.route('/api/game/ai-move', methods=['GET'])
def api_ai_move():
    """获取 AI 走法（调用 Python GoAI）"""
    from go_game import GoAI
    game_id = request.args.get('gameId', 'default')
    difficulty = request.args.get('difficulty', 'medium')

    if game_id not in active_games:
        active_games[game_id] = GoGame()

    game = active_games[game_id]
    ai = GoAI(difficulty)
    move = ai.get_move(game, show_animation=False)

    return jsonify({'move': move, 'player': game.current_player})
```

**Step 2: Commit**

```bash
git add app.py
git commit -m "feat(api: add /api/game/* validation routes for go engine)"
```

---

### Task 9: 重写 go-game.js 使用 go-engine

**Objective:** 用新规则引擎替换 `go-game.js` 中有 bug 的 `placeStone` 和 `checkCaptures` 方法。

**Files:**
- Modify: `static/js/go-game.js`

**关键变更:**
1. `constructor` 中初始化 `this.engine = new GoEngine(this.boardSize)`
2. `placeStone` 改为调用 `this.engine.isValidMove()`
3. `checkCaptures` 改为调用 `this.engine.simulateMove()`
4. `makeAIMove` 改为调用 `/api/game/ai-move`

**Step 1: Modify — 找到 `placeStone` 方法，替换为:**

```javascript
    placeStone(row, col, player) {
        const result = this.engine.isValidMove(row, col, player, this.engine.koState);
        if (!result.valid) {
            console.warn('Invalid move:', result.reason);
            return false;
        }

        // 使用 simulateMove 获取结果
        const { newBoard, captured } = this.engine.simulateMove(row, col, player);

        // 更新棋盘和提子
        this.engine.board = newBoard;
        this.gameState = newBoard;

        if (captured.length > 0) {
            this.captures[player] += captured.length;
            this.board.playCaptureAnimation(captured);
        }

        // 更新 ko 状态
        const simResult = this.engine.simulateMove(row, col, player);
        this.engine.koState = simResult.koState;

        return true;
    }
```

**Step 2: Commit**

```bash
git add static/js/go-game.js
git commit -m "feat(game): integrate go-engine for rule validation"
```

---

### Task 10: 最终验证 + Push

**Step 1: 启动服务测试**

```bash
cd ~/projects/go-game
python app.py &
sleep 2
curl -s http://127.0.0.1:1010/api/game/valid-moves | python3 -m json.tool | head -20
```

**Step 2: Push 到 GitHub**

```bash
git push origin main
```

---

## 验证清单

- [ ] go-engine.js 可以正确判断自杀禁着
- [ ] go-engine.js 可以正确判断打劫禁着
- [ ] go-engine.js 可以正确计算提子
- [ ] go-engine.js 可以正确计算终局分数
- [ ] Flask /api/game/validate 返回正确结果
- [ ] go-game.js 使用 go-engine 后落子逻辑正确
- [ ] 所有 commit 已 push 到 GitHub
