// ホールド機能とNEXT表示のテスト

describe('HoldManager', () => {
    it('初期状態ではホールドピースがnull', () => {
        const holdManager = new HoldManager();
        expect(holdManager.heldPiece).toBe(null);
        expect(holdManager.canHold).toBeTruthy();
    });

    it('ピースをホールドできる', () => {
        const holdManager = new HoldManager();
        const piece = new Tetromino('I');
        
        const result = holdManager.holdPiece(piece);
        expect(holdManager.heldPiece.type).toBe('I');
        expect(result).toBe(null); // 初回ホールドでは交換ピースなし
    });

    it('ホールド済みピースがある場合は交換される', () => {
        const holdManager = new HoldManager();
        const iPiece = new Tetromino('I');
        const tPiece = new Tetromino('T');
        
        // 1回目のホールド
        holdManager.holdPiece(iPiece);
        
        // 2回目のホールド（交換）
        const exchangedPiece = holdManager.holdPiece(tPiece);
        expect(holdManager.heldPiece.type).toBe('T');
        expect(exchangedPiece.type).toBe('I');
    });

    it('ホールド後は一時的にホールドできない', () => {
        const holdManager = new HoldManager();
        const piece = new Tetromino('I');
        
        holdManager.holdPiece(piece);
        expect(holdManager.canHold).toBeFalsy();
    });

    it('ピース固定後にホールドが再び可能になる', () => {
        const holdManager = new HoldManager();
        const piece = new Tetromino('I');
        
        holdManager.holdPiece(piece);
        expect(holdManager.canHold).toBeFalsy();
        
        holdManager.enableHold();
        expect(holdManager.canHold).toBeTruthy();
    });

    it('ホールドできない状態でのホールド試行はnullを返す', () => {
        const holdManager = new HoldManager();
        const piece1 = new Tetromino('I');
        const piece2 = new Tetromino('T');
        
        holdManager.holdPiece(piece1);
        const result = holdManager.holdPiece(piece2);
        expect(result).toBe(null);
        expect(holdManager.heldPiece.type).toBe('I'); // 変更されない
    });
});

describe('NextQueue', () => {
    it('5つのNEXTピースを管理する', () => {
        const nextQueue = new NextQueue();
        expect(nextQueue.queue.length).toBe(5);
        
        // すべてのピースが存在することを確認
        nextQueue.queue.forEach(piece => {
            expect(piece).toBeTruthy();
            expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece.type);
        });
    });

    it('次のピースを取得すると新しいピースが補充される', () => {
        const nextQueue = new NextQueue();
        const firstPiece = nextQueue.queue[0];
        
        const nextPiece = nextQueue.getNext();
        expect(nextPiece.type).toBe(firstPiece.type);
        expect(nextQueue.queue.length).toBe(5); // 常に5つ維持
        expect(nextQueue.queue[0]).not.toBe(firstPiece); // 先頭が変わる
    });

    it('複数回取得しても常に5つのキューを維持', () => {
        const nextQueue = new NextQueue();
        
        // 3つ取得
        nextQueue.getNext();
        nextQueue.getNext();
        nextQueue.getNext();
        
        expect(nextQueue.queue.length).toBe(5);
    });

    it('特定位置のピースを取得できる', () => {
        const nextQueue = new NextQueue();
        const thirdPiece = nextQueue.getPieceAt(2);
        expect(thirdPiece).toBeTruthy();
        expect(thirdPiece).toBe(nextQueue.queue[2]);
    });

    it('範囲外インデックスでnullを返す', () => {
        const nextQueue = new NextQueue();
        expect(nextQueue.getPieceAt(5)).toBe(null);
        expect(nextQueue.getPieceAt(-1)).toBe(null);
    });
});

describe('TetrisGameのホールド・NEXT機能', () => {
    it('ゲーム開始時にホールドマネージャーとネクストキューが初期化される', () => {
        const game = new TetrisGame();
        game.startGame();
        
        expect(game.holdManager).toBeTruthy();
        expect(game.nextQueue).toBeTruthy();
        expect(game.nextQueue.queue.length).toBe(5);
    });

    it('Cキーでピースをホールドできる', () => {
        const game = new TetrisGame();
        game.startGame();
        
        const currentType = game.currentPiece.type;
        game.holdCurrentPiece();
        
        expect(game.holdManager.heldPiece.type).toBe(currentType);
        expect(game.currentPiece.type).not.toBe(currentType); // 新しいピースに変わる
    });

    it('ホールド後に新しいピースがNEXTキューから補充される', () => {
        const game = new TetrisGame();
        game.startGame();
        
        const originalNext = game.nextQueue.queue[0].type;
        game.holdCurrentPiece();
        
        expect(game.currentPiece.type).toBe(originalNext);
    });

    it('ホールドピースがある状態でのホールドで交換される', () => {
        const game = new TetrisGame();
        game.startGame();
        
        // 1回目のホールド
        const firstType = game.currentPiece.type;
        game.holdCurrentPiece();
        
        // ホールドを再び有効にして2回目のホールド
        game.holdManager.enableHold();
        const secondType = game.currentPiece.type;
        game.holdCurrentPiece();
        
        expect(game.currentPiece.type).toBe(firstType); // 交換される
        expect(game.holdManager.heldPiece.type).toBe(secondType);
    });

    it('連続ホールド防止が機能する', () => {
        const game = new TetrisGame();
        game.startGame();
        
        const originalType = game.currentPiece.type;
        game.holdCurrentPiece();
        
        // 連続でホールドを試行
        const attemptType = game.currentPiece.type;
        game.holdCurrentPiece();
        
        // 変化しないことを確認
        expect(game.currentPiece.type).toBe(attemptType);
    });

    it('ピース固定後にホールドが再び可能になる', () => {
        const game = new TetrisGame();
        game.startGame();
        
        // ホールド
        game.holdCurrentPiece();
        expect(game.holdManager.canHold).toBeFalsy();
        
        // ピース固定をシミュレート
        game.holdManager.enableHold();
        expect(game.holdManager.canHold).toBeTruthy();
    });

    it('NEXT表示が5つのピースを表示する', () => {
        const game = new TetrisGame();
        game.startGame();
        
        const nextPieces = game.getNextPieces(5);
        expect(nextPieces.length).toBe(5);
        
        nextPieces.forEach(piece => {
            expect(piece).toBeTruthy();
            expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece.type);
        });
    });
});