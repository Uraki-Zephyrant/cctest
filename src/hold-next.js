// ホールド機能管理クラス
class HoldManager {
    constructor() {
        this.heldPiece = null;
        this.canHold = true;
    }

    holdPiece(piece) {
        if (!this.canHold) {
            return null;
        }

        let exchangedPiece = null;
        
        if (this.heldPiece !== null) {
            // 交換
            exchangedPiece = this.heldPiece;
            this.heldPiece = piece.copy();
            // 交換されたピースの位置をリセット
            exchangedPiece.x = 3;
            exchangedPiece.y = 0;
        } else {
            // 初回ホールド
            this.heldPiece = piece.copy();
        }

        // ホールド後は一時的に無効化
        this.canHold = false;
        
        return exchangedPiece;
    }

    enableHold() {
        this.canHold = true;
    }

    reset() {
        this.heldPiece = null;
        this.canHold = true;
    }
}

// NEXT表示管理クラス
class NextQueue {
    constructor() {
        this.queue = [];
        this.initializeQueue();
    }

    initializeQueue() {
        // 初期の5つのピースを生成
        for (let i = 0; i < 5; i++) {
            this.queue.push(this.generateRandomPiece());
        }
    }

    generateRandomPiece() {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new Tetromino(randomType);
    }

    getNext() {
        // 先頭のピースを取得
        const nextPiece = this.queue.shift();
        
        // 新しいピースを末尾に追加
        this.queue.push(this.generateRandomPiece());
        
        // 取得したピースの位置をリセット
        nextPiece.x = 3;
        nextPiece.y = 0;
        
        return nextPiece;
    }

    getPieceAt(index) {
        if (index >= 0 && index < this.queue.length) {
            return this.queue[index];
        }
        return null;
    }

    reset() {
        this.queue = [];
        this.initializeQueue();
    }
}