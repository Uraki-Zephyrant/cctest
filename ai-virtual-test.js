// AI仮想動作確認システム
const fs = require('fs');

// テトリス基本クラスの簡易実装
class Tetromino {
    constructor(type) {
        this.type = type;
        this.x = 3;
        this.y = 0;
        this.rotation = 0;
        this.shape = this.getShape(type);
        this.color = this.getColor(type);
    }
    
    getShape(type) {
        const shapes = {
            'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            'O': [[1,1],[1,1]],
            'T': [[0,1,0],[1,1,1],[0,0,0]],
            'S': [[0,1,1],[1,1,0],[0,0,0]],
            'Z': [[1,1,0],[0,1,1],[0,0,0]],
            'J': [[1,0,0],[1,1,1],[0,0,0]],
            'L': [[0,0,1],[1,1,1],[0,0,0]]
        };
        return shapes[type] || shapes['I'];
    }
    
    getColor(type) {
        const colors = {
            'I': '#00f0f0', 'O': '#f0f000', 'T': '#a000f0',
            'S': '#00f000', 'Z': '#f00000', 'J': '#0000f0', 'L': '#f0a000'
        };
        return colors[type] || '#666666';
    }
    
    copy() {
        const newPiece = new Tetromino(this.type);
        newPiece.x = this.x;
        newPiece.y = this.y;
        newPiece.rotation = this.rotation;
        return newPiece;
    }
    
    rotate() {
        const oldShape = this.shape;
        const newShape = [];
        for (let x = 0; x < oldShape[0].length; x++) {
            newShape.push([]);
            for (let y = oldShape.length - 1; y >= 0; y--) {
                newShape[x].push(oldShape[y][x]);
            }
        }
        this.shape = newShape;
        this.rotation = (this.rotation + 1) % 4;
    }
}

class GameBoard {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill().map(() => Array(width).fill(0));
    }
    
    isValidPosition(piece, x, y) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px] !== 0) {
                    const boardX = x + px;
                    const boardY = y + py;
                    
                    if (boardX < 0 || boardX >= this.width || 
                        boardY >= this.height || 
                        (boardY >= 0 && this.grid[boardY][boardX] !== 0)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece(piece) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px] !== 0) {
                    const boardX = piece.x + px;
                    const boardY = piece.y + py;
                    if (boardY >= 0 && boardY < this.height && boardX >= 0 && boardX < this.width) {
                        this.grid[boardY][boardX] = 1;
                    }
                }
            }
        }
    }
    
    getCompletedLines() {
        const completedLines = [];
        for (let y = 0; y < this.height; y++) {
            if (this.grid[y].every(cell => cell !== 0)) {
                completedLines.push(y);
            }
        }
        return completedLines;
    }
    
    clear() {
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
    }
    
    // ボード状態の可視化
    visualize() {
        console.log('  0123456789');
        for (let y = 0; y < this.height; y++) {
            const row = this.grid[y].map(cell => cell ? '█' : '·').join('');
            console.log(`${y.toString().padStart(2)}${row}`);
        }
        console.log('  0123456789');
    }
}

// 修正済みAIコードを読み込み
let TetrisAI;
try {
    const aiCode = fs.readFileSync('./src/autoplay.js', 'utf8');
    // Node.js環境用に調整
    const modifiedCode = aiCode
        .replace(/console\.log/g, '// console.log') // ログを一時的に無効化
        .replace(/class TetrisAI/g, 'TetrisAI = class TetrisAI');
    
    eval(modifiedCode);
    console.log('✅ TetrisAI読み込み成功');
} catch (error) {
    console.log('❌ TetrisAI読み込み失敗:', error.message);
    process.exit(1);
}

// AI仮想テストシステム
class AIVirtualTest {
    constructor() {
        this.ai = new TetrisAI();
        this.board = new GameBoard();
        this.totalLines = 0;
        this.totalPieces = 0;
        this.gameHistory = [];
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            'info': '📋',
            'success': '✅',
            'warn': '⚠️',
            'error': '❌',
            'ai': '🤖'
        }[level] || '📋';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }
    
    // 危険なボード状況を作成（スクリーンショットのような状況）
    createDangerousBoard() {
        this.log('危険なボード状況を作成中...', 'warn');
        
        // 底から15行目まで不規則に配置（スクリーンショットに近い状況）
        for (let y = 19; y >= 5; y--) {
            for (let x = 0; x < 10; x++) {
                // 約70%の確率でブロック配置、ランダムな穴を作る
                if (Math.random() < 0.7) {
                    this.board.grid[y][x] = 1;
                }
            }
            // 各行に少なくとも1つは穴を確保
            const emptySpots = [];
            for (let x = 0; x < 10; x++) {
                if (this.board.grid[y][x] === 0) emptySpots.push(x);
            }
            if (emptySpots.length === 0) {
                // 穴がない場合は1つ作る
                const randomX = Math.floor(Math.random() * 10);
                this.board.grid[y][randomX] = 0;
            }
        }
        
        this.log('危険ボード作成完了', 'warn');
        this.analyzeBoard();
    }
    
    // 実用的なテストボード作成
    createPracticalBoard() {
        this.log('実用的なボード状況を作成中...', 'info');
        
        // 底から5行程度に適度に配置
        for (let y = 19; y >= 15; y--) {
            for (let x = 0; x < 10; x++) {
                if (Math.random() < 0.4) {
                    this.board.grid[y][x] = 1;
                }
            }
        }
        
        this.log('実用ボード作成完了', 'info');
        this.analyzeBoard();
    }
    
    // ボード分析
    analyzeBoard() {
        const maxHeight = this.getMaxHeight();
        const avgHeight = this.getAverageHeight();
        const holes = this.countHoles();
        const completableLines = this.getCompletedLines().length;
        
        this.log(`ボード分析 - 最高: ${maxHeight}, 平均: ${avgHeight.toFixed(1)}, 穴: ${holes}, 完成可能ライン: ${completableLines}`);
    }
    
    getMaxHeight() {
        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                if (this.board.grid[y][x] !== 0) {
                    return this.board.height - y;
                }
            }
        }
        return 0;
    }
    
    getAverageHeight() {
        let totalHeight = 0;
        for (let x = 0; x < this.board.width; x++) {
            for (let y = 0; y < this.board.height; y++) {
                if (this.board.grid[y][x] !== 0) {
                    totalHeight += this.board.height - y;
                    break;
                }
            }
        }
        return totalHeight / this.board.width;
    }
    
    countHoles() {
        let holes = 0;
        for (let x = 0; x < this.board.width; x++) {
            let blockFound = false;
            for (let y = 0; y < this.board.height; y++) {
                if (this.board.grid[y][x] !== 0) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }
        return holes;
    }
    
    getCompletedLines() {
        return this.board.getCompletedLines();
    }
    
    // AIの戦略決定テスト
    testAIStrategy() {
        this.log('=== AI戦略決定テスト ===', 'ai');
        
        const strategy = this.ai.selectStrategy(this.board);
        this.log(`選択された戦略: ${strategy.name}`, 'ai');
        this.log(`優先順位: ${strategy.priority.join(' > ')}`, 'ai');
        
        return strategy;
    }
    
    // 全ピースタイプでのAI判断テスト
    testAllPieces() {
        this.log('=== 全ピースタイプでのAI判断テスト ===', 'ai');
        
        const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const results = [];
        
        for (const pieceType of pieces) {
            const piece = new Tetromino(pieceType);
            
            try {
                const startTime = Date.now();
                const bestMove = this.ai.calculateBestMove(this.board, piece, []);
                const thinkTime = Date.now() - startTime;
                
                results.push({
                    piece: pieceType,
                    move: bestMove,
                    thinkTime,
                    success: true
                });
                
                this.log(`${pieceType}ピース - 位置:(${bestMove.x},${bestMove.rotation}) スコア:${bestMove.score?.toFixed(1)} 思考:${thinkTime}ms`, 'ai');
                
            } catch (error) {
                results.push({
                    piece: pieceType,
                    error: error.message,
                    success: false
                });
                
                this.log(`${pieceType}ピース - エラー: ${error.message}`, 'error');
            }
        }
        
        return results;
    }
    
    // 実際のゲームプレイシミュレーション
    simulateGameplay(maxPieces = 10) {
        this.log(`=== ゲームプレイシミュレーション (${maxPieces}手) ===`, 'success');
        
        const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        let placedPieces = 0;
        let linesCleared = 0;
        
        for (let i = 0; i < maxPieces; i++) {
            const pieceType = pieces[Math.floor(Math.random() * pieces.length)];
            const piece = new Tetromino(pieceType);
            
            this.log(`\n--- ${i + 1}手目: ${pieceType}ピース ---`);
            
            try {
                // AI判断
                const bestMove = this.ai.calculateBestMove(this.board, piece, []);
                
                // ピース移動
                for (let r = 0; r < bestMove.rotation; r++) {
                    piece.rotate();
                }
                piece.x = bestMove.x;
                piece.y = bestMove.y;
                
                // 落下位置計算
                while (this.board.isValidPosition(piece, piece.x, piece.y + 1)) {
                    piece.y++;
                }
                
                // 配置チェック
                if (this.board.isValidPosition(piece, piece.x, piece.y)) {
                    this.board.placePiece(piece);
                    placedPieces++;
                    
                    // ライン消去チェック
                    const completedLines = this.board.getCompletedLines();
                    if (completedLines.length > 0) {
                        linesCleared += completedLines.length;
                        this.log(`🎉 ${completedLines.length}ライン消去！ (合計: ${linesCleared}ライン)`, 'success');
                        
                        // ライン削除
                        for (const lineY of completedLines.sort((a, b) => b - a)) {
                            this.board.grid.splice(lineY, 1);
                            this.board.grid.unshift(Array(this.board.width).fill(0));
                        }
                    } else {
                        this.log('ライン消去なし');
                    }
                    
                    this.log(`配置完了 - 位置:(${piece.x},${piece.y}) 回転:${bestMove.rotation} スコア:${bestMove.score?.toFixed(1)}`);
                    this.analyzeBoard();
                    
                } else {
                    this.log('❌ ゲームオーバー: ピース配置不可', 'error');
                    break;
                }
                
            } catch (error) {
                this.log(`❌ エラー: ${error.message}`, 'error');
                break;
            }
        }
        
        this.log(`\n=== シミュレーション結果 ===`, 'success');
        this.log(`配置ピース数: ${placedPieces}`);
        this.log(`消去ライン数: ${linesCleared}`);
        this.log(`効率: ${linesCleared > 0 ? (linesCleared / placedPieces * 4).toFixed(3) : '0.000'}`);
        
        return {
            placedPieces,
            linesCleared,
            efficiency: linesCleared > 0 ? linesCleared / placedPieces * 4 : 0
        };
    }
    
    // 修正前後の比較テスト
    compareStrategies() {
        this.log('=== 修正前後の戦略比較 ===', 'success');
        
        // 危険な状況での戦略テスト
        this.createDangerousBoard();
        console.log('\n【危険な状況でのAI判断】');
        this.board.visualize();
        
        const strategy = this.testAIStrategy();
        
        this.log('\n修正後の特徴:');
        this.log('- 高さ14以上: 超緊急戦略');
        this.log('- 高さ11以上: 緊急戦略');
        this.log('- 高さ8以上: 安全優先戦略');
        this.log('- Perfect Clear: 高さ6以下のみ');
        
        return strategy;
    }
    
    // 総合テスト実行
    runFullTest() {
        console.log('\n🎮 === AI仮想動作確認システム ===\n');
        
        // 1. 修正内容確認
        this.log('修正済みAI評価パラメータ確認:', 'info');
        this.log(`- height: ${this.ai.evaluation.height} (強化済み)`);
        this.log(`- clear1: ${this.ai.evaluation.clear1} (ライン消去推奨)`);
        this.log(`- clear4: ${this.ai.evaluation.clear4} (テトリス推奨)`);
        
        // 2. 戦略比較
        this.compareStrategies();
        
        // 3. 実用ボードでのテスト
        this.log('\n=== 実用ボードでのテスト ===', 'info');
        this.board.clear();
        this.createPracticalBoard();
        console.log('\n【実用的な状況でのAI判断】');
        this.board.visualize();
        this.testAIStrategy();
        
        // 4. ゲームプレイシミュレーション
        const result = this.simulateGameplay(20);
        
        // 5. 総合評価
        this.log('\n=== 総合評価 ===', 'success');
        if (result.linesCleared > 0) {
            this.log('🎉 AI修正成功！ライン消去を達成！', 'success');
            this.log(`効率: ${result.efficiency.toFixed(3)} (0.5以上で良好)`, 'success');
        } else {
            this.log('⚠️ まだ改善の余地があります', 'warn');
        }
        
        return result;
    }
}

// テスト実行
const test = new AIVirtualTest();
test.runFullTest();