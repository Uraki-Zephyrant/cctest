// ゲーム状態管理クラス
class GameStateManager {
    constructor() {
        this.currentState = 'title';
        this.validStates = ['title', 'playing', 'gameOver'];
    }

    setState(newState) {
        if (this.validStates.includes(newState)) {
            this.currentState = newState;
        } else {
            console.warn(`Invalid state: ${newState}`);
        }
    }

    isTitle() {
        return this.currentState === 'title';
    }

    isPlaying() {
        return this.currentState === 'playing';
    }

    isGameOver() {
        return this.currentState === 'gameOver';
    }
}

// タイトル画面クラス
class TitleScreen {
    constructor() {
        this.title = 'TETRIS';
        this.subtitle = 'Press SPACE to Start';
        this.onGameStart = null;
        this.element = document.getElementById('titleScreen');
    }

    handleKeyPress(keyCode) {
        if (keyCode === 'Space' && this.onGameStart) {
            this.onGameStart();
        }
    }

    show() {
        if (this.element) {
            this.element.classList.remove('hidden');
        }
    }

    hide() {
        if (this.element) {
            this.element.classList.add('hidden');
        }
    }
}