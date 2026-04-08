/**
 * 围棋棋盘 - 完全重写版
 */

class GoBoard {
    constructor(containerId, size = 19) {
        this.containerId = containerId;
        this.container = null;
        this.size = size;
        this.board = [];
        this.lastMove = null;
        this.listeners = [];
        
        // 初始化空棋盘
        for (let i = 0; i < size; i++) {
            this.board.push(new Array(size).fill(0));
        }
        
        this.init();
    }
    
    init() {
        console.log('GoBoard.init() called, looking for container:', this.containerId);
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error('GoBoard ERROR: Container not found:', this.containerId);
            console.error('Available elements with id:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }
        console.log('GoBoard: Container found', this.container);
        this.render();
        console.log('GoBoard initialized:', this.containerId);
    }
    
    render() {
        if (!this.container) return;
        
        const size = this.size;
        const cellSize = 100 / size;
        
        // 构建 SVG
        let svg = `<svg viewBox="0 0 100 100" style="width:100%;height:auto;display:block;background:#DEB887;" id="goSvg-${this.containerId}">`;
        
        // 网格线
        for (let i = 0; i < size; i++) {
            const pos = (i + 0.5) * cellSize;
            svg += `<line x1="${cellSize/2}" y1="${pos}" x2="${100-cellSize/2}" y2="${pos}" stroke="#444" stroke-width="0.4"/>`;
            svg += `<line x1="${pos}" y1="${cellSize/2}" x2="${pos}" y2="${100-cellSize/2}" stroke="#444" stroke-width="0.4"/>`;
        }
        
        // 星位
        const stars = this.getStarPoints();
        stars.forEach(([r, c]) => {
            svg += `<circle cx="${(c+0.5)*cellSize}" cy="${(r+0.5)*cellSize}" r="${cellSize*0.18}" fill="#444"/>`;
        });
        
        // 棋子
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (this.board[r][c] !== 0) {
                    const cx = (c + 0.5) * cellSize;
                    const cy = (r + 0.5) * cellSize;
                    const isBlack = this.board[r][c] === 1;
                    
                    // 阴影
                    svg += `<circle cx="${cx+0.6}" cy="${cy+0.6}" r="${cellSize*0.4}" fill="rgba(0,0,0,0.2)"/>`;
                    // 棋子
                    svg += `<circle cx="${cx}" cy="${cy}" r="${cellSize*0.4}" fill="${isBlack?'#111':'#fff'}" stroke="${isBlack?'#333':'#aaa'}" stroke-width="0.5"/>`;
                    
                    // 最后一手标记
                    if (this.lastMove && this.lastMove[0] === r && this.lastMove[1] === c) {
                        svg += `<circle cx="${cx}" cy="${cy}" r="${cellSize*0.12}" fill="#e74c3c"/>`;
                    }
                }
            }
        }
        
        svg += `</svg>`;
        this.container.innerHTML = svg;
        
        // 绑定点击事件
        this.bindClickEvent();
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
    
    bindClickEvent() {
        const svgId = `goSvg-${this.containerId}`;
        const svg = document.getElementById(svgId);
        console.log('GoBoard.bindClickEvent(): looking for SVG:', svgId, 'found:', !!svg);
        
        if (!svg) {
            console.error('GoBoard ERROR: SVG element not found:', svgId);
            return;
        }
        
        // 移除旧事件（通过替换节点）
        const newSvg = svg.cloneNode(true);
        svg.parentNode.replaceChild(newSvg, svg);
        
        // 添加点击事件
        newSvg.addEventListener('click', (e) => {
            const rect = newSvg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cellW = rect.width / this.size;
            const cellH = rect.height / this.size;
            
            const col = Math.floor(x / cellW);
            const row = Math.floor(y / cellH);
            
            console.log('GoBoard CLICK:', row, col, 'listeners:', this.listeners.length);
            
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                this.listeners.forEach(fn => fn(row, col));
            }
        });
        
        console.log('GoBoard: Click event bound to SVG');
    }
    
    setBoard(board) {
        this.board = board;
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
    
    addClickListener(fn) {
        this.listeners.push(fn);
    }
    
    coordToString(row, col) {
        return String.fromCharCode(65 + col) + (this.size - row);
    }
}

window.GoBoard = GoBoard;
