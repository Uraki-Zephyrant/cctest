// AI思考エンジン
class TetrisAI {
    constructor() {
        this.difficulty = 'normal';
        this.lastThinkTime = 0;
        this.debugInfo = null;
        this.lookAheadDepth = 2;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // 難易度に応じてパラメータ調整
        switch (difficulty) {
            case 'easy':
                this.lookAheadDepth = 1;
                break;
            case 'normal':
                this.lookAheadDepth = 2;
                break;
            case 'hard':
                this.lookAheadDepth = 3;
                break;
            case 'expert':
                this.lookAheadDepth = 4;
                break;
        }
    }

    calculateBestMove(board, piece, nextPieces = []) {
        const startTime = Date.now();
        
        const allMoves = this.generateAllPossibleMoves(board, piece);
        let bestMove = null;
        let bestScore = -Infinity;
        let evaluatedMoves = 0;

        for (const move of allMoves) {
            const tempBoard = this.simulateMove(board, piece, move);
            let score = this.evaluateBoard(tempBoard);
            
            // 先読み評価
            if (nextPieces.length > 0 && this.lookAheadDepth > 1) {
                score += this.calculateLookAheadScore(tempBoard, nextPieces, this.lookAheadDepth - 1);
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            evaluatedMoves++;
        }

        this.lastThinkTime = Date.now() - startTime;
        this.debugInfo = {
            evaluatedMoves: evaluatedMoves,
            bestMove: bestMove,
            bestScore: bestScore,
            thinkTime: this.lastThinkTime
        };

        return bestMove || { x: piece.x, rotation: 0, score: 0 };
    }

    generateAllPossibleMoves(board, piece) {
        const moves = [];
        
        // 各回転状態について
        for (let rotation = 0; rotation < 4; rotation++) {
            const rotatedPiece = piece.copy();
            
            // 回転を適用
            for (let r = 0; r < rotation; r++) {
                rotatedPiece.rotate();
            }
            
            // 各横位置について
            for (let x = 0; x < board.width; x++) {
                rotatedPiece.x = x;
                rotatedPiece.y = 0;
                
                // 落下位置を計算
                while (board.isValidPosition(rotatedPiece, rotatedPiece.x, rotatedPiece.y + 1)) {
                    rotatedPiece.y++;
                }
                
                // 有効な位置なら追加
                if (board.isValidPosition(rotatedPiece, rotatedPiece.x, rotatedPiece.y)) {
                    moves.push({
                        x: rotatedPiece.x,
                        y: rotatedPiece.y,
                        rotation: rotation,
                        score: 0
                    });
                }
            }
        }
        
        return moves;
    }

    simulateMove(board, piece, move) {
        const tempBoard = this.copyBoard(board);
        const tempPiece = piece.copy();
        
        // 移動と回転を適用
        tempPiece.x = move.x;
        tempPiece.y = move.y;
        for (let r = 0; r < move.rotation; r++) {
            tempPiece.rotate();
        }
        
        // ピースを配置
        tempBoard.placePiece(tempPiece);
        
        // 完成したラインを削除
        const completedLines = tempBoard.getCompletedLines();
        if (completedLines.length > 0) {
            tempBoard.clearLines(completedLines);
        }
        
        return tempBoard;
    }

    evaluateBoard(board) {
        const evaluator = new BoardEvaluator();
        return evaluator.evaluateBoard(board);
    }

    calculateLookAheadScore(board, nextPieces, depth) {
        if (depth <= 0 || nextPieces.length === 0) {
            return 0;
        }
        
        const piece = nextPieces[0];
        const remainingPieces = nextPieces.slice(1);
        const moves = this.generateAllPossibleMoves(board, piece);
        
        let bestScore = -Infinity;
        for (const move of moves) {
            const tempBoard = this.simulateMove(board, piece, move);
            const score = this.evaluateBoard(tempBoard) + 
                         this.calculateLookAheadScore(tempBoard, remainingPieces, depth - 1);
            bestScore = Math.max(bestScore, score);
        }
        
        return bestScore * 0.9; // 将来のスコアは現在より少し価値を下げる
    }

    shouldHold(board, currentPiece, holdPiece) {
        if (!holdPiece) return false;
        
        const currentBest = this.calculateBestMove(board, currentPiece);
        const holdBest = this.calculateBestMove(board, holdPiece);
        
        return holdBest.score > currentBest.score + 50; // ある程度の差があればホールド
    }

    calculateWithLookahead(board, pieces, depth) {
        const moves = [];
        let totalScore = 0;
        let currentBoard = this.copyBoard(board);
        
        for (let i = 0; i < Math.min(pieces.length, depth); i++) {
            const piece = pieces[i];
            const remainingPieces = pieces.slice(i + 1);
            const bestMove = this.calculateBestMove(currentBoard, piece, remainingPieces);
            
            moves.push(bestMove);
            totalScore += bestMove.score;
            currentBoard = this.simulateMove(currentBoard, piece, bestMove);
        }
        
        return { moves: moves, totalScore: totalScore };
    }

    copyBoard(board) {
        const copy = new GameBoard(board.width, board.height);
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                copy.grid[y][x] = board.grid[y][x];
            }
        }
        return copy;
    }
}

// ボード評価クラス
class BoardEvaluator {
    constructor() {
        this.weights = {
            height: -0.5,
            lines: 0.8,
            holes: -0.35,
            bumpiness: -0.18,
            tSpinSetup: 0.2
        };
    }

    evaluateBoard(board) {
        const heightPenalty = this.calculateHeightPenalty(board);
        const holePenalty = this.calculateHolePenalty(board);
        const bumpinessPenalty = this.calculateBumpinessPenalty(board);
        const lineBonus = this.calculateLineBonus(board);
        const tSpinBonus = this.calculateTSpinSetupBonus(board);
        
        return (heightPenalty * this.weights.height) +
               (holePenalty * this.weights.holes) +
               (bumpinessPenalty * this.weights.bumpiness) +
               (lineBonus * this.weights.lines) +
               (tSpinBonus * this.weights.tSpinSetup);
    }

    calculateHeightPenalty(board) {
        let totalHeight = 0;
        let maxHeight = 0;
        
        for (let x = 0; x < board.width; x++) {
            const columnHeight = this.getColumnHeight(board, x);
            totalHeight += columnHeight;
            maxHeight = Math.max(maxHeight, columnHeight);
        }
        
        return totalHeight + (maxHeight * 2); // 最大高さは特にペナルティ
    }

    calculateHolePenalty(board) {
        let holes = 0;
        
        for (let x = 0; x < board.width; x++) {
            let blockFound = false;
            for (let y = 0; y < board.height; y++) {
                if (board.grid[y][x] !== 0) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }
        
        return holes;
    }

    calculateBumpinessPenalty(board) {
        let bumpiness = 0;
        
        for (let x = 0; x < board.width - 1; x++) {
            const height1 = this.getColumnHeight(board, x);
            const height2 = this.getColumnHeight(board, x + 1);
            bumpiness += Math.abs(height1 - height2);
        }
        
        return bumpiness;
    }

    calculateLineBonus(board) {
        const completedLines = board.getCompletedLines();
        return completedLines.length * completedLines.length; // 複数ライン同時消去にボーナス
    }

    calculateTSpinSetupBonus(board) {
        // 簡略化版T-Spinセットアップ検出
        let setupCount = 0;
        
        for (let x = 1; x < board.width - 1; x++) {
            for (let y = 2; y < board.height - 1; y++) {
                if (this.isTSpinSetup(board, x, y)) {
                    setupCount++;
                }
            }
        }
        
        return setupCount;
    }

    isTSpinSetup(board, x, y) {
        // T字型の空きスペースがあるかチェック（簡略版）
        if (board.grid[y][x] !== 0) return false;
        if (board.grid[y-1][x] !== 0) return false;
        if (board.grid[y][x-1] !== 0) return false;
        if (board.grid[y][x+1] !== 0) return false;
        
        return true;
    }

    getColumnHeight(board, x) {
        for (let y = 0; y < board.height; y++) {
            if (board.grid[y][x] !== 0) {
                return board.height - y;
            }
        }
        return 0;
    }
}

// ゲームモード管理クラス
class GameModeManager {
    constructor() {
        this.currentMode = 'manual';
        this.isAutoplay = false;
        this.autoplaySpeed = 1.0;
        this.allowManualIntervention = true;
        this.lastManualIntervention = 0;
    }

    setMode(mode) {
        this.currentMode = mode;
        this.isAutoplay = (mode === 'autoplay');
    }

    setAutoplaySpeed(speed) {
        this.autoplaySpeed = Math.max(0.1, Math.min(5.0, speed));
    }

    triggerManualIntervention() {
        this.lastManualIntervention = Date.now();
    }

    isManualInterventionRecent() {
        return (Date.now() - this.lastManualIntervention) < 3000; // 3秒以内
    }
}