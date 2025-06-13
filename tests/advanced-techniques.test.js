// 高度なテトリステクニックのテスト

describe('T-Spin判定システム', () => {
    it('T-Spin判定クラスが正しく初期化される', () => {
        const tSpinDetector = new TSpinDetector();
        expect(tSpinDetector).toBeTruthy();
    });

    it('T-Spin Single（TSD）を正しく判定する', () => {
        const board = new GameBoard(10, 20);
        const tSpinDetector = new TSpinDetector();
        
        // T-Spin Singleのセットアップ
        // 底上げして1ライン消去のT-Spin環境を作成
        for (let x = 0; x < 10; x++) {
            if (x !== 4) board.grid[19][x] = 1; // 4列目だけ空ける
        }
        for (let x = 0; x < 10; x++) {
            if (x < 4 || x > 6) board.grid[18][x] = 1; // T-Spinの形を作る
        }
        
        const tPiece = new Tetromino('T');
        tPiece.x = 4;
        tPiece.y = 17;
        // Tピースを配置前の回転状態を記録
        const wasRotatedInto = true;
        
        const result = tSpinDetector.detectTSpin(board, tPiece, wasRotatedInto);
        expect(result.isTSpin).toBeTruthy();
        expect(result.type).toBe('Single');
    });

    it('T-Spin Double（TSD）を正しく判定する', () => {
        const board = new GameBoard(10, 20);
        const tSpinDetector = new TSpinDetector();
        
        // T-Spin Doubleのセットアップ
        for (let x = 0; x < 10; x++) {
            if (x !== 4) {
                board.grid[19][x] = 1;
                board.grid[18][x] = 1;
            }
        }
        for (let x = 0; x < 10; x++) {
            if (x < 4 || x > 6) board.grid[17][x] = 1;
        }
        
        const tPiece = new Tetromino('T');
        tPiece.x = 4;
        tPiece.y = 16;
        
        const result = tSpinDetector.detectTSpin(board, tPiece, true);
        expect(result.isTSpin).toBeTruthy();
        expect(result.type).toBe('Double');
    });

    it('T-Spin Triple（TST）を正しく判定する', () => {
        const board = new GameBoard(10, 20);
        const tSpinDetector = new TSpinDetector();
        
        // T-Spin Tripleのセットアップ
        for (let x = 0; x < 10; x++) {
            if (x !== 4) {
                board.grid[19][x] = 1;
                board.grid[18][x] = 1;
                board.grid[17][x] = 1;
            }
        }
        for (let x = 0; x < 10; x++) {
            if (x < 4 || x > 6) board.grid[16][x] = 1;
        }
        
        const tPiece = new Tetromino('T');
        tPiece.x = 4;
        tPiece.y = 15;
        
        const result = tSpinDetector.detectTSpin(board, tPiece, true);
        expect(result.isTSpin).toBeTruthy();
        expect(result.type).toBe('Triple');
    });

    it('通常のライン消去はT-Spinと判定されない', () => {
        const board = new GameBoard(10, 20);
        const tSpinDetector = new TSpinDetector();
        
        // 通常のライン消去
        for (let x = 0; x < 10; x++) {
            board.grid[19][x] = 1;
        }
        
        const tPiece = new Tetromino('T');
        tPiece.x = 4;
        tPiece.y = 17;
        
        const result = tSpinDetector.detectTSpin(board, tPiece, false);
        expect(result.isTSpin).toBeFalsy();
    });

    it('T-Spin Mini判定が機能する', () => {
        const board = new GameBoard(10, 20);
        const tSpinDetector = new TSpinDetector();
        
        // T-Spin Miniのセットアップ（角が1つまたは2つ埋まっている状態）
        const result = tSpinDetector.detectTSpin(board, new Tetromino('T'), true);
        // 具体的なMini判定条件は実装時に詳細化
        expect(typeof result.isMini).toBe('boolean');
    });
});

describe('Perfect Clear検出システム', () => {
    it('Perfect Clear検出クラスが正しく初期化される', () => {
        const pcDetector = new PerfectClearDetector();
        expect(pcDetector).toBeTruthy();
    });

    it('完全に空のボードをPerfect Clearと判定する', () => {
        const board = new GameBoard(10, 20);
        const pcDetector = new PerfectClearDetector();
        
        const result = pcDetector.detectPerfectClear(board);
        expect(result.isPerfectClear).toBeTruthy();
        expect(result.clearedLines).toBe(0);
    });

    it('4ライン消去後のPerfect Clearを検出する', () => {
        const board = new GameBoard(10, 20);
        const pcDetector = new PerfectClearDetector();
        
        // 下4ラインにブロックを配置
        for (let y = 16; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                board.grid[y][x] = 1;
            }
        }
        
        // 4ライン消去をシミュレート
        board.clearLines([16, 17, 18, 19]);
        
        const result = pcDetector.detectPerfectClear(board);
        expect(result.isPerfectClear).toBeTruthy();
        expect(result.clearedLines).toBe(4);
    });

    it('部分的なライン消去はPerfect Clearではない', () => {
        const board = new GameBoard(10, 20);
        const pcDetector = new PerfectClearDetector();
        
        // いくつかのブロックを残す
        board.grid[19][0] = 1;
        board.grid[18][5] = 1;
        
        const result = pcDetector.detectPerfectClear(board);
        expect(result.isPerfectClear).toBeFalsy();
    });

    it('Perfect Clear Openerパターンを認識する', () => {
        const board = new GameBoard(10, 20);
        const pcDetector = new PerfectClearDetector();
        
        // 開幕PC用の特定パターンを設定
        const result = pcDetector.detectPCOPattern(board);
        expect(typeof result.pattern).toBe('string');
        expect(typeof result.isPossible).toBe('boolean');
    });
});

describe('SRS回転システム', () => {
    it('SRS回転システムクラスが正しく初期化される', () => {
        const srs = new SuperRotationSystem();
        expect(srs).toBeTruthy();
    });

    it('基本回転（Basic Rotation）が機能する', () => {
        const srs = new SuperRotationSystem();
        const board = new GameBoard(10, 20);
        const piece = new Tetromino('T');
        
        const result = srs.tryRotate(piece, board, 'clockwise');
        expect(result.success).toBeTruthy();
        expect(result.finalPosition).toBeTruthy();
    });

    it('ウォールキック（Wall Kick）が機能する', () => {
        const srs = new SuperRotationSystem();
        const board = new GameBoard(10, 20);
        const piece = new Tetromino('I');
        
        // 壁際での回転をテスト
        piece.x = 0; // 左端
        const result = srs.tryRotate(piece, board, 'clockwise');
        expect(result.success).toBeTruthy();
        expect(result.kickUsed).toBeTruthy();
    });

    it('Iピースの特殊回転ルールが適用される', () => {
        const srs = new SuperRotationSystem();
        const board = new GameBoard(10, 20);
        const iPiece = new Tetromino('I');
        
        const result = srs.tryRotate(iPiece, board, 'clockwise');
        expect(result.rotationPoint).toBeTruthy();
        expect(result.kickTable).toBeTruthy();
    });

    it('他ピースの標準回転ルールが適用される', () => {
        const srs = new SuperRotationSystem();
        const board = new GameBoard(10, 20);
        const oPiece = new Tetromino('O');
        
        // Oピースは回転しない
        const result = srs.tryRotate(oPiece, board, 'clockwise');
        expect(result.success).toBeTruthy();
        expect(result.noRotation).toBeTruthy();
    });

    it('回転不可能な場合を正しく処理する', () => {
        const srs = new SuperRotationSystem();
        const board = new GameBoard(10, 20);
        const piece = new Tetromino('T');
        
        // 周囲をブロックで囲む
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (x !== 1 || y !== 1) {
                    board.grid[y][x] = 1;
                }
            }
        }
        piece.x = 1;
        piece.y = 1;
        
        const result = srs.tryRotate(piece, board, 'clockwise');
        expect(result.success).toBeFalsy();
    });
});

