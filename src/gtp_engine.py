"""
gtp_engine.py - GTP (Go Text Protocol) Adapter

Allows GUI Go programs (Sabaki, etc.) to control the Go engine.
"""

import sys
from typing import Tuple, Optional

from go_engine_core import GoEngineCore, BLACK, WHITE, EMPTY
from mcts_engine import MCTSEngine


class GTPEngine:
    """GTP Protocol Adapter for Go Engine"""

    def __init__(self, name: str = "GoEngine", version: str = "1.0"):
        self.name = name
        self.version = version
        self.core = GoEngineCore(board_size=19)
        self.mcts = MCTSEngine(core=self.core, board_size=19)
        self.board_size = 19

    def _gtp_to_rc(self, coord: str) -> Optional[Tuple[int, int]]:
        """
        Convert GTP coordinate (e.g., 'D4') to (row, col).
        GTP uses A-T for columns (skipping I), 1-19 for rows.
        Row 1 is at the bottom, so we invert: row = board_size - row_num
        """
        if len(coord) < 2:
            return None

        col_letter = coord[0].upper()
        try:
            row_num = int(coord[1:])
        except ValueError:
            return None

        # Convert column letter to index (skipping I)
        col = ord(col_letter) - ord('A')
        if col > 8:  # Skip I (index 8)
            col -= 1

        # Convert row number to array index (1 = bottom = last row)
        row = self.board_size - row_num

        if 0 <= row < self.board_size and 0 <= col < self.board_size:
            return (row, col)
        return None

    def _rc_to_gtp(self, row: int, col: int) -> str:
        """Convert (row, col) to GTP coordinate (e.g., 'D4')."""
        # Convert column index to letter (skipping I)
        if col >= 8:
            col_letter = chr(ord('A') + col + 1)  # Skip I
        else:
            col_letter = chr(ord('A') + col)

        # Convert row index to GTP row (1 = bottom)
        row_num = self.board_size - row
        return f"{col_letter}{row_num}"

    def _color_to_int(self, color: str) -> Optional[int]:
        """Convert GTP color (B/D) to internal constant."""
        color = color.upper()
        if color == 'B':
            return BLACK
        elif color == 'W':
            return WHITE
        return None

    def _int_to_color(self, color: int) -> str:
        """Convert internal color to GTP (B/D)."""
        return 'B' if color == BLACK else 'W'

    def _render_board(self) -> str:
        """Generate ASCII art of the board."""
        size = self.board_size
        lines = []

        # Header
        lines.append(f"= This is GoEngine GTP")
        lines.append("")

        # Column labels
        col_labels = "   "
        for c in range(size):
            label = chr(ord('A') + c)
            if c >= 8:  # Skip I
                label = chr(ord(label) + 1)
            col_labels += f" {label}"
        lines.append(col_labels)
        lines.append("  " + "+" + "-" * (size * 2 - 1) + "+")

        # Board rows
        for r in range(size):
            row_num = size - r
            row_str = f"{row_num:2d} |"
            for c in range(size):
                stone = self.core.board[r][c]
                if stone == BLACK:
                    row_str += " X"
                elif stone == WHITE:
                    row_str += " O"
                else:
                    row_str += " ."
            row_str += " |"
            lines.append(row_str)

        # Bottom border
        lines.append("  " + "+" + "-" * (size * 2 - 1) + "+")
        lines.append(col_labels)

        return "\n".join(lines)

    def execute(self, command: str) -> Tuple[bool, str]:
        """
        Execute a GTP command and return (success, response).
        Response does NOT include the leading '=' or '?' (caller adds it).
        """
        parts = command.strip().split()
        if not parts:
            return (False, "empty command")

        cmd = parts[0].lower()
        args = parts[1:] if len(parts) > 1 else []

        try:
            if cmd == "name":
                return (True, self.name)

            elif cmd == "version":
                return (True, self.version)

            elif cmd == "list_commands":
                commands = [
                    "name", "version", "list_commands", "known_command",
                    "boardsize", "clear_board", "play", "genmove",
                    "showboard", "final_score", "quit"
                ]
                return (True, "\n".join(commands))

            elif cmd == "known_command":
                if not args:
                    return (False, "known_command requires an argument")
                known = [
                    "name", "version", "list_commands", "known_command",
                    "boardsize", "clear_board", "play", "genmove",
                    "showboard", "final_score", "quit"
                ]
                return (True, "true" if args[0].lower() in known else "false")

            elif cmd == "boardsize":
                if not args:
                    return (False, "boardsize requires an argument")
                try:
                    size = int(args[0])
                except ValueError:
                    return (False, "invalid boardsize")
                if size < 9 or size > 19:
                    return (False, "unsupported boardsize")
                self.board_size = size
                self.core = GoEngineCore(board_size=size)
                self.mcts = MCTSEngine(core=self.core, board_size=size)
                return (True, "")

            elif cmd == "clear_board":
                self.core = GoEngineCore(board_size=self.board_size)
                self.mcts = MCTSEngine(core=self.core, board_size=self.board_size)
                return (True, "")

            elif cmd == "play":
                if len(args) < 2:
                    return (False, "play requires color and coordinate")
                color = self._color_to_int(args[0])
                if color is None:
                    return (False, "invalid color")
                coord = self._gtp_to_rc(args[1])
                if coord is None:
                    return (False, "invalid coordinate")
                row, col = coord
                valid, msg = self.core.is_valid_move(row, col, color)
                if not valid:
                    return (False, msg)
                new_board, captured, ko_state = self.core.simulate_move(row, col, color)
                self.core.board = new_board
                self.core.ko_state = ko_state
                self.core.move_history.append((row, col, color))
                # Reset MCTS root to reflect new board state
                self.mcts.root = None
                return (True, "")

            elif cmd == "genmove":
                if not args:
                    return (False, "genmove requires a color argument")
                color = self._color_to_int(args[0])
                if color is None:
                    return (False, "invalid color")

                # Use MCTS with 400 simulations for faster GTP response
                move = self.mcts.get_best_move(color, simulations=400)
                if move is None:
                    # No valid moves - pass
                    return (True, "pass")
                row, col = move

                # Make the move
                new_board, captured, ko_state = self.core.simulate_move(row, col, color)
                self.core.board = new_board
                self.core.ko_state = ko_state
                self.core.move_history.append((row, col, color))
                # Reset MCTS root
                self.mcts.root = None

                return (True, self._rc_to_gtp(row, col))

            elif cmd == "showboard":
                return (True, self._render_board())

            elif cmd == "final_score":
                result = self.core.score(komi=6.5)
                diff = result["black"] - result["white"]
                if diff > 0:
                    return (True, f"black+{diff:.1f}")
                elif diff < 0:
                    return (True, f"white+{-diff:.1f}")
                else:
                    return (True, "0")

            elif cmd == "quit":
                return (True, "")

            else:
                return (False, f"unknown command: {cmd}")

        except Exception as e:
            return (False, str(e))

    def run(self):
        """Interactive stdin/stdout loop."""
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                line = line.strip()
                if not line or line.startswith('#'):
                    continue

                success, response = self.execute(line)
                if line.lower() == "quit":
                    print(f"= {response}")
                    break
                elif success:
                    print(f"= {response}")
                else:
                    print(f"? {response}")

            except EOFError:
                break
            except Exception as e:
                print(f"? {e}")


def main():
    """Entry point for running GTP engine as a module."""
    engine = GTPEngine()
    engine.run()


if __name__ == "__main__":
    main()
