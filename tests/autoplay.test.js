// オートプレイ機能のテスト

describe('AI思考エンジン', () => {
    it('AI思考エンジンが正しく初期化される', () => {
        const aiEngine = new TetrisAI();
        expect(aiEngine).toBeTruthy();
        expect(aiEngine.difficulty).toBe('normal');
    });

    it('難易度設定が機能する', () => {
        const aiEngine = new TetrisAI();
        
        aiEngine.setDifficulty('easy');
        expect(aiEngine.difficulty).toBe('easy');
        
        aiEngine.setDifficulty('hard');
        expect(aiEngine.difficulty).toBe('hard');
        
        aiEngine.setDifficulty('expert');
        expect(aiEngine.difficulty).toBe('expert');
    });

    it('最適な配置を計算する', () => {
        const aiEngine = new TetrisAI();
        const board = new GameBoard(10, 20);
        const piece = new Tetromino('T');
        
        const bestMove = aiEngine.calculateBestMove(board, piece);
        expect(bestMove).toBeTruthy();
        expect(bestMove.x).toBeGreaterThanOrEqual(0);
        expect(bestMove.x).toBeLessThan(10);
        expect(bestMove.rotation).toBeGreaterThanOrEqual(0);
        expect(bestMove.rotation).toBeLessThan(4);
        expect(typeof bestMove.score).toBe('number');
    });

    it('ホールド判定が機能する', () => {
        const aiEngine = new TetrisAI();
        const board = new GameBoard(10, 20);
        const currentPiece = new Tetromino('I');
        const holdPiece = new Tetromino('T');
        
        const shouldHold = aiEngine.shouldHold(board, currentPiece, holdPiece);
        expect(typeof shouldHold).toBe('boolean');
    });

    it('複数ピース先読みが機能する', () => {
        const aiEngine = new TetrisAI();
        const board = new GameBoard(10, 20);
        const pieces = [new Tetromino('T'), new Tetromino('I'), new Tetromino('O')];
        
        const result = aiEngine.calculateWithLookahead(board, pieces, 2);
        expect(result).toBeTruthy();
        expect(result.moves).toBeTruthy();
        expect(result.totalScore).toBeGreaterThanOrEqual(0);
    });
});

describe('ピース配置評価', () => {
    it('ボード評価関数が機能する', () => {
        const evaluator = new BoardEvaluator();
        const board = new GameBoard(10, 20);
        
        const score = evaluator.evaluateBoard(board);
        expect(typeof score).toBe('number');
    });

    it('高さペナルティが計算される', () => {
        const evaluator = new BoardEvaluator();
        const board = new GameBoard(10, 20);
        
        // 高い積みを作成
        for (let y = 15; y < 20; y++) {
            for (let x = 0; x < 5; x++) {
                board.grid[y][x] = 1;
            }
        }
        
        const heightPenalty = evaluator.calculateHeightPenalty(board);
        expect(heightPenalty).toBeGreaterThan(0);
    });

    it('穴ペナルティが計算される', () => {
        const evaluator = new BoardEvaluator();
        const board = new GameBoard(10, 20);
        
        // 穴を作成
        board.grid[19][0] = 1;
        board.grid[19][2] = 1;
        // board.grid[19][1] は0のまま（穴）
        
        const holePenalty = evaluator.calculateHolePenalty(board);
        expect(holePenalty).toBeGreaterThan(0);
    });

    it('凸凹ペナルティが計算される', () => {
        const evaluator = new BoardEvaluator();
        const board = new GameBoard(10, 20);
        
        // 凸凹を作成
        board.grid[19][0] = 1;
        board.grid[18][0] = 1;
        board.grid[19][2] = 1;
        // 1列目は低い
        
        const bumpinessPenalty = evaluator.calculateBumpinessPenalty(board);
        expect(bumpinessPenalty).toBeGreaterThan(0);
    });

    it('ライン消去ボーナスが計算される', () => {
        const evaluator = new BoardEvaluator();
        const board = new GameBoard(10, 20);
        
        // 完成可能行を作成
        for (let x = 0; x < 9; x++) {
            board.grid[19][x] = 1;
        }
        // 1つだけ空けておく
        
        const lineBonus = evaluator.calculateLineBonus(board);
        expect(lineBonus).toBeGreaterThanOrEqual(0);
    });

    it('T-Spinセットアップボーナスが計算される', () => {
        const evaluator = new BoardEvaluator();
        const board = new GameBoard(10, 20);
        
        // T-Spinセットアップを作成
        const tSpinBonus = evaluator.calculateTSpinSetupBonus(board);
        expect(typeof tSpinBonus).toBe('number');
    });
});

