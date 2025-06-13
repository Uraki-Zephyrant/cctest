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
                this.useHold = false;
                this.tSpinPriority = 0;
                this.perfectClearPriority = 0;
                break;
            case 'normal':
                this.lookAheadDepth = 2;
                this.useHold = true;
                this.tSpinPriority = 0.3;
                this.perfectClearPriority = 0.1;
                break;
            case 'hard':
                this.lookAheadDepth = 3;
                this.useHold = true;
                this.tSpinPriority = 0.7;
                this.perfectClearPriority = 0.4;
                break;
            case 'expert':
                this.lookAheadDepth = 4;
                this.useHold = true;
                this.tSpinPriority = 1.0;
                this.perfectClearPriority = 0.8;
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
        const dangerLevel = this.getDangerLevel(board);
        this.debugInfo = {
            evaluatedMoves: evaluatedMoves,
            bestMove: bestMove,
            bestScore: bestScore,
            thinkTime: this.lastThinkTime,
            dangerLevel: dangerLevel,
            survivalMode: dangerLevel > 0.3
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
        const evaluator = new BoardEvaluator(this);
        return evaluator.evaluateBoard(board);
    }

    getDangerLevel(board) {
        // ピンチレベルを0-1で評価（1が最も危険）
        let maxHeight = 0;
        let totalHeight = 0;
        let holes = 0;
        
        for (let x = 0; x < board.width; x++) {
            const columnHeight = this.getColumnHeight(board, x);
            maxHeight = Math.max(maxHeight, columnHeight);
            totalHeight += columnHeight;
        }
        
        // 穴の数をカウント
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
        
        // 危険度計算
        const heightDanger = Math.min(1, maxHeight / (board.height * 0.7)); // 高さ70%以上で危険
        const averageHeightDanger = Math.min(1, (totalHeight / board.width) / (board.height * 0.5));
        const holeDanger = Math.min(1, holes / 10); // 10個以上の穴で最大危険
        
        return Math.max(heightDanger, averageHeightDanger * 0.7, holeDanger * 0.5);
    }

    getColumnHeight(board, x) {
        for (let y = 0; y < board.height; y++) {
            if (board.grid[y][x] !== 0) {
                return board.height - y;
            }
        }
        return 0;
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
        if (!this.useHold || !holdPiece) return false;
        
        const dangerLevel = this.getDangerLevel(board);
        const currentBest = this.calculateBestMove(board, currentPiece);
        const holdBest = this.calculateBestMove(board, holdPiece);
        
        // ピンチ時のホールド戦略調整
        let holdThreshold = 50;
        if (dangerLevel > 0.3) {
            // ピンチ時: より慎重にホールド判断（より大きな差が必要）
            holdThreshold = 100 + (dangerLevel * 100);
        } else {
            // 平常時: 積極的にホールド（小さな差でもホールド）
            holdThreshold = 30;
        }
        
        return holdBest.score > currentBest.score + holdThreshold;
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
    constructor(ai = null) {
        this.ai = ai;
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
        const perfectClearBonus = this.calculatePerfectClearBonus(board);
        
        // ピンチ状況に応じた重み調整
        let dangerLevel = 0;
        if (this.ai) {
            dangerLevel = this.ai.getDangerLevel(board);
        }
        
        // ピンチ時の重み変化（0: 平常時、1: 最大ピンチ）
        const survivalMode = dangerLevel > 0.3; // 30%以上の危険度で生存モード
        
        let heightWeight = this.weights.height;
        let holeWeight = this.weights.holes;
        let bumpinessWeight = this.weights.bumpiness;
        let lineWeight = this.weights.lines;
        let tSpinWeight = this.weights.tSpinSetup;
        let perfectClearWeight = 0;
        
        if (this.ai) {
            // 難易度に応じた基本重み
            tSpinWeight *= (this.ai.tSpinPriority || 0);
            perfectClearWeight = this.ai.perfectClearPriority || 0;
            
            if (survivalMode) {
                // ピンチ時: 生存重視
                const panicMultiplier = 1 + dangerLevel * 2; // 最大3倍のペナルティ
                heightWeight *= panicMultiplier;
                holeWeight *= panicMultiplier;
                bumpinessWeight *= panicMultiplier;
                
                // 高スコア狙いを抑制
                tSpinWeight *= Math.max(0.1, 1 - dangerLevel); // 危険度に応じて減少
                perfectClearWeight *= Math.max(0.1, 1 - dangerLevel);
                
                // ライン消去を優先（即座にフィールドをクリア）
                lineWeight *= 1.5 + dangerLevel;
            } else {
                // 平常時: 高スコア狙い
                lineWeight *= 1.2; // 通常より少し高めのライン消去ボーナス
            }
        }
        
        return (heightPenalty * heightWeight) +
               (holePenalty * holeWeight) +
               (bumpinessPenalty * bumpinessWeight) +
               (lineBonus * lineWeight) +
               (tSpinBonus * tSpinWeight) +
               (perfectClearBonus * perfectClearWeight);
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

    calculatePerfectClearBonus(board) {
        // Perfect Clear（全消し）の可能性を評価
        let totalBlocks = 0;
        let filledRows = 0;
        
        for (let y = board.height - 1; y >= 0; y--) {
            let rowBlocks = 0;
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x] !== 0) {
                    totalBlocks++;
                    rowBlocks++;
                }
            }
            if (rowBlocks > 0) {
                filledRows++;
            } else {
                break; // 空行に到達したら終了
            }
        }
        
        // ブロック数が少なく、整理されている場合にボーナス
        if (totalBlocks <= 20 && filledRows <= 4) {
            return 100 - totalBlocks; // ブロック数が少ないほど高評価
        }
        
        return 0;
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