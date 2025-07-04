// 実用的高性能テトリスAI - 安全重視・ライン消去優先版
class TetrisAI {
    constructor() {
        this.difficulty = 'normal';
        this.lastThinkTime = 0;
        this.debugInfo = null;
        this.lookAheadDepth = 4;
        this.debugLevel = 2; // 0: なし, 1: 基本, 2: 詳細, 3: 全て
        
        // 実用的テトリスAI評価パラメータ（高さ制御重視版）
        this.evaluation = {
            // フィールド状態評価（高さ制御を最重要視）
            back_to_back: 52,
            bumpiness: -35,
            bumpiness_sq: -12,
            row_transitions: -8,
            height: -120,          // 高さペナルティを大幅強化
            top_half: -400,        // 上半分ペナルティ強化
            top_quarter: -800,     // 上四分の一ペナルティ強化
            jeopardy: -50,         // 危険状態ペナルティ強化
            cavity_cells: -200,
            cavity_cells_sq: -8,
            overhang_cells: -50,
            overhang_cells_sq: -5,
            covered_cells: -25,
            covered_cells_sq: -3,
            well_depth: 40,        // 井戸深度評価を控えめに
            max_well_depth: 10,
            well_column: [15, 18, 15, 30, 35, 16, 35, 8, -5, 18],
            
            // ライン消去評価（安全重視・実用性重視版）
            move_time: -3,
            wasted_t: -152,
            b2b_clear: 150,
            clear1: 200,         // シングル（確実にライン消去を高評価）
            clear2: 400,         // ダブル（効率的）
            clear3: 650,         // トリプル（非常に効率的）
            clear4: 1000,        // テトリス（最高効率）
            tspin1: 300,         // T-spin Single
            tspin2: 600,         // T-spin Double
            tspin3: 800,         // T-spin Triple
            mini_tspin1: 150,    // Mini T-spin（適度に評価）
            mini_tspin2: 250,    // Mini T-spin（適度に評価）
            perfect_clear: 500,  // Perfect Clear（過度に優先しない）
            combo_garbage: 180,  // コンボ
            
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
            console.log(`実用AI思考開始: ピース=${piece.type}, 効率=${this.gameState.efficiency.toFixed(3)}`);
            
            // 安全重視の戦略選択
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
    
    // 実用的テトリスAIのための戦略選択（安全重視）
    selectStrategy(board) {
        const maxHeight = this.getMaxHeight(board);
        const totalBlocks = this.countTotalBlocks(board);
        const almostCompleteLines = this.countAlmostCompleteLines(board);
        const avgHeight = this.getHeights(board).reduce((a, b) => a + b, 0) / 10;
        
        // 戦略1: 超緊急回避（危険時）- 最優先
        if (maxHeight >= 14 || avgHeight >= 10) {
            return {
                name: 'SUPER_EMERGENCY',
                priority: ['clear4', 'clear3', 'clear2', 'clear1'],
                weights: { survival: 2000, height_penalty: 1000, line_clear_bonus: 800 }
            };
        }
        
        // 戦略2: 緊急回避（高さ注意）
        if (maxHeight >= 11 || avgHeight >= 8) {
            return {
                name: 'EMERGENCY',
                priority: ['clear4', 'clear3', 'clear2', 'clear1'],
                weights: { survival: 1200, height_penalty: 600, line_clear_bonus: 400 }
            };
        }
        
        // 戦略3: 安全重視（中程度の高さ）
        if (maxHeight >= 8 || avgHeight >= 6 || almostCompleteLines >= 4) {
            return {
                name: 'SAFETY_FIRST',
                priority: ['clear4', 'clear3', 'clear2', 'tspin2'],
                weights: { safety: 600, line_clear_bonus: 300, tetris_bonus: 200 }
            };
        }
        
        // 戦略4: Perfect Clear狙い（序盤、安全時のみ）
        if (totalBlocks <= 20 && maxHeight <= 6 && this.gameState.totalLines < 15) {
            return {
                name: 'PERFECT_CLEAR',
                priority: ['perfect_clear', 'clear4', 'clear3', 'clear2'],
                weights: { perfect_clear: 400, efficiency_bonus: 200 }
            };
        }
        
        // 戦略5: T-spin重視（中盤、安全時）
        if (this.gameState.totalLines < 60 && maxHeight <= 7) {
            return {
                name: 'T_SPIN_FOCUS',
                priority: ['tspin3', 'tspin2', 'clear4', 'clear3'],
                weights: { tspin_bonus: 250, back_to_back: 150 }
            };
        }
        
        // デフォルト: バランス戦略（ライン消去重視）
        return {
            name: 'BALANCED',
            priority: ['clear4', 'clear3', 'clear2', 'tspin2'],
            weights: { balance: 150, line_clear_bonus: 100 }
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
        
        // 実用的効率ボーナス（ライン消去を積極的に評価）
        const efficiency = lines / 1.0; // 1ピースあたりのライン数
        score += 150 * lines; // 基本ライン消去ボーナス
        if (efficiency >= 2.0) {
            score += 300 * efficiency; // 高効率ボーナス
        } else if (efficiency >= 1.0) {
            score += 200 * efficiency; // 標準効率ボーナス
        }
        
        return score;
    }
    
    // フィールド状態評価（安全重視・実用版）
    evaluateFieldState(board) {
        let score = 0;
        
        // 高さ関連
        const heights = this.getHeights(board);
        const maxHeight = Math.max(...heights);
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
        
        // 高さペナルティを大幅強化
        score += this.evaluation.height * avgHeight;
        score += this.evaluation.height * maxHeight * 0.5; // 最大高さ追加ペナルティ
        
        // 危険高さの追加ペナルティ
        if (maxHeight >= 14) {
            score -= 1000 * (maxHeight - 13); // 超危険ペナルティ
        } else if (maxHeight >= 11) {
            score -= 400 * (maxHeight - 10); // 危険ペナルティ
        } else if (maxHeight >= 8) {
            score -= 100 * (maxHeight - 7); // 注意ペナルティ
        }
        
        // 平均高さペナルティ
        if (avgHeight >= 10) {
            score -= 600 * (avgHeight - 9);
        } else if (avgHeight >= 8) {
            score -= 200 * (avgHeight - 7);
        }
        
        // バンピネス（凹凸）
        let bumpiness = 0;
        for (let x = 0; x < heights.length - 1; x++) {
            const diff = Math.abs(heights[x] - heights[x + 1]);
            bumpiness += diff;
            score += this.evaluation.bumpiness_sq * diff * diff;
        }
        score += this.evaluation.bumpiness * bumpiness;
        
        // 上部危険度（強化版）
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
        
        // 井戸評価（控えめに）
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
    
    // 戦略固有ボーナス適用（実用版）
    applyStrategyBonus(board, clearInfo, strategy) {
        let bonus = 0;
        
        switch (strategy.name) {
            case 'SUPER_EMERGENCY':
            case 'EMERGENCY':
                // 緊急時はライン消去を最優先
                if (clearInfo.linesCleared > 0) {
                    bonus += clearInfo.linesCleared * (strategy.weights.line_clear_bonus || 0);
                }
                const heightReduction = this.calculateHeightReduction(board);
                bonus += heightReduction * (strategy.weights.survival || 0);
                break;
                
            case 'SAFETY_FIRST':
                if (clearInfo.linesCleared > 0) {
                    bonus += clearInfo.linesCleared * (strategy.weights.line_clear_bonus || 0);
                }
                if (clearInfo.linesCleared === 4) {
                    bonus += strategy.weights.tetris_bonus || 0;
                }
                break;
                
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
                
            case 'BALANCED':
                if (clearInfo.linesCleared > 0) {
                    bonus += clearInfo.linesCleared * (strategy.weights.line_clear_bonus || 0);
                }
                break;
        }
        
        return bonus;
    }
    
    // 先読み評価（安全重視版）
    evaluateLookahead(board, nextPieces, depth) {
        if (depth >= this.lookAheadDepth || nextPieces.length === 0) {
            return 0;
        }
        
        const nextPiece = nextPieces[0];
        const remainingPieces = nextPieces.slice(1);
        
        // 現在の高さ状況を考慮した先読み深度調整
        const maxHeight = this.getMaxHeight(board);
        const searchLimit = maxHeight >= 14 ? 3 : maxHeight >= 11 ? 5 : 7; // 危険時は手数を絞る
        
        // 先読み：安全性を重視した評価
        const moves = this.generateAllPossibleMoves(board, nextPiece).slice(0, searchLimit);
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const testBoard = this.simulateMove(board, nextPiece, move);
            const clearInfo = this.analyzeClear(testBoard, nextPiece, move);
            
            // 即座のライン消去を高く評価
            let immediateScore = this.evaluateFieldState(testBoard) * 0.6;
            if (clearInfo.linesCleared > 0) {
                immediateScore += clearInfo.linesCleared * 100; // ライン消去ボーナス
            }
            
            const futureScore = this.evaluateLookahead(testBoard, remainingPieces, depth + 1) * 0.5;
            
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
        const maxRotations = piece.type === 'O' ? 1 : 4; // Oピースは回転不要
        
        for (let rotation = 0; rotation < maxRotations; rotation++) {
            const testPiece = piece.copy();
            
            // 回転適用
            for (let r = 0; r < rotation; r++) {
                testPiece.rotate();
            }
            
            // 全横位置をテスト（範囲を拡張して境界ケースに対応）
            for (let x = -2; x <= board.width + 1; x++) {
                testPiece.x = x;
                testPiece.y = 0;
                
                // 最上位から落下位置を計算
                const finalY = this.calculateDropPosition(board, testPiece, x);
                
                if (finalY !== null && this.isValidFinalPosition(board, testPiece, x, finalY)) {
                    moves.push({
                        x: x,
                        y: finalY,
                        rotation: rotation,
                        score: 0
                    });
                    
                    if (this.debugLevel >= 3) {
                        console.log(`[AI-Move] 有効候補: ${piece.type} x=${x} rot=${rotation} y=${finalY}`);
                    }
                }
            }
        }
        
        if (this.debugLevel >= 1) {
            console.log(`[AI] ${piece.type}ピース: ${moves.length}手の候補生成`);
        }
        
        return moves;
    }
    
    // 落下位置計算（完全修正版）
    calculateDropPosition(board, piece, x) {
        let dropY = 0;
        
        // 最上位から開始して、有効な位置を探す
        while (dropY < board.height) {
            if (!board.isValidPosition(piece, x, dropY)) {
                // 最初から無効な場合は配置不可能
                if (dropY === 0) {
                    return null;
                }
                // 一つ上が最終位置
                return dropY - 1;
            }
            
            // 次の位置をチェック
            if (!board.isValidPosition(piece, x, dropY + 1)) {
                // 次が無効なら現在位置が最終
                return dropY;
            }
            
            dropY++;
        }
        
        // ボードの底まで達した場合
        return Math.max(0, board.height - 1);
    }
    
    // 最終配置位置の妥当性チェック
    isValidFinalPosition(board, piece, x, y) {
        // 境界チェック
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px] !== 0) {
                    const boardX = x + px;
                    const boardY = y + py;
                    
                    // 範囲外チェック
                    if (boardX < 0 || boardX >= board.width || 
                        boardY < 0 || boardY >= board.height) {
                        return false;
                    }
                    
                    // 衝突チェック
                    if (board.grid[boardY][boardX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    simulateMove(board, piece, move) {
        try {
            const tempBoard = this.copyBoard(board);
            if (!tempBoard) {
                console.error('[AI-Sim] ボードコピー失敗');
                return board;
            }
            
            const tempPiece = piece.copy();
            
            // 回転適用
            for (let r = 0; r < move.rotation; r++) {
                tempPiece.rotate();
            }
            
            // 位置設定
            tempPiece.x = move.x;
            tempPiece.y = move.y;
            
            // 配置可能性を再確認
            if (!this.isValidFinalPosition(tempBoard, tempPiece, move.x, move.y)) {
                if (this.debugLevel >= 2) {
                    console.warn(`[AI-Sim] 配置スキップ: ${piece.type} at (${move.x}, ${move.y})`);
                }
                return tempBoard; // 配置せずに返す
            }
            
            // ピース配置
            this.placePieceOnBoard(tempBoard, tempPiece);
            
            // ライン消去処理
            const clearedLines = this.processLineClear(tempBoard);
            
            if (this.debugLevel >= 2 && clearedLines > 0) {
                console.log(`[AI-Sim] ${clearedLines}ライン消去シミュレート完了`);
            }
            
            return tempBoard;
            
        } catch (error) {
            console.error('[AI-Sim] シミュレーションエラー:', error);
            return board;
        }
    }
    
    // ピース配置処理（新規追加）
    placePieceOnBoard(board, piece) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px] !== 0) {
                    const boardX = piece.x + px;
                    const boardY = piece.y + py;
                    
                    if (boardX >= 0 && boardX < board.width && 
                        boardY >= 0 && boardY < board.height) {
                        board.grid[boardY][boardX] = 1; // ピースタイプで区別可能
                    }
                }
            }
        }
    }
    
    // ライン消去処理（完全修正版）
    processLineClear(board) {
        const completedLines = [];
        
        // 下から上へスキャンして完成ラインを検出
        for (let y = board.height - 1; y >= 0; y--) {
            let isComplete = true;
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            
            if (isComplete) {
                completedLines.push(y);
            }
        }
        
        // ライン消去を実行（下から上へ）
        for (let i = completedLines.length - 1; i >= 0; i--) {
            const lineY = completedLines[i];
            
            // ライン削除
            board.grid.splice(lineY, 1);
            
            // 上部に新しい空ラインを追加
            board.grid.unshift(new Array(board.width).fill(0));
        }
        
        return completedLines.length;
    }
    
    copyBoard(board) {
        if (!board || !board.grid) {
            console.error('[AI] copyBoard: 無効なボード');
            return null;
        }
        
        try {
            // 新しいボードオブジェクトを作成
            const newBoard = {
                width: board.width || 10,
                height: board.height || 20,
                grid: []
            };
            
            // グリッドを深くコピー
            for (let y = 0; y < newBoard.height; y++) {
                if (board.grid[y]) {
                    newBoard.grid[y] = [...board.grid[y]];
                } else {
                    newBoard.grid[y] = new Array(newBoard.width).fill(0);
                }
            }
            
            // 必要なメソッドを追加
            newBoard.getCompletedLines = function() {
                const lines = [];
                for (let y = 0; y < this.height; y++) {
                    if (this.grid[y] && this.grid[y].every(cell => cell !== 0)) {
                        lines.push(y);
                    }
                }
                return lines;
            };
            
            newBoard.isValidPosition = function(piece, x, y) {
                for (let py = 0; py < piece.shape.length; py++) {
                    for (let px = 0; px < piece.shape[py].length; px++) {
                        if (piece.shape[py][px] !== 0) {
                            const boardX = x + px;
                            const boardY = y + py;
                            
                            if (boardX < 0 || boardX >= this.width || boardY >= this.height || 
                                (boardY >= 0 && this.grid[boardY] && this.grid[boardY][boardX] !== 0)) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            };
            
            newBoard.placePiece = function(piece) {
                for (let py = 0; py < piece.shape.length; py++) {
                    for (let px = 0; px < piece.shape[py].length; px++) {
                        if (piece.shape[py][px] !== 0) {
                            const boardX = piece.x + px;
                            const boardY = piece.y + py;
                            
                            if (boardX >= 0 && boardX < this.width && 
                                boardY >= 0 && boardY < this.height) {
                                if (!this.grid[boardY]) {
                                    this.grid[boardY] = new Array(this.width).fill(0);
                                }
                                this.grid[boardY][boardX] = 1;
                            }
                        }
                    }
                }
            };
            
            if (this.debugLevel >= 3) {
                console.log(`[AI-Copy] ボードコピー完了: ${newBoard.width}x${newBoard.height}`);
            }
            
            return newBoard;
            
        } catch (error) {
            console.error('[AI] ボードコピーエラー:', error);
            return null;
        }
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
        // 実用的ホールド戦略：安全性を重視
        const maxHeight = this.getMaxHeight(board);
        
        // 危険時はホールドを控える
        if (maxHeight >= 14) {
            return false;
        }
        
        // Iピース（テトリス用）は重要なのでホールド検討
        if (currentPiece.type === 'I' && heldPiece?.type !== 'I') {
            return false; // Iピースは基本的にホールドしない（テトリスに使用）
        }
        
        // テトリス狙いでIピースをホールド済みの場合、必要時に使用
        if (heldPiece?.type === 'I') {
            const almostCompleteLines = this.countAlmostCompleteLines(board);
            return almostCompleteLines >= 3; // テトリス狙いの時のみ
        }
        
        // T-spinセットアップのためのTピースホールド
        if (currentPiece.type === 'T' && maxHeight <= 10) {
            const tSpinSetups = this.detectTSpinSetups(board);
            return tSpinSetups.some(setup => setup); // T-spinセットアップがある場合
        }
        
        return false; // デフォルトはホールドしない
    }
}