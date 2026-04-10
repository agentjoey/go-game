"""
mcts_engine.py - Monte Carlo Tree Search 围棋 AI
"""
import math
import random
from typing import Optional, Tuple, List, Dict

from go_engine_core import GoEngineCore

# 常量
BLACK = 1
WHITE = 2
EMPTY = 0


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
        core = GoEngineCore(len(self.board))
        core.board = self.board
        return len(core.get_valid_moves(self.player)) == 0


class MCTSEngine:
    """MCTS AI 引擎"""

    def __init__(self, core: GoEngineCore = None, board_size: int = 19):
        self.board_size = board_size
        self.core = core or GoEngineCore(board_size)
        self.root: Optional[MCTSNode] = None
        self.c_param = 1.41  # UCB1 exploration constant

    def _get_untried_moves(self, board: List[List[int]], player: int, ko_state) -> List[Tuple[int, int]]:
        """获取所有未尝试的合法走法（复用 core 实例）"""
        self.core.board = [row[:] for row in board]
        self.core.ko_state = [row[:] for row in ko_state] if ko_state else None
        return self.core.get_valid_moves(player)

    def _simulate(self, board: List[List[int]], player: int, ko_state) -> int:
        """随机模拟到终局，返回胜者 (BLACK=1, WHITE=2)"""
        sim_board = [row[:] for row in board]
        sim_ko = [row[:] for row in ko_state] if ko_state else None
        board_size = len(board)

        current_player = player
        passes = 0
        max_moves = board_size * board_size * 2

        for _ in range(max_moves):
            # 快速获取空位（MCTS 随机模拟用 fast 版本，跳过复杂验证）
            empty_spots = []
            for r in range(board_size):
                for c in range(board_size):
                    if sim_board[r][c] == EMPTY:
                        empty_spots.append((r, c))

            if not empty_spots:
                # 连续 pass，终局
                break

            # 随机选择一个走法
            move = random.choice(empty_spots)
            new_board, captured, new_ko = self.core.simulate_move(move[0], move[1], current_player)
            sim_board = new_board
            sim_ko = new_ko
            passes = 0
            current_player = WHITE if current_player == BLACK else BLACK

        # 计分
        self.core.board = sim_board
        self.core.ko_state = sim_ko
        result = self.core.score(6.5)
        return 1 if result["winner"] == "black" else 2

    def _backpropagate(self, node: MCTSNode, winner: int):
        """回传更新统计"""
        while node is not None:
            node.visits += 1
            # 只有与获胜者不同的节点才记录胜利
            # node.player 是要落子的一方，如果 winner != node.player，说明 node 的玩家输了
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
            node.untried_moves = self._get_untried_moves(node.board, node.player, node.ko_state)

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
            self.root.untried_moves = self._get_untried_moves(self.root.board, player, self.root.ko_state)

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
