# デプロイトラブルシューティング

本ドキュメントは、糖質管理アドバイザーのデプロイ時に直面した問題と解決策をまとめたものです。

---

## 1. Railway: "Railpack could not determine how to build the app"

### 症状
Railway でデプロイ時に以下のエラーが発生:
```
Railpack could not determine how to build the app.
```

### 原因
- モノレポ構成（frontend/ と backend/ が同一リポジトリ）で、Railway がどのディレクトリをビルドすべきか判断できない
- Python プロジェクトとして認識されていない

### 解決策
1. **Root Directory の設定**
   - Railway Dashboard → Service → Settings → Source
   - "Root Directory" を `backend` に設定

2. **nixpacks.toml の作成**（backend/ 直下）
   ```toml
   [phases.setup]
   nixPkgs = ["python311", "pip"]

   [phases.install]
   cmds = ["python -m pip install -r requirements.txt"]

   [start]
   cmd = "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
   ```

---

## 2. Railway: "pip: command not found" / "no precompiled python found"

### 症状
```
pip: command not found
no precompiled python found for core:python@3.11.0
```

### 原因
- Python バージョン指定が厳密すぎる（3.11.0 のようなパッチバージョン指定）
- Nixpacks が指定されたバージョンのプリコンパイル済み Python を見つけられない

### 解決策
1. **nixpacks.toml の修正**
   ```toml
   # NG: パッチバージョン指定
   nixPkgs = ["python3110"]

   # OK: メジャー.マイナーバージョン指定
   nixPkgs = ["python311", "pip"]
   ```

2. **runtime.txt の修正**（backend/ 直下）
   ```
   # NG
   python-3.11.0

   # OK
   python-3.11
   ```

3. **pip コマンドの実行方法**
   ```toml
   # NG: pip が PATH にない場合がある
   cmds = ["pip install -r requirements.txt"]

   # OK: python -m を使用
   cmds = ["python -m pip install -r requirements.txt"]
   ```

---

## 3. Railway: 環境変数が読み込まれない

### 症状
- API から "Gemini API Keyが設定されていません" エラー
- 環境変数を設定したはずなのに反映されない

### 原因
- 環境変数名のスペルミス
- 設定後の再デプロイ忘れ
- pydantic-settings の設定問題

### 解決策
1. **環境変数名の確認**
   | 変数名 | 正しい例 |
   |--------|----------|
   | GEMINI_API_KEY | `AIzaSy...` |
   | FRONTEND_URL | `https://example.vercel.app` |

2. **Railway Dashboard での確認項目**
   - 変数名が大文字・アンダースコア形式か
   - 値に余分なスペースや引用符がないか
   - 保存ボタンを押したか
   - 再デプロイが実行されたか

3. **デバッグ用エンドポイントの追加**
   ```python
   @app.get("/api/debug/env")
   async def debug_env():
       return {
           "gemini_api_key_set": bool(settings.gemini_api_key),
           "gemini_api_key_from_env": bool(os.environ.get("GEMINI_API_KEY")),
       }
   ```

4. **pydantic-settings の設定**
   ```python
   from pydantic_settings import BaseSettings, SettingsConfigDict

   class Settings(BaseSettings):
       gemini_api_key: str = ""

       model_config = SettingsConfigDict(
           env_file=".env",
           case_sensitive=False,  # 大文字小文字を区別しない
       )
   ```

---

## 4. Vercel: 環境変数が反映されない

### 症状
- `process.env.NEXT_PUBLIC_API_URL` が `undefined`
- ローカルでは動作するが本番で動作しない

### 原因
- 環境変数名が `NEXT_PUBLIC_` で始まっていない
- 環境変数設定後に再デプロイしていない
- ビルド時に環境変数が存在しなかった

### 解決策
1. **変数名のプレフィックス確認**
   ```
   # NG: クライアントサイドで使用不可
   API_URL=https://...

   # OK: NEXT_PUBLIC_ プレフィックス必須
   NEXT_PUBLIC_API_URL=https://...
   ```

2. **Vercel Dashboard での設定**
   - Project → Settings → Environment Variables
   - 変数追加後、必ず **Redeploy** を実行

3. **デバッグ用ログの追加**
   ```typescript
   console.log("Current API URL:", process.env.NEXT_PUBLIC_API_URL);
   ```

---

## 5. CORS エラー

### 症状
```
Access to fetch at 'https://backend...' from origin 'https://frontend...'
has been blocked by CORS policy
```

### 原因
- バックエンドの CORS 設定にフロントエンドの URL が含まれていない
- Vercel のプレビュー URL が許可されていない

### 解決策
```python
from fastapi.middleware.cors import CORSMiddleware

cors_origins = [settings.frontend_url, "http://localhost:3000"]
cors_origins = [origin for origin in cors_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # プレビューURL対応
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 6. Chrome でファイル選択が動作しない

### 症状
- Edge では画像アップロードが動作するが、Chrome では反応しない
- クリックしても何も起きない

### 原因
- `display: none` の input 要素はクリックイベントが発火しない場合がある
- Chrome のセキュリティ制限

### 解決策（調査中）
GitHub Issue #1 で追跡中

試した方法:
1. `visibility: hidden` + absolute positioning
2. `useRef` + `inputRef.current.click()`
3. `<label htmlFor>` + visually hidden input

```tsx
<label htmlFor="meal-image-upload" className="cursor-pointer">
  <input
    id="meal-image-upload"
    type="file"
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      border: '0',
    }}
  />
</label>
```

---

## トラブルシューティングの一般的なアプローチ

1. **ログを追加する**: 問題箇所を特定するため、詳細なログ出力を追加
2. **段階的に確認**: 環境変数 → 設定ファイル → アプリケーションコードの順で確認
3. **診断エンドポイント**: 本番環境の状態を確認できる API を一時的に追加
4. **最小構成でテスト**: 問題を切り分けるため、最小限の構成で動作確認

---

## 関連リンク

- [Railway Nixpacks 設定](https://nixpacks.com/docs/configuration/file)
- [Vercel 環境変数](https://vercel.com/docs/environment-variables)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
