/**
 * 围棋棋盘 - Phase 1 美化版
 */

class GoBoard {
    constructor(containerId, size = 19) {
        this.containerId = containerId;
        this.container = null;
        this.size = size;
        this.board = [];
        this.lastMove = null;
        this.listeners = [];
        
        for (let i = 0; i < size; i++) {
            this.board.push(new Array(size).fill(0));
        }
        
        this.init();
    }
    
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            setTimeout(() => this.init(), 100);
            return;
        }
        this.render();
    }
    
    render() {
        if (!this.container) return;
        
        const size = this.size;
        const cellSize = 100 / size;
        
        let svg = `<svg viewBox="0 0 100 100" style="width:100%;height:auto;display:block;cursor:pointer;" class="go-board-svg">`;
        
        // 榧木色背景
        svg += `<rect x="0" y="0" width="100" height="100" fill="#e8dfc8" rx="4"/>`;
        
        // 网格线
        for (let i = 0; i < size; i++) {
            const pos = (i + 0.5) * cellSize;
            svg += `<line x1="${cellSize/2}" y1="${pos}" x2="${100-cellSize/2}" y2="${pos}" stroke="#3d3d3d" stroke-width="0.35"/>`;
            svg += `<line x1="${pos}" y1="${cellSize/2}" x2="${pos}" y2="${100-cellSize/2}" stroke="#3d3d3d" stroke-width="0.35"/>`;
        }
        
        // 星位
        const stars = this.getStarPoints();
        stars.forEach(([r, c]) => {
            svg += `<circle cx="${(c+0.5)*cellSize}" cy="${(r+0.5)*cellSize}" r="${cellSize*0.18}" fill="#c45c48"/>`;
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
                    // 棋子渐变效果
                    const gradId = `grad-${r}-${c}`;
                    if (isBlack) {
                        svg += `<circle cx="${cx}" cy="${cy}" r="${cellSize*0.4}" fill="#2d2d2d" stroke="#1a1a1a" stroke-width="0.3"/>`;
                        svg += `<ellipse cx="${cx-cellSize*0.1}" cy="${cy-cellSize*0.12}" rx="${cellSize*0.15}" ry="${cellSize*0.08}" fill="rgba(255,255,255,0.15)"/>`;
                    } else {
                        svg += `<circle cx="${cx}" cy="${cy}" r="${cellSize*0.4}" fill="#faf8f5" stroke="#d0cdc5" stroke-width="0.3"/>`;
                        svg += `<ellipse cx="${cx-cellSize*0.1}" cy="${cy-cellSize*0.12}" rx="${cellSize*0.12}" ry="${cellSize*0.06}" fill="rgba(255,255,255,0.6)"/>`;
                    }
                    
                    // 最后一手标记
                    if (this.lastMove && this.lastMove[0] === r && this.lastMove[1] === c) {
                        const markerColor = isBlack ? '#fff' : '#1a1a1a';
                        svg += `<circle cx="${cx}" cy="${cy}" r="${cellSize*0.12}" fill="${markerColor}"/>`;
                    }
                }
            }
        }
        
        // 鼠标悬停预览
        svg += `<rect class="hover-layer" x="0" y="0" width="100" height="100" fill="transparent"/>`;
        
        svg += `</svg>`;
        this.container.innerHTML = svg;
        
        this.bindEvents();
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
        const svg = this.container.querySelector('svg');
        if (!svg) return;
        
        const newSvg = svg.cloneNode(true);
        svg.parentNode.replaceChild(newSvg, svg);
        
        // 悬停效果
        newSvg.addEventListener('mousemove', (e) => {
            const rect = newSvg.getBoundingClientRect();
            const cellW = rect.width / this.size;
            const cellH = rect.height / this.size;
            const col = Math.floor((e.clientX - rect.left) / cellW);
            const row = Math.floor((e.clientY - rect.top) / cellH);
            
            // 可以在此处添加候选子预览
        });
        
        // 点击落子
        newSvg.addEventListener('click', (e) => {
            const rect = newSvg.getBoundingClientRect();
            const col = Math.floor((e.clientX - rect.left) / (rect.width / this.size));
            const row = Math.floor((e.clientY - rect.top) / (rect.height / this.size));
            
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                this.listeners.forEach(fn => fn(row, col));
            }
        });
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
