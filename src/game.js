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
        
        // ライン消去アニメーション
        this.lineAnimation = {
            active: false,
            lines: [],
            stage: 'highlight', // 'highlight' -> 'clear' -> 'drop'
            timer: 0,
            duration: {
                highlight: 300,
                clear: 200,
                drop: 133  // 400ms ÷ 3 ≈ 133ms
            },
            // 落下アニメーション用
            dropAnimation: {
                beforeBoard: null, // 消去前のボード状態
                afterBoard: null,  // 消去後のボード状態
                progress: 0        // 落下進行度 (0-1)
            }
        };
        
        // タイトル画面では初期化しない
        this.currentPiece = null;
        
        this.setupEventListeners();
        this.lastTime = 0;
        
        // スコア表示要素
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        
        // オートプレイ関連
        this.modeManager = new GameModeManager();
        this.aiEngine = null;
        this.aiThinkInterval = 1000;
        this.lastAIAction = 0;
        this.debugMode = false;
        
        // タイトル画面のイベント設定
        this.titleScreen.onGameStart = (mode, options) => this.startGame(mode, options);
        
        this.updateDisplay();
    }

    startGame(mode = 'manual', options = {}) {
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
        
        // オートプレイ設定
        console.log(`[startGame] モード設定: ${mode}, オプション:`, options);
        this.modeManager.setMode(mode);
        
        if (mode === 'autoplay') {
            console.log(`[startGame] オートプレイモード初期化開始...`);
            
            this.aiEngine = new TetrisAI();
            console.log(`[startGame] TetrisAI作成完了: ${!!this.aiEngine}`);
            
            this.aiEngine.setDifficulty(options.difficulty || 'normal');
            this.aiEngine.debugLevel = 1; // 基本レベルでデバッグ開始
            this.modeManager.setAutoplaySpeed(options.speed || 1.0);
            this.aiThinkInterval = Math.max(50, 200 / this.modeManager.autoplaySpeed);
            this.lastAIAction = Date.now() - this.aiThinkInterval; // 即座に実行
            
            console.log(`[startGame] オートプレイ初期化完了:`);
            console.log(`  - AI: ${!!this.aiEngine}`);
            console.log(`  - isAutoplay: ${this.modeManager.isAutoplay}`);
            console.log(`  - 思考間隔: ${this.aiThinkInterval}ms`);
            console.log(`  - 難易度: ${options.difficulty || 'normal'}`);
        } else {
            console.log(`[startGame] 手動モードで開始`);
        }
        
        this.updateDisplay();
        this.draw();
        
        // オートプレイの場合、初回AI実行を強制実行
        if (mode === 'autoplay' && this.aiEngine && this.currentPiece) {
            console.log(`[startGame] 初回AI実行を強制開始...`);
            setTimeout(() => {
                if (this.modeManager.isAutoplay && this.aiEngine && this.currentPiece) {
                    console.log(`[startGame] 初回AI実行実行中...`);
                    this.executeAIMove();
                }
            }, 500); // 500ms後に実行
        }
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

    executeAIMove() {
        console.log(`[executeAIMove] 開始 - AI思考実行中...`);
        
        if (!this.aiEngine || !this.modeManager.isAutoplay || !this.currentPiece) {
            console.log(`[executeAIMove] 実行条件不足: AI=${!!this.aiEngine}, オートプレイ=${this.modeManager.isAutoplay}, ピース=${!!this.currentPiece}`);
            return;
        }

        // ==== 詳細デバッグ: ボード状態を記録 ====
        const boardStateBefore = this.logBoardState('AI思考前');
        
        // 次の数ピースを取得
        const nextPieces = this.getNextPieces(this.aiEngine.lookAheadDepth);
        
        // ホールド判定
        if (this.holdManager && this.holdManager.canHold) {
            const shouldHold = this.aiEngine.shouldHold(
                this.board, 
                this.currentPiece, 
                this.holdManager.heldPiece
            );
            
            if (shouldHold) {
                console.log(`[AI] ホールド判定: ピース${this.currentPiece.type}をホールド`);
                this.holdCurrentPiece();
                return;
            }
        }
        
        try {
            // 最適な移動を計算
            console.log(`[AI] 思考開始: ピース=${this.currentPiece.type}, 位置=(${this.currentPiece.x}, ${this.currentPiece.y})`);
            const bestMove = this.aiEngine.calculateBestMove(this.board, this.currentPiece, nextPieces);
            
            if (bestMove) {
                console.log(`[AI] 思考完了: 最適手=(${bestMove.x}, ${bestMove.rotation}), スコア=${bestMove.score ? bestMove.score.toFixed(1) : 'N/A'}`);
                
                // ==== デバッグ: AI思考の詳細シミュレーション ====
                this.debugAIDecision(bestMove);
                
                // 移動を実行
                this.executeMoveSequence(bestMove);
                console.log(`[AI] 移動実行完了`);
            } else {
                console.log(`[AI] 警告: 最適手が見つかりませんでした`);
            }
            
        } catch (error) {
            console.error(`[AI] エラー:`, error.message);
        }
        
        this.lastAIAction = Date.now();
    }

    // デバッグ用: AI決定の詳細シミュレーション
    debugAIDecision(bestMove) {
        console.log(`==== AI決定デバッグ ====`);
        
        // AIの思考をシミュレート
        const simulatedBoard = this.aiEngine.simulateMove(this.board, this.currentPiece, bestMove);
        const completedLines = simulatedBoard.getCompletedLines();
        
        console.log(`AI予測:`);
        console.log(`  - 配置位置: (${bestMove.x}, ${bestMove.rotation})`);
        console.log(`  - 予測消去ライン数: ${completedLines ? completedLines.length : 0}`);
        console.log(`  - 予測消去ライン: [${completedLines ? completedLines.join(', ') : 'なし'}]`);
        
        if (completedLines && completedLines.length > 0) {
            console.log(`  - AI予測: ${completedLines.length}ライン消去可能`);
        } else {
            console.log(`  - AI予測: ライン消去なし`);
        }
        
        console.log(`==================`);
    }

    // デバッグ用: ボード状態のログ出力
    logBoardState(label) {
        if (!this.aiEngine || this.aiEngine.debugLevel < 2) {
            return {
                totalBlocks: this.aiEngine ? this.aiEngine.countTotalBlocks(this.board) : 0,
                maxHeight: this.aiEngine ? this.aiEngine.getMaxHeight(this.board) : 0,
                almostCompleteLines: this.aiEngine ? this.aiEngine.countAlmostCompleteLines(this.board) : 0
            };
        }
        
        console.log(`==== ボード状態: ${label} ====`);
        
        const totalBlocks = this.aiEngine.countTotalBlocks(this.board);
        const maxHeight = this.aiEngine.getMaxHeight(this.board);
        const almostCompleteLines = this.aiEngine.countAlmostCompleteLines(this.board);
        
        console.log(`総ブロック数: ${totalBlocks}`);
        console.log(`最大高さ: ${maxHeight}`);
        console.log(`ほぼ完成ライン数: ${almostCompleteLines}`);
        
        // ボード上部10行を表示
        console.log(`ボード上部10行:`);
        for (let y = 0; y < Math.min(10, this.board.height); y++) {
            const row = this.board.grid[y].map(cell => cell === 0 ? '.' : '#').join('');
            console.log(`  ${y.toString().padStart(2)}: ${row}`);
        }
        
        console.log(`========================`);
        
        return {
            totalBlocks,
            maxHeight,
            almostCompleteLines
        };
    }

    executeMoveSequence(move) {
        console.log(`[移動実行] 開始: 目標位置=(${move.x}, ${move.rotation})`);
        
        if (!this.currentPiece) {
            console.log(`[移動実行] エラー: currentPieceが存在しません`);
            return;
        }
        
        try {
            const originalPosition = { x: this.currentPiece.x, y: this.currentPiece.y };
            console.log(`[移動実行] 開始位置: (${originalPosition.x}, ${originalPosition.y})`);
            
            // 回転
            console.log(`[移動実行] 回転: ${move.rotation}回`);
            for (let r = 0; r < move.rotation; r++) {
                const beforeRotation = this.currentPiece.rotation || 0;
                this.rotatePiece();
                const afterRotation = this.currentPiece.rotation || 0;
                console.log(`[移動実行] 回転 ${r + 1}: ${beforeRotation} → ${afterRotation}`);
            }
            
            // 横移動
            const targetX = move.x;
            const currentX = this.currentPiece.x;
            const moveDistance = targetX - currentX;
            
            console.log(`[移動実行] 横移動: ${currentX} → ${targetX} (距離: ${moveDistance})`);
            
            if (moveDistance !== 0) {
                for (let i = 0; i < Math.abs(moveDistance); i++) {
                    const beforeX = this.currentPiece.x;
                    if (moveDistance > 0) {
                        this.movePieceRight();
                    } else {
                        this.movePieceLeft();
                    }
                    const afterX = this.currentPiece.x;
                    
                    if (beforeX === afterX) {
                        console.log(`[移動実行] 横移動制限: ${i + 1}回目で移動不可 (壁/衝突)`);
                        break;
                    }
                }
            }
            
            // 最終位置確認
            console.log(`[移動実行] 移動後位置: (${this.currentPiece.x}, ${this.currentPiece.y})`);
            
            // ハードドロップ
            console.log(`[移動実行] ハードドロップ実行`);
            this.hardDrop();
            
            console.log(`[移動実行] 完了`);
            
        } catch (error) {
            console.error(`[移動実行] エラー:`, error.message);
            console.error(error.stack);
        }
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
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
            console.log(`[update] ゲーム状態が非プレイ中: ${this.stateManager.currentState}`);
            return;
        }
        
        // ライン消去アニメーション更新
        this.updateLineAnimation(deltaTime);
        
        // アニメーション中は他の処理を停止
        if (this.lineAnimation.active) {
            console.log(`[update] ライン消去アニメーション中`);
            return;
        }
        
        // currentPieceが存在しない場合は処理を停止
        if (!this.currentPiece) {
            console.log(`[update] currentPieceが存在しません - 新しいピースを生成する必要があります`);
            return;
        }
        
        console.log(`[update] 通常更新処理開始 - オートプレイ=${this.modeManager ? this.modeManager.isAutoplay : 'undefined'}`);
        
        // オートプレイ処理（強制実行）
        if (this.modeManager && this.modeManager.isAutoplay && this.aiEngine && this.currentPiece) {
            console.log(`[オートプレイ] 条件確認完了 - AI実行中...`);
            
            const timeSinceLastAI = Date.now() - this.lastAIAction;
            
            // AI実行間隔を短縮（即座に実行）
            if (timeSinceLastAI > 100) { // 100ms間隔に短縮
                console.log(`[AI] 思考開始 - 経過時間: ${timeSinceLastAI}ms`);
                this.executeAIMove();
            }
        } else {
            // デバッグ: なぜAIが実行されないかを詳細に出力
            if (this.modeManager && this.modeManager.isAutoplay) {
                console.log(`[オートプレイ診断] modeManager=${!!this.modeManager}, isAutoplay=${this.modeManager.isAutoplay}, aiEngine=${!!this.aiEngine}, currentPiece=${!!this.currentPiece}`);
            }
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
            
            // ESCキーでの手動介入
            if (event.code === 'Escape' && this.modeManager.isAutoplay) {
                this.modeManager.triggerManualIntervention();
                event.preventDefault();
                return;
            }
            
            // オートプレイ中の手動介入
            if (this.modeManager.isAutoplay && this.modeManager.allowManualIntervention) {
                this.modeManager.triggerManualIntervention();
            }
            
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
        if (!this.currentPiece) return;
        if (this.board.isValidPosition(this.currentPiece, this.currentPiece.x - 1, this.currentPiece.y)) {
            this.currentPiece.x--;
            this.draw();
        }
    }

    movePieceRight() {
        if (!this.currentPiece) return;
        if (this.board.isValidPosition(this.currentPiece, this.currentPiece.x + 1, this.currentPiece.y)) {
            this.currentPiece.x++;
            this.draw();
        }
    }

    movePieceDown() {
        if (!this.currentPiece) return false;
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
        if (!this.currentPiece) return;
        const rotatedPiece = this.currentPiece.copy();
        rotatedPiece.rotate();
        
        if (this.board.isValidPosition(rotatedPiece, rotatedPiece.x, rotatedPiece.y)) {
            this.currentPiece = rotatedPiece;
            this.draw();
        }
    }

    hardDrop() {
        if (!this.currentPiece) return;
        while (this.movePieceDown()) {
            // 落下可能な限り落下
        }
    }

    placePiece() {
        console.log(`[placePiece] ピース配置開始: ${this.currentPiece.type} at (${this.currentPiece.x}, ${this.currentPiece.y})`);
        
        // ==== デバッグ: 配置前のボード状態 ====
        this.logBoardState('ピース配置前');
        
        this.board.placePiece(this.currentPiece);
        
        // ==== デバッグ: 配置後のボード状態 ====
        this.logBoardState('ピース配置後');
        
        // ピースを配置したので現在のピースを無効化
        this.currentPiece = null;
        
        // 完成した行をチェック
        const completedLines = this.board.getCompletedLines();
        console.log(`[placePiece] 完成ライン検出: ${completedLines.length}ライン [${completedLines.join(', ')}]`);
        
        if (completedLines.length > 0) {
            console.log(`[placePiece] ライン消去アニメーション開始: ${completedLines.length}ライン`);
            this.startLineAnimation(completedLines);
            return; // アニメーション完了後に続行
        } else {
            console.log(`[placePiece] ライン消去なし - 次のピース生成`);
        }
        
        this.spawnNextPiece();
    }

    startLineAnimation(completedLines) {
        this.lineAnimation.active = true;
        this.lineAnimation.lines = completedLines;
        this.lineAnimation.stage = 'highlight';
        this.lineAnimation.timer = 0;
        
        // 落下アニメーション用にボード状態を保存
        this.lineAnimation.dropAnimation.beforeBoard = this.copyBoardState();
        this.lineAnimation.dropAnimation.progress = 0;
    }

    copyBoardState() {
        const copy = [];
        for (let y = 0; y < this.board.height; y++) {
            copy[y] = [];
            for (let x = 0; x < this.board.width; x++) {
                copy[y][x] = this.board.grid[y][x];
            }
        }
        return copy;
    }

    updateLineAnimation(deltaTime) {
        if (!this.lineAnimation.active) return;

        this.lineAnimation.timer += deltaTime;
        const currentDuration = this.lineAnimation.duration[this.lineAnimation.stage];

        if (this.lineAnimation.timer >= currentDuration) {
            switch (this.lineAnimation.stage) {
                case 'highlight':
                    this.lineAnimation.timer = 0;
                    this.lineAnimation.stage = 'clear';
                    break;
                case 'clear':
                    // 実際にラインを消去してアフター状態を保存
                    const linesBeforeClear = this.lineAnimation.lines.slice();
                    console.log(`[ライン消去] 消去実行: ${linesBeforeClear.length}ライン [${linesBeforeClear.join(', ')}]`);
                    
                    this.clearLines(this.lineAnimation.lines.length);
                    this.board.clearLines(this.lineAnimation.lines);
                    
                    // 消去後の確認
                    const linesAfterClear = this.board.getCompletedLines();
                    console.log(`[ライン消去] 消去完了後の残存完成ライン: ${linesAfterClear.length}個`);
                    
                    this.lineAnimation.dropAnimation.afterBoard = this.copyBoardState();
                    this.lineAnimation.timer = 0; // dropステージ用にリセット
                    this.lineAnimation.stage = 'drop';
                    break;
                case 'drop':
                    // アニメーション終了
                    this.lineAnimation.active = false;
                    this.spawnNextPiece();
                    break;
            }
        }
        
        // drop段階では進行度を常に更新
        if (this.lineAnimation.stage === 'drop') {
            this.lineAnimation.dropAnimation.progress = 
                Math.min(1.0, this.lineAnimation.timer / this.lineAnimation.duration.drop);
        }
        
        // アニメーション中は常に描画更新
        this.draw();
    }

    spawnNextPiece() {
        // 次のピースを設定
        this.currentPiece = this.nextQueue.getNext();
        
        // ホールド可能にする
        if (this.holdManager) {
            this.holdManager.enableHold();
        }
        
        // オートプレイ時は新しいピースでAIアクションをリセット
        if (this.modeManager.isAutoplay) {
            this.lastAIAction = Date.now() - this.aiThinkInterval; // 即座に実行
        }
        
        // ゲームオーバーチェック
        if (!this.board.isValidPosition(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.endGame();
        }
        
        this.updateDisplay();
        this.draw();
    }

    clearLines(lineCount) {
        console.log(`[clearLines] ライン消去処理開始: ${lineCount}ライン`);
        
        const baseScore = [0, 40, 100, 300, 1200];
        const scoreGain = baseScore[lineCount] * this.level;
        this.score += scoreGain;
        this.lines += lineCount;
        
        console.log(`[clearLines] スコア追加: ${scoreGain} (total: ${this.score})`);
        console.log(`[clearLines] 総ライン数: ${this.lines}`);
        
        // レベルアップ（10ライン毎）
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            console.log(`[clearLines] レベルアップ: ${this.level} (落下間隔: ${this.dropInterval}ms)`);
        }
        
        // AIの効率更新
        if (this.aiEngine && lineCount > 0) {
            this.aiEngine.updateGameState(lineCount, false, false);
            console.log(`[clearLines] AI効率更新: ${this.aiEngine.gameState.efficiency.toFixed(3)}`);
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
        if (this.stateManager.isPlaying()) {
            // ボードを描画
            this.drawBoard();
            
            // 現在のピースを描画（存在する場合のみ）
            if (this.currentPiece) {
                this.drawPiece(this.ctx, this.currentPiece, this.currentPiece.x, this.currentPiece.y);
            }
            
            // ホールド・NEXT表示を描画
            this.drawHold();
            this.drawNext();
        } else {
            // キャンバスをクリア
            this.clearHoldAndNext();
        }
    }

    drawBoard() {
        // 落下アニメーション中は特別な描画
        if (this.lineAnimation.active && this.lineAnimation.stage === 'drop') {
            this.drawDropAnimation();
            return;
        }
        
        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                if (this.board.grid[y][x] !== 0) {
                    // ライン消去アニメーション中の行の色を変える
                    let fillColor = '#666';
                    let strokeColor = '#fff';
                    
                    if (this.lineAnimation.active && this.lineAnimation.lines.includes(y)) {
                        switch (this.lineAnimation.stage) {
                            case 'highlight':
                                // ハイライト：白く光らせる
                                const progress = this.lineAnimation.timer / this.lineAnimation.duration.highlight;
                                const intensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
                                fillColor = `rgb(${100 + intensity * 155}, ${100 + intensity * 155}, ${100 + intensity * 155})`;
                                strokeColor = '#ffff00';
                                break;
                            case 'clear':
                                // 消去：透明度を下げる
                                const fadeProgress = this.lineAnimation.timer / this.lineAnimation.duration.clear;
                                const alpha = 1 - fadeProgress;
                                fillColor = `rgba(102, 102, 102, ${alpha})`;
                                strokeColor = `rgba(255, 255, 255, ${alpha})`;
                                break;
                        }
                    }
                    
                    this.ctx.fillStyle = fillColor;
                    this.ctx.fillRect(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                    this.ctx.strokeStyle = strokeColor;
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

    drawDropAnimation() {
        const beforeBoard = this.lineAnimation.dropAnimation.beforeBoard;
        const afterBoard = this.lineAnimation.dropAnimation.afterBoard;
        const progress = this.lineAnimation.dropAnimation.progress;
        const completedLines = this.lineAnimation.lines;
        
        if (!beforeBoard || !afterBoard) return;
        
        // 最も下の消去ラインを見つける
        const lowestClearedLine = Math.max(...completedLines);
        const numLinesCleared = completedLines.length;
        
        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                // 消去ライン以上にあったブロックを落下アニメーション
                if (beforeBoard[y][x] !== 0 && y < lowestClearedLine && !completedLines.includes(y)) {
                    // 現在の表示位置を計算（線形補間）
                    const currentY = y + (numLinesCleared * progress);
                    
                    this.ctx.fillStyle = '#666';
                    this.ctx.fillRect(
                        x * this.blockSize,
                        currentY * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.strokeRect(
                        x * this.blockSize,
                        currentY * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                }
                
                // 消去ライン以下の固定部分を描画
                if (y > lowestClearedLine && beforeBoard[y][x] !== 0) {
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
        } else {
            // デバッグ: なぜゲームループが実行されないか
            console.log(`[ゲームループ] 状態確認: isPlaying=${this.stateManager.isPlaying()}, currentState=${this.stateManager.currentState}`);
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