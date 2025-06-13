// メインゲームクラス
class TetrisGame {
    constructor() {
        // 状態管理
        this.stateManager = new GameStateManager();
        this.titleScreen = new TitleScreen();
        
        this.board = new GameBoard(10, 20);
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // ホールド・NEXT機能
        this.holdManager = null;
        this.nextQueue = null;
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        this.nextCanvases = [
            document.getElementById('next1Canvas'),
            document.getElementById('next2Canvas'),
            document.getElementById('next3Canvas'),
            document.getElementById('next4Canvas'),
            document.getElementById('next5Canvas')
        ];
        this.nextCtxs = this.nextCanvases.map(canvas => canvas.getContext('2d'));
        
        this.blockSize = 30;
        this.dropTime = 0;
        this.dropInterval = 1000; // 1秒
        
        // タイトル画面では初期化しない
        this.currentPiece = null;
        
        this.setupEventListeners();
        this.lastTime = 0;
        
        // スコア表示要素
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        
        // タイトル画面のイベント設定
        this.titleScreen.onGameStart = () => this.startGame();
        
        this.updateDisplay();
    }

    startGame() {
        this.stateManager.setState('playing');
        this.titleScreen.hide();
        
        // ゲーム状態をリセット
        this.board.clear();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // ホールド・NEXT機能を初期化
        this.holdManager = new HoldManager();
        this.nextQueue = new NextQueue();
        
        // ピースを初期化
        this.currentPiece = this.nextQueue.getNext();
        
        this.updateDisplay();
        this.draw();
    }

    holdCurrentPiece() {
        if (!this.holdManager || !this.currentPiece) return;
        
        // ホールドできない場合は何もしない
        if (!this.holdManager.canHold) return;
        
        const exchangedPiece = this.holdManager.holdPiece(this.currentPiece);
        
        if (exchangedPiece) {
            // 交換
            this.currentPiece = exchangedPiece;
        } else {
            // 初回ホールド - 新しいピースを取得
            this.currentPiece = this.nextQueue.getNext();
        }
        
        this.draw();
    }

    getNextPieces(count) {
        if (!this.nextQueue) return [];
        
        const pieces = [];
        for (let i = 0; i < Math.min(count, this.nextQueue.queue.length); i++) {
            pieces.push(this.nextQueue.getPieceAt(i));
        }
        return pieces;
    }

    endGame() {
        this.stateManager.setState('gameOver');
        this.gameOver = true;
        this.showGameOver();
    }

    returnToTitle() {
        this.stateManager.setState('title');
        this.titleScreen.show();
        this.gameOver = false;
        
        // ゲームオーバー画面を削除
        const overlay = document.querySelector('.game-over-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    update(deltaTime) {
        // タイトル画面では更新しない
        if (!this.stateManager.isPlaying()) {
            return;
        }
        
        this.dropTime += deltaTime;
        if (this.dropTime > this.dropInterval) {
            this.movePieceDown();
            this.dropTime = 0;
        }
    }

    getRandomPiece() {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new Tetromino(randomType);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            // タイトル画面での操作
            if (this.stateManager.isTitle()) {
                this.titleScreen.handleKeyPress(event.code);
                event.preventDefault();
                return;
            }
            
            // ゲーム中の操作
            if (!this.stateManager.isPlaying()) return;
            
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
                case 'KeyC':
                    this.holdCurrentPiece();
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
        this.currentPiece = this.nextQueue.getNext();
        
        // ホールド可能にする
        if (this.holdManager) {
            this.holdManager.enableHold();
        }
        
        // ゲームオーバーチェック
        if (!this.board.isValidPosition(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.endGame();
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
                <button id="restartButton">もう一度プレイ</button>
                <button id="titleButton">タイトルに戻る</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // イベントリスナーを追加
        document.getElementById('restartButton').addEventListener('click', () => {
            overlay.remove();
            this.startGame();
        });
        
        document.getElementById('titleButton').addEventListener('click', () => {
            this.returnToTitle();
        });
    }

    draw() {
        // メインキャンバスをクリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // ゲーム中のみ描画
        if (this.stateManager.isPlaying() && this.currentPiece) {
            // ボードを描画
            this.drawBoard();
            
            // 現在のピースを描画
            this.drawPiece(this.ctx, this.currentPiece, this.currentPiece.x, this.currentPiece.y);
            
            // ホールド・NEXT表示を描画
            this.drawHold();
            this.drawNext();
        } else {
            // キャンバスをクリア
            this.clearHoldAndNext();
        }
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

    drawHold() {
        // ホールドキャンバスをクリア
        this.holdCtx.fillStyle = '#111';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (this.holdManager && this.holdManager.heldPiece) {
            this.drawPieceOnCanvas(
                this.holdCtx, 
                this.holdManager.heldPiece, 
                this.holdCanvas.width, 
                this.holdCanvas.height, 
                16
            );
        }
    }

    drawNext() {
        if (!this.nextQueue) return;
        
        for (let i = 0; i < this.nextCtxs.length; i++) {
            const ctx = this.nextCtxs[i];
            const canvas = this.nextCanvases[i];
            const piece = this.nextQueue.getPieceAt(i);
            
            // キャンバスをクリア
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (piece) {
                const blockSize = i === 0 ? 14 : (i === 1 ? 12 : (i === 2 ? 10 : 8));
                this.drawPieceOnCanvas(ctx, piece, canvas.width, canvas.height, blockSize);
            }
        }
    }

    drawPieceOnCanvas(ctx, piece, canvasWidth, canvasHeight, blockSize) {
        const centerX = Math.floor((canvasWidth - piece.shape[0].length * blockSize) / 2);
        const centerY = Math.floor((canvasHeight - piece.shape.length * blockSize) / 2);
        
        ctx.fillStyle = piece.color;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0) {
                    ctx.fillRect(
                        centerX + x * blockSize,
                        centerY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(
                        centerX + x * blockSize,
                        centerY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }

    clearHoldAndNext() {
        // ホールドキャンバスクリア
        this.holdCtx.fillStyle = '#111';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        // NEXTキャンバスクリア
        this.nextCtxs.forEach((ctx, i) => {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, this.nextCanvases[i].width, this.nextCanvases[i].height);
        });
    }

    gameLoop(time) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        // 状態に応じた処理
        if (this.stateManager.isPlaying()) {
            this.update(deltaTime);
            this.draw();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        // 初期はタイトル画面を表示
        this.titleScreen.show();
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