"""
go_engine_wasm.py - Python WebAssembly Go Engine Wrapper
Falls back to pure Python when WASM is not available
"""

import sys
from typing import List, Optional

# Try to import wasmtime for WebAssembly support
try:
    import wasmtime
    WASMTIME_AVAILABLE = True
except ImportError:
    WASMTIME_AVAILABLE = False

from go_engine_core import GoEngineCore, EMPTY, BLACK, WHITE

# Direction vectors for neighbor lookups
DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


class GoEngineWASM:
    """
    Go Engine wrapper with WebAssembly support when available.
    Falls back to pure Python implementation from go_engine_core.
    """
    
    def __init__(self, board_size: int = 19, wasm_path: Optional[str] = None):
        """
        Initialize the Go engine.
        
        Args:
            board_size: Size of the board (default 19x19)
            wasm_path: Optional path to WASM binary (not used in pure Python fallback)
        """
        self.core = GoEngineCore(board_size)
        self.board_size = board_size
        self.wasm_path = wasm_path
        self.wasm_available = WASMTIME_AVAILABLE
        
        # WASM engine instance (would be used if wasmtime was available and configured)
        self._wasm_engine = None
        self._wasm_linker = None
    
    def is_valid_move(self, row: int, col: int, player: int) -> dict:
        """
        Check if a move is valid.
        
        Args:
            row: Row index (0-based)
            col: Column index (0-based)
            player: Player (1=BLACK, 2=WHITE)
            
        Returns:
            {"valid": bool, "reason": str}
        """
        valid, reason = self.core.is_valid_move(row, col, player)
        return {"valid": valid, "reason": reason}
    
    def get_valid_moves(self, player: int) -> List[List[int]]:
        """
        Get all valid moves for a player.
        
        Args:
            player: Player (1=BLACK, 2=WHITE)
            
        Returns:
            List of [row, col] pairs for valid moves
        """
        moves = self.core.get_valid_moves(player)
        return [[r, c] for r, c in moves]
    
    def simulate_move(self, row: int, col: int, player: int) -> dict:
        """
        Simulate a move without making it.
        
        Args:
            row: Row index (0-based)
            col: Column index (0-based)
            player: Player (1=BLACK, 2=WHITE)
            
        Returns:
            {"newBoard": [[]], "captured": [[row, col], ...], "koState": [[]] or null}
        """
        new_board, captured, ko_state = self.core.simulate_move(row, col, player)
        
        # Convert captured from List[Tuple] to List[List]
        captured_list = [[r, c] for r, c in captured]
        
        return {
            "newBoard": new_board,
            "captured": captured_list,
            "koState": ko_state
        }
    
    def make_move(self, row: int, col: int, player: int) -> dict:
        """
        Make a move on the board.
        
        Args:
            row: Row index (0-based)
            col: Column index (0-based)
            player: Player (1=BLACK, 2=WHITE)
            
        Returns:
            {"success": bool, "board": [[]], "captured": [], "koState": null, "reason": ""}
        """
        # First check if move is valid
        valid, reason = self.core.is_valid_move(row, col, player)
        
        if not valid:
            return {
                "success": False,
                "board": self.core.board,
                "captured": [],
                "koState": None,
                "reason": reason
            }
        
        # Simulate to get the new board state
        new_board, captured, ko_state = self.core.simulate_move(row, col, player)
        
        # Apply the move to the core board
        self.core.board = new_board
        self.core.ko_state = ko_state
        self.core.move_history.append((row, col, player))
        
        # Convert captured from List[Tuple] to List[List]
        captured_list = [[r, c] for r, c in captured]
        
        return {
            "success": True,
            "board": new_board,
            "captured": captured_list,
            "koState": ko_state,
            "reason": ""
        }
    
    def score(self, komi: float = 6.5) -> dict:
        """
        Calculate the score at end of game.
        
        Args:
            komi: Komi (compensation for white, default 6.5)
            
        Returns:
            dict with "black", "white", "territory", "stones", "winner", "margin"
        """
        return self.core.score(komi)
    
    def reset(self, board_size: Optional[int] = None) -> None:
        """
        Reset the board.
        
        Args:
            board_size: Optional new board size (if None, keeps current size)
        """
        if board_size is not None:
            self.board_size = board_size
        self.core = GoEngineCore(self.board_size)
    
    def set_board(self, board: List[List[int]]) -> None:
        """
        Set the board to a specific configuration.
        
        Args:
            board: 2D list representing the board (board_size x board_size)
        """
        self.core.board = [row[:] for row in board]
        self.core.board_size = len(board)
        self.board_size = len(board)