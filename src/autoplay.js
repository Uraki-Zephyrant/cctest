// Cold Clear準拠の高性能テトリスAI - 100ライン目標
class TetrisAI {
    constructor() {
        this.difficulty = 'normal';
        this.lastThinkTime = 0;
        this.debugInfo = null;
        this.lookAheadDepth = 4;
        this.debugLevel = 2; // 0: なし, 1: 基本, 2: 詳細, 3: 全て
        
        // Cold Clear準拠評価パラメータ
        this.evaluation = {
            // フィールド状態評価
            back_to_back: 52,
            bumpiness: -24,
            bumpiness_sq: -7,
            row_transitions: -5,
            height: -39,
            top_half: -150,
            top_quarter: -511,
            jeopardy: -11,
            cavity_cells: -173,
            cavity_cells_sq: -3,
            overhang_cells: -34,
            overhang_cells_sq: -1,
            covered_cells: -17,
            covered_cells_sq: -1,
            well_depth: 57,
            max_well_depth: 17,
            well_column: [20, 23, 20, 50, 59, 21, 59, 10, -10, 24],
            
            // ライン消去評価
            move_time: -3,
            wasted_t: -152,
            b2b_clear: 104,
            clear1: -143,        // シングル（低評価）
            clear2: -100,        // ダブル（低評価）
            clear3: -58,         // トリプル（低評価）
            clear4: 390,         // テトリス（高評価）
            tspin1: 121,         // T-spin Single
            tspin2: 410,         // T-spin Double
            tspin3: 602,         // T-spin Triple
            mini_tspin1: -158,   // Mini T-spin（低評価）
            mini_tspin2: -93,    // Mini T-spin（低評価）
            perfect_clear: 999,  // Perfect Clear（最高評価）
            combo_garbage: 150,  // コンボ
            
            // T-spin slot評価
            tslot: [8, 148, 192, 407]
        };
        
        // ゲーム状態追跡
        this.gameState = {
            backToBack: false,
            combo: 0,
            totalLines: 0,
            efficiency: 0
        };
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        switch (difficulty) {
            case 'easy':
                this.lookAheadDepth = 2;
                break;
            case 'normal':
                this.lookAheadDepth = 4;
                break;
            case 'hard':
                this.lookAheadDepth = 6;
                break;
            case 'expert':
                this.lookAheadDepth = 8;
                break;
        }
    }

    calculateBestMove(board, piece, nextPieces = []) {
        const startTime = Date.now();
        
        try {
            console.log(`Cold Clear AI思考開始: ピース=${piece.type}, 効率=${this.gameState.efficiency.toFixed(3)}`);
            
            // 100ライン目標のための戦略選択
            const strategy = this.selectStrategy(board);
            console.log(`戦略選択: ${strategy.name}`);
            
            // 最適手を計算
            const bestMove = this.findBestMove(board, piece, nextPieces, strategy);
            
            this.lastThinkTime = Date.now() - startTime;
            
            this.debugInfo = {
                strategy: strategy.name,
                bestMove: bestMove,
                thinkTime: this.lastThinkTime,
                efficiency: this.gameState.efficiency
            };

            console.log(`AI決定完了: 位置=(${bestMove ? bestMove.x : 'null'},${bestMove ? bestMove.rotation : 'null'}), スコア=${bestMove ? bestMove.score.toFixed(1) : 'null'}`);
            return bestMove || { x: piece.x, rotation: 0, score: 0 };
            
        } catch (error) {
            console.error('AI思考エラー:', error);
            return { x: piece.x, rotation: 0, score: 0 };
        }
    }
    
    // 100ライン目標のための戦略選択
    selectStrategy(board) {
        const maxHeight = this.getMaxHeight(board);
        const totalBlocks = this.countTotalBlocks(board);
        const almostCompleteLines = this.countAlmostCompleteLines(board);
        
        // 戦略1: Perfect Clear狙い（序盤、ブロック少数時）
        if (totalBlocks <= 40 && this.gameState.totalLines < 20) {
            return {
                name: 'PERFECT_CLEAR',
                priority: ['perfect_clear', 'tspin2', 'tspin3', 'clear4'],
                weights: { perfect_clear: 1500, efficiency_bonus: 500 }
            };
        }
        
        // 戦略2: T-spin重視（中盤）
        if (this.gameState.totalLines < 70 && maxHeight < 15) {
            return {
                name: 'T_SPIN_FOCUS',
                priority: ['tspin3', 'tspin2', 'clear4', 'combo_garbage'],
                weights: { tspin_bonus: 300, back_to_back: 200 }
            };
        }
        
        // 戦略3: Tetris重視（終盤）
        if (this.gameState.totalLines >= 70 || almostCompleteLines >= 8) {
            return {
                name: 'TETRIS_RUSH',
                priority: ['clear4', 'clear3', 'tspin3'],
                weights: { tetris_bonus: 400, line_efficiency: 300 }
            };
        }
        
        // 戦略4: 緊急回避（危険時）
        if (maxHeight >= 16) {
            return {
                name: 'EMERGENCY',
                priority: ['clear4', 'clear3', 'clear2', 'clear1'],
                weights: { survival: 1000, height_penalty: 500 }
            };
        }
        
        // デフォルト: バランス戦略
        return {
            name: 'BALANCED',
            priority: ['clear4', 'tspin2', 'clear3'],
            weights: { balance: 100 }
        };
    }
    
    // 最適手探索
    findBestMove(board, piece, nextPieces, strategy) {
        const allMoves = this.generateAllPossibleMoves(board, piece);
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of allMoves) {
            const score = this.evaluateMove(board, piece, move, nextPieces, strategy);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        if (bestMove) {
            bestMove.score = bestScore;
        }
        
        return bestMove;
    }
    
    // Cold Clear準拠の総合評価
    evaluateMove(board, piece, move, nextPieces, strategy) {
        const testBoard = this.simulateMove(board, piece, move);
        let score = 0;
        
        // 1. ライン消去評価（最重要）
        const clearInfo = this.analyzeClear(testBoard, piece, move);
        score += this.evaluateLineClear(clearInfo, strategy);
        
        // 2. フィールド状態評価
        score += this.evaluateFieldState(testBoard);
        
        // 3. T-spin機会評価
        score += this.evaluateTSpinOpportunities(testBoard);
        
        // 4. Perfect Clear機会評価
        score += this.evaluatePerfectClearOpportunities(testBoard);
        
        // 5. 戦略固有ボーナス
        score += this.applyStrategyBonus(testBoard, clearInfo, strategy);
        
        // 6. 先読み評価（簡略版）
        if (nextPieces.length > 0 && this.lookAheadDepth > 1) {
            score += this.evaluateLookahead(testBoard, nextPieces, 1) * 0.3;
        }
        
        return score;
    }
    
    // ライン消去詳細分析
    analyzeClear(board, piece, move) {
        const originalBoard = this.copyBoard(board);
        const testBoard = this.simulateMove(board, piece, move);
        const completedLines = testBoard.getCompletedLines();
        
        return {
            linesCleared: completedLines ? completedLines.length : 0,
            isTSpin: this.isTSpinMove(originalBoard, piece, move),
            isMiniTSpin: this.isMiniTSpinMove(originalBoard, piece, move),
            isPerfectClear: this.isPerfectClear(testBoard),
            completedLines: completedLines || []
        };
    }
    
    // ライン消去評価
    evaluateLineClear(clearInfo, strategy) {
        let score = 0;
        const lines = clearInfo.linesCleared;
        
        if (lines === 0) return 0;
        
        // Cold Clear準拠の基本評価
        if (clearInfo.isPerfectClear) {
            score += this.evaluation.perfect_clear;
        } else if (clearInfo.isTSpin) {
            if (lines === 1) score += this.evaluation.tspin1;
            else if (lines === 2) score += this.evaluation.tspin2;
            else if (lines === 3) score += this.evaluation.tspin3;
        } else if (clearInfo.isMiniTSpin) {
            if (lines === 1) score += this.evaluation.mini_tspin1;
            else if (lines === 2) score += this.evaluation.mini_tspin2;
        } else {
            // 通常のライン消去
            if (lines === 1) score += this.evaluation.clear1;
            else if (lines === 2) score += this.evaluation.clear2;
            else if (lines === 3) score += this.evaluation.clear3;
            else if (lines === 4) score += this.evaluation.clear4;
        }
        
        // Back-to-Backボーナス
        if (this.gameState.backToBack && (lines === 4 || clearInfo.isTSpin)) {
            score += this.evaluation.b2b_clear;
        }
        
        // コンボボーナス
        if (this.gameState.combo > 0) {
            score += this.evaluation.combo_garbage * Math.min(this.gameState.combo, 10);
        }
        
        // 100ライン目標のための効率ボーナス
        const efficiency = lines / 1.0; // 1ピースあたりのライン数
        if (efficiency > 1.0) {
            score += 200 * efficiency; // 高効率ボーナス
        }
        
        return score;
    }
    
    // フィールド状態評価（Cold Clear準拠）
    evaluateFieldState(board) {
        let score = 0;
        
        // 高さ関連
        const heights = this.getHeights(board);
        const maxHeight = Math.max(...heights);
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
        
        score += this.evaluation.height * avgHeight;
        score += this.evaluation.max_well_depth * maxHeight;
        
        // バンピネス（凹凸）
        let bumpiness = 0;
        for (let x = 0; x < heights.length - 1; x++) {
            const diff = Math.abs(heights[x] - heights[x + 1]);
            bumpiness += diff;
            score += this.evaluation.bumpiness_sq * diff * diff;
        }
        score += this.evaluation.bumpiness * bumpiness;
        
        // 上部危険度
        const topHalfBlocks = this.countBlocksInRange(board, 0, 10);
        const topQuarterBlocks = this.countBlocksInRange(board, 0, 5);
        score += this.evaluation.top_half * topHalfBlocks;
        score += this.evaluation.top_quarter * topQuarterBlocks;
        
        // 穴・洞窟評価
        const holes = this.countHoles(board);
        const cavities = this.countCavities(board);
        score += this.evaluation.cavity_cells * cavities;
        score += this.evaluation.cavity_cells_sq * cavities * cavities;
        
        // オーバーハング
        const overhangs = this.countOverhangs(board);
        score += this.evaluation.overhang_cells * overhangs;
        score += this.evaluation.overhang_cells_sq * overhangs * overhangs;
        
        // 井戸評価
        const wells = this.analyzeWells(board);
        score += this.evaluation.well_depth * wells.totalDepth;
        score += this.evaluation.max_well_depth * wells.maxDepth;
        
        return score;
    }
    
    // T-spin機会評価
    evaluateTSpinOpportunities(board) {
        let score = 0;
        
        // T-spinセットアップの検出
        const tSpinSetups = this.detectTSpinSetups(board);
        
        for (let i = 0; i < tSpinSetups.length && i < this.evaluation.tslot.length; i++) {
            if (tSpinSetups[i]) {
                score += this.evaluation.tslot[i];
            }
        }
        
        return score;
    }
    
    // Perfect Clear機会評価
    evaluatePerfectClearOpportunities(board) {
        let score = 0;
        
        const totalBlocks = this.countTotalBlocks(board);
        
        // Perfect Clear近い状態の検出
        if (totalBlocks <= 40) {
            const pcPotential = this.assessPerfectClearPotential(board);
            score += pcPotential * 100;
        }
        
        return score;
    }
    
    // 戦略固有ボーナス適用
    applyStrategyBonus(board, clearInfo, strategy) {
        let bonus = 0;
        
        switch (strategy.name) {
            case 'PERFECT_CLEAR':
                if (clearInfo.isPerfectClear) {
                    bonus += strategy.weights.perfect_clear || 0;
                }
                break;
                
            case 'T_SPIN_FOCUS':
                if (clearInfo.isTSpin) {
                    bonus += strategy.weights.tspin_bonus || 0;
                }
                break;
                
            case 'TETRIS_RUSH':
                if (clearInfo.linesCleared === 4) {
                    bonus += strategy.weights.tetris_bonus || 0;
                }
                break;
                
            case 'EMERGENCY':
                const heightReduction = this.calculateHeightReduction(board);
                bonus += heightReduction * (strategy.weights.survival || 0);
                break;
        }
        
        return bonus;
    }
    
    // 先読み評価（簡略版）
    evaluateLookahead(board, nextPieces, depth) {
        if (depth >= this.lookAheadDepth || nextPieces.length === 0) {
            return 0;
        }
        
        const nextPiece = nextPieces[0];
        const remainingPieces = nextPieces.slice(1);
        
        // 簡略化された先読み：最良手のみ評価
        const moves = this.generateAllPossibleMoves(board, nextPiece).slice(0, 5); // 上位5手のみ
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const testBoard = this.simulateMove(board, nextPiece, move);
            const immediateScore = this.evaluateFieldState(testBoard) * 0.5;
            const futureScore = this.evaluateLookahead(testBoard, remainingPieces, depth + 1) * 0.7;
            
            bestScore = Math.max(bestScore, immediateScore + futureScore);
        }
        
