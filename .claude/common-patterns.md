# 頻繁に使用するコマンドパターン・実装テンプレート

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

## 開発フロー定型パターン

### 新機能開発手順
1. **要件整理**: 実装する機能の明確化
2. **テスト設計**: 期待される入出力の定義
3. **テスト実装**: 失敗するテストの作成
4. **テストコミット**: `Add failing tests for feature X`
5. **最小実装**: テストを通す最小限のコード
6. **実装コミット**: `Implement minimal feature X`
7. **リファクタリング**: コード品質向上（必要に応じて）
8. **リファクタリングコミット**: `Refactor feature X`

### デバッグ時の定型手順
1. **現象の確認**: エラーメッセージ・動作の記録
2. **仮説立案**: 原因の推測
3. **検証**: console.log等での確認
4. **修正**: 最小限の変更
5. **テスト**: 修正内容の確認
6. **コミット**: 修正内容の記録