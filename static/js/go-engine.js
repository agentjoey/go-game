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
}

// Export to window for use in browser
window.GoEngine = GoEngine;
