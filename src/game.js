// メインゲームクラス
class TetrisGame {
    constructor() {
        this.board = new GameBoard(10, 20);
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.blockSize = 30;
        this.dropTime = 0;
        this.dropInterval = 1000; // 1秒
        
        this.currentPiece = this.getRandomPiece();
        this.nextPiece = this.getRandomPiece();
        
        this.setupEventListeners();
        this.lastTime = 0;
        
        // スコア表示要素
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        
        this.updateDisplay();
    }

    getRandomPiece() {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new Tetromino(randomType);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.gameOver) return;
            
            switch(event.code) {
                case 'ArrowLeft':
                    this.movePieceLeft();
                    break;
                case 'ArrowRight':
                    this.movePieceRight();
                    break;
                case 'ArrowDown':
                    this.movePieceDown();
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case 'Space':
                    this.hardDrop();
                    break;
            }
            event.preventDefault();
        });
    }

    movePieceLeft() {
        if (this.board.isValidPosition(this.currentPiece, this.currentPiece.x - 1, this.currentPiece.y)) {
            this.currentPiece.x--;
            this.draw();
        }
    }

    movePieceRight() {
        if (this.board.isValidPosition(this.currentPiece, this.currentPiece.x + 1, this.currentPiece.y)) {
            this.currentPiece.x++;
            this.draw();
        }
    }

    movePieceDown() {
        if (this.board.isValidPosition(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            this.draw();
            return true;
        } else {
            this.placePiece();
            return false;
        }
    }

    rotatePiece() {
        const rotatedPiece = this.currentPiece.copy();
        rotatedPiece.rotate();
        
        if (this.board.isValidPosition(rotatedPiece, rotatedPiece.x, rotatedPiece.y)) {
            this.currentPiece = rotatedPiece;
            this.draw();
        }
    }

    hardDrop() {
        while (this.movePieceDown()) {
            // 落下可能な限り落下
        }
    }

    placePiece() {
        this.board.placePiece(this.currentPiece);
        
        // 完成した行をチェック
        const completedLines = this.board.getCompletedLines();
        if (completedLines.length > 0) {
            this.clearLines(completedLines.length);
            this.board.clearLines(completedLines);
        }
        
        // 次のピースを設定
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        
        // ゲームオーバーチェック
        if (!this.board.isValidPosition(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver = true;
            this.showGameOver();
        }
        
        this.updateDisplay();
        this.draw();
    }

    clearLines(lineCount) {
        const baseScore = [0, 40, 100, 300, 1200];
        this.score += baseScore[lineCount] * this.level;
        this.lines += lineCount;
        
        // レベルアップ（10ライン毎）
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
        }
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.linesElement.textContent = this.lines;
    }

    showGameOver() {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-message">
                <h2>ゲームオーバー</h2>
                <p>スコア: ${this.score}</p>
                <p>レベル: ${this.level}</p>
                <p>ライン: ${this.lines}</p>
                <button onclick="location.reload()">もう一度プレイ</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    draw() {
        // メインキャンバスをクリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // ボードを描画
        this.drawBoard();
        
        // 現在のピースを描画
        this.drawPiece(this.ctx, this.currentPiece, this.currentPiece.x, this.currentPiece.y);
        
        // 次のピースを描画
        this.drawNextPiece();
    }

    drawBoard() {
        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                if (this.board.grid[y][x] !== 0) {
                    this.ctx.fillStyle = '#666';
                    this.ctx.fillRect(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.strokeRect(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                }
            }
        }
    }

    drawPiece(ctx, piece, offsetX, offsetY) {
        ctx.fillStyle = piece.color;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0) {
                    ctx.fillRect(
                        (offsetX + x) * this.blockSize,
                        (offsetY + y) * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(
                        (offsetX + x) * this.blockSize,
                        (offsetY + y) * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                }
            }
        }
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#111';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const centerX = Math.floor((this.nextCanvas.width / 20 - this.nextPiece.shape[0].length) / 2);
        const centerY = Math.floor((this.nextCanvas.height / 20 - this.nextPiece.shape.length) / 2);
        
        this.nextCtx.fillStyle = this.nextPiece.color;
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x] !== 0) {
                    this.nextCtx.fillRect(
                        (centerX + x) * 20,
                        (centerY + y) * 20,
                        20,
                        20
                    );
                    this.nextCtx.strokeStyle = '#fff';
                    this.nextCtx.strokeRect(
                        (centerX + x) * 20,
                        (centerY + y) * 20,
                        20,
                        20
                    );
                }
            }
        }
    }

    gameLoop(time) {
        if (this.gameOver) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropTime += deltaTime;
        if (this.dropTime > this.dropInterval) {
            this.movePieceDown();
            this.dropTime = 0;
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// ゲーム開始
let game;
window.addEventListener('load', () => {
    // テストが完了してからゲーム開始
    setTimeout(() => {
        game = new TetrisGame();
        game.start();
    }, 200);
});