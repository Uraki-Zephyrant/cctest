// テトリスのコア機能テスト

describe('テトリミノ（ブロック）クラス', () => {
    it('Iピースの初期形状が正しく作成される', () => {
        const iPiece = new Tetromino('I');
        expect(iPiece.type).toBe('I');
        expect(iPiece.shape).toEqual([
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]);
    });

    it('Oピースの初期形状が正しく作成される', () => {
        const oPiece = new Tetromino('O');
        expect(oPiece.type).toBe('O');
        expect(oPiece.shape).toEqual([
            [1, 1],
            [1, 1]
        ]);
    });

    it('Tピースの初期形状が正しく作成される', () => {
        const tPiece = new Tetromino('T');
        expect(tPiece.type).toBe('T');
        expect(tPiece.shape).toEqual([
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]);
    });

    it('ピースが時計回りに90度回転する', () => {
        const tPiece = new Tetromino('T');
        tPiece.rotate();
        expect(tPiece.shape).toEqual([
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0]
        ]);
    });

    it('ピースの初期位置が正しく設定される', () => {
        const piece = new Tetromino('I');
        expect(piece.x).toBe(3);
        expect(piece.y).toBe(0);
    });
});

describe('ゲームボードクラス', () => {
    it('空のゲームボードが正しく初期化される', () => {
        const board = new GameBoard(10, 20);
        expect(board.width).toBe(10);
        expect(board.height).toBe(20);
        expect(board.grid.length).toBe(20);
        expect(board.grid[0].length).toBe(10);
        expect(board.grid[0][0]).toBe(0);
    });

    it('ピースがボード内の有効な位置に配置できる', () => {
        const board = new GameBoard(10, 20);
        const piece = new Tetromino('I');
        expect(board.isValidPosition(piece, 3, 0)).toBeTruthy();
    });

    it('ピースがボード外に配置できない', () => {
        const board = new GameBoard(10, 20);
        const piece = new Tetromino('I');
        expect(board.isValidPosition(piece, -1, 0)).toBeFalsy();
        expect(board.isValidPosition(piece, 10, 0)).toBeFalsy();
    });

    it('ピースがボードに固定される', () => {
        const board = new GameBoard(10, 20);
        const piece = new Tetromino('O');
        piece.x = 0;
        piece.y = 18;
        board.placePiece(piece);
        expect(board.grid[18][0]).toBe(1);
        expect(board.grid[18][1]).toBe(1);
        expect(board.grid[19][0]).toBe(1);
        expect(board.grid[19][1]).toBe(1);
    });

    it('完成した行が検出される', () => {
        const board = new GameBoard(10, 20);
        // 最下行を全て埋める
        for (let x = 0; x < 10; x++) {
            board.grid[19][x] = 1;
        }
        const completedLines = board.getCompletedLines();
        expect(completedLines).toEqual([19]);
    });

    it('完成した行が削除される', () => {
        const board = new GameBoard(10, 20);
        // 最下行を全て埋める
        for (let x = 0; x < 10; x++) {
            board.grid[19][x] = 1;
        }
        board.clearLines([19]);
        expect(board.grid[19][0]).toBe(0);
    });
});

describe('ゲームロジック', () => {
    it('ゲームが正しく初期化される', () => {
        const game = new TetrisGame();
        expect(game.score).toBe(0);
        expect(game.level).toBe(1);
        expect(game.lines).toBe(0);
        expect(game.gameOver).toBeFalsy();
        expect(game.currentPiece).toBeTruthy();
        expect(game.nextPiece).toBeTruthy();
    });

    it('ピースが1マス下に落下する', () => {
        const game = new TetrisGame();
        const initialY = game.currentPiece.y;
        game.movePieceDown();
        expect(game.currentPiece.y).toBe(initialY + 1);
    });

    it('ピースが左右に移動する', () => {
        const game = new TetrisGame();
        const initialX = game.currentPiece.x;
        
        game.movePieceLeft();
        expect(game.currentPiece.x).toBe(initialX - 1);
        
        game.movePieceRight();
        expect(game.currentPiece.x).toBe(initialX);
    });

    it('ピースが回転する', () => {
        const game = new TetrisGame();
        const piece = new Tetromino('T');
        game.currentPiece = piece;
        const originalShape = JSON.parse(JSON.stringify(piece.shape));
        
        game.rotatePiece();
        expect(game.currentPiece.shape).not.toEqual(originalShape);
    });

    it('ラインクリア時にスコアが加算される', () => {
        const game = new TetrisGame();
        const initialScore = game.score;
        game.clearLines(1);
        expect(game.score).toBeGreater(initialScore);
    });
});

// テスト実行
window.addEventListener('load', () => {
    // 少し遅延してクラスが定義されるのを待つ
    setTimeout(() => {
        testRunner.runSummary();
    }, 100);
});