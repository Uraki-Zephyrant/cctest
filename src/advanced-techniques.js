// T-Spin判定システム
class TSpinDetector {
    constructor() {
        this.name = 'T-Spin Detector';
    }

    // T-Spin判定のメイン関数
    detectTSpin(board, tPiece, wasRotatedInto) {
        if (tPiece.type !== 'T' || !wasRotatedInto) {
            return { isTSpin: false, type: null, isMini: false };
        }

        const corners = this.checkTSpinCorners(board, tPiece);
        const filledCorners = corners.filter(corner => corner.filled).length;
        
        // 3ポイント法: 4つの角のうち3つ以上が埋まっていればT-Spin
        if (filledCorners >= 3) {
            const clearedLines = this.simulateLineClear(board, tPiece);
            const isMini = this.checkTSpinMini(corners, tPiece.rotation);
            
            let type = null;
            if (clearedLines === 1) type = 'Single';
            else if (clearedLines === 2) type = 'Double';
            else if (clearedLines === 3) type = 'Triple';
            
            return {
                isTSpin: true,
                type: type,
                isMini: isMini,
                clearedLines: clearedLines
            };
        }
        
        return { isTSpin: false, type: null, isMini: false };
    }

    // Tピースの4つの角をチェック
    checkTSpinCorners(board, tPiece) {
        const x = tPiece.x;
        const y = tPiece.y;
        
        // Tピースの中心から見た4つの角の相対位置
        const corners = [
            { x: x, y: y },         // 左上
            { x: x + 2, y: y },     // 右上
            { x: x, y: y + 2 },     // 左下
            { x: x + 2, y: y + 2 }  // 右下
        ];
        
        return corners.map(corner => ({
            x: corner.x,
            y: corner.y,
            filled: this.isPositionFilled(board, corner.x, corner.y)
        }));
    }

    // 位置が埋まっているかチェック（ボード外も埋まっているとみなす）
    isPositionFilled(board, x, y) {
        if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
            return true; // ボード外は埋まっているとみなす
        }
        return board.grid[y][x] !== 0;
    }

    // T-Spin Mini判定
    checkTSpinMini(corners, rotation) {
        // 簡略化版: より詳細な判定は後で実装
        const frontCorners = this.getFrontCorners(corners, rotation);
        const frontFilled = frontCorners.filter(corner => corner.filled).length;
        return frontFilled < 2;
    }

    // 回転状態に応じてフロント角を取得
    getFrontCorners(corners, rotation) {
        switch (rotation) {
            case 0: return [corners[0], corners[1]]; // 上向き: 上の2角
            case 1: return [corners[1], corners[3]]; // 右向き: 右の2角
            case 2: return [corners[2], corners[3]]; // 下向き: 下の2角
            case 3: return [corners[0], corners[2]]; // 左向き: 左の2角
            default: return [corners[0], corners[1]];
        }
    }

    // ライン消去のシミュレーション
    simulateLineClear(board, piece) {
        // ピースを仮配置してライン数をカウント
        const tempBoard = this.copyBoard(board);
        this.placePieceOnBoard(tempBoard, piece);
        return this.countCompletedLines(tempBoard);
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

    placePieceOnBoard(board, piece) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px] !== 0) {
                    const x = piece.x + px;
                    const y = piece.y + py;
                    if (y >= 0 && y < board.height && x >= 0 && x < board.width) {
                        board.grid[y][x] = 1;
                    }
                }
            }
        }
    }

    countCompletedLines(board) {
        let count = 0;
        for (let y = 0; y < board.height; y++) {
            let isComplete = true;
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) count++;
        }
        return count;
    }
}

// Perfect Clear検出システム
class PerfectClearDetector {
    constructor() {
        this.name = 'Perfect Clear Detector';
    }

    // Perfect Clear判定
    detectPerfectClear(board) {
        const isEmpty = this.isBoardEmpty(board);
        return {
            isPerfectClear: isEmpty,
            clearedLines: isEmpty ? this.getLastClearedLines(board) : 0
        };
    }

    // ボードが完全に空かチェック
    isBoardEmpty(board) {
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // 最後に消去されたライン数を取得（簡略化版）
    getLastClearedLines(board) {
        // 実際の実装では履歴を保持する必要がある
        return 0;
    }

    // Perfect Clear Openerパターン検出
    detectPCOPattern(board) {
        // 開幕PC用のパターン認識（簡略化版）
        const height = this.getBoardHeight(board);
        const isOpenerHeight = height >= 0 && height <= 4;
        
        return {
            pattern: isOpenerHeight ? 'PCO-possible' : 'none',
            isPossible: isOpenerHeight
        };
    }

    // ボードの高さを取得
    getBoardHeight(board) {
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x] !== 0) {
                    return board.height - y;
                }
            }
        }
        return 0;
    }
}

// SRS回転システム
class SuperRotationSystem {
    constructor() {
        this.name = 'Super Rotation System';
        this.kickTables = this.initializeKickTables();
    }

    // キックテーブルの初期化
    initializeKickTables() {
        return {
            // 標準ピース（T, S, Z, J, L）のキックテーブル
            standard: {
                '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
                '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
                '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
                '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]
            },
            // Iピースの特殊キックテーブル
            I: {
                '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
                '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
                '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
                '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]
            }
        };
    }

    // 回転試行
    tryRotate(piece, board, direction) {
        if (piece.type === 'O') {
            // Oピースは回転しない
            return { success: true, noRotation: true };
        }

        const currentRotation = piece.rotation || 0;
        const newRotation = this.getNewRotation(currentRotation, direction);
        const kickKey = `${currentRotation}->${newRotation}`;
        
        // 適切なキックテーブルを選択
        const kickTable = piece.type === 'I' ? this.kickTables.I : this.kickTables.standard;
        const kicks = kickTable[kickKey] || [[0, 0]];

        // 各キック位置を試行
        for (let i = 0; i < kicks.length; i++) {
            const [kickX, kickY] = kicks[i];
            const testX = piece.x + kickX;
            const testY = piece.y + kickY;
            
            // 新しい形状で位置をテスト
            const testPiece = piece.copy();
            testPiece.rotation = newRotation;
            testPiece.x = testX;
            testPiece.y = testY;
            this.applyRotation(testPiece, newRotation);
            
            if (board.isValidPosition(testPiece, testX, testY)) {
                return {
                    success: true,
                    finalPosition: { x: testX, y: testY },
                    kickUsed: i > 0,
                    kickIndex: i,
                    rotationPoint: { x: kickX, y: kickY },
                    kickTable: kickKey
                };
            }
        }

        return { success: false };
    }

    // 新しい回転状態を計算
    getNewRotation(current, direction) {
        if (direction === 'clockwise') {
            return (current + 1) % 4;
        } else {
            return (current + 3) % 4; // 反時計回り
        }
    }

    // 回転を適用
    applyRotation(piece, newRotation) {
        // 現在の回転状態から目標回転状態への差分を計算
        const rotationDiff = newRotation - (piece.rotation || 0);
        for (let i = 0; i < Math.abs(rotationDiff); i++) {
            if (rotationDiff > 0) {
                piece.rotate(); // 時計回り
            } else {
                // 反時計回りは時計回りを3回
                piece.rotate();
                piece.rotate();
                piece.rotate();
            }
        }
        piece.rotation = newRotation;
    }
}

// Finesse最適化システム
class FinesseOptimizer {
    constructor() {
        this.name = 'Finesse Optimizer';
        this.optimalMoves = this.initializeOptimalMoves();
    }

    // 最適手順データの初期化（簡略化版）
    initializeOptimalMoves() {
        return {
            // ピースタイプ別の最適手順テーブル
            'T': {
                positions: {
                    0: { moves: [], count: 0 },
                    1: { moves: ['left'], count: 1 },
                    2: { moves: ['left', 'left'], count: 2 }
                    // ... 他の位置
                }
            }
            // ... 他のピースタイプ
        };
    }

    // 最適な操作手順を取得
    getOptimalMoves(piece, targetX, targetRotation) {
        const currentX = piece.x;
        const moveDistance = targetX - currentX;
        const rotationNeeded = targetRotation;

        // 基本的な最適手順を計算
        const moves = [];
        
        // 回転操作
        for (let i = 0; i < rotationNeeded; i++) {
            moves.push('rotate');
        }
        
        // 移動操作
        const direction = moveDistance > 0 ? 'right' : 'left';
        for (let i = 0; i < Math.abs(moveDistance); i++) {
            moves.push(direction);
        }

        return {
            moves: moves,
            moveCount: moves.length,
            isOptimal: true // 簡略化版では常にtrue
        };
    }

    // プレイヤーの操作を評価
    evaluatePlayerMoves(playerMoves, piece, targetX, targetRotation) {
        const optimal = this.getOptimalMoves(piece, targetX, targetRotation);
        const wastedMoves = Math.max(0, playerMoves.length - optimal.moveCount);
        const efficiency = optimal.moveCount / playerMoves.length;

        return {
            isOptimal: wastedMoves === 0,
            wastedMoves: wastedMoves,
            efficiency: efficiency,
            optimalMoves: optimal.moves
        };
    }
}

// 統合スコアシステム
class AdvancedScoreSystem {
    constructor() {
        this.combo = 0;
        this.level = 1;
    }

    // T-Spinボーナス計算
    calculateTSpinBonus(tSpinResult, level) {
        if (!tSpinResult.isTSpin) return 0;

        const baseScores = {
            'Single': tSpinResult.isMini ? 200 : 800,
            'Double': 1200,
            'Triple': 1600
        };

        return (baseScores[tSpinResult.type] || 0) * level;
    }

    // Perfect Clearボーナス計算
    calculatePerfectClearBonus(pcResult, level) {
        if (!pcResult.isPerfectClear) return 0;

        const baseScore = pcResult.isOpener ? 2000 : 1000;
        const lineBonus = pcResult.clearedLines * 500;
        
        return (baseScore + lineBonus) * level;
    }

    // ライン消去を追加（コンボ管理）
    addLineClears(lines) {
        if (lines > 0) {
            this.combo++;
        } else {
            this.combo = 0;
        }
    }

    // コンボリセット
    resetCombo() {
        this.combo = 0;
    }

    // コンボボーナス計算
    calculateComboBonus(level) {
        if (this.combo <= 1) return 0;
        return 50 * this.combo * level;
    }
}