#!/usr/bin/env python3
"""
Go Game (围棋) - A complete implementation in Python
19x19 board, black and white players, basic Go rules implemented.
With AI support - three difficulty levels: easy, medium, hard
"""

import os
import copy
import random
import time
import threading
import sys


class GoGame:
    """围棋游戏类"""
    
    # 棋盘常量
    EMPTY = 0
    BLACK = 1
    WHITE = 2
    BOARD_SIZE = 19
    
    # 方向向量 (上, 下, 左, 右)
    DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    # 星位坐标
    STAR_POINTS = [3, 9, 15]
    
    # 开局重要点（角部星位、小目、目外等）
    OPENING_PRIORITY_POINTS = [
        # 四角星位
        (3, 3), (3, 15), (15, 3), (15, 15),
        # 四角小目
        (3, 5), (3, 13), (5, 3), (5, 15), (13, 3), (13, 15), (15, 5), (15, 13),
        # 四角目外
        (3, 7), (3, 11), (7, 3), (7, 15), (11, 3), (11, 15), (15, 7), (15, 11),
        # 边角3-3
        (2, 2), (2, 16), (16, 2), (16, 16),
        # 天元
        (9, 9),
        # 四边星位附近
        (3, 9), (9, 3), (9, 15), (15, 9),
    ]
    
    def __init__(self):
        self.board = [[self.EMPTY for _ in range(self.BOARD_SIZE)] for _ in range(self.BOARD_SIZE)]
        self.current_player = self.BLACK
        self.last_board_state = None  # 用于打劫检测
        self.passes = 0  # 连续pass次数
        self.captured = {self.BLACK: 0, self.WHITE: 0}  # 提子计数
        self.move_history = []  # 历史记录
        
    def clone(self):
        """创建游戏状态的深拷贝（用于AI模拟）"""
        new_game = GoGame.__new__(GoGame)
        new_game.board = copy.deepcopy(self.board)
        new_game.current_player = self.current_player
        new_game.last_board_state = copy.deepcopy(self.last_board_state) if self.last_board_state else None
        new_game.passes = self.passes
        new_game.captured = copy.copy(self.captured)
        new_game.move_history = copy.copy(self.move_history)
        return new_game
        
    def clear_screen(self):
        """清屏"""
        os.system('cls' if os.name == 'nt' else 'clear')
        
    def get_stone_char(self, row, col):
        """获取棋子字符"""
        stone = self.board[row][col]
        if stone == self.BLACK:
            return "●"
        elif stone == self.WHITE:
            return "○"
        else:
            return "·"
            
    def print_board(self, highlight=None):
        """打印棋盘
        
        Args:
            highlight: 高亮显示的位置 (row, col)
        """
        self.clear_screen()
        print("\n" + "=" * 50)
        print("           围 棋 (Go)")
        print("=" * 50)
        
        # 列标签
        print("    ", end="")
        for col in range(self.BOARD_SIZE):
            col_label = chr(ord('A') + col)
            print(f" {col_label}", end="")
        print()
        
        # 棋盘行
        for row in range(self.BOARD_SIZE):
            row_num = self.BOARD_SIZE - row
            print(f"{row_num:2d}  ", end="")
            
            for col in range(self.BOARD_SIZE):
                # 打印交叉点
                stone = self.board[row][col]
                if highlight and highlight[0] == row and highlight[1] == col:
                    # 高亮最后落子位置
                    if stone == self.BLACK:
                        print("[●]", end="")
                    elif stone == self.WHITE:
                        print("[○]", end="")
                    else:
                        print("[+]", end="")
                else:
                    if stone == self.BLACK:
                        print(" ●", end="")
                    elif stone == self.WHITE:
                        print(" ○", end="")
                    else:
                        # 星位标记
                        if self.is_star_point(row, col):
                            print(" +", end="")
                        else:
                            print(" ·", end="")
            
            print(f"  {row_num:2d}")
        
        # 列标签
        print("    ", end="")
        for col in range(self.BOARD_SIZE):
            col_label = chr(ord('A') + col)
            print(f" {col_label}", end="")
        print()
        
        print("=" * 50)
        player_name = "黑方 (●)" if self.current_player == self.BLACK else "白方 (○)"
        print(f"当前玩家: {player_name}")
        print(f"提子数 - 黑方: {self.captured[self.BLACK]}, 白方: {self.captured[self.WHITE]}")
        print("=" * 50)
        print("输入 'help' 查看帮助")
        print()
        
    def is_star_point(self, row, col):
        """判断是否为星位"""
        return row in self.STAR_POINTS and col in self.STAR_POINTS
        
    def parse_coordinate(self, coord_str):
        """解析坐标，如 'd4' -> (3, 15)"""
        coord_str = coord_str.strip().lower()
        
        if len(coord_str) < 2:
            return None
            
        # 提取列字母
        col_char = coord_str[0]
        if not col_char.isalpha():
            return None
            
        col = ord(col_char) - ord('a')
        
        # 提取行号
        try:
            row_num = int(coord_str[1:])
        except ValueError:
            return None
            
        # 转换为0-based索引
        row = self.BOARD_SIZE - row_num
        
        if 0 <= row < self.BOARD_SIZE and 0 <= col < self.BOARD_SIZE:
            return (row, col)
        return None
        
    def format_coordinate(self, row, col):
        """格式化坐标为字符串"""
        return f"{chr(ord('A') + col)}{self.BOARD_SIZE - row}"
        
    def get_neighbors(self, row, col):
        """获取相邻位置"""
        neighbors = []
        for dr, dc in self.DIRECTIONS:
            nr, nc = row + dr, col + dc
            if 0 <= nr < self.BOARD_SIZE and 0 <= nc < self.BOARD_SIZE:
                neighbors.append((nr, nc))
        return neighbors
        
    def get_group(self, row, col):
        """获取与指定位置相连的棋子组 (DFS)"""
        stone = self.board[row][col]
        if stone == self.EMPTY:
            return set()
            
        group = set()
        stack = [(row, col)]
        
        while stack:
            r, c = stack.pop()
            if (r, c) in group:
                continue
            group.add((r, c))
            
            for nr, nc in self.get_neighbors(r, c):
                if self.board[nr][nc] == stone and (nr, nc) not in group:
                    stack.append((nr, nc))
                    
        return group
        
    def count_liberties(self, group):
        """计算一个棋子组的气数"""
        liberties = set()
        for row, col in group:
            for nr, nc in self.get_neighbors(row, col):
                if self.board[nr][nc] == self.EMPTY:
                    liberties.add((nr, nc))
        return liberties
        
    def get_liberty_count(self, row, col):
        """获取指定位置棋子的气的数量"""
        if self.board[row][col] == self.EMPTY:
            return 0
        group = self.get_group(row, col)
        return len(self.count_liberties(group))
        
    def remove_group(self, group):
        """移除一个棋子组并返回被提的棋子数"""
        for row, col in group:
            self.board[row][col] = self.EMPTY
        return len(group)
        
    def is_suicide(self, row, col):
        """检查是否为自杀走法"""
        # 临时放置棋子
        self.board[row][col] = self.current_player
        
        # 获取自己棋子的组
        own_group = self.get_group(row, col)
        own_liberties = self.count_liberties(own_group)
        
        # 检查是否提掉了对方的棋子
        opponent = self.WHITE if self.current_player == self.BLACK else self.BLACK
        captured = False
        
        for nr, nc in self.get_neighbors(row, col):
            if self.board[nr][nc] == opponent:
                opp_group = self.get_group(nr, nc)
                opp_liberties = self.count_liberties(opp_group)
                if len(opp_liberties) == 0:
                    captured = True
                    
        # 恢复棋盘
        self.board[row][col] = self.EMPTY
        
        # 如果没有提子且自己没有气，则为自杀
        if not captured and len(own_liberties) == 0:
            return True
        return False
        
    def is_ko(self, row, col):
        """检查是否为打劫"""
        if self.last_board_state is None:
            return False
            
        # 临时放置棋子
        self.board[row][col] = self.current_player
        
        # 处理提子
        opponent = self.WHITE if self.current_player == self.BLACK else self.BLACK
        for nr, nc in self.get_neighbors(row, col):
            if self.board[nr][nc] == opponent:
                opp_group = self.get_group(nr, nc)
                opp_liberties = self.count_liberties(opp_group)
                if len(opp_liberties) == 0:
                    self.remove_group(opp_group)
                    
        # 检查是否回到上一步的棋盘状态
        is_ko = self.board == self.last_board_state
        
        return is_ko
        
    def is_valid_move(self, row, col):
        """检查是否为合法走法"""
        if not (0 <= row < self.BOARD_SIZE and 0 <= col < self.BOARD_SIZE):
            return False
        if self.board[row][col] != self.EMPTY:
            return False
        if self.is_suicide(row, col):
            return False
        return True
        
    def get_valid_moves(self):
        """获取所有合法走法"""
        valid_moves = []
        for row in range(self.BOARD_SIZE):
            for col in range(self.BOARD_SIZE):
                if self.is_valid_move(row, col):
                    valid_moves.append((row, col))
        return valid_moves
        
    def simulate_move(self, row, col):
        """模拟落子，返回新游戏状态和提子数（不改变当前状态）"""
        new_game = self.clone()
        success, message = new_game.make_move(row, col)
        return new_game, success, message
        
    def make_move(self, row, col):
        """执行落子"""
        # 检查位置是否合法
        if not (0 <= row < self.BOARD_SIZE and 0 <= col < self.BOARD_SIZE):
            return False, "位置超出棋盘范围"
            
        # 检查位置是否为空
        if self.board[row][col] != self.EMPTY:
            return False, "该位置已有棋子"
            
        # 保存当前状态用于打劫检测
        old_board = copy.deepcopy(self.board)
        
        # 检查自杀
        if self.is_suicide(row, col):
            return False, "禁止自杀"
            
        # 放置棋子
        self.board[row][col] = self.current_player
        
        # 处理提子
        opponent = self.WHITE if self.current_player == self.BLACK else self.BLACK
        captured_stones = 0
        captured_groups = []
        
        for nr, nc in self.get_neighbors(row, col):
            if self.board[nr][nc] == opponent:
                opp_group = self.get_group(nr, nc)
                opp_liberties = self.count_liberties(opp_group)
                if len(opp_liberties) == 0:
                    captured_stones += self.remove_group(opp_group)
                    captured_groups.append(opp_group)
                    
        # 检查打劫 (简化的打劫检测)
        if captured_stones == 1 and self.last_board_state is not None:
            # 如果只提了一个子，检查是否回到上一状态
            if self.board == self.last_board_state:
                # 恢复棋盘
                self.board = old_board
                return False, "打劫！不能立即回提，请先在别处落子"
                
        # 更新状态
        self.last_board_state = old_board
        self.captured[self.current_player] += captured_stones
        self.passes = 0
        
        # 记录历史
        coord = self.format_coordinate(row, col)
        self.move_history.append((self.current_player, coord, captured_stones))
        
        # 切换玩家
        self.current_player = opponent
        
        return True, f"落子成功，提掉 {captured_stones} 个子"
        
    def pass_turn(self):
        """Pass 回合"""
        self.passes += 1
        player_name = "黑方" if self.current_player == self.BLACK else "白方"
        self.move_history.append((self.current_player, "PASS", 0))
        self.current_player = self.WHITE if self.current_player == self.BLACK else self.BLACK
        return self.passes >= 2  # 如果双方连续pass，游戏结束
        
    def resign(self):
        """认输"""
        winner = "白方" if self.current_player == self.BLACK else "黑方"
        return winner
        
    def flood_fill_territory(self, row, col, visited):
        """洪水填充算法寻找领地"""
        if (row, col) in visited or not (0 <= row < self.BOARD_SIZE and 0 <= col < self.BOARD_SIZE):
            return set(), None
            
        if self.board[row][col] != self.EMPTY:
            return set(), self.board[row][col]
            
        territory = set()
        boundary_colors = set()
        stack = [(row, col)]
        
        while stack:
            r, c = stack.pop()
            if (r, c) in visited or not (0 <= r < self.BOARD_SIZE and 0 <= c < self.BOARD_SIZE):
                continue
                
            if self.board[r][c] != self.EMPTY:
                boundary_colors.add(self.board[r][c])
                continue
                
            visited.add((r, c))
            territory.add((r, c))
            
            for nr, nc in self.get_neighbors(r, c):
                stack.append((nr, nc))
                
        # 如果领地只被一种颜色包围，则属于该颜色
        if len(boundary_colors) == 1:
            return territory, boundary_colors.pop()
        else:
            return territory, None  # 中立地（双活或无主）
            
    def count_score(self):
        """计算分数（数目法）"""
        visited = set()
        territory_count = {self.BLACK: 0, self.WHITE: 0}
        
        # 计算领地
        for row in range(self.BOARD_SIZE):
            for col in range(self.BOARD_SIZE):
                if self.board[row][col] == self.EMPTY and (row, col) not in visited:
                    territory, owner = self.flood_fill_territory(row, col, visited)
                    if owner is not None:
                        territory_count[owner] += len(territory)
                        
        # 计算活子数
        stones = {self.BLACK: 0, self.WHITE: 0}
        for row in range(self.BOARD_SIZE):
            for col in range(self.BOARD_SIZE):
                if self.board[row][col] != self.EMPTY:
                    stones[self.board[row][col]] += 1
                    
        # 计算总分 (子 + 地 + 贴目)
        # 中国规则：黑贴3.75子
        black_score = stones[self.BLACK] + territory_count[self.BLACK]
        white_score = stones[self.WHITE] + territory_count[self.WHITE] + 3.75
        
        return {
            'stones': stones,
            'territory': territory_count,
            'black_total': black_score,
            'white_total': white_score,
            'winner': '黑方' if black_score > white_score else '白方',
            'margin': abs(black_score - white_score)
        }
        
    def print_score(self):
        """打印分数"""
        score = self.count_score()
        print("\n" + "=" * 50)
        print("               终局统计")
        print("=" * 50)
        print(f"活子数 - 黑方: {score['stones'][self.BLACK]}, 白方: {score['stones'][self.WHITE]}")
        print(f"领地数 - 黑方: {score['territory'][self.BLACK]}, 白方: {score['territory'][self.WHITE]}")
        print(f"提子数 - 黑方: {self.captured[self.BLACK]}, 白方: {self.captured[self.WHITE]}")
        print("-" * 50)
        print(f"黑方总分: {score['black_total']:.2f}")
        print(f"白方总分: {score['white_total']:.2f} (含贴目3.75)")
        print("-" * 50)
        print(f"胜者: {score['winner']}，胜 {score['margin']:.2f} 子")
        print("=" * 50)
        
    def print_help(self):
        """打印帮助信息"""
        print("\n" + "=" * 50)
        print("                 帮助信息")
        print("=" * 50)
        print("坐标输入: 字母+数字，如 d4, K16")
        print("  - 字母 a-s 表示列 (A-S)")
        print("  - 数字 1-19 表示行")
        print()
        print("命令:")
        print("  pass    - 停一手 (Pass)")
        print("  resign  - 认输")
        print("  score   - 计算当前局面分数")
        print("  history - 显示对局历史")
        print("  help    - 显示此帮助")
        print("  quit    - 退出游戏")
        print("=" * 50)
        input("按 Enter 继续...")
        
    def print_history(self):
        """打印历史记录"""
        print("\n" + "=" * 50)
        print("                 对局历史")
        print("=" * 50)
        for i, (player, coord, captured) in enumerate(self.move_history, 1):
            player_name = "黑" if player == self.BLACK else "白"
            cap_info = f" (提{captured}子)" if captured > 0 else ""
            print(f"  第{i:3d}手: {player_name} {coord}{cap_info}")
        print("=" * 50)
        input("按 Enter 继续...")