        return bestScore;
    }
    
    // === ユーティリティメソッド ===
    
    // T-spin判定
    isTSpinMove(board, piece, move) {
        if (piece.type !== 'T') return false;
        
        // 簡略化されたT-spin判定
        // 実際の実装では3-corner ruleなどを使用
        const testBoard = this.simulateMove(board, piece, move);
        const corners = this.checkTSpinCorners(testBoard, move);
        
        return corners >= 3; // 3つ以上のコーナーが埋まっている
    }
    
    isMiniTSpinMove(board, piece, move) {
        if (piece.type !== 'T') return false;
        
        // Mini T-spinの判定（簡略版）
        const testBoard = this.simulateMove(board, piece, move);
        const corners = this.checkTSpinCorners(testBoard, move);
        
        return corners === 2; // 2つのコーナーが埋まっている
    }
    
    checkTSpinCorners(board, move) {
        // T-spinコーナー判定の簡略実装
        const x = move.x;
        const y = move.y;
        let corners = 0;
        
        // 4つのコーナーをチェック
        const cornerPositions = [
            [x, y], [x + 2, y], [x, y + 2], [x + 2, y + 2]
        ];
        
        for (const [cx, cy] of cornerPositions) {
            if (cx < 0 || cx >= board.width || cy >= board.height || 
                (cy >= 0 && board.grid[cy][cx] !== 0)) {
                corners++;
            }
        }
        
        return corners;
    }
    
    isPerfectClear(board) {
        return this.countTotalBlocks(board) === 0;
    }
    
    detectTSpinSetups(board) {
        const setups = [];
        
        // T-spinセットアップの検出（簡略版）
        for (let x = 1; x < board.width - 1; x++) {
            for (let y = 2; y < board.height - 1; y++) {
                if (this.isTSpinSetupAt(board, x, y)) {
                    setups.push(true);
                } else {
                    setups.push(false);
                }
            }
        }
        
        return setups.slice(0, 4); // 最大4つまで
    }
    
    isTSpinSetupAt(board, x, y) {
        // T-spinセットアップの簡略判定
        try {
            return (
                board.grid[y][x] === 0 && // 中央が空
                board.grid[y - 1][x] === 0 && // 上が空
                board.grid[y][x - 1] !== 0 && // 左にブロック
                board.grid[y][x + 1] !== 0 && // 右にブロック
                board.grid[y + 1][x - 1] !== 0 && // 左下にブロック
                board.grid[y + 1][x + 1] !== 0 // 右下にブロック
            );
        } catch (e) {
            return false;
        }
    }
    
    assessPerfectClearPotential(board) {
        const totalBlocks = this.countTotalBlocks(board);
        if (totalBlocks === 0) return 1000;
        if (totalBlocks > 40) return 0;
        
        // ブロック数が少ないほど高いポテンシャル
        return Math.max(0, 400 - totalBlocks * 8);
    }
    
    analyzeWells(board) {
        const heights = this.getHeights(board);
        let totalDepth = 0;
        let maxDepth = 0;
        
        for (let x = 0; x < board.width; x++) {
            const leftHeight = x > 0 ? heights[x - 1] : 20;
            const rightHeight = x < board.width - 1 ? heights[x + 1] : 20;
            const wellDepth = Math.min(leftHeight, rightHeight) - heights[x];
            
            if (wellDepth > 0) {
                totalDepth += wellDepth;
                maxDepth = Math.max(maxDepth, wellDepth);
            }
        }
        
        return { totalDepth, maxDepth };
    }
    
    countCavities(board) {
        let cavities = 0;
        for (let x = 0; x < board.width; x++) {
            let inCavity = false;
            for (let y = 0; y < board.height; y++) {
                if (board.grid[y][x] !== 0) {
                    inCavity = true;
                } else if (inCavity) {
                    cavities++;
                }
            }
        }
        return cavities;
    }
    
    countOverhangs(board) {
        let overhangs = 0;
        for (let y = 1; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x] !== 0 && board.grid[y - 1][x] === 0) {
                    overhangs++;
                }
            }
        }
        return overhangs;
    }
    
    countBlocksInRange(board, startY, endY) {
        let blocks = 0;
        for (let y = startY; y < Math.min(endY, board.height); y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x] !== 0) {
                    blocks++;
                }
            }
        }
        return blocks;
    }
    
    calculateHeightReduction(board) {
        // 高さ削減効果の計算（簡略版）
        const heights = this.getHeights(board);
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
        return Math.max(0, 15 - avgHeight); // 15以下に下げる効果
    }
    
    // === 基本メソッド ===
    
    getMaxHeight(board) {
        return Math.max(...this.getHeights(board));
    }
    
    getHeights(board) {
        const heights = [];
        for (let x = 0; x < board.width; x++) {
            heights.push(this.getColumnHeight(board, x));
        }
        return heights;
    }
    
    getColumnHeight(board, x) {
        for (let y = 0; y < board.height; y++) {
            if (board.grid[y][x] !== 0) {
                return board.height - y;
            }
        }
        return 0;
    }
    
    countTotalBlocks(board) {
        let blocks = 0;
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x] !== 0) {
                    blocks++;
                }
            }
        }
        return blocks;
    }
    
    countAlmostCompleteLines(board) {
        let count = 0;
        for (let y = 0; y < board.height; y++) {
            const blocks = board.grid[y].filter(cell => cell !== 0).length;
            if (blocks >= 8) count++;
        }
        return count;
    }
    
    countHoles(board) {
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
    
    generateAllPossibleMoves(board, piece) {
        const moves = [];
        
        for (let rotation = 0; rotation < 4; rotation++) {
            const rotatedPiece = piece.copy();
            
            // 指定回数だけ回転
            for (let r = 0; r < rotation; r++) {
                rotatedPiece.rotate();
            }
            
            // 各列での配置を試す
            for (let x = 0; x < board.width; x++) {
                rotatedPiece.x = x;
                rotatedPiece.y = 0;
                
                // 着地点まで落下
                while (board.isValidPosition(rotatedPiece, rotatedPiece.x, rotatedPiece.y + 1)) {
                    rotatedPiece.y++;
                }
                
                // 配置可能なら候補に追加
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
        
        if (this.debugLevel >= 2) {
            console.log(`[AI] 可能な手の数: ${moves.length}`);
        }
        return moves;
    }
    
    simulateMove(board, piece, move) {
        const tempBoard = this.copyBoard(board);
        const tempPiece = piece.copy();
        
        // デバッグ: シミュレーション開始
        if (this.debugLevel >= 3) {
            console.log(`[AI-Sim] シミュレーション開始: ${piece.type} -> (${move.x}, ${move.rotation})`);
        }
        
        // 回転を適用
        for (let r = 0; r < move.rotation; r++) {
            tempPiece.rotate();
        }
        
        // 位置を設定
        tempPiece.x = move.x;
        tempPiece.y = move.y;
        
        // 配置可能性を確認
        if (!tempBoard.isValidPosition(tempPiece, tempPiece.x, tempPiece.y)) {
            console.warn(`[AI-Sim] 警告: 無効な配置 (${tempPiece.x}, ${tempPiece.y})`);
        }
        
        // ピースを配置
        tempBoard.placePiece(tempPiece);
        
        // デバッグ: 配置後の状態
        const completedLines = tempBoard.getCompletedLines();
        if (this.debugLevel >= 3) {
            console.log(`[AI-Sim] 配置完了: ${completedLines ? completedLines.length : 0}ライン消去予測`);
        }
        
        return tempBoard;
    }
    
    copyBoard(board) {
        const newBoard = Object.create(Object.getPrototypeOf(board));
        newBoard.width = board.width;
        newBoard.height = board.height;
        newBoard.grid = [];
        
        for (let y = 0; y < board.height; y++) {
            newBoard.grid[y] = [...board.grid[y]];
        }
        
        // 必要なメソッドをコピー
        newBoard.placePiece = board.placePiece.bind(newBoard);
        newBoard.getCompletedLines = board.getCompletedLines.bind(newBoard);
        newBoard.isValidPosition = board.isValidPosition.bind(newBoard);
        
        return newBoard;
    }
    
    // ゲーム状態更新
    updateGameState(linesCleared, isTSpin, isBackToBack) {
        this.gameState.totalLines += linesCleared;
        this.gameState.backToBack = isBackToBack;
        
        if (linesCleared > 0) {
            this.gameState.combo++;
        } else {
            this.gameState.combo = 0;
        }
        
        // 効率計算（簡略版）
        this.gameState.efficiency = this.gameState.totalLines / Math.max(1, this.gameState.totalLines * 0.6);
    }
    
    shouldHold(board, currentPiece, heldPiece) {
        // Cold Clearは基本的にホールドを控えめに使用
        if (!this.gameState.efficiency || this.gameState.efficiency < 0.2) {
            return false; // 効率が低い場合はホールドしない
        }
        
        // Perfect Clear狙いの場合のみホールド検討
        const totalBlocks = this.countTotalBlocks(board);
        return totalBlocks <= 20 && currentPiece.type !== 'I' && heldPiece?.type === 'I';
    }
}