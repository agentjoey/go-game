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
