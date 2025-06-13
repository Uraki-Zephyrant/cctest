// タイトル画面機能のテスト

describe('GameStateManager', () => {
    it('初期状態はタイトル画面である', () => {
        const stateManager = new GameStateManager();
        expect(stateManager.currentState).toBe('title');
    });

    it('ゲーム状態をタイトルからゲーム中に変更できる', () => {
        const stateManager = new GameStateManager();
        stateManager.setState('playing');
        expect(stateManager.currentState).toBe('playing');
    });

    it('ゲーム状態をゲーム中からゲームオーバーに変更できる', () => {
        const stateManager = new GameStateManager();
        stateManager.setState('playing');
        stateManager.setState('gameOver');
        expect(stateManager.currentState).toBe('gameOver');
    });

    it('ゲームオーバーからタイトルに戻ることができる', () => {
        const stateManager = new GameStateManager();
        stateManager.setState('playing');
        stateManager.setState('gameOver');
        stateManager.setState('title');
        expect(stateManager.currentState).toBe('title');
    });

    it('現在の状態がタイトル画面かどうかを判定できる', () => {
        const stateManager = new GameStateManager();
        expect(stateManager.isTitle()).toBeTruthy();
        
        stateManager.setState('playing');
        expect(stateManager.isTitle()).toBeFalsy();
    });

    it('現在の状態がゲーム中かどうかを判定できる', () => {
        const stateManager = new GameStateManager();
        expect(stateManager.isPlaying()).toBeFalsy();
        
        stateManager.setState('playing');
        expect(stateManager.isPlaying()).toBeTruthy();
    });

    it('現在の状態がゲームオーバーかどうかを判定できる', () => {
        const stateManager = new GameStateManager();
        expect(stateManager.isGameOver()).toBeFalsy();
        
        stateManager.setState('gameOver');
        expect(stateManager.isGameOver()).toBeTruthy();
    });
});

describe('TitleScreen', () => {
    it('タイトル画面が正しく初期化される', () => {
        const titleScreen = new TitleScreen();
        expect(titleScreen.title).toBe('TETRIS');
        expect(titleScreen.subtitle).toBe('Press SPACE to Start');
    });

    it('スペースキーでゲーム開始イベントが発火される', () => {
        const titleScreen = new TitleScreen();
        let gameStarted = false;
        
        titleScreen.onGameStart = () => {
            gameStarted = true;
        };
        
        titleScreen.handleKeyPress('Space');
        expect(gameStarted).toBeTruthy();
    });

    it('スペースキー以外ではゲーム開始イベントが発火されない', () => {
        const titleScreen = new TitleScreen();
        let gameStarted = false;
        
        titleScreen.onGameStart = () => {
            gameStarted = true;
        };
        
        titleScreen.handleKeyPress('ArrowUp');
        expect(gameStarted).toBeFalsy();
    });
});

describe('TetrisGameの状態管理', () => {
    it('ゲームが初期状態でタイトル画面を表示する', () => {
        const game = new TetrisGame();
        expect(game.stateManager.isTitle()).toBeTruthy();
    });

    it('タイトル画面からゲームを開始できる', () => {
        const game = new TetrisGame();
        game.startGame();
        expect(game.stateManager.isPlaying()).toBeTruthy();
    });

    it('ゲーム終了時にゲームオーバー状態になる', () => {
        const game = new TetrisGame();
        game.startGame();
        game.endGame();
        expect(game.stateManager.isGameOver()).toBeTruthy();
    });

    it('ゲームオーバー後にタイトルに戻ることができる', () => {
        const game = new TetrisGame();
        game.startGame();
        game.endGame();
        game.returnToTitle();
        expect(game.stateManager.isTitle()).toBeTruthy();
    });

    it('タイトル画面ではゲームの更新処理が実行されない', () => {
        const game = new TetrisGame();
        const initialPieceY = game.currentPiece ? game.currentPiece.y : null;
        
        // タイトル画面で更新処理を実行
        game.update(1000);
        
        // ピースが動いていないことを確認（まだゲームが開始されていない）
        if (game.currentPiece) {
            expect(game.currentPiece.y).toBe(initialPieceY);
        } else {
            expect(game.currentPiece).toBe(null);
        }
    });
});