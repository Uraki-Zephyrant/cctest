# 実装パターン・設計決定の知見

## 🎯 最重要教訓: ワークフロー問題の解決

### 根本的な気づき
**技術的問題 < ワークフロー問題**
- 优秀なアルゴリズム（Cold Clear）を持っていても
- **問題解決アプローチが間違っていると失敗する**
- 症状追いかけ → 根本原因特定への転換が成功の鍵

### 悪いワークフローのパターン
#### ❌ 症状追いかけ型対処
```
クラス定義エラー → ES5対応
オートプレイしない → イベント設定修正  
1ラインも消せない → 評価パラメータ調整
```
**問題**: 表面的症状への場当たり的対処で根本課題を見落とし

#### ❌ 検証不足での実装継続
- ブラウザテストで「動かない」→ すぐ次の修正
- AI判断が実際に反映されているかの確認不足
- **ブラックボックス状態**での開発継続

#### ❌ 問題重要度の誤判定
```
構文エラー（軽微）← 時間を消費
設定エラー（中度）← 時間を消費
アーキテクチャエラー（致命的）← 見落とし
```

### 改善されたワークフロー
#### ✅ 根本原因特定ファースト
1. **問題の分類**: 表面 vs 深層の正確な判定
2. **検証環境構築**: 仮想テストシステムによる分離検証
3. **段階的原因特定**: 症状→仮説→検証→根本原因
4. **構造的解決**: アーキテクチャレベルでの修正

#### ✅ 検証駆動開発
- **ai-virtual-test.js**: AI思考とゲーム実行の分離検証
- **定量的評価**: 修正前後の客観的比較
- **段階的確認**: 部分機能 → 統合 → 全体

### 成功要因の分析
1. **正しい問題認識**
   - 「AIが賢くない」→「AI判断が正しく実行されていない」
   - 「パラメータが悪い」→「座標系が統一されていない」

2. **適切なツール選択**
   - Cold Clearアルゴリズム（実績重視）
   - 仮想テストシステム（検証重視）

3. **構造的解決の優先**
   - 座標系統一（深層問題）
   - システム間整合性の確保

### 結果比較
- **改善前**: 18ライン（症状追いかけアプローチ）
- **改善後**: 435ライン（根本原因特定アプローチ）
- **改善率**: 2300%の劇的向上

## アーキテクチャ設計
### クラス設計
- **Tetromino**: ピース（ブロック）の形状、色、位置を管理
- **GameBoard**: ゲーム盤面の状態管理、衝突検出、ライン消去
- **TetrisGame**: ゲーム全体のロジック、UI制御、イベント処理

### 責務分離の原則
- 各クラスは単一責任を持つ
- ピース操作とボード管理を明確に分離
- 描画ロジックはゲームクラスに集約

## Canvas描画パターン
### 効率的な描画手法
- フレーム毎の全画面クリア → 必要部分の再描画
- ブロックサイズ（30px）を基準とした座標計算
- 次のピース表示用の独立Canvas使用

### 座標系統一
- ゲーム座標（0-9, 0-19）とピクセル座標の明確な変換
- オフセット計算による正確な描画位置決定

## イベント処理設計
### キーボード操作
- `keydown`イベントによるリアルタイム操作
- `preventDefault()`によるブラウザデフォルト動作抑制
- ゲームオーバー時の操作無効化

## スコアリングシステム
### 標準テトリス準拠
- 1ライン: 40点 × レベル
- 2ライン: 100点 × レベル  
- 3ライン: 300点 × レベル
- 4ライン: 1200点 × レベル

## 避けるべきパターン
### ❌ アンチパターン
- グローバル変数の多用
- DOM要素の頻繁な書き換え
- 回転時の境界チェック不備
- テストなしでの実装進行

### ✅ 推奨パターン
- クラスベースの責務分離
- requestAnimationFrame使用
- 事前の境界・衝突チェック
- テスト先行開発

## AI戦略システム
### テトリス狙い戦略改善
#### 実装した改善点
1. **ライン消去ボーナスの大幅強化**
   - 旧: `lines²` → 新: テトリス準拠`[0,40,100,300,1200]`
   - テトリス(4ライン)を75倍重視

2. **井戸セットアップ評価システム**
   - 端列での深い井戸形成を高評価
   - 深さ4以上でテトリス可能判定
   - 指数関数的ボーナス: `深さ^1.5 × 10`

3. **I字ピース特化ホールド戦略**
   - 井戸準備中: I字ピースをホールド
   - 井戸完成時: I字ピースで即座にテトリス
   - 危険度<0.4時のみ積極戦略発動

#### 戦略的優先度
- **平常時**: テトリス狙い重視(1.5倍)
- **危険時**: 生存優先、高スコア狙い抑制
- **井戸評価**: 左端・右端・9列目を重点評価

### 歯抜けライン対策システム
#### 実装した機能
1. **歯抜けライン検出**
   - 7個以上ブロック + 1-3個穴のライン特定
   - 底に近いほど高優先度評価

2. **修復可能性評価**
   - 上方向アクセス性（空きスペース）
   - 端列優遇（埋めやすさ）
   - 優先度算出: 深度×50 + ブロック数×30 + 埋めやすさ×20

3. **動的戦略調整**
   - 歯抜け発見時: 修復ボーナス1.5-2.0倍
   - テトリス狙い抑制（安全優先）
   - 深い穴に追加ペナルティ

#### 修復戦略
- **即座修復**: 危険時は2倍重視
- **段階修復**: 平常時は1.5倍重視
- **予防重視**: 深い穴形成にペナルティ

### 両端深溝対策システム
#### 発見された問題
- **過度なテトリス狙い**: 端列での井戸形成を重視しすぎ
- **深さ制限不足**: 8層超のペナルティでは不十分
- **バランス評価の欠如**: 左右高さバランス未考慮

#### 実装した対策
1. **厳格な深さ制限**
   - 6層超: 強いペナルティ (×10)
   - 10層超: 非常に強いペナルティ (×20追加)

2. **バランス評価システム**
   - 左右高さ差: 8超でペナルティ
   - 端溝深さ: 6層超で大ペナルティ (×15)
   - バランスボーナス: 最大100点

3. **動的戦略調整**
   - 深溝6層超: バランス重視3倍、テトリス狙い0.3倍
   - I字ピース制御: 深溝優先埋め、浅溝時のみ井戸作り許可

#### 期待効果
- 端の深溝形成防止
- より均等で安全な積み方
- テトリス狙いと安全性の適切なバランス