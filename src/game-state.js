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

// ゲームモード管理クラス
class GameModeManager {
    constructor() {
        this.isAutoplay = false;
        this.autoplaySpeed = 1.0;
        this.allowManualIntervention = true;
        this.lastManualIntervention = 0;
        this.manualInterventionCooldown = 3000; // 3秒
    }

    setMode(mode) {
        this.isAutoplay = (mode === 'autoplay');
    }

    setAutoplaySpeed(speed) {
        this.autoplaySpeed = Math.max(0.1, Math.min(5.0, speed));
    }

    triggerManualIntervention() {
        this.lastManualIntervention = Date.now();
    }

    isManualInterventionRecent() {
        return (Date.now() - this.lastManualIntervention) < this.manualInterventionCooldown;
    }
}

// タイトル画面クラス
class TitleScreen {
    constructor() {
        this.title = 'TETRIS';
        this.subtitle = 'Press SPACE to Start';
        this.onGameStart = null;
        this.element = document.getElementById('titleScreen');
        this.gameMode = 'manual'; // 'manual' or 'autoplay'
        this.aiDifficulty = 'normal';
        this.autoplaySpeed = 1.0;
        
        this.setupModeSelector();
    }

    setupModeSelector() {
        const manualBtn = document.getElementById('manualModeBtn');
        const autoBtn = document.getElementById('autoModeBtn');
        const autoSettings = document.getElementById('autoplaySettings');
        const speedSlider = document.getElementById('autoplaySpeed');
        const speedDisplay = document.getElementById('speedDisplay');
        const difficultySelect = document.getElementById('aiDifficulty');
        const autoInstructions = document.getElementById('autoModeInstructions');

        // モードボタンのイベントリスナー
        manualBtn.addEventListener('click', () => {
            this.setGameMode('manual');
            manualBtn.classList.add('active');
            autoBtn.classList.remove('active');
            autoSettings.classList.add('hidden');
            autoInstructions.classList.add('hidden');
        });

        autoBtn.addEventListener('click', () => {
            this.setGameMode('autoplay');
            autoBtn.classList.add('active');
            manualBtn.classList.remove('active');
            autoSettings.classList.remove('hidden');
            autoInstructions.classList.remove('hidden');
        });

        // 速度スライダーのイベントリスナー
        speedSlider.addEventListener('input', (e) => {
            this.autoplaySpeed = parseFloat(e.target.value);
            speedDisplay.textContent = `${this.autoplaySpeed}x`;
        });

        // 難易度選択のイベントリスナー
        difficultySelect.addEventListener('change', (e) => {
            this.aiDifficulty = e.target.value;
        });
    }

    setGameMode(mode) {
        this.gameMode = mode;
    }

    toggleGameMode() {
        this.gameMode = this.gameMode === 'manual' ? 'autoplay' : 'manual';
    }

    handleKeyPress(keyCode) {
        if (keyCode === 'Space' && this.onGameStart) {
            this.onGameStart(this.gameMode, {
                difficulty: this.aiDifficulty,
                speed: this.autoplaySpeed
            });
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