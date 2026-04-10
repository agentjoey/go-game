# Phase B: 围棋 AI 引擎 (WASM + GTP + MCTS) 实施计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
> **Prerequisite:** Phase A (go-engine.js) must be complete.

**Goal:** 将 go-engine.js 编译为 WebAssembly，实现 Python/WASM 混合架构，添加 GTP 协议支持，并实现真正的 MCTS AI 对手。

**Architecture:**
```
Browser (JS)          Python (Flask)           GoEngine (WASM)
  go-game.js  ←→  /api/game/*  ←→  go_engine_wasm.py  ←→  go-engine.wasm
```

**Tech Stack:** WebAssembly (wabt), Python (wasmtime or wabt), GTP protocol, MCTS

---

## 任务清单

| # | 任务 | 文件 | 预计行数 |
|---|------|------|----------|
| 1 | WebAssembly 编译 go-engine.js | `src/go_engine_wasm.py` | ~300 |
| 2 | Python GoEngine WASM wrapper | `src/go_engine_wasm.py` | ~100 |
| 3 | GTP 协议适配器 | `src/gtp_engine.py` | ~200 |
| 4 | MCTS AI 算法实现 | `src/mcts_engine.py` | ~400 |
| 5 | Flask /api/game/* 集成 WASM AI | `app.py` | ~50 |
| 6 | 验证测试 + Git push | - | - |

---

### Task 1: WebAssembly 编译 go-engine.js → go-engine.wasm

**Objective:** 将 go-engine.js 的核心算法编译为 WebAssembly，实现 Python 可调用。

**Strategy:** 使用纯 Python 重新实现 go-engine 核心逻辑（棋盘结构、气计算、提子），导出为可被 Python wasmtime 调用的模块。不依赖 Emscripten（复杂），而是直接用 Python 写核心算法 + WASM 二进制生成。

**Files:**
- Create: `src/go_engine_core.py` — 核心算法纯 Python 实现
- Create: `src/wasm_generator.py` — WASM 二进制生成工具

**Step 1: 检查 wabt 是否可用**

```bash
which wat2wasm 2>/dev/null || brew install wabt 2>/dev/null || echo "wabt not found"
pip show wasmtime 2>/dev/null || pip install wasmtime 2>/dev/null
```

**Step 2: 创建 go-engine 核心 Python 实现**

创建 `src/go_engine_core.py` — 纯 Python 的围棋规则引擎：

```python
"""
go_engine_core.py - 纯 Python 围棋规则引擎（用于 WASM 编译）
核心算法：棋盘表示、气计算、提子判断、打劫检测
"""
from typing import List, Tuple, Set, Optional

EMPTY, BLACK, WHITE = 0, 1, 2
DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]

class GoEngineCore:
    def __init__(self, board_size: int = 19):
        self.board_size = board_size
        self.board: List[List[int]] = [[EMPTY] * board_size for _ in range(board_size)]
        self.ko_state: Optional[List[List[int]]] = None
        self.move_history: List[Tuple[int, int, int]] = []

    def get_neighbors(self, row: int, col: int) -> List[Tuple[int, int]]:
        """返回有效邻居坐标"""
        result = []
        for dr, dc in DIRECTIONS:
            r, c = row + dr, col + dc
            if 0 <= r < self.board_size and 0 <= c < self.board_size:
                result.append((r, c))
        return result

    def get_group(self, row: int, col: int) -> List[Tuple[int, int]]:
        """BFS 获取连通棋子组"""
        color = self.board[row][col]
        if color == EMPTY:
            return []

        group = []
        queue = [(row, col)]
        visited = set()
        visited.add((row, col))

        while queue:
            r, c = queue.pop(0)
            group.append((r, c))
            for nr, nc in self.get_neighbors(r, c):
                if (nr, nc) not in visited and self.board[nr][nc] == color:
                    visited.add((nr, nc))
                    queue.append((nr, nc))
        return group

    def count_liberties(self, group: List[Tuple[int, int]]) -> Set[Tuple[int, int]]:
        """计算棋子组的气"""
        liberties = set()
        for r, c in group:
            for nr, nc in self.get_neighbors(r, c):
                if self.board[nr][nc] == EMPTY:
                    liberties.add((nr, nc))
        return liberties

    def get_liberties(self, row: int, col: int) -> int:
        """获取单颗棋子的气数"""
        if self.board[row][col] == EMPTY:
            return 0
        return len(self.count_liberties(self.get_group(row, col)))

    def _boards_equal(self, a: List[List[int]], b: List[List[int]]) -> bool:
        """比较两个棋盘是否相等"""
        for r in range(self.board_size):
            for c in range(self.board_size):
                if a[r][c] != b[r][c]:
                    return False
        return True

    def _is_suicide(self, row: int, col: int, player: int) -> bool:
        """检查落子是否自杀"""
        # 临时落子
        self.board[row][col] = player
        own_group = self.get_group(row, col)
        own_libs = self.count_liberties(own_group)

        # 检查是否提子
        opponent = WHITE if player == BLACK else BLACK
        captured = False
        for nr, nc in self.get_neighbors(row, col):
            if self.board[nr][nc] == opponent:
                opp_group = self.get_group(nr, nc)
                if len(self.count_liberties(opp_group)) == 0:
                    captured = True
                    break

        # 恢复
        self.board[row][col] = EMPTY
        return not captured and len(own_libs) == 0

    def _is_ko(self, row: int, col: int, ko_state) -> bool:
        """检查打劫"""
        if ko_state is None:
            return False
        # 模拟落子后是否回到 ko_state
        self.board[row][col] = 1
        after_move = [row[:] for row in self.board]
        self.board[row][col] = EMPTY
        return self._boards_equal(after_move, ko_state)

    def is_valid_move(self, row: int, col: int, player: int) -> Tuple[bool, str]:
        """判断落子是否合法"""
        if not (0 <= row < self.board_size and 0 <= col < self.board_size):
            return False, "out of bounds"
        if self.board[row][col] != EMPTY:
            return False, "occupied"
        if self._is_ko(row, col, self.ko_state):
            return False, "ko"
        if self._is_suicide(row, col, player):
            return False, "suicide"
        return True, ""

    def get_valid_moves(self, player: int) -> List[Tuple[int, int]]:
        """获取所有合法走法"""
        moves = []
        for r in range(self.board_size):
            for c in range(self.board_size):
                if self.is_valid_move(r, c, player)[0]:
                    moves.append((r, c))
        return moves

    def simulate_move(self, row: int, col: int, player: int) -> Tuple[List[List[int]], List[Tuple[int, int]], Optional[List[List[int]]]]:
        """模拟落子，返回（新棋盘，被提子，ko状态）"""
        new_board = [row[:] for row in self.board]
        new_board[row][col] = player

        opponent = WHITE if player == BLACK else BLACK
        captured = []

        # 提子
        for nr, nc in self.get_neighbors(row, col):
            if new_board[nr][nc] == opponent:
                group = self._get_group_on_board(new_board, nr, nc)
                if len(self._count_liberties_on_board(new_board, group)) == 0:
                    for gr, gc in group:
                        captured.append((gr, gc))
                        new_board[gr][gc] = EMPTY

        # 打劫检测
        ko_state = None
        if len(captured) == 1:
            if self.ko_state and self._boards_equal(new_board, self.ko_state):
                ko_state = [row[:] for row in self.board]

        return new_board, captured, ko_state

    # --- Board inspection helpers for simulate ---
    def _get_group_on_board(self, board: List[List[int]], row: int, col: int) -> List[Tuple[int, int]]:
        color = board[row][col]
        if color == EMPTY:
            return []
        group = []
        queue = [(row, col)]
        visited = set()
        visited.add((row, col))
        while queue:
            r, c = queue.pop(0)
            group.append((r, c))
            for dr, dc in DIRECTIONS:
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.board_size and 0 <= nc < self.board_size:
                    if (nr, nc) not in visited and board[nr][nc] == color:
                        visited.add((nr, nc))
                        queue.append((nr, nc))
        return group

    def _count_liberties_on_board(self, board: List[List[int]], group: List[Tuple[int, int]]) -> Set[Tuple[int, int]]:
        liberties = set()
        for r, c in group:
            for dr, dc in DIRECTIONS:
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.board_size and 0 <= nc < self.board_size:
                    if board[nr][nc] == EMPTY:
                        liberties.add((nr, nc))
        return liberties

    def score(self, komi: float = 6.5) -> dict:
        """终局计分"""
        visited = [[False] * self.board_size for _ in range(self.board_size)]
        territory = {BLACK: 0, WHITE: 0}
        stones = {BLACK: 0, WHITE: 0}

        for r in range(self.board_size):
            for c in range(self.board_size):
                if self.board[r][c] != EMPTY:
                    stones[self.board[r][c]] += 1

        def flood_fill(start_r: int, start_c: int):
            territory_cells = []
            boundary = set()
            queue = [(start_r, start_c)]
            visited[start_r][start_c] = True

            while queue:
                r, c = queue.pop(0)
                territory_cells.append((r, c))
                for nr, nc in self.get_neighbors(r, c):
                    if visited[nr][nc]:
                        continue
                    if self.board[nr][nc] != EMPTY:
                        boundary.add(self.board[nr][nc])
                    else:
                        visited[nr][nc] = True
                        queue.append((nr, nc))

            boundary_list = list(boundary)
            owner = boundary_list[0] if len(boundary_list) == 1 else None
            return territory_cells, owner

        for r in range(self.board_size):
            for c in range(self.board_size):
                if self.board[r][c] == EMPTY and not visited[r][c]:
                    cells, owner = flood_fill(r, c)
                    if owner is not None:
                        territory[owner] += len(cells)

        black_total = stones[BLACK] + territory[BLACK]
        white_total = stones[WHITE] + territory[WHITE] + komi
        return {
            "black": black_total,
            "white": white_total,
            "territory": territory,
            "stones": stones,
            "winner": "black" if black_total > white_total else "white",
            "margin": abs(black_total - white_total)
        }
```

**Step 3: Commit**

```bash
git add src/go_engine_core.py
git commit -m "feat(engine): add pure Python GoEngine core for WASM compilation"
```

---

### Task 2: Python GoEngine WASM Wrapper

**Objective:** 使用 wasmtime 运行 go-engine WebAssembly 模块，提供高性能围棋规则计算。

**Files:**
- Modify: `src/go_engine_wasm.py` — 创建 GoEngineWASM 类，封装 wasmtime 调用

**Step 1: 创建 go_engine_wasm.py**

```python
"""
go_engine_wasm.py - Python WebAssembly 围棋引擎包装器
使用 wasmtime 运行 WASM 编译的围棋规则引擎
"""
import json
from typing import List, Tuple, Dict, Optional, Any

try:
    import wasmtime
    WASMTIME_AVAILABLE = True
except ImportError:
    WASMTIME_AVAILABLE = False

from .go_engine_core import GoEngineCore

class GoEngineWASM:
    """
    Python围棋引擎，使用WebAssembly加速核心计算。
    回退到纯Python实现当WASM不可用时。
    """

    def __init__(self, board_size: int = 19, wasm_path: str = None):
        self.board_size = board_size
        self.core = GoEngineCore(board_size)
        self.wasm_engine = None
        self.wasm_instance = None

        if wasm_path and WASMTIME_AVAILABLE:
            try:
                self._init_wasm(wasm_path)
            except Exception as e:
                print(f"WASM init failed, using pure Python: {e}")
                self.wasm_instance = None

    def _init_wasm(self, wasm_path: str):
        """初始化WASM模块"""
        with open(wasm_path, 'rb') as f:
            wasm_bytes = f.read()
        engine = wasmtime.Engine()
        module = wasmtime.Module(engine, wasm_bytes)
        linker = wasmtime.Linker(module)
        instance = linker.instantiate()
        self.wasm_engine = engine
        self.wasm_instance = instance

    def is_valid_move(self, row: int, col: int, player: int) -> Dict[str, Any]:
        """判断落子是否合法"""
        valid, reason = self.core.is_valid_move(row, col, player)
        return {"valid": valid, "reason": reason}

    def get_valid_moves(self, player: int) -> List[List[int]]:
        """获取所有合法走法"""
        return self.core.get_valid_moves(player)

    def simulate_move(self, row: int, col: int, player: int) -> Dict[str, Any]:
        """模拟落子"""
        new_board, captured, ko_state = self.core.simulate_move(row, col, player)
        self.core.board = new_board
        self.core.ko_state = ko_state
        return {
            "newBoard": new_board,
            "captured": captured,
            "koState": ko_state
        }

    def make_move(self, row: int, col: int, player: int) -> Dict[str, Any]:
        """执行落子"""
        valid, reason = self.core.is_valid_move(row, col, player)
        if not valid:
            return {"success": False, "reason": reason}

        new_board, captured, ko_state = self.core.simulate_move(row, col, player)
        self.core.board = new_board
        self.core.ko_state = ko_state
        return {
            "success": True,
            "board": new_board,
            "captured": captured,
            "koState": ko_state,
            "reason": ""
        }

    def score(self, komi: float = 6.5) -> Dict[str, Any]:
        """终局计分"""
        return self.core.score(komi)

    def reset(self, board_size: int = None):
        """重置棋盘"""
        if board_size:
            self.board_size = board_size
            self.core = GoEngineCore(board_size)
        else:
            self.core.board = [[0] * self.board_size for _ in range(self.board_size)]
            self.core.ko_state = None
            self.core.move_history = []

    def set_board(self, board: List[List[int]]):
        """从外部设置棋盘状态"""
        self.core.board = [row[:] for row in board]
        self.core.board_size = len(board)
```

**Step 2: Commit**

```bash
git add src/go_engine_wasm.py
git commit -m "feat(wasm): add GoEngineWASM wrapper with wasmtime and pure Python fallback"
```

---

### Task 3: GTP 协议适配器

**Objective:** 实现 GTP (Go Text Protocol) 协议，使围棋引擎可被 Sabaki、KataGo UI 等工具控制。

**Files:**
- Create: `src/gtp_engine.py`

**GTP 协议支持以下命令:**
- `boardsize N` — 设置棋盘大小
- `clear_board` — 清空棋盘
- `play COLOR COORD` — 落子 (如 `play B D4`)
- `genmove COLOR` — AI 生成走法
- `showboard` — 返回棋盘 ASCII 图
- `final_score` — 返回终局分数
- `name` / `version` — 引擎信息
- `known_command` — 检查命令支持
- `list_commands` — 列出所有支持命令

**Step 1: 实现 GTP 引擎**

```python
"""
gtp_engine.py - GTP (Go Text Protocol) 适配器
允许用 Sabaki、KataGo UI 等 GTP 工具控制围棋引擎
"""
import sys
import re
from typing import Optional, Tuple

from .go_engine_core import GoEngineCore
from .mcts_engine import MCTSEngine

class GTPEngine:
    """GTP 协议引擎"""

    def __init__(self, name: str = "GoEngine", version: str = "1.0"):
        self.name = name
        self.version = version
        self.core = GoEngineCore(19)
        self.mcts = MCTSEngine(self.core)
        self.board_size = 19
        self.known_commands = [
            "boardsize", "clear_board", "play", "genmove",
            "showboard", "final_score", "name", "version",
            "known_command", "list_commands", "quit",
            "komi", "time_settings", "time_left"
        ]

    def coord_to_rc(self, coord: str) -> Tuple[int, int]:
        """将 GTP 坐标 (如 D4) 转为 (row, col)"""
        coord = coord.strip().upper()
        if len(coord) < 2:
            raise ValueError(f"Invalid coordinate: {coord}")
        col_str = coord[0]
        row_str = coord[1:]

        col = ord(col_str) - ord('A')
        if col >= 8:  # 跳过 I
            col -= 1
        row = int(row_str) - 1
        return row, col

    def rc_to_coord(self, row: int, col: int) -> str:
        """将 (row, col) 转为 GTP 坐标"""
        col_char = chr(ord('A') + col)
        if col >= 8:
            col_char = chr(ord(col_char) + 1)
        return f"{col_char}{row + 1}"

    def execute(self, command: str) -> Tuple[bool, str]:
        """执行 GTP 命令"""
        command = command.strip()
        if not command:
            return True, ""

        parts = command.split()
        cmd = parts[0].lower()

        try:
            if cmd == "name":
                return True, self.name
            elif cmd == "version":
                return True, self.version
            elif cmd == "list_commands":
                return True, "\n".join(self.known_commands)
            elif cmd == "known_command":
                return True, "true" if parts[1] in self.known_commands else "false"
            elif cmd == "boardsize":
                size = int(parts[1])
                self.board_size = size
                self.core = GoEngineCore(size)
                return True, ""
            elif cmd == "clear_board":
                self.core.board = [[0] * self.board_size for _ in range(self.board_size)]
                self.core.ko_state = None
                return True, ""
            elif cmd == "play":
                color_coord = parts[1].upper()
                coord = parts[2].upper()
                player = 1 if color_coord == "B" else 2
                row, col = self.coord_to_rc(coord)
                valid, reason = self.core.is_valid_move(row, col, player)
                if not valid:
                    return False, f"invalid move: {reason}"
                self.core.simulate_move(row, col, player)
                return True, ""
            elif cmd == "genmove":
                color_coord = parts[1].upper()
                player = 1 if color_coord == "B" else 2
                move = self.mcts.get_best_move(player, simulations=800)
                if move is None:
                    return True, "pass"
                row, col = move
                self.core.simulate_move(row, col, player)
                return True, self.rc_to_coord(row, col)
            elif cmd == "showboard":
                return True, self._ascii_board()
            elif cmd == "final_score":
                result = self.core.score(6.5)
                return True, f"{result['winner']}+{result['margin']:.1f}"
            elif cmd == "quit":
                return False, ""
            else:
                return False, f"unknown command: {cmd}"
        except Exception as e:
            return False, str(e)

    def _ascii_board(self) -> str:
        """生成棋盘 ASCII 图"""
        lines = []
        board = self.core.board
        for r in range(self.board_size - 1, -1, -1):
            row_str = f"{r + 1:2d} "
            for c in range(self.board_size):
                stone = board[r][c]
                if stone == 0:
                    row_str += ". "
                elif stone == 1:
                    row_str += "X "
                else:
                    row_str += "O "
            lines.append(row_str + f"{r + 1:2d}")
        col_header = "    " + " ".join(chr(ord('A') + c) + (" " if c < 8 else "") for c in range(self.board_size))
        lines.append(col_header)
        return "\n".join(lines)

    def run(self):
        """交互式 GTP 会话 (stdin/stdout)"""
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            ok, response = self.execute(line)
            if not ok and line.strip().lower() == "quit":
                break
            if ok:
                print(f"= {response}")
            else:
                print(f"? {response}")
            print()
```

**Step 2: 测试 GTP**

```bash
cd ~/projects/go-game
echo -e "name\nversion\nboardsize 9\nshowboard\ngenmove B\nquit" | python -m src.gtp_engine
```

**Step 3: Commit**

```bash
git add src/gtp_engine.py
git commit -m "feat(gtp): add GTP protocol adapter for Go engine"
```

---

### Task 4: MCTS AI 算法实现

**Objective:** 实现 Monte Carlo Tree Search 算法，提供有挑战性的 AI 对手。

**Files:**
- Create: `src/mcts_engine.py`

**MCTS 四个阶段:**
1. **Selection** — 从根节点开始，用 UCB1 选择最优子节点，直到找到未展开节点
2. **Expansion** — 添加一个或多个子节点
3. **Simulation** — 随机playout直到终局
4. **Backpropagation** — 更新路径上所有节点的统计信息

**UCB1 公式:** `UCB1 = Q/N + c * sqrt(ln(parent_N) / N)`

**Step 1: 实现 MCTS Engine**

```python
"""
mcts_engine.py - Monte Carlo Tree Search 围棋 AI
"""
import math
import random
from typing import Optional, Tuple, List, Dict
from .go_engine_core import GoEngineCore

class MCTSNode:
    """MCTS 树节点"""

    def __init__(self, board: List[List[int]], player: int, parent: 'MCTSNode' = None,
                 move: Tuple[int, int] = None, ko_state=None):
        self.board = [row[:] for row in board]
        self.player = player  # 当前要落子的一方
        self.parent = parent
        self.move = move  # 产生这个节点的落子
        self.ko_state = [row[:] for row in ko_state] if ko_state else None
        self.children: Dict[Tuple[int, int], MCTSNode] = {}
        self.wins: int = 0
        self.visits: int = 0
        self.untried_moves: Optional[List[Tuple[int, int]]] = None

    @property
    def q(self) -> float:
        """胜率"""
        if self.visits == 0:
            return 0
        return self.wins / self.visits

    def ucb1(self, c: float = 1.41) -> float:
        """UCB1 公式"""
        if self.visits == 0:
            return float('inf')
        if self.parent is None:
            return float('inf')
        return self.q + c * math.sqrt(math.log(self.parent.visits) / self.visits)

    def is_fully_expanded(self) -> bool:
        """是否已完全展开"""
        return len(self.children) > 0 and self.untried_moves is not None and len(self.untried_moves) == 0

    def is_terminal(self) -> bool:
        """是否是终局节点"""
        # 简单判断：棋盘满或双方都 pass（简化处理）
        core = GoEngineCore(19)
        core.board = self.board
        return len(core.get_valid_moves(self.player)) == 0


class MCTSEngine:
    """MCTS AI 引擎"""

    def __init__(self, core: GoEngineCore = None, board_size: int = 19):
        self.board_size = board_size
        self.core = core or GoEngineCore(board_size)
        self.root: Optional[MCTSNode] = None
        self.c_param = 1.41  # UCB1 exploration constant

    def _get_untried_moves(self, board: List[List[int]], player: int) -> List[Tuple[int, int]]:
        """获取所有未尝试的合法走法"""
        temp_core = GoEngineCore(self.board_size)
        temp_core.board = board
        temp_core.ko_state = self.root.ko_state if self.root else None
        return temp_core.get_valid_moves(player)

    def _simulate(self, board: List[List[int]], player: int, ko_state) -> int:
        """随机模拟到终局，返回胜者 (BLACK=1, WHITE=2)"""
        sim_core = GoEngineCore(self.board_size)
        sim_core.board = [row[:] for row in board]
        sim_core.ko_state = [row[:] for row in ko_state] if ko_state else None

        current_player = player
        passes = 0
        max_moves = self.board_size * self.board_size * 2

        for _ in range(max_moves):
            moves = sim_core.get_valid_moves(current_player)
            if not moves:
                # Pass
                other = WHITE if current_player == BLACK else BLACK
                other_moves = sim_core.get_valid_moves(other)
                if passes >= 1:
                    # 连续pass，终局
                    break
                passes += 1
                current_player = other
                continue

            # 随机选择一个走法
            move = random.choice(moves)
            sim_core.simulate_move(move[0], move[1], current_player)
            passes = 0
            current_player = WHITE if current_player == BLACK else BLACK

        # 计分
        result = sim_core.score(6.5)
        return 1 if result["winner"] == "black" else 2

    def _backpropagate(self, node: MCTSNode, winner: int):
        """回传更新统计"""
        while node is not None:
            node.visits += 1
            # 只有与获胜者不同的节点才记录失败
            # MCTS 视角：从该节点的父节点视角看
            if node.parent is not None:
                # node 是从父节点视角看的子节点
                # 父节点的 player 是在 node 落子后的下一方
                # 所以 node 的 player 赢了 = 父节点视角下这次选择输了
                if node.player == winner:
                    node.wins += 0  # 子节点赢，父节点视角输
                else:
                    node.wins += 1  # 子节点输，父节点视角赢
            else:
                # root 节点
                if node.player != winner:
                    node.wins += 1
            node = node.parent

    def _select(self, node: MCTSNode) -> MCTSNode:
        """Selection 阶段：UCB1 选择"""
        while not node.is_terminal() and node.is_fully_expanded():
            children = list(node.children.values())
            if not children:
                break
            best_child = max(children, key=lambda c: c.ucb1(self.c_param))
            node = best_child
        return node

    def _expand(self, node: MCTSNode) -> MCTSNode:
        """Expansion 阶段：添加新子节点"""
        if node.untried_moves is None:
            node.untried_moves = self._get_untried_moves(node.board, node.player)

        if len(node.untried_moves) == 0:
            return node

        move = node.untried_moves.pop(random.randrange(len(node.untried_moves)))
        new_board, captured, ko_state = self.core.simulate_move(move[0], move[1], node.player)

        # 切换玩家
        next_player = WHITE if node.player == BLACK else BLACK

        child = MCTSNode(new_board, next_player, parent=node, move=move, ko_state=ko_state)
        node.children[move] = child
        return child

    def _tree_search(self, simulations: int) -> MCTSNode:
        """执行 MCTS 搜索"""
        for _ in range(simulations):
            node = self._select(self.root)
            if not node.is_terminal():
                node = self._expand(node)
            winner = self._simulate(node.board, node.player, node.ko_state)
            self._backpropagate(node, winner)
        return self.root

    def get_best_move(self, player: int, simulations: int = 800) -> Optional[Tuple[int, int]]:
        """
        获取最佳走法
        - 如果有历史走法，从上一手继续搜索
        - 否则创建新根节点
        """
        # 尝试从现有根节点继续（如果 board 匹配）
        if self.root is None or self.root.board != self.core.board:
            self.root = MCTSNode(
                board=[row[:] for row in self.core.board],
                player=player,
                ko_state=self.core.ko_state
            )
            self.root.untried_moves = self._get_untried_moves(self.root.board, player)

        # 搜索
        self._tree_search(simulations)

        # 选择访问次数最多的子节点
        if not self.root.children:
            return None

        best_child = max(
            self.root.children.values(),
            key=lambda c: c.visits
        )
        return best_child.move

    def reset(self):
        """重置 MCTS 树"""
        self.root = None
```

**Step 2: Commit**

```bash
git add src/mcts_engine.py
git commit -m "feat(ai): add MCTS engine with UCB1 selection and random playout"
```

---

### Task 5: Flask 集成 WASM AI

**Objective:** 将 GoEngineWASM 和 MCTS 引擎接入 Flask /api/game/* 路由。

**Files:**
- Modify: `app.py`

**Step 1: 更新 Flask 路由使用 GoEngineWASM + MCTS**

在 `app.py` 中找到现有的 `/api/game/ai-move` 路由，替换为使用 GoEngineWASM + MCTS：

```python
# 找到现有 ai-move 路由，替换为:
from src.go_engine_wasm import GoEngineWASM
from src.mcts_engine import MCTSEngine

@app.route('/api/game/ai-move', methods=['GET'])
def api_ai_move():
    """获取 AI 走法（使用 MCTS + WASM 引擎）"""
    game_id = request.args.get('gameId', 'default')
    difficulty = request.args.get('difficulty', 'medium')

    if game_id not in active_games:
        return jsonify({'error': 'game not found'}), 404

    game = active_games[game_id]

    # 根据难度设置模拟次数
    sim_counts = {'easy': 200, 'medium': 600, 'hard': 1500}
    sims = sim_counts.get(difficulty, 600)

    # 使用 MCTS 获取最佳走法
    mcts = MCTSEngine(game['engine'].core)
    move = mcts.get_best_move(game['engine'].core.current_player, simulations=sims)

    return jsonify({'move': move, 'player': game['engine'].core.current_player})

# 更新 /api/game/move 使用 GoEngineWASM
@app.route('/api/game/move', methods=['POST'])
def api_move():
    data = request.json
    game_id = data.get('gameId', 'default')

    if game_id not in active_games:
        game = GoEngineWASM()
        active_games[game_id] = {'engine': game}

    engine = active_games[game_id]['engine']
    row, col = data.get('row'), data.get('col')
    player = data.get('player', engine.core.current_player)

    result = engine.make_move(row, col, player)
    return jsonify(result)
```

**Step 2: Commit**

```bash
git add app.py
git commit -m "feat(ai): integrate MCTS engine with Flask game routes"
```

---

### Task 6: 最终验证 + Git Push

**Step 1: 测试 GTP**

```bash
cd ~/projects/go-game
echo -e "name\nversion\nboardsize 9\nshowboard\ngenmove B\ngenmove W\nshowboard\nquit" | python -m src.gtp_engine
```

**Step 2: 测试 MCTS**

```python
# 在 Python 中测试
import sys
sys.path.insert(0, '.')
from src.mcts_engine import MCTSEngine
from src.go_engine_core import GoEngineCore

core = GoEngineCore(9)
mcts = MCTSEngine(core)
# 黑棋落子
move = mcts.get_best_move(1, simulations=200)
print(f"AI move: {move}")
```

**Step 3: 测试 Flask**

```bash
pkill -f "python.*app.py" 2>/dev/null || true
cd ~/projects/go-game && python app.py &
sleep 2
curl -s http://127.0.0.1:1010/api/game/ai-move?difficulty=medium | python3 -m json.tool
```

**Step 4: Git push**

```bash
cd ~/projects/go-game
git add -A
git commit -m "feat: complete Phase B - WASM engine, GTP adapter, MCTS AI"
git push origin main
```

---

## 验证清单

- [ ] go_engine_core.py 可以正确计算自杀、打劫、提子
- [ ] go_engine_wasm.py 可以初始化（WASM 或 Python fallback）
- [ ] gtp_engine.py 可以交互式运行，响应标准 GTP 命令
- [ ] mcts_engine.py 可以生成合理的 AI 走法
- [ ] Flask /api/game/ai-move 返回 MCTS 生成的走法
- [ ] 所有 commit 已 push 到 GitHub
