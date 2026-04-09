/**
 * GoEngine - Core Go rule engine
 * A reliable, standalone Go game logic library
 */
class GoEngine {
    // Static constants for board cell states
    static EMPTY = 0;
    static BLACK = 1;
    static WHITE = 2;

    // Direction vectors for neighbor checks (up, down, left, right)
    static DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    /**
     * Create a new Go game engine
     * @param {number} boardSize - Size of the board (default 19)
     */
    constructor(boardSize = 19) {
        this.boardSize = boardSize;
        this.board = this._createEmptyBoard();
        this.koState = null;
    }

    /**
     * Get all valid neighbor coordinates for a given position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number[][]} Array of valid neighbor coordinates [[r,c], ...]
     */
    getNeighbors(row, col) {
        const neighbors = [];
        for (const [dr, dc] of this.constructor.DIRECTIONS) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < this.boardSize && newCol >= 0 && newCol < this.boardSize) {
                neighbors.push([newRow, newCol]);
            }
        }
        return neighbors;
    }

    /**
     * Get all stones in the same group as the stone at the given position
     * Uses BFS/flood-fill algorithm
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number[][]} Array of stone coordinates in the group [[r,c], ...]
     */
    getGroup(row, col) {
        const color = this.board[row][col];
        if (color === GoEngine.EMPTY) {
            return [];
        }

        const group = [];
        const visited = new Set();
        const queue = [[row, col]];
        const key = (r, c) => `${r},${c}`;

        visited.add(key(row, col));

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            group.push([r, c]);

            for (const [nr, nc] of this.getNeighbors(r, c)) {
                const neighborKey = key(nr, nc);
                if (!visited.has(neighborKey) && this.board[nr][nc] === color) {
                    visited.add(neighborKey);
                    queue.push([nr, nc]);
                }
            }
        }

        return group;
    }

    /**
     * Count the liberties for a group of stones
     * @param {number[][]} group - Array of stone coordinates [[r,c], ...]
     * @returns {Set<string>} Set of liberty coordinates as strings "row,col"
     */
    countLiberties(group) {
        const liberties = new Set();
        for (const [r, c] of group) {
            for (const [nr, nc] of this.getNeighbors(r, c)) {
                if (this.board[nr][nc] === GoEngine.EMPTY) {
                    liberties.add(`${nr},${nc}`);
                }
            }
        }
        return liberties;
    }

    /**
     * Get the count of liberties for a single stone's group
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {number} Number of liberties, or 0 if position is EMPTY
     */
    getLiberties(row, col) {
        if (this.board[row][col] === GoEngine.EMPTY) {
            return 0;
        }
        const group = this.getGroup(row, col);
        return this.countLiberties(group).size;
    }

    /**
     * Create an empty board filled with EMPTY
     * @returns {number[][]} 2D array representing the board
     * @private
     */
    _createEmptyBoard() {
        const board = [];
        for (let i = 0; i < this.boardSize; i++) {
            board.push(new Array(this.boardSize).fill(GoEngine.EMPTY));
        }
        return board;
    }

    /**
     * Compare two 2D board arrays for equality
     * @param {number[][]} a - First board
     * @param {number[][]} b - Second board
     * @returns {boolean} True if boards are identical
     * @private
     */
    _boardsEqual(a, b) {
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (a[r][c] !== b[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Check if a move would be a suicide (no liberties and no captures)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player color (BLACK or WHITE)
     * @returns {boolean} True if the move would be suicide
     * @private
     */
    _isSuicide(row, col, player) {
        // Temporarily place the stone
        const originalValue = this.board[row][col];
        this.board[row][col] = player;

        // Check if own group has liberties after placement
        const ownGroup = this.getGroup(row, col);
        const ownLiberties = this.countLiberties(ownGroup);

        // If we have liberties, it's not suicide
        if (ownLiberties.size > 0) {
            this.board[row][col] = originalValue;
            return false;
        }

        // No liberties - check if any opponent groups would be captured
        const opponent = player === GoEngine.BLACK ? GoEngine.WHITE : GoEngine.BLACK;
        let captured = false;

        for (const [nr, nc] of this.getNeighbors(row, col)) {
            if (this.board[nr][nc] === opponent) {
                const opponentGroup = this.getGroup(nr, nc);
                if (this.countLiberties(opponentGroup).size === 0) {
                    captured = true;
                    break;
                }
            }
        }

        // Restore board state
        this.board[row][col] = originalValue;

        // Suicide if no liberties AND no captures
        return !captured;
    }

    /**
     * Check if a move would violate ko rules
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player color (BLACK or WHITE)
     * @param {number[][]} koState - Previous board state (ko state) or null
     * @returns {boolean} True if the move would be ko
     * @private
     */
    _isKo(row, col, player, koState) {
        if (koState === null) {
            return false;
        }

        // Simulate the move
        const originalValue = this.board[row][col];
        this.board[row][col] = player;
        const result = this._boardsEqual(this.board, koState);
        this.board[row][col] = originalValue;

        return result;
    }

    /**
     * Check if a move is valid
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player color (BLACK or WHITE)
     * @param {number[][]} koState - Previous board state for ko detection (optional)
     * @returns {{valid: boolean, reason: string}} Object with validity and reason
     */
    isValidMove(row, col, player, koState = null) {
        // Check if within bounds
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
            return { valid: false, reason: 'Out of bounds' };
        }

        // Check if position is empty
        if (this.board[row][col] !== GoEngine.EMPTY) {
            return { valid: false, reason: 'Position already occupied' };
        }

        // Check ko
        if (this._isKo(row, col, player, koState)) {
            return { valid: false, reason: 'Ko violation' };
        }

        // Check suicide
        if (this._isSuicide(row, col, player)) {
            return { valid: false, reason: 'Suicide move' };
        }

        return { valid: true, reason: '' };
    }

    /**
     * Get all valid moves for a player
     * @param {number} player - Player color (BLACK or WHITE)
     * @returns {Array} Array of valid move coordinates [[row, col], ...]
     */
    getValidMoves(player) {
        const moves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col, player, this.koState).valid) {
                    moves.push([row, col]);
                }
            }
        }
        return moves;
    }
}

// Export to window for use in browser
window.GoEngine = GoEngine;
