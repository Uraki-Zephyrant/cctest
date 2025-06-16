# 頻繁に使用するコマンドパターン・実装テンプレート

## 🎯 問題解決ワークフロー（最重要パターン）

### 問題発生時の対応手順
```bash
1. 問題の分類（重要度判定）
   - 構文エラー（軽微）← 即座に対処
   - 設定エラー（中度）← 設定見直し
   - ロジックエラー（重要）← 部分検証
   - アーキテクチャエラー（致命的）← 最優先で根本対処

2. 根本原因特定プロセス
   - 症状の詳細記録
   - 仮説立案（表面的 vs 構造的）
   - 検証環境構築（仮想テスト等）
   - 段階的検証（部分 → 統合 → 全体）

3. 構造的解決の実施
   - アーキテクチャレベルでの修正
   - システム間整合性確保
   - 回帰テスト実施
   - 定量的効果測定
```

### 仮想テストシステム構築パターン（重要）
```javascript
// 完全制御環境での根本原因特定
class VirtualTestSystem {
    constructor() {
        this.ai = new TetrisAI();
        this.board = new GameBoard();
    }
    
    // AI思考とゲーム実行の分離検証
    testAIDecisionExecution() {
        const aiDecision = this.ai.calculateBestMove(this.board, piece);
        const gameResult = this.executeMove(aiDecision);
        const metrics = this.measureEfficiency();
        
        return { 
            aiDecision, 
            gameResult, 
            metrics,
            isConsistent: this.verifyConsistency(aiDecision, gameResult)
        };
    }
    
    // 修正前後の定量比較
    compareBeforeAfter() {
        const before = this.runSimulation('before');
        const after = this.runSimulation('after');
        
        console.log(`改善率: ${(after.efficiency / before.efficiency * 100).toFixed(1)}%`);
        return { before, after, improvement: after.efficiency / before.efficiency };
    }
}
```

### 根本原因特定のための検証コマンド
```bash
# システム間整合性確認（最重要）
node virtual-test.js        # AI思考の独立検証
# ブラウザテスト            # ゲーム実行の独立検証  
# 結果比較                  # 不整合箇所の特定
# 座標系・処理順序の確認    # 根本原因の特定

# 効果測定
node fixed-virtual-test.js  # 修正後の効果確認
```

## Git 操作の定型パターン

### 適切なコミットサイクル
```bash
# 変更前の状態確認
git status
git diff

# 小さな単位でのコミット（日本語メッセージ）
git add specific-file.js
git commit -m "特定機能の実装

詳細な説明...

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 定期的なプッシュ
git push
```

### コミットメッセージのルール
- **必ず日本語で記載**
- 1行目: 変更内容の要約（50文字以内推奨）
- 2行目: 空行
- 3行目以降: 詳細説明（必要に応じて）

### TDD サイクルのコミットパターン
```bash
# 1. テスト作成
git add tests/feature.test.js
git commit -m "機能Xの失敗テストを追加"

# 2. 最小実装
git add src/feature.js
git commit -m "機能Xのテストを通す最小実装"

# 3. リファクタリング（必要に応じて）
git add src/feature.js
git commit -m "機能Xのコードをリファクタリング"
```

## JavaScript実装テンプレート

### 座標系統一パターン（重要）
```javascript
// AI思考とゲーム実行で同一の座標系を使用
calculateDropPosition(board, piece) {
    let dropY = piece.y;
    while (dropY < board.height && 
           board.isValidPosition(piece, piece.x, dropY + 1)) {
        dropY++;
    }
    return board.isValidPosition(piece, piece.x, dropY) ? dropY : null;
}

// 直接配置パターン（段階的移動を避ける）
executeMoveSequence(move) {
    // AI決定を直接適用（座標系の不整合を防ぐ）
    for (let r = 0; r < move.rotation; r++) {
        this.currentPiece.rotate();
    }
    this.currentPiece.x = move.x;
    this.currentPiece.y = move.y || 0;
    
    // 正確な落下位置を再計算
    const finalY = this.calculateFinalDropPosition();
    if (finalY !== null) {
        this.currentPiece.y = finalY;
    }
}
```

### Cold Clear準拠AI評価パターン
```javascript
// 40+パラメータによる精密評価（実績重視）
evaluation = {
    height: -120,        // 高さ制御最重要
    clear1: 200,         // ライン消去推奨
    clear4: 1000,        // テトリス高評価
    perfect_clear: 500,  // 適度なPC評価
    top_half: -400,      // 上半分ペナルティ
    top_quarter: -800,   // 上四分の一ペナルティ
    // ...40+パラメータ
}

// 5段階戦略選択（生存性重視）
selectStrategy(board) {
    const maxHeight = this.getMaxHeight(board);
    const avgHeight = this.getAverageHeight(board);
    
    if (maxHeight >= 14 || avgHeight >= 10) return STRATEGIES.SUPER_EMERGENCY;
    if (maxHeight >= 11 || avgHeight >= 8) return STRATEGIES.EMERGENCY;
    if (maxHeight >= 8 || avgHeight >= 6) return STRATEGIES.SAFETY_FIRST;
    if (maxHeight <= 6) return STRATEGIES.PERFECT_CLEAR;
    if (maxHeight <= 7) return STRATEGIES.T_SPIN_FOCUS;
    return STRATEGIES.BALANCED;
}
```

### クラス定義パターン
```javascript
class FeatureName {
    constructor(param1, param2) {
        this.property1 = param1;
        this.property2 = param2;
    }

    // メソッド定義
    methodName() {
        // 実装
    }

    // プライベートメソッド（慣例的に_プレフィックス）
    _privateMethod() {
        // 内部処理
    }
}
```

### Canvas描画パターン
```javascript
// 基本描画テンプレート
draw() {
    // 1. キャンバスクリア
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 2. 背景要素描画
    this.drawBackground();
    
    // 3. 動的要素描画
    this.drawMovingElements();
}

// ブロック描画の統一パターン
drawBlock(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
        x * this.blockSize,
        y * this.blockSize,
        this.blockSize,
        this.blockSize
    );
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(
        x * this.blockSize,
        y * this.blockSize,
        this.blockSize,
        this.blockSize
    );
}
```

### イベントリスナーパターン
```javascript
setupEventListeners() {
    document.addEventListener('keydown', (event) => {
        switch(event.code) {
            case 'ArrowLeft':
                this.handleLeftKey();
                break;
            case 'ArrowRight':
                this.handleRightKey();
                break;
            // その他のキー
        }
        event.preventDefault();
    });
}
```

## テスト記述パターン

### 基本テスト構造
```javascript
describe('クラス名/機能名', () => {
    it('期待される動作の説明', () => {
        // Arrange - 準備
        const instance = new ClassName(param);
        
        // Act - 実行
        const result = instance.method();
        
        // Assert - 検証
        expect(result).toBe(expected);
    });
});
```

### 境界値テストパターン
```javascript
describe('境界値テスト', () => {
    it('最小値での動作', () => {
        // 最小値テスト
    });
    
    it('最大値での動作', () => {
        // 最大値テスト
    });
    
    it('範囲外の値での動作', () => {
        // エラーケーステスト
    });
});
```

## 改善された開発フロー定型パターン

### 新機能開発手順（ワークフロー改善版）
1. **要件整理**: 実装する機能の明確化
2. **問題分析**: 表面的 vs 構造的問題の判定
3. **検証環境構築**: 仮想テスト等の準備
4. **テスト設計**: 期待される入出力の定義
5. **テスト実装**: 失敗するテストの作成
6. **テストコミット**: `Add failing tests for feature X`
7. **最小実装**: テストを通す最小限のコード
8. **実装コミット**: `Implement minimal feature X`
9. **統合検証**: システム間整合性確認
10. **リファクタリング**: コード品質向上（必要に応じて）
11. **リファクタリングコミット**: `Refactor feature X`

### デバッグ時の定型手順（根本原因特定版）
1. **現象の詳細記録**: エラーメッセージ・動作の記録
2. **問題分類**: 構文 < 設定 < ロジック < アーキテクチャ
3. **仮説立案**: 表面的原因 vs 構造的原因
4. **検証環境構築**: 分離テスト可能な環境
5. **段階的検証**: 部分機能 → 統合 → 全体
6. **根本原因特定**: アーキテクチャレベルの問題発見
7. **構造的修正**: システム全体の整合性確保
8. **効果測定**: 修正前後の定量比較
9. **コミット**: 修正内容の記録

### 効果測定パターン
```javascript
// 定量的改善効果の測定
const measureImprovement = () => {
    const before = { pieces: 20, lines: 0, efficiency: 0.000 };
    const after = { pieces: 20, lines: 5, efficiency: 1.000 };
    
    console.log('=== 改善効果測定 ===');
    console.log(`修正前: ${before.pieces}ピース → ${before.lines}ライン (効率: ${before.efficiency})`);
    console.log(`修正後: ${after.pieces}ピース → ${after.lines}ライン (効率: ${after.efficiency})`);
    console.log(`改善率: ${(after.efficiency / Math.max(before.efficiency, 0.001) * 100).toFixed(1)}%`);
    
    return { before, after };
};
```