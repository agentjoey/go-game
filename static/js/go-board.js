/**
 * 围棋棋盘 - Phase 2 动画增强版
 */

class GoBoard {
    constructor(containerId, size = 19) {
        this.containerId = containerId;
        this.container = null;
        this.size = size;
        this.board = [];
        this.lastMove = null;
        this.listeners = [];
        this.hoverCell = null;
        this.animatingCells = [];
        
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
        
        // 候选子悬停
        if (this.hoverCell && this.board[this.hoverCell.row]?.[this.hoverCell.col] === 0) {
            const hx = (this.hoverCell.col + 0.5) * cellSize;
            const hy = (this.hoverCell.row + 0.5) * cellSize;
            svg += `<circle class="candidate-stone" cx="${hx}" cy="${hy}" r="${cellSize*0.35}" fill="rgba(0,0,0,0.15)" stroke="#666" stroke-width="0.3" stroke-dasharray="2,1"/>`;
        }
        
        // 棋子
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (this.board[r][c] !== 0) {
                    const cx = (c + 0.5) * cellSize;
                    const cy = (r + 0.5) * cellSize;
                    const isBlack = this.board[r][c] === 1;
                    const isAnimating = this.animatingCells.some(a => a.row === r && a.col === c);
                    const animClass = isAnimating ? 'piece-drop' : '';
                    
                    // 阴影
                    svg += `<circle cx="${cx+0.6}" cy="${cy+0.6}" r="${cellSize*0.4}" fill="rgba(0,0,0,0.2)"/>`;
                    
                    if (isBlack) {
                        svg += `<circle cx="${cx}" cy="${cy}" r="${cellSize*0.4}" fill="#2d2d2d" stroke="#1a1a1a" stroke-width="0.3" class="${animClass}"/>`;
                        svg += `<ellipse cx="${cx-cellSize*0.1}" cy="${cy-cellSize*0.12}" rx="${cellSize*0.15}" ry="${cellSize*0.08}" fill="rgba(255,255,255,0.15)"/>`;
                    } else {
                        svg += `<circle cx="${cx}" cy="${cy}" r="${cellSize*0.4}" fill="#faf8f5" stroke="#d0cdc5" stroke-width="0.3" class="${animClass}"/>`;
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
        
        const self = this;
        
        newSvg.addEventListener('mousemove', (e) => {
            const rect = newSvg.getBoundingClientRect();
            const col = Math.floor((e.clientX - rect.left) / (rect.width / this.size));
            const row = Math.floor((e.clientY - rect.top) / (rect.height / this.size));
            
            if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
                if (!this.hoverCell || this.hoverCell.row !== row || this.hoverCell.col !== col) {
                    this.hoverCell = { row, col };
                    this.render();
                }
            }
        });
        
        newSvg.addEventListener('mouseleave', () => {
            this.hoverCell = null;
            this.render();
        });
        
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
    
    // 播放落子动画
    playPlaceAnimation(row, col) {
        this.animatingCells.push({ row, col });
        this.render();
        
        setTimeout(() => {
            this.animatingCells = this.animatingCells.filter(a => !(a.row === row && a.col === col));
            this.render();
        }, 400);
    }
    
    // 播放提子动画
    playCaptureAnimation(positions) {
        positions.forEach(([r, c], i) => {
            setTimeout(() => {
                // 添加提子动画效果
                const svg = this.container.querySelector('svg');
                if (svg) {
                    const cellSize = 100 / this.size;
                    const cx = (c + 0.5) * cellSize;
                    const cy = (r + 0.5) * cellSize;
                    
                    const circle = svg.querySelector(`circle:nth-child(${this.getStoneIndex(r, c)})`);
                    if (circle) {
                        circle.classList.add('capture-effect');
                    }
                }
            }, i * 100);
        });
    }
    
    getStoneIndex(row, col) {
        // 计算棋子在 SVG 中的索引（粗略估算）
        return 1 + (row * this.size + col);
    }
}

window.GoBoard = GoBoard;