class AIThinkingAnimation:
    """AI思考动画"""
    
    def __init__(self):
        self.stop_event = threading.Event()
        self.thread = None
        
    def _animate(self, ai_name="AI"):
        """动画循环"""
        dots = ["", ".", "..", "..."]
        i = 0
        while not self.stop_event.is_set():
            print(f"\r{ai_name} 思考中{dots[i % 4]}   ", end="", flush=True)
            time.sleep(0.3)
            i += 1
        # 清除动画
        print("\r" + " " * 30 + "\r", end="")
        
    def start(self, ai_name="AI"):
        """开始动画"""
        self.stop_event.clear()
        self.thread = threading.Thread(target=self._animate, args=(ai_name,))
        self.thread.daemon = True
        self.thread.start()
        
    def stop(self):
        """停止动画"""
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=0.5)


class GoAI:
    """围棋AI类 - 使用启发式评估和MCTS"""
    
    def __init__(self, difficulty="medium"):
        """
        初始化AI
        
        Args:
            difficulty: 难度级别 - 'easy', 'medium', 'hard'
        """
        self.difficulty = difficulty
        self.animation = AIThinkingAnimation()
        
        # 根据难度设置搜索参数
        if difficulty == "easy":
            self.max_simulations = 10
            self.search_depth = 1
        elif difficulty == "medium":
            self.max_simulations = 50
            self.search_depth = 2
        else:  # hard
            self.max_simulations = 200
            self.search_depth = 3
            
    def get_move(self, game, show_animation=True):
        """
        获取AI的下一步走法
        
        Args:
            game: 当前游戏状态
            show_animation: 是否显示思考动画
            
        Returns:
            (row, col) 或 None (pass)
        """
        ai_name = f"AI ({self.difficulty})"
        
        if show_animation:
            self.animation.start(ai_name)
            
        try:
            if self.difficulty == "easy":
                move = self._easy_move(game)
            elif self.difficulty == "medium":
                move = self._medium_move(game)
            else:  # hard
                move = self._hard_move(game)
        finally:
            if show_animation:
                self.animation.stop()
                
        return move
        
    def _easy_move(self, game):
        """
        简单难度：随机选择合法且不太差的位置
        
        策略：
        1. 优先占据星位和开局要点
        2. 如果能提子则优先提子
        3. 避免自杀和明显的坏棋
        4. 随机选择其他合法位置
        """
        valid_moves = game.get_valid_moves()
        
        if not valid_moves:
            return None  # Pass
            
        # 1. 检查是否有提子机会
        capturing_moves = []
        for row, col in valid_moves:
            new_game, success, _ = game.simulate_move(row, col)
            if success:
                # 计算提子数
                captured = game.captured[game.current_player] - new_game.captured[game.current_player]
                # 注意：这里是因为模拟后current_player已经切换了，所以取反
                actual_captured = game.captured[game.WHITE if game.current_player == game.BLACK else game.BLACK]
                new_captured = new_game.captured[game.WHITE if game.current_player == game.BLACK else game.BLACK]
                if new_captured > actual_captured:
                    capturing_moves.append((row, col, new_captured - actual_captured))
                    
        if capturing_moves:
            # 优先提子，随机选择能提子的走法
            capturing_moves.sort(key=lambda x: x[2], reverse=True)
            return (capturing_moves[0][0], capturing_moves[0][1])
            
        # 2. 检查是否能救自己的处于危险的棋子（只剩1气）
        saving_moves = []
        for row in range(game.BOARD_SIZE):
            for col in range(game.BOARD_SIZE):
                if game.board[row][col] == game.current_player:
                    liberties = game.get_liberty_count(row, col)
                    if liberties == 1:
                        # 找到能救这个棋子的位置
                        group = game.get_group(row, col)
                        for gr, gc in game.count_liberties(group):
                            if (gr, gc) in valid_moves:
                                saving_moves.append((gr, gc))
                                
        if saving_moves and random.random() < 0.7:
            return random.choice(saving_moves)
            
        # 3. 开局阶段优先占据星位和要点
        if len(game.move_history) < 20:
            opening_moves = []
            for row, col in game.OPENING_PRIORITY_POINTS:
                if (row, col) in valid_moves:
                    opening_moves.append((row, col))
            if opening_moves and random.random() < 0.8:
                return random.choice(opening_moves)
                
        # 4. 随机选择一个合法位置，但排除明显很差的走法
        good_moves = []
        for row, col in valid_moves:
            score = self._quick_evaluate(game, row, col)
            if score > -5:  # 排除明显很差的走法
                good_moves.append((row, col, score))
                
        if good_moves:
            # 根据分数加权随机选择
            good_moves.sort(key=lambda x: x[2], reverse=True)
            # 前50%的好棋中随机选择
            top_count = max(1, len(good_moves) // 2)
            return random.choice(good_moves[:top_count])[:2]
        elif valid_moves:
            return random.choice(valid_moves)
        else:
            return None
            
    def _medium_move(self, game):
        """
        中等难度：使用启发式评估
        
        策略：
        1. 评估每个合法位置的分数
        2. 考虑：气的数量、连接、眼位、吃子、防守
        3. 选择分数最高的走法
        """
        valid_moves = game.get_valid_moves()
        
        if not valid_moves:
            return None
            
        # 评估所有合法走法
        move_scores = []
        for row, col in valid_moves:
            score = self._evaluate_move(game, row, col)
            move_scores.append((row, col, score))
            
        # 按分数排序
        move_scores.sort(key=lambda x: x[2], reverse=True)
        
        # 前几个最佳走法中稍微随机选择（增加变化性）
        top_count = min(3, len(move_scores))
        best_moves = move_scores[:top_count]
        
        if best_moves:
            # 权重选择，分数高的概率大
            weights = [max(0.1, m[2] + 10) for m in best_moves]
            total = sum(weights)
            weights = [w / total for w in weights]
            
            r = random.random()
            cumulative = 0
            for i, (row, col, score) in enumerate(best_moves):
                cumulative += weights[i]
                if r <= cumulative:
                    return (row, col)
                    
            return (best_moves[0][0], best_moves[0][1])
            
        return None
        
    def _hard_move(self, game):
        """
        困难难度：结合启发式评估和简单的MCTS
        
        策略：
        1. 先用启发式快速评估筛选候选走法
        2. 对候选走法进行MCTS模拟
        3. 选择模拟胜率最高的走法
        """
        valid_moves = game.get_valid_moves()
        
        if not valid_moves:
            return None
            
        # 1. 快速筛选出候选走法（前10个）
        move_scores = []
        for row, col in valid_moves:
            score = self._evaluate_move(game, row, col)
            move_scores.append((row, col, score))
            
        move_scores.sort(key=lambda x: x[2], reverse=True)
        candidates = move_scores[:min(10, len(move_scores))]
        
        if not candidates:
            return None
            
        # 2. 对候选走法进行MCTS模拟
        best_move = None
        best_win_rate = -1
        
        for row, col, _ in candidates:
            win_rate = self._mcts_simulate(game, row, col)
            if win_rate > best_win_rate:
                best_win_rate = win_rate
                best_move = (row, col)
                
        return best_move
        
    def _mcts_simulate(self, game, row, col):
        """
        对指定走法进行MCTS模拟
        
        Returns:
            胜率 (0-1)
        """
        wins = 0
        simulations = self.max_simulations
        
        for _ in range(simulations):
            # 复制游戏状态
            sim_game = game.clone()
            
            # 执行走法
            success, _ = sim_game.make_move(row, col)
            if not success:
                continue
                
            # 随机模拟到结束（或步数限制）
            current_player = sim_game.current_player
            max_steps = 50  # 限制模拟步数
            step = 0
            
            while step < max_steps:
                valid_moves = sim_game.get_valid_moves()
                
                # 如果双方连续pass，结束
                if sim_game.passes >= 2:
                    break
                    
                if valid_moves:
                    # 使用启发式选择较好的随机走法
                    move = self._random_policy_move(sim_game, valid_moves)
                    if move:
                        sim_game.make_move(move[0], move[1])
                    else:
                        sim_game.pass_turn()
                else:
                    sim_game.pass_turn()
                    
                step += 1
                
            # 评估结果
            score = sim_game.count_score()
            original_player = game.current_player
            
            if original_player == game.BLACK:
                if score['winner'] == '黑方':
                    wins += 1
            else:
                if score['winner'] == '白方':
                    wins += 1
                    
        return wins / simulations if simulations > 0 else 0.5
        
    def _random_policy_move(self, game, valid_moves):
        """随机策略：在合法走法中随机选择，稍微偏向好棋"""
        if not valid_moves:
            return None
            
        # 快速评估并排序
        scored_moves = []
        for row, col in valid_moves[:20]:  # 限制评估数量
            score = self._quick_evaluate(game, row, col)
            scored_moves.append((row, col, score))
            
        scored_moves.sort(key=lambda x: x[2], reverse=True)
        
        # 前一半中随机选择
        top_half = max(1, len(scored_moves) // 2)
        return random.choice(scored_moves[:top_half])[:2] if scored_moves else None
        
    def _quick_evaluate(self, game, row, col):
        """快速评估一个位置的分数（用于easy和随机模拟）"""
        score = 0
        
        # 模拟落子
        new_game, success, _ = game.simulate_move(row, col)
        if not success:
            return -1000
            
        player = game.current_player
        opponent = game.WHITE if player == game.BLACK else game.BLACK
        
        # 1. 提子得分
        captured = new_game.captured[player] - game.captured[player]
        score += captured * 10
        
        # 2. 己方棋子的气增加得分
        for nr, nc in game.get_neighbors(row, col):
            if game.board[nr][nc] == player:
                old_lib = game.get_liberty_count(nr, nc)
                new_lib = new_game.get_liberty_count(nr, nc)
                score += (new_lib - old_lib) * 2
                
        # 3. 新棋子的气数
        new_group = new_game.get_group(row, col)
        new_liberties = len(new_game.count_liberties(new_group))
        score += new_liberties
        
        # 4. 位置分（角边好）
        if (row, col) in game.OPENING_PRIORITY_POINTS:
            score += 3
            
        # 5. 打劫惩罚
        if game.board == game.last_board_state:
            score -= 100
            
        return score
        
    def _evaluate_move(self, game, row, col):
        """
        详细评估一个走法的分数
        
        考虑因素：
        1. 吃子价值
        2. 气数变化
        3. 连接和断开
        4. 眼位
        5. 领地控制
        6. 安全度
        """
        score = 0
        
        # 模拟落子
        new_game, success, _ = game.simulate_move(row, col)
        if not success:
            return -1000
            
        player = game.current_player
        opponent = game.WHITE if player == game.BLACK else game.BLACK
        
        # ========== 1. 吃子和反提 ==========
        captured = new_game.captured[player] - game.captured[player]
        score += captured * 15  # 提子很有价值
        
        # 检查是否能救自己的危险棋子
        for nr, nc in game.get_neighbors(row, col):
            if game.board[nr][nc] == player:
                old_lib = game.get_liberty_count(nr, nc)
                if old_lib == 1:  # 原来是1气的危险棋子
                    new_lib = new_game.get_liberty_count(nr, nc)
                    score += (new_lib - old_lib) * 20  # 救棋很有价值
                    
        # ========== 2. 攻击对方 ==========
        for nr, nc in game.get_neighbors(row, col):
            if game.board[nr][nc] == opponent:
                old_lib = game.get_liberty_count(nr, nc)
                new_lib = new_game.get_liberty_count(nr, nc)
                if new_lib == 0:  # 提子已在上面计算
                    pass
                elif new_lib == 1:  # 打入选叫吃
                    score += 12
                elif new_lib == 2:  # 减少气数
                    score += 4
                    
        # ========== 3. 气的数量 ==========
        new_group = new_game.get_group(row, col)
        new_liberties = len(new_game.count_liberties(new_group))
        score += new_liberties * 2
        
        # 惩罚少气的走法
        if new_liberties == 1:
            score -= 10
        elif new_liberties == 2:
            score -= 3
            
        # ========== 4. 连接价值 ==========
        friendly_neighbors = 0
        for nr, nc in game.get_neighbors(row, col):
            if game.board[nr][nc] == player:
                friendly_neighbors += 1
                score += 3  # 连接加分
                
        # ========== 5. 位置分 ==========
        # 角上更有价值（19路棋盘）
        corner_dist = min(row, col, 18-row, 18-col)
        if corner_dist <= 3:
            score += (4 - corner_dist) * 2
            
        # 星位和开局要点
        if (row, col) in game.OPENING_PRIORITY_POINTS:
            score += 5
            
        # ========== 6. 眼位形成 ==========
        # 检查是否形成眼或假眼
        empty_neighbors = sum(1 for nr, nc in game.get_neighbors(row, col) 
                             if game.board[nr][nc] == game.EMPTY)
        if empty_neighbors >= 3 and friendly_neighbors >= 2:
            score += 8  # 潜在的眼位
            
        # ========== 7. 领地控制 ==========
        # 简单的领地估计：周围空地
        territory_potential = 0
        visited = set()
        for nr, nc in game.get_neighbors(row, col):
            if game.board[nr][nc] == game.EMPTY and (nr, nc) not in visited:
                # 简单估计这片空地的归属
                friendly_influence = 0
                enemy_influence = 0
                for nnr, nnc in game.get_neighbors(nr, nc):
                    if game.board[nnr][nnc] == player:
                        friendly_influence += 1
                    elif game.board[nnr][nnc] == opponent:
                        enemy_influence += 1
                if friendly_influence > enemy_influence:
                    territory_potential += 1
                visited.add((nr, nc))
        score += territory_potential * 2
        
        # ========== 8. 开局布局 ==========
        if len(game.move_history) < 10:
            # 开局优先角、边
            if row in [2, 3, 4, 14, 15, 16] and col in [2, 3, 4, 14, 15, 16]:
                score += 10  # 角部
            elif row in [2, 3, 4, 14, 15, 16] or col in [2, 3, 4, 14, 15, 16]:
                score += 5  # 边部
            elif row == 9 and col == 9:
                score += 3  # 天元
                
        # ========== 9. 避免重复 ==========
        if game.last_board_state:
            # 简单检查是否形成循环
            pass
            
        return score


class GoGameManager:
    """游戏管理器 - 处理游戏模式和AI对战"""
    
    def __init__(self):
        self.game = None
        self.ai_black = None
        self.ai_white = None
        self.mode = None  # 'pvp', 'pve', 'eve'
        self.ai_difficulty = None
        self.player_color = None  # 玩家执黑还是执白
        self.last_move = None  # 最后落子位置
        
    def select_game_mode(self):
        """选择游戏模式 - 5选项菜单"""
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            print("\n" + "=" * 50)
            print("           围 棋 (Go) - 主菜单")
            print("=" * 50)
            print()
            print("  1. 人 vs 人")
            print("  2. 人 vs AI (easy)")
            print("  3. 人 vs AI (medium)")
            print("  4. 人 vs AI (hard)")
            print("  5. AI vs AI (演示)")
            print()
            print("=" * 50)
            print("  输入 'help' 查看游戏帮助")
            print("  输入 'quit' 退出")
            print("=" * 50)
            
            choice = input("请输入选项 (1-5): ").strip().lower()
            
            if choice == '1':
                self.mode = 'pvp'
                return True
            elif choice == '2':
                self.mode = 'pve'
                self.ai_difficulty = 'easy'
                self.player_color = GoGame.BLACK
                self.ai_white = GoAI('easy')
                return True
            elif choice == '3':
                self.mode = 'pve'
                self.ai_difficulty = 'medium'
                self.player_color = GoGame.BLACK
                self.ai_white = GoAI('medium')
                return True
            elif choice == '4':
                self.mode = 'pve'
                self.ai_difficulty = 'hard'
                self.player_color = GoGame.BLACK
                self.ai_white = GoAI('hard')
                return True
            elif choice == '5':
                self.mode = 'eve'
                self.ai_black = GoAI('medium')
                self.ai_white = GoAI('hard')
                return True
            elif choice == 'quit' or choice == 'exit' or choice == 'q':
                return False
            elif choice == 'help':
                self._show_help()
            else:
                print("无效选项，请重新选择")
                input("按 Enter 继续...")
    
    def _show_help(self):
        """显示帮助信息"""
        os.system('cls' if os.name == 'nt' else 'clear')
        print("\n" + "=" * 50)
        print("                 帮助信息")
        print("=" * 50)
        print("坐标输入: 字母+数字，如 d4, K16")
        print("  - 字母 a-s 表示列 (A-S)")
        print("  - 数字 1-19 表示行")
        print()
        print("命令:")
        print("  pass    - 停一手 (Pass)")
        print("  resign  - 认输")
        print("  score   - 计算当前局面分数")
        print("  history - 显示对局历史")
        print("  help    - 显示此帮助")
        print("  quit    - 退出游戏")
        print("=" * 50)
        input("按 Enter 继续...")
                
    def _select_pve_options(self):
        """选择人机对战选项"""
        # 选择AI难度
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            print("\n" + "=" * 50)
            print("         选择 AI 难度")
            print("=" * 50)
            print()
            print("  1. 简单 (Easy)   - 随机走法 + 基础评估")
            print("  2. 中等 (Medium) - 启发式评估")
            print("  3. 困难 (Hard)   - MCTS + 深度评估")
            print()
            print("=" * 50)
            
            choice = input("请输入选项 (1-3): ").strip()
            
            if choice == '1':
                self.ai_difficulty = 'easy'
                break
            elif choice == '2':
                self.ai_difficulty = 'medium'
                break
            elif choice == '3':
                self.ai_difficulty = 'hard'
                break
            else:
                print("无效选项")
                input("按 Enter 继续...")
                
        # 选择执黑或执白
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            print("\n" + "=" * 50)
            print("         选择你的颜色")
            print("=" * 50)
            print()
            print("  1. 执黑 (●) - 先行")
            print("  2. 执白 (○) - 后行")
            print()
            print("=" * 50)
            
            choice = input("请输入选项 (1-2): ").strip()
            
            if choice == '1':
                self.player_color = GoGame.BLACK
                self.ai_white = GoAI(self.ai_difficulty)
                break
            elif choice == '2':
                self.player_color = GoGame.WHITE
                self.ai_black = GoAI(self.ai_difficulty)
                break
            else:
                print("无效选项")
                input("按 Enter 继续...")
                
        return True
        
    def _select_eve_options(self):
        """选择AI对战选项"""
        # 黑方AI难度
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            print("\n" + "=" * 50)
            print("       选择黑方 (●) AI 难度")
            print("=" * 50)
            print()
            print("  1. 简单 (Easy)")
            print("  2. 中等 (Medium)")
            print("  3. 困难 (Hard)")
            print()
            print("=" * 50)
            
            choice = input("请输入选项 (1-3): ").strip()
            
            if choice == '1':
                difficulty = 'easy'
                break
            elif choice == '2':
                difficulty = 'medium'
                break
            elif choice == '3':
                difficulty = 'hard'
                break
            else:
                print("无效选项")
                input("按 Enter 继续...")
                
        self.ai_black = GoAI(difficulty)
        
        # 白方AI难度
        while True:
            os.system('cls' if os.name == 'nt' else 'clear')
            print("\n" + "=" * 50)
            print("       选择白方 (○) AI 难度")
            print("=" * 50)
            print()
            print("  1. 简单 (Easy)")
            print("  2. 中等 (Medium)")
            print("  3. 困难 (Hard)")
            print()
            print("=" * 50)
            
            choice = input("请输入选项 (1-3): ").strip()
            
            if choice == '1':
                difficulty = 'easy'
                break
            elif choice == '2':
                difficulty = 'medium'
                break
            elif choice == '3':
                difficulty = 'hard'
                break
            else:
                print("无效选项")
                input("按 Enter 继续...")
                
        self.ai_white = GoAI(difficulty)
        
        return True
        
    def run_game(self):
        """运行游戏主循环"""
        self.game = GoGame()
        
        print("\n欢迎来到围棋游戏！")
        print("输入 'help' 查看帮助信息")
        input("按 Enter 开始游戏...")
        
        while True:
            # 显示棋盘，高亮最后落子
            self.game.print_board(highlight=self.last_move)
            
            player_name = "黑方 (●)" if self.game.current_player == self.game.BLACK else "白方 (○)"
            
            # 判断当前是否是AI回合
            is_ai_turn = False
            current_ai = None
            
            if self.mode == 'pve':
                if self.game.current_player != self.player_color:
                    is_ai_turn = True
                    current_ai = self.ai_black if self.game.current_player == self.game.BLACK else self.ai_white
            elif self.mode == 'eve':
                is_ai_turn = True
                current_ai = self.ai_black if self.game.current_player == self.game.BLACK else self.ai_white
                
            if is_ai_turn and current_ai:
                # AI回合
                print(f"{player_name} [AI] 正在思考...")
                
                move = current_ai.get_move(self.game, show_animation=True)
                
                if move is None:
                    # AI选择pass
                    print(f"{player_name} [AI] 选择停一手 (Pass)")
                    game_over = self.game.pass_turn()
                    self.last_move = None
                    if game_over:
                        print("双方连续停手，游戏结束！")
                        self.game.print_board()
                        self.game.print_score()
                        break
                    input("按 Enter 继续...")
                else:
                    row, col = move
                    coord = self.game.format_coordinate(row, col)
                    success, message = self.game.make_move(row, col)
                    
                    if success:
                        self.last_move = (row, col)
                        print(f"{player_name} [AI] 落子: {coord}")
                        if message:
                            print(message)
                        
                        # AI vs AI 模式时自动继续
                        if self.mode == 'eve':
                            time.sleep(0.5)  # 稍微暂停以便观察
                        else:
                            input("按 Enter 继续...")
                    else:
                        print(f"AI 落子失败: {message}")
                        # 如果AI失败，让它pass
                        self.game.pass_turn()
                        self.last_move = None
                        input("按 Enter 继续...")
                        
            else:
                # 人类玩家回合
                user_input = input(f"{player_name} > ").strip().lower()
                
                if not user_input:
                    continue
                    
                # 处理命令
                if user_input == 'quit' or user_input == 'exit':
                    confirm = input("确定要退出游戏吗? (y/n) ").strip().lower()
                    if confirm == 'y':
                        print("感谢游玩，再见！")
                        break
                    continue
                    
                if user_input == 'help':
                    self.game.print_help()
                    continue
                    
                if user_input == 'pass':
                    game_over = self.game.pass_turn()
                    self.last_move = None
                    print(f"{player_name} Pass")
                    if game_over:
                        print("双方连续停手，游戏结束！")
                        self.game.print_board()
                        self.game.print_score()
                        break
                    input("按 Enter 继续...")
                    continue
                    
                if user_input == 'resign':
                    winner = self.game.resign()
                    print(f"\n{player_name} 认输！")
                    print(f"胜者: {winner}")
                    break
                    
                if user_input == 'score':
                    self.game.print_score()
                    input("按 Enter 继续...")
                    continue
                    
                if user_input == 'history':
                    self.game.print_history()
                    continue
                    
                # 解析坐标
                coord = self.game.parse_coordinate(user_input)
                if coord is None:
                    print(f"无效的坐标: {user_input}")
                    print("请输入类似 'd4' 或 'K16' 的坐标")
                    input("按 Enter 继续...")
                    continue
                    
                row, col = coord
                success, message = self.game.make_move(row, col)
                
                if not success:
                    print(f"落子失败: {message}")
                    input("按 Enter 继续...")
                else:
                    self.last_move = (row, col)
                    if message:
                        print(message)


def main():
    """主函数"""
    manager = GoGameManager()
    
    if manager.select_game_mode():
        manager.run_game()


if __name__ == "__main__":
    main()
