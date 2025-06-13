// テトリミノ（ブロック）クラス
class Tetromino {
    constructor(type) {
        this.type = type;
        this.x = 3; // 初期x位置
        this.y = 0; // 初期y位置
        this.rotation = 0; // 回転状態（0-3）
        this.shape = this.getShape(type);
        this.color = this.getColor(type);
        this.lastRotatedInto = false; // T-Spin判定用
    }

    getShape(type) {
        const shapes = {
            'I': [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            'O': [
                [1, 1],
                [1, 1]
            ],
            'T': [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            'S': [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            'Z': [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            'J': [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            'L': [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ]
        };
        return shapes[type] || shapes['I'];
    }

    getColor(type) {
        const colors = {
            'I': '#00ffff', // シアン
            'O': '#ffff00', // 黄色
            'T': '#800080', // 紫
            'S': '#008000', // 緑
            'Z': '#ff0000', // 赤
            'J': '#0000ff', // 青
            'L': '#ffa500'  // オレンジ
        };
        return colors[type] || colors['I'];
    }

    // 時計回りに90度回転
    rotate() {
        const newShape = [];
        const size = this.shape.length;
        
        for (let i = 0; i < size; i++) {
            newShape[i] = [];
            for (let j = 0; j < size; j++) {
                newShape[i][j] = this.shape[size - 1 - j][i];
            }
        }
        
        this.shape = newShape;
        this.rotation = (this.rotation + 1) % 4;
        this.lastRotatedInto = true;
    }

    // ピースのコピーを作成
    copy() {
        const copy = new Tetromino(this.type);
        copy.x = this.x;
        copy.y = this.y;
        copy.rotation = this.rotation;
        copy.lastRotatedInto = this.lastRotatedInto;
        copy.shape = this.shape.map(row => [...row]);
        return copy;
    }
}

// ゲームボード管理クラス
class GameBoard {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                grid[y][x] = 0;
            }
        }
        return grid;
    }

    // ピースが指定位置に配置可能かチェック
    isValidPosition(piece, x, y) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px] !== 0) {
                    const newX = x + px;
                    const newY = y + py;
                    
                    // ボード境界チェック
                    if (newX < 0 || newX >= this.width || newY >= this.height) {
                        return false;
                    }
                    
                    // 既存ブロックとの衝突チェック
                    if (newY >= 0 && this.grid[newY][newX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // ピースをボードに固定
    placePiece(piece) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px] !== 0) {
                    const x = piece.x + px;
                    const y = piece.y + py;
                    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                        this.grid[y][x] = 1;
                    }
                }
            }
        }
    }

    // 完成した行を検出
    getCompletedLines() {
        const completedLines = [];
        for (let y = 0; y < this.height; y++) {
            let isComplete = true;
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                completedLines.push(y);
            }
        }
        return completedLines;
    }

    // 指定した行を削除し、上の行を下に移動
    clearLines(lines) {
        lines.sort((a, b) => b - a); // 下から上の順序でソート
        
        for (let line of lines) {
            // 指定行を削除
            this.grid.splice(line, 1);
            // 上に新しい空行を追加
            this.grid.unshift(new Array(this.width).fill(0));
        }
    }

    // ボードをクリア
    clear() {
        this.grid = this.createEmptyGrid();
    }
}