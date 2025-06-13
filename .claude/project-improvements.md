# 過去の試行錯誤・改善プロセス

## Git コミット単位の改善

### 現在の問題点
#### 大きすぎるコミット単位
- `204a67b`: 463行の変更（テトリミノ + ゲームロジック）
- `163f8de`: 377行の変更（テストフレームワーク + HTML + CSS + テスト）

#### 複数責務の混在
- 異なる機能を1つのコミットに含める
- テストと実装を同時にコミット
- ファイル作成とロジック実装の混在

### 失敗パターンの分析
#### なぜ大きなコミットになったか
1. **機能完成を急いだ**: TDD工程を理解していたが、コミットタイミングを見誤った
2. **変更範囲の見積もり不足**: 実装開始前に変更ファイル数を把握していなかった
3. **中間コミットの意識不足**: 機能途中でのコミットを躊躇した

### 改善プロセス
#### 推奨コミット単位（100-200行目安）
```
適切な分割例:
1. Add simple test framework for TDD approach (test-runner.js のみ)
2. Add basic HTML structure for Tetris game (index.html のみ)
3. Add CSS styling for game interface (style.css のみ)
4. Add comprehensive test cases for Tetris core logic (tetris.test.js のみ)
5. Implement Tetromino class with rotation logic (Tetrominoクラス部分)
6. Implement GameBoard class with collision detection (GameBoardクラス部分)
7. Implement line clearing and validation logic (ライン消去ロジック)
8. Implement main game loop and controls (TetrisGameクラス基本部分)
9. Add scoring and level progression system (スコア計算部分)
10. Add game over handling and UI (ゲームオーバー処理)
```

#### 今後のコミット戦略
- **1コミット = 1機能または1修正**
- **テストと実装の分離**: テスト追加 → コミット → 実装 → コミット
- **独立動作保証**: 各コミット時点でエラーのない状態を維持
- **中間コミットの積極活用**: 機能が部分的でも意味のある単位でコミット

### 教訓
#### 学んだこと
- TDDの理解とコミット戦略は別のスキル
- コミット分割の計画は実装開始前に行う
- 「動く最小単位」での頻繁なコミットが重要

#### 次回適用すること
- 実装前にコミット計画の作成
- 機能実装中の定期的な進捗確認
- 200行を超えそうな場合の早期分割判断