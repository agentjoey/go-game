/**
 * 围棋棋盘绘制与交互
 */

class GoBoard {
    constructor(containerId, size = 19) {
        this.container = document.getElementById(containerId);
        this.size = size;
        this.board = this.createEmptyBoard();
        this.lastMove = null;
        this.listeners = [];
        
        this.init();
    }

    createEmptyBoard() {
        return Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const cellSize = 100 / this.size;
        let svg = `<svg viewBox="0 0 100 100" class="go-board-svg">`;
        
        // 绘制棋盘背景
        svg += `<rect x="0" y="0" width="100" height="100" fill="#DEB887"/>`;
        
        // 绘制网格线
        for (let i = 0; i < this.size; i++) {
            const pos = (i + 0.5) * cellSize;
            // 横线
            svg += `<line x1="${cellSize/2}" y1="${pos}" x2="${100-cellSize/2}" y2="${pos}" stroke="#333" stroke-width="0.2"/>`;
            // 竖线
            svg += `<line x1="${pos}" y1="${cellSize/2}" x2="${pos}" y2="${100-cellSize/2}" stroke="#333" stroke-width="0.2"/>`;
        }
        
        // 绘制星位
        const starPoints = this.getStarPoints();
        starPoints.forEach(([row, col]) => {
            const x = (col + 0.5) * cellSize;
            const y = (row + 0.5) * cellSize;
            svg += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.12}" fill="#333"/>`;
        });
        
        // 绘制棋子
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] !== 0) {
                    const x = (col + 0.5) * cellSize;
                    const y = (row + 0.5) * cellSize;
                    const color = this.board[row][col] === 1 ? '#000' : '#fff';
                    const strokeColor = this.board[row][col] === 1 ? '#333' : '#ccc';
                    
                    // 棋子阴影
                    svg += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="${cellSize * 0.42}" fill="rgba(0,0,0,0.2)"/>`;
                    
                    // 棋子
                    svg += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.42}" fill="${color}" stroke="${strokeColor}" stroke-width="0.3"/>`;
                    
                    // 最后一手标记
                    if (this.lastMove && this.lastMove[0] === row && this.lastMove[1] === col) {
                        svg += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.15}" fill="${this.board[row][col] === 1 ? '#fff' : '#000'}"/>`;
                    }
                }
            }
        }
        
        svg += `</svg>`;
        this.container.innerHTML = svg;
    }

    getStarPoints() {
        const points = [];
        if (this.size === 19) {
            // 19路棋盘的星位
            const positions = [3, 9, 15];
            positions.forEach(row => {
                positions.forEach(col => {
                    points.push([row, col]);
                });
            });
            // 天元
            points.push([9, 9]);
        } else if (this.size === 13) {
            const positions = [3, 6, 9];
            positions.forEach(row => {
                positions.forEach(col => {
                    points.push([row, col]);
                });
            });
            points.push([6, 6]);
        } else if (this.size === 9) {
            const positions = [2, 4, 6];
            positions.forEach(row => {
                positions.forEach(col => {
                    points.push([row, col]);
                });
            });
            points.push([4, 4]);
        }
        return points;
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const svg = this.container.querySelector('svg');
            const rect = svg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cellSize = 100 / this.size;
            const col = Math.floor(x / rect.width * this.size);
            const row = Math.floor(y / rect.height * this.size);
            
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                this.notifyListeners(row, col);
            }
        });
    }

    setBoard(board) {
        this.board = board.map(row => [...row]);
        this.render();
    }

    setLastMove(row, col) {
        this.lastMove = [row, col];
        this.render();
    }

    clearLastMove() {
        this.lastMove = null;
        this.render();
    }

    addClickListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(row, col) {
        this.listeners.forEach(callback => callback(row, col));
    }

    animatePlaceStone(row, col, color) {
        // 简化动画：在下一帧重新渲染
        requestAnimationFrame(() => {
            this.render();
        });
    }

    getCellSize() {
        return 100 / this.size;
    }

    coordToString(row, col) {
        const colLetter = String.fromCharCode(65 + col);
        return `${colLetter}${this.size - row}`;
    }

    stringToCoord(str) {
        str = str.toUpperCase().trim();
        if (str.length < 2) return null;
        
        const col = str.charCodeAt(0) - 65;
        const row = this.size - parseInt(str.substring(1));
        
        if (col >= 0 && col < this.size && row >= 0 && row < this.size) {
            return [row, col];
        }
        return null;
    }
}

// 导出
window.GoBoard = GoBoard;
