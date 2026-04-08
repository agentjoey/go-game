/**
 * 围棋棋盘绘制与交互
 */

class GoBoard {
    constructor(containerId, size = 19) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }
        this.size = size;
        this.board = this.createEmptyBoard();
        this.lastMove = null;
        this.listeners = [];
        this.clickHandler = null;
        
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
        let svg = `<svg viewBox="0 0 100 100" class="go-board-svg" style="cursor:pointer;">`;
        
        // 棋盘背景（木纹色）
        svg += `<rect x="0" y="0" width="100" height="100" fill="#DEB887"/>`;
        
        // 绘制网格线
        for (let i = 0; i < this.size; i++) {
            const pos = (i + 0.5) * cellSize;
            // 横线
            svg += `<line x1="${cellSize/2}" y1="${pos}" x2="${100-cellSize/2}" y2="${pos}" stroke="#333" stroke-width="0.3"/>`;
            // 竖线
            svg += `<line x1="${pos}" y1="${cellSize/2}" x2="${pos}" y2="${100-cellSize/2}" stroke="#333" stroke-width="0.3"/>`;
        }
        
        // 绘制星位
        const starPoints = this.getStarPoints();
        starPoints.forEach(([row, col]) => {
            const x = (col + 0.5) * cellSize;
            const y = (row + 0.5) * cellSize;
            svg += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.15}" fill="#333"/>`;
        });
        
        // 绘制棋子
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] !== 0) {
                    const x = (col + 0.5) * cellSize;
                    const y = (row + 0.5) * cellSize;
                    const isBlack = this.board[row][col] === 1;
                    const color = isBlack ? '#000' : '#fff';
                    const strokeColor = isBlack ? '#333' : '#ccc';
                    
                    // 棋子阴影
                    svg += `<circle cx="${x + 0.8}" cy="${y + 0.8}" r="${cellSize * 0.42}" fill="rgba(0,0,0,0.15)"/>`;
                    
                    // 棋子本体
                    svg += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.42}" fill="${color}" stroke="${strokeColor}" stroke-width="0.4"/>`;
                    
                    // 最后一手标记（小红点）
                    if (this.lastMove && this.lastMove[0] === row && this.lastMove[1] === col) {
                        svg += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.12}" fill="#e74c3c"/>`;
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
            // 19路棋盘的星位 (3,3), (3,9), (3,15), (9,3), (9,9), (9,15), (15,3), (15,9), (15,15) 和天元 (9,9)
            const positions = [3, 9, 15];
            positions.forEach(row => {
                positions.forEach(col => {
                    points.push([row, col]);
                });
            });
        } else if (this.size === 13) {
            const positions = [3, 6, 9];
            positions.forEach(row => {
                positions.forEach(col => {
                    points.push([row, col]);
                });
            });
        } else if (this.size === 9) {
            // 9路棋盘的星位 (2,2), (2,6), (6,2), (6,6) 和天元 (4,4)
            const positions = [2, 6];
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
        // 移除旧的事件监听器
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
        }
        
        // 创建新的事件处理器
        this.clickHandler = (e) => {
            const svg = this.container.querySelector('svg');
            if (!svg) return;
            
            const rect = svg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 计算点击位置对应的棋盘坐标
            const cellSize = rect.width / this.size;
            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);
            
            // 确保坐标在有效范围内
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                this.notifyListeners(row, col);
            }
        };
        
        this.container.addEventListener('click', this.clickHandler);
    }

    setBoard(board) {
        this.board = board.map(row => [...row]);
        this.render();
        this.bindEvents(); // 重新绑定事件
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

    getCellSize() {
        return 100 / this.size;
    }

    // 坐标转换：从 row, col 到字母数字组合 (如 D4)
    coordToString(row, col) {
        const colLetter = String.fromCharCode(65 + col);
        return `${colLetter}${this.size - row}`;
    }

    // 坐标转换：从字符串 (如 D4) 到 row, col
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

    // 清除棋盘
    clear() {
        this.board = this.createEmptyBoard();
        this.lastMove = null;
        this.render();
    }
}

// 导出到全局
window.GoBoard = GoBoard;