describe('Finesse最適化システム', () => {
    it('Finesse判定クラスが正しく初期化される', () => {
        const finesse = new FinesseOptimizer();
        expect(finesse).toBeTruthy();
    });

    it('最適な操作手順を計算する', () => {
        const finesse = new FinesseOptimizer();
        const piece = new Tetromino('T');
        const targetX = 7;
        const targetRotation = 1;
        
        const result = finesse.getOptimalMoves(piece, targetX, targetRotation);
        expect(result.moves).toBeTruthy();
        expect(result.moveCount).toBeGreaterThan(0);
        expect(result.isOptimal).toBeTruthy();
    });

    it('プレイヤーの操作とFinesse最適解を比較する', () => {
        const finesse = new FinesseOptimizer();
        const playerMoves = ['right', 'right', 'rotate', 'right'];
        const piece = new Tetromino('L');
        const targetX = 3;
        const targetRotation = 1;
        
        const result = finesse.evaluatePlayerMoves(playerMoves, piece, targetX, targetRotation);
        expect(typeof result.isOptimal).toBe('boolean');
        expect(result.wastedMoves).toBeGreaterThanOrEqual(0);
        expect(result.efficiency).toBeGreaterThan(0);
    });

    it('すべてのピースタイプの最適解を提供する', () => {
        const finesse = new FinesseOptimizer();
        const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        
        pieces.forEach(type => {
            const piece = new Tetromino(type);
            const result = finesse.getOptimalMoves(piece, 5, 0);
            expect(result).toBeTruthy();
            expect(result.moves).toBeTruthy();
        });
    });
});

describe('統合スコアシステム', () => {
    it('T-Spinボーナス点が正しく計算される', () => {
        const scoreSystem = new AdvancedScoreSystem();
        
        const tSpinSingle = { isTSpin: true, type: 'Single', isMini: false };
        const score1 = scoreSystem.calculateTSpinBonus(tSpinSingle, 1);
        expect(score1).toBeGreaterThan(0);
        
        const tSpinDouble = { isTSpin: true, type: 'Double', isMini: false };
        const score2 = scoreSystem.calculateTSpinBonus(tSpinDouble, 1);
        expect(score2).toBeGreaterThan(score1);
        
        const tSpinTriple = { isTSpin: true, type: 'Triple', isMini: false };
        const score3 = scoreSystem.calculateTSpinBonus(tSpinTriple, 1);
        expect(score3).toBeGreaterThan(score2);
    });

    it('Perfect Clearボーナス点が正しく計算される', () => {
        const scoreSystem = new AdvancedScoreSystem();
        
        const pc4Line = { isPerfectClear: true, clearedLines: 4 };
        const score = scoreSystem.calculatePerfectClearBonus(pc4Line, 1);
        expect(score).toBeGreaterThan(0);
        
        const pcOpener = { isPerfectClear: true, clearedLines: 4, isOpener: true };
        const openerScore = scoreSystem.calculatePerfectClearBonus(pcOpener, 1);
        expect(openerScore).toBeGreaterThan(score);
    });

    it('コンボシステムが機能する', () => {
        const scoreSystem = new AdvancedScoreSystem();
        
        // 連続ライン消去でコンボ
        scoreSystem.addLineClears(1);
        expect(scoreSystem.combo).toBe(1);
        
        scoreSystem.addLineClears(2);
        expect(scoreSystem.combo).toBe(2);
        
        // ライン消去なしでコンボリセット
        scoreSystem.resetCombo();
        expect(scoreSystem.combo).toBe(0);
    });
});