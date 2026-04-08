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

        // 费曼模式高亮区域
        this.highlightCells.forEach(({ row, col }) => {
            const hx = (col + 0.5) * cellSize;
            const hy = (row + 0.5) * cellSize;
            svg += `<circle cx="${hx}" cy="${hy}" r="${cellSize*0.35}" fill="rgba(255,215,0,0.3)" stroke="#ffd700" stroke-width="0.5" stroke-dasharray="3,2"/>`;
        });
        
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

                    // 费曼模式问号标记
                    if (this.questionMark && this.questionMark.row === r && this.questionMark.col === c) {
                        svg += `<text x="${cx}" y="${cy + cellSize*0.15}" text-anchor="middle" font-size="${cellSize*0.4}" fill="#c45c48" font-weight="bold">?</text>`;
                    }

                    // 正确标记
                    if (this.correctMarkPos && this.correctMarkPos.row === r && this.correctMarkPos.col === c) {
                        svg += `<circle cx="${cx}" cy="${cy}" r="${cellSize*0.25}" fill="#5a8f5a" stroke="#fff" stroke-width="${cellSize*0.05}"/>`;
                        svg += `<text x="${cx}" y="${cy + cellSize*0.12}" text-anchor="middle" font-size="${cellSize*0.25}" fill="#fff" font-weight="bold">✓</text>`;
                    }
                }
            }
        }

        // 苏格拉底模式焦点位置 - 金色醒目标记（画在棋子之上，确保始终可见）
        if (this.socraticFocus) {
            const fx = (this.socraticFocus.col + 0.5) * cellSize;
            const fy = (this.socraticFocus.row + 0.5) * cellSize;
            // 外层虚线圆
            svg += `<circle cx="${fx}" cy="${fy}" r="${cellSize*0.45}" fill="none" stroke="#ffd700" stroke-width="${cellSize*0.06}" stroke-dasharray="${cellSize*0.15},${cellSize*0.08}"/>`;
            // 内层实线圆
            svg += `<circle cx="${fx}" cy="${fy}" r="${cellSize*0.3}" fill="rgba(255,215,0,0.15)" stroke="#ffd700" stroke-width="${cellSize*0.05}"/>`;
            // 中心实心圆点
            svg += `<circle cx="${fx}" cy="${fy}" r="${cellSize*0.1}" fill="#ffd700"/>`;
            // 四个方向小三角装饰
            const tri = cellSize * 0.06;
            svg += `<polygon points="${fx},${fy-cellSize*0.38} ${fx-tri},${fy-cellSize*0.3} ${fx+tri},${fy-cellSize*0.3}" fill="#ffd700"/>`;
            svg += `<polygon points="${fx},${fy+cellSize*0.38} ${fx-tri},${fy+cellSize*0.3} ${fx+tri},${fy+cellSize*0.3}" fill="#ffd700"/>`;
            svg += `<polygon points="${fx-cellSize*0.38},${fy} ${fx-cellSize*0.3},${fy-tri} ${fx-cellSize*0.3},${fy+tri}" fill="#ffd700"/>`;
            svg += `<polygon points="${fx+cellSize*0.38},${fy} ${fx+cellSize*0.3},${fy-tri} ${fx+cellSize*0.3},${fy+tri}" fill="#ffd700"/>`;
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

    // ==================== 费曼模式标记 ====================

    questionMark = null;
    markingMode = false;
    highlightCells = [];
    correctMarkPos = null;
    socraticFocus = null;

    setQuestionMark(row, col) {
        this.questionMark = { row, col };
        this.render();
    }

    setMarkingMode(enabled) {
        this.markingMode = enabled;
        this.render();
    }

    setSocraticFocus(row, col) {
        this.socraticFocus = { row, col };
        this.render();
    }

    clearSocraticFocus() {
        this.socraticFocus = null;
        this.render();
    }

    highlightArea(row, col, persistent = false) {
        this.highlightCells = [];
        // 高亮周围3x3区域
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
                    this.highlightCells.push({ row: r, col: c });
                }
            }
        }
        this.render();

        // 非持续模式：3秒后清除
        if (!persistent) {
            setTimeout(() => {
                this.highlightCells = [];
                this.render();
            }, 3000);
        }
    }

    showCorrectMark(row, col) {
        this.correctMarkPos = { row, col };
        this.render();
    }

    clearFeynmanMarks() {
        this.questionMark = null;
        this.markingMode = false;
        this.highlightCells = [];
        this.correctMarkPos = null;
        this.socraticFocus = null;
        this.render();
    }

    // ==================== 移动端手势支持 ====================

    scale = 1;
    lastTouchDist = 0;
    touchStartPos = null;
    longPressTimer = null;

    enableTouchGestures() {
        if (!this.container) return;

        const svg = this.container.querySelector('svg');
        if (!svg) return;

        // 防止默认触摸行为
        svg.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.touchStartPos = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    time: Date.now()
                };

                // 长按检测 (500ms)
                this.longPressTimer = setTimeout(() => {
                    this.handleLongPress(e);
                }, 500);
            } else if (e.touches.length === 2) {
                // 双指缩放开始
                this.lastTouchDist = this.getTouchDistance(e.touches);
                clearTimeout(this.longPressTimer);
            }
        }, { passive: false });

        svg.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                // 双指缩放
                const dist = this.getTouchDistance(e.touches);
                const delta = dist - this.lastTouchDist;

                if (Math.abs(delta) > 5) {
                    this.scale += delta * 0.005;
                    this.scale = Math.max(0.5, Math.min(2, this.scale));
                    svg.style.transform = `scale(${this.scale})`;
                    this.lastTouchDist = dist;
                }
                e.preventDefault();
            }
        }, { passive: false });

        svg.addEventListener('touchend', (e) => {
            clearTimeout(this.longPressTimer);

            if (e.touches.length === 0) {
                // 检测短按点击
                if (this.touchStartPos && Date.now() - this.touchStartPos.time < 300) {
                    // 短按处理 - 在 touchstart 中已经通过 click 处理
                }
            }

            this.touchStartPos = null;
        });

        // 单指点击处理
        svg.addEventListener('click', (e) => {
            // 如果是触摸后移动过，不处理点击
            if (this.isMobile) return;
        });

        this.isMobile = true;
    }

    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleLongPress(e) {
        // 长按显示分析
        const rect = this.container.getBoundingClientRect();
        const col = Math.floor((e.touches[0].clientX - rect.left) / (rect.width / this.size));
        const row = Math.floor((e.touches[0].clientY - rect.top) / (rect.height / this.size));

        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            // 触发长按回调（如果有）
            if (this.onLongPress) {
                this.onLongPress(row, col);
            }
        }
    }

    setOnLongPress(callback) {
        this.onLongPress = callback;
    }
}

window.GoBoard = GoBoard;
