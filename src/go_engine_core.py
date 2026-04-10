"""
go_engine_core.py - Pure Python Go Engine Core
"""

import copy
from typing import List, Tuple, Set, Optional

# 常量
EMPTY = 0
BLACK = 1
WHITE = 2

# 方向向量 (上, 下, 左, 右)
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

    def get_valid_moves_fast(self, player: int) -> List[Tuple[int, int]]:
        """快速获取合法走法（跳过 ko/suicide 检测，用于 MCTS 模拟）"""
        moves = []
        for r in range(self.board_size):
            for c in range(self.board_size):
                if self.board[r][c] == EMPTY:
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
