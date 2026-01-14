# 糖質管理アドバイザー

食事画像から栄養素を分析し、糖質制限のアドバイスを提供するWebアプリケーション。

## 機能

- 食事画像のアップロード
- Gemini AIによる食品認識・栄養素推定
- 基準値との比較（レーダーチャート）
- 食べる順番のアドバイス
- 糖質制限向けのカスタムアドバイス

## 技術スタック

### バックエンド
- Python 3.11+
- FastAPI
- Google Gemini API

### フロントエンド
- Next.js 14
- React 18
- Tailwind CSS
- Chart.js

## セットアップ

### 1. Gemini API Keyの取得

[Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを取得してください。

### 2. バックエンドのセットアップ

```bash
cd backend

# 仮想環境の作成
python -m venv venv

# 仮想環境の有効化
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してGEMINI_API_KEYを設定

# サーバー起動
uvicorn main:app --reload
```

バックエンドは http://localhost:8000 で起動します。

### 3. フロントエンドのセットアップ

```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local

# 開発サーバー起動
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

## 使い方

1. ブラウザで http://localhost:3000 を開く
2. 食事の写真をドラッグ&ドロップまたはクリックしてアップロード
3. AIが食品を認識し、栄養素を分析
4. レーダーチャートで基準値との比較を確認
5. 食べる順番のアドバイスを参考に食事

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/` | GET | ヘルスチェック |
| `/api/analyze` | POST | 食事画像の栄養分析 |
| `/api/standards` | GET | 栄養摂取基準値の取得 |

## プロジェクト構造

```
carbohydrate_advisor/
├── backend/
│   ├── main.py              # FastAPIアプリケーション
│   ├── config.py            # 設定管理
│   ├── requirements.txt     # Python依存関係
│   └── services/
│       └── nutrition_analyzer.py  # Gemini連携サービス
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx   # レイアウト
│   │   │   ├── page.tsx     # メインページ
│   │   │   └── globals.css  # グローバルスタイル
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx    # 画像アップロード
│   │   │   ├── NutritionChart.tsx   # レーダーチャート
│   │   │   └── NutritionResult.tsx  # 結果表示
│   │   └── types/
│   │       └── nutrition.ts # 型定義
│   └── package.json
└── README.md
```

## 今後の開発予定（Phase 2以降）

- [ ] ユーザー認証機能
- [ ] 食事履歴の保存
- [ ] 週間・月間レポート
- [ ] 食事検索機能

## 注意事項

- 栄養素の数値はAIによる推定値です。正確な数値は栄養士にご相談ください。
- 医療上のアドバイスではありません。糖質制限については医師にご相談ください。
