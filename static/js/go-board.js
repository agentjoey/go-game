/**
 * 围棋棋盘 - 简化版 MVP (纯 JavaScript)
 */

class GoBoard {
    constructor(containerId, size = 19) {
        this.containerId = containerId;
        this.container = null;
        this.size = size;
        this.board = this.createEmptyBoard();
        this.lastMove = null;
        this.listeners = [];
        this.boundHandler = null;
        
        this.init();
    }
    
    createEmptyBoard() {
        const b = [];
        for (let i = 0; i < this.size; i++) {
            b.push(new Array(this.size).fill(0));
        }
        return b;
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.log('Waiting for container:', this.containerId);
            setTimeout(() => this.init(), 100);
            return;
        }
        console.log('Board initialized:', this.containerId);
        this.render();
        this.bindEvents();
    }

    render() {
        if (!this.container) return;
        
        const cellSize = 100 / this.size;
        let html = `<div class="go-board-svg-container" style="position:relative;width:100%;">`;
        html += `<svg viewBox="0 0 100 100" style="width:100%;display:block;cursor:pointer;">`;
        
        // 棋盘背景
        html += `<rect x="0" y="0" width="100" height="100" fill="#DEB887"/>`;
        
        // 网格线
        for (let i = 0; i < this.size; i++) {
            const pos = (i + 0.5) * cellSize;
            html += `<line x1="${cellSize/2}" y1="${pos}" x2="${100-cellSize/2}" y2="${pos}" stroke="#333" stroke-width="0.3"/>`;
            html += `<line x1="${pos}" y1="${cellSize/2}" x2="${pos}" y2="${100-cellSize/2}" stroke="#333" stroke-width="0.3"/>`;
        }
        
        // 星位
        const stars = this.getStarPoints();
        stars.forEach(([r, c]) => {
            const x = (c + 0.5) * cellSize;
            const y = (r + 0.5) * cellSize;
            html += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.15}" fill="#333"/>`;
        });
        
        // 棋子
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] !== 0) {
                    const x = (c + 0.5) * cellSize;
                    const y = (r + 0.5) * cellSize;
                    const isBlack = this.board[r][c] === 1;
                    const color = isBlack ? '#000' : '#fff';
                    const stroke = isBlack ? '#333' : '#ccc';
                    const isLast = this.lastMove && this.lastMove[0] === r && this.lastMove[1] === c;
                    
                    // 阴影
                    html += `<circle cx="${x+0.5}" cy="${y+0.5}" r="${cellSize * 0.42}" fill="rgba(0,0,0,0.2)"/>`;
                    // 棋子
                    html += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.42}" fill="${color}" stroke="${stroke}" stroke-width="0.4"/>`;
                    // 最后一手标记
                    if (isLast) {
                        html += `<circle cx="${x}" cy="${y}" r="${cellSize * 0.12}" fill="#e74c3c"/>`;
                    }
                }
            }
        }
        
        html += `</svg>`;
        html += `</div>`;
        
        this.container.innerHTML = html;
    }
    
    getStarPoints() {
        if (this.size === 19) {
            return [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]];
        } else if (this.size === 13) {
            return [[3,3],[3,6],[3,9],[6,3],[6,6],[6,9],[9,3],[9,6],[9,9]];
        } else if (this.size === 9) {
            return [[2,2],[2,6],[6,2],[6,6],[4,4]];
        }
        return [];
    }
    
    bindEvents() {
        if (!this.container) return;
        
        // 移除旧事件
        if (this.boundHandler) {
            this.container.removeEventListener('click', this.boundHandler);
        }
        
        // 创建新的事件处理器
        this.boundHandler = (e) => {
            const svg = this.container.querySelector('svg');
            if (!svg) return;
            
            const rect = svg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cellW = rect.width / this.size;
            const cellH = rect.height / this.size;
            
            const col = Math.floor(x / cellW);
            const row = Math.floor(y / cellH);
            
            console.log('Click:', row, col, 'size:', this.size);
            
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                this.notifyListeners(row, col);
            }
        };
        
        this.container.addEventListener('click', this.boundHandler);
    }
    
    setBoard(board) {
        this.board = board;
        this.render();
        this.bindEvents();
    }
    
    setLastMove(row, col) {
        this.lastMove = [row, col];
        this.render();
    }
    
    clearLastMove() {
        this.lastMove = null;
        this.render();
    }
    
    addClickListener(fn) {
        this.listeners.push(fn);
    }
    
    notifyListeners(row, col) {
        this.listeners.forEach(fn => fn(row, col));
    }
    
    coordToString(row, col) {
        return String.fromCharCode(65 + col) + (this.size - row);
    }
}

window.GoBoard = GoBoard;
