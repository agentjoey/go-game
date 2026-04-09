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

    /**
     * Create a deep copy of the current board
     * @returns {number[][]} Deep copy of the board
     * @private
     */
    _deepCopyBoard() {
        const copy = [];
        for (let r = 0; r < this.boardSize; r++) {
            copy.push([...this.board[r]]);
        }
        return copy;
    }

    /**
     * Create a temporary GoEngine instance with a given board
     * Used for checking liberties on a simulated board state
     * @param {number[][]} board - The board to use for the temp engine
     * @returns {GoEngine} A new GoEngine instance with the given board
     * @private
     */
    _createEngineWithBoard(board) {
        const tempEngine = new GoEngine(this.boardSize);
        tempEngine.board = board;
        return tempEngine;
    }

    /**
     * Simulate a move without modifying the original board
     * Returns the new board state, captured stones, and ko information
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player color (BLACK or WHITE)
     * @returns {{newBoard: number[][], captured: number[][], koState: number[][]|null}}
     *   newBoard: Deep copy of board with the move applied
     *   captured: Array of [[r,c], ...] coordinates of captured stones
     *   koState: The board state before this move (for ko detection), or null if no ko
     */
    simulateMove(row, col, player) {
        // Step 1: Deep copy the board
        const newBoard = this._deepCopyBoard();
        const captured = [];
        
        // Store the original board state for ko detection
        const previousBoard = this._deepCopyBoard();
        
        // Step 2: Place the stone
        newBoard[row][col] = player;
        
        // Step 3: Check neighbors for opponent groups with 0 liberties and remove them
        const opponent = player === GoEngine.BLACK ? GoEngine.WHITE : GoEngine.BLACK;
        const tempEngine = this._createEngineWithBoard(newBoard);
        
        for (const [nr, nc] of this.getNeighbors(row, col)) {
            if (newBoard[nr][nc] === opponent) {
                const opponentGroup = tempEngine.getGroup(nr, nc);
                if (tempEngine.countLiberties(opponentGroup).size === 0) {
                    // Remove all stones in this group (they have 0 liberties)
                    for (const [gr, gc] of opponentGroup) {
                        captured.push([gr, gc]);
                        newBoard[gr][gc] = GoEngine.EMPTY;
                    }
                    // Recreate temp engine since we modified newBoard
                    tempEngine.board = newBoard;
                }
            }
        }
        
        // Step 4: Check if the placed stone itself has 0 liberties (suicide edge case)
        // In Go, suicide moves are typically not allowed, but we check for completeness
        tempEngine.board = newBoard;
        const placedGroup = tempEngine.getGroup(row, col);
        if (tempEngine.countLiberties(placedGroup).size === 0) {
            // This would be suicide - remove the placed stone
            newBoard[row][col] = GoEngine.EMPTY;
        }
        
        // Step 5: Ko detection
        let koState = null;
        // Ko occurs when exactly 1 stone was captured and the resulting board
        // matches the previous board state (this.koState)
        if (captured.length === 1 && this.koState !== null) {
            // Check if newBoard matches this.koState
            if (this._boardsEqual(newBoard, this.koState)) {
                // This was a ko - return the board state before the move
                koState = previousBoard;
            }
        }
        
        // Step 6: Return results
        return { newBoard, captured, koState };
    }

    /**
     * Flood-fill from an empty position to find the entire connected empty region
     * Uses BFS to find all empty points that are connected
     * @param {number} startRow - Starting row index
     * @param {number} startCol - Starting column index
     * @param {Set<string>} visited - Set of already visited positions (as "row,col" strings)
     * @returns {{territory: Set<string>, owner: number|null}}
     *   territory: Set of "row,col" strings for all empty positions in the region
     *   owner: BLACK, WHITE, or null (null if territory touches both colors - neutral)
     * @private
     */
    _floodFill(startRow, startCol, visited) {
        const territory = new Set();
        const boundaryColors = new Set();
        const queue = [[startRow, startCol]];
        const key = (r, c) => `${r},${c}`;

        visited.add(key(startRow, startCol));

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            territory.add(key(r, c));

            for (const [nr, nc] of this.getNeighbors(r, c)) {
                const neighborKey = key(nr, nc);
                const neighborValue = this.board[nr][nc];

                if (neighborValue === GoEngine.EMPTY) {
                    // Empty neighbor - add to queue if not visited
                    if (!visited.has(neighborKey)) {
                        visited.add(neighborKey);
                        queue.push([nr, nc]);
                    }
                } else {
                    // Stone neighbor - record its color as a boundary
                    boundaryColors.add(neighborValue);
                }
            }
        }

        // Determine owner: null if touches both colors, otherwise the single color
        let owner = null;
        if (boundaryColors.size === 1) {
            owner = boundaryColors.values().next().value;
        }

        return { territory, owner };
    }

    /**
     * Calculate the score using flood-fill territory calculation
     * This is for END GAME scoring - does not check for dead groups
     * @param {number} komi - Komi (points given to white, default 6.5 for Chinese rules)
     * @returns {{black: number, white: number, territory: {black: number, white: number}, stones: {black: number, white: number}, winner: string|null, margin: number}}
     */
    score(komi = 6.5) {
        const visited = new Set();
        const territory = { black: new Set(), white: new Set() };
        const stones = { black: 0, white: 0 };

        // Count all stones on the board
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] === GoEngine.BLACK) {
                    stones.black++;
                } else if (this.board[r][c] === GoEngine.WHITE) {
                    stones.white++;
                }
            }
        }

        // Flood-fill all empty regions to find territory
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const key = `${r},${c}`;
                if (this.board[r][c] === GoEngine.EMPTY && !visited.has(key)) {
                    const result = this._floodFill(r, c, visited);
                    if (result.owner === GoEngine.BLACK) {
                        for (const pos of result.territory) {
                            territory.black.add(pos);
                        }
                    } else if (result.owner === GoEngine.WHITE) {
                        for (const pos of result.territory) {
                            territory.white.add(pos);
                        }
                    }
                }
            }
        }

        // Calculate scores
        const blackScore = stones.black + territory.black.size;
        const whiteScore = stones.white + territory.white.size + komi;

        // Determine winner
        let winner = null;
        let margin = 0;
        if (blackScore > whiteScore) {
            winner = 'black';
            margin = blackScore - whiteScore;
        } else if (whiteScore > blackScore) {
            winner = 'white';
            margin = whiteScore - blackScore;
        }

        return {
            black: blackScore,
            white: whiteScore,
            territory: {
                black: territory.black.size,
                white: territory.white.size
            },
            stones: {
                black: stones.black,
                white: stones.white
            },
            winner,
            margin
        };
    }
}

// Export to window for use in browser
window.GoEngine = GoEngine;