describe('ゲームモード管理', () => {
    it('ゲームモードマネージャーが正しく初期化される', () => {
        const modeManager = new GameModeManager();
        expect(modeManager.currentMode).toBe('manual');
        expect(modeManager.isAutoplay).toBeFalsy();
    });

    it('オートプレイモードに切り替えられる', () => {
        const modeManager = new GameModeManager();
        
        modeManager.setMode('autoplay');
        expect(modeManager.currentMode).toBe('autoplay');
        expect(modeManager.isAutoplay).toBeTruthy();
    });

    it('手動モードに戻せる', () => {
        const modeManager = new GameModeManager();
        
        modeManager.setMode('autoplay');
        modeManager.setMode('manual');
        expect(modeManager.currentMode).toBe('manual');
        expect(modeManager.isAutoplay).toBeFalsy();
    });

    it('オートプレイ速度が設定できる', () => {
        const modeManager = new GameModeManager();
        
        modeManager.setAutoplaySpeed(2.0);
        expect(modeManager.autoplaySpeed).toBe(2.0);
        
        modeManager.setAutoplaySpeed(0.5);
        expect(modeManager.autoplaySpeed).toBe(0.5);
    });

    it('手動介入が機能する', () => {
        const modeManager = new GameModeManager();
        modeManager.setMode('autoplay');
        
        const canIntervene = modeManager.allowManualIntervention;
        expect(typeof canIntervene).toBe('boolean');
        
        modeManager.triggerManualIntervention();
        expect(modeManager.lastManualIntervention).toBeGreaterThan(0);
    });
});

describe('TetrisGameのオートプレイ統合', () => {
    it('オートプレイモードでゲームが開始できる', () => {
        const game = new TetrisGame();
        game.startGame('autoplay');
        
        expect(game.modeManager.isAutoplay).toBeTruthy();
        expect(game.aiEngine).toBeTruthy();
    });

    it('オートプレイ中にAIが自動で操作する', () => {
        const game = new TetrisGame();
        game.startGame('autoplay');
        
        const initialPosition = { x: game.currentPiece.x, y: game.currentPiece.y };
        
        // AI操作をトリガー
        game.executeAIMove();
        
        // AIが何らかの操作を行ったかチェック
        const finalPosition = { x: game.currentPiece.x, y: game.currentPiece.y };
        const hasMovedOrRotated = 
            initialPosition.x !== finalPosition.x || 
            initialPosition.y !== finalPosition.y ||
            game.currentPiece.rotation !== 0;
            
        expect(hasMovedOrRotated).toBeTruthy();
    });

    it('オートプレイ中でも手動操作できる', () => {
        const game = new TetrisGame();
        game.startGame('autoplay');
        game.modeManager.allowManualIntervention = true;
        
        const initialX = game.currentPiece.x;
        game.movePieceLeft(); // 手動操作
        
        expect(game.currentPiece.x).toBe(initialX - 1);
        expect(game.modeManager.lastManualIntervention).toBeGreaterThan(0);
    });

    it('オートプレイ速度調整が機能する', () => {
        const game = new TetrisGame();
        game.startGame('autoplay');
        
        game.modeManager.setAutoplaySpeed(3.0);
        expect(game.aiThinkInterval).toBeLessThan(1000); // 高速
        
        game.modeManager.setAutoplaySpeed(0.3);
        expect(game.aiThinkInterval).toBeGreaterThan(1000); // 低速
    });

    it('AI思考時間が測定される', () => {
        const game = new TetrisGame();
        game.startGame('autoplay');
        
        const startTime = Date.now();
        game.executeAIMove();
        const endTime = Date.now();
        
        expect(game.aiEngine.lastThinkTime).toBeGreaterThan(0);
        expect(game.aiEngine.lastThinkTime).toBeLessThanOrEqual(endTime - startTime);
    });

    it('デバッグモードでAI思考が表示される', () => {
        const game = new TetrisGame();
        game.startGame('autoplay');
        game.setDebugMode(true);
        
        game.executeAIMove();
        
        expect(game.aiEngine.debugInfo).toBeTruthy();
        expect(game.aiEngine.debugInfo.evaluatedMoves).toBeGreaterThan(0);
        expect(game.aiEngine.debugInfo.bestMove).toBeTruthy();
    });
});

describe('タイトル画面オートプレイ選択', () => {
    it('タイトル画面にオートプレイ選択肢が表示される', () => {
        const titleScreen = new TitleScreen();
        
        expect(titleScreen.gameMode).toBe('manual');
        expect(typeof titleScreen.toggleGameMode).toBe('function');
    });

    it('ゲームモード切り替えが機能する', () => {
        const titleScreen = new TitleScreen();
        
        titleScreen.toggleGameMode();
        expect(titleScreen.gameMode).toBe('autoplay');
        
        titleScreen.toggleGameMode();
        expect(titleScreen.gameMode).toBe('manual');
    });

    it('選択されたモードでゲームが開始される', () => {
        const titleScreen = new TitleScreen();
        const game = new TetrisGame();
        
        titleScreen.gameMode = 'autoplay';
        titleScreen.onGameStart = (mode) => {
            game.startGame(mode);
        };
        
        titleScreen.onGameStart(titleScreen.gameMode);
        expect(game.modeManager.isAutoplay).toBeTruthy();
    });
});