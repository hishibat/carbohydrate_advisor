# ユーザー End-to-End 利用フロー

糖質管理アドバイザーのユーザー操作フロー図

## メインフロー: 食事画像分析と保存

```mermaid
flowchart TD
    Start([アプリにアクセス]) --> CheckAuth{ログイン<br/>状態確認}

    CheckAuth -->|未ログイン| ShowGuest[ゲスト画面表示<br/>・画像アップロードUI<br/>・栄養基準値表示]
    CheckAuth -->|ログイン済| ShowUser[ユーザー画面表示<br/>・画像アップロードUI<br/>・食事履歴リンク]

    ShowGuest --> Upload[食事画像をアップロード<br/>ドラッグ&ドロップ or 選択]
    ShowUser --> Upload

    Upload --> Validate{画像<br/>バリデーション}
    Validate -->|NG<br/>10MB超過/非画像| Error1[エラー表示<br/>再アップロード促す]
    Error1 --> Upload

    Validate -->|OK| SendAPI[バックエンドAPIに送信<br/>POST /api/analyze]

    SendAPI --> Processing[処理中...<br/>ローディング表示]

    Processing --> GeminiAnalysis[Gemini 2.5 Flash<br/>画像認識・栄養推定]

    GeminiAnalysis --> APIResponse{API応答}
    APIResponse -->|エラー| Error2[エラー表示<br/>再試行促す]
    Error2 --> Upload

    APIResponse -->|成功| DisplayResult[分析結果表示]

    subgraph 結果表示["分析結果表示エリア"]
        DisplayResult --> Foods[認識食品リスト]
        DisplayResult --> Chart[レーダーチャート<br/>栄養バランス]
        DisplayResult --> Details[栄養素詳細<br/>糖質・たんぱく質・脂質等]
        DisplayResult --> Overlay[食品位置表示<br/>バウンディングボックス]
        DisplayResult --> Order[推奨食べ順]
        DisplayResult --> Advice[AIアドバイス]
    end

    Details --> CheckSave{保存機能}

    CheckSave -->|未ログイン| PromptLogin[ログイン促すメッセージ<br/>保存には認証が必要]
    PromptLogin --> LoginFlow

    CheckSave -->|ログイン済| SaveForm[保存フォーム表示]

    SaveForm --> SelectType[食事タイプ選択<br/>朝食/昼食/夕食/間食]
    SelectType --> SelectDate[日付選択<br/>デフォルト: 今日]
    SelectDate --> ClickSave[保存ボタンクリック]

    ClickSave --> UploadImage[画像をStorageに保存]
    UploadImage --> InsertMeal[mealsテーブルに挿入]
    InsertMeal --> InsertNutrition[nutrition_dataテーブルに挿入]
    InsertNutrition --> SaveComplete[保存完了メッセージ]

    SaveComplete --> NextAction{次のアクション}
    NextAction -->|新しい分析| Reset[画面リセット]
    Reset --> Upload
    NextAction -->|履歴確認| History[食事履歴ページへ]

    subgraph LoginFlow["ログインフロー"]
        PromptLogin --> ShowAuthModal[認証モーダル表示]
        ShowAuthModal --> AuthChoice{新規/既存}
        AuthChoice -->|新規登録| SignUp[メール・パスワード入力]
        SignUp --> SendConfirm[確認メール送信]
        SendConfirm --> WaitConfirm[メール確認待ち]
        WaitConfirm --> ConfirmEmail[メールリンククリック]
        ConfirmEmail --> LoginSuccess
        AuthChoice -->|ログイン| SignIn[メール・パスワード入力]
        SignIn --> Authenticate[Supabase認証]
        Authenticate -->|成功| LoginSuccess[ログイン成功<br/>JWT取得]
        Authenticate -->|失敗| AuthError[エラー表示<br/>再入力促す]
        AuthError --> SignIn
        LoginSuccess --> CloseModal[モーダル閉じる]
        CloseModal --> CheckSave
    end

    History --> End([終了])

    style Start fill:#c8e6c9
    style End fill:#ffcdd2
    style 結果表示 fill:#e3f2fd
    style LoginFlow fill:#fff8e1
```

## 詳細シーケンス図: 画像分析プロセス

```mermaid
sequenceDiagram
    autonumber

    actor User as ユーザー
    participant Browser as ブラウザ<br/>(Next.js)
    participant API as バックエンド<br/>(FastAPI)
    participant Gemini as Gemini 2.5<br/>Flash
    participant Supabase as Supabase

    User->>Browser: 食事画像をドロップ
    Browser->>Browser: ファイル検証<br/>(サイズ・形式)
    Browser->>Browser: プレビュー表示

    User->>Browser: 分析開始
    Browser->>Browser: FormData作成
    Browser->>API: POST /api/analyze<br/>(multipart/form-data)

    API->>API: 画像受信・検証
    API->>API: EXIF情報処理<br/>(回転補正・除去)
    API->>API: Base64エンコード

    API->>Gemini: 画像分析リクエスト<br/>(プロンプト+画像)

    Note over Gemini: 食品認識処理<br/>・食品検出<br/>・位置特定<br/>・栄養推定<br/>・アドバイス生成

    Gemini-->>API: JSON応答<br/>(栄養データ・座標)

    API->>API: レスポンス整形
    API-->>Browser: NutritionData JSON

    Browser->>Browser: 状態更新
    Browser->>Browser: 結果コンポーネント描画
    Browser->>Browser: Chart.js レンダリング
    Browser->>Browser: バウンディングボックス描画

    Browser-->>User: 分析結果表示

    alt ログイン済みの場合
        User->>Browser: 保存ボタンクリック
        Browser->>Supabase: 画像アップロード<br/>(Storage)
        Supabase-->>Browser: 画像URL
        Browser->>Supabase: INSERT meals
        Supabase-->>Browser: meal_id
        Browser->>Supabase: INSERT nutrition_data
        Supabase-->>Browser: 成功
        Browser-->>User: 保存完了表示
    end
```

## 認証フロー詳細

```mermaid
sequenceDiagram
    autonumber

    actor User as ユーザー
    participant Browser as ブラウザ
    participant Auth as Supabase Auth
    participant DB as PostgreSQL
    participant Email as メールサービス

    rect rgb(255, 248, 225)
        Note over User,Email: 新規登録フロー
        User->>Browser: 登録フォーム入力
        Browser->>Auth: signUp(email, password)
        Auth->>Auth: ユーザー作成
        Auth->>Email: 確認メール送信
        Auth-->>Browser: 確認待ち状態
        Browser-->>User: メール確認を促す

        User->>Email: 確認リンククリック
        Email->>Auth: トークン検証
        Auth->>Auth: メール確認完了
        Auth-->>Browser: セッション確立
    end

    rect rgb(227, 242, 253)
        Note over User,DB: ログインフロー
        User->>Browser: ログインフォーム入力
        Browser->>Auth: signInWithPassword()
        Auth->>Auth: 認証情報検証
        Auth-->>Browser: JWT + Refresh Token
        Browser->>Browser: トークン保存<br/>(localStorage/Cookie)
        Browser-->>User: ログイン成功表示
    end

    rect rgb(232, 245, 233)
        Note over User,DB: 認証済みデータアクセス
        User->>Browser: データ操作要求
        Browser->>DB: クエリ + JWT
        DB->>DB: RLS検証<br/>(auth.uid() = user_id)
        DB-->>Browser: 自分のデータのみ返却
        Browser-->>User: データ表示
    end

    rect rgb(255, 235, 238)
        Note over User,Auth: ログアウトフロー
        User->>Browser: ログアウトクリック
        Browser->>Auth: signOut()
        Auth->>Auth: セッション無効化
        Auth-->>Browser: 完了
        Browser->>Browser: トークン削除
        Browser-->>User: ゲスト状態に戻る
    end
```

## 状態遷移図

```mermaid
stateDiagram-v2
    [*] --> 初期状態

    初期状態 --> 画像選択中: 画像ドロップ/選択
    画像選択中 --> 初期状態: キャンセル
    画像選択中 --> 分析中: 分析開始

    分析中 --> 結果表示: 分析成功
    分析中 --> エラー状態: 分析失敗

    エラー状態 --> 画像選択中: 再試行
    エラー状態 --> 初期状態: リセット

    結果表示 --> 保存フォーム表示: 保存選択(ログイン済)
    結果表示 --> ログイン促進: 保存選択(未ログイン)
    結果表示 --> 画像選択中: 新規分析

    ログイン促進 --> 認証中: ログイン開始
    認証中 --> 保存フォーム表示: 認証成功
    認証中 --> ログイン促進: 認証失敗

    保存フォーム表示 --> 保存中: 保存実行
    保存中 --> 保存完了: 保存成功
    保存中 --> 保存フォーム表示: 保存失敗

    保存完了 --> 画像選択中: 新規分析
    保存完了 --> 履歴ページ: 履歴確認

    履歴ページ --> [*]
```

## ユーザーシナリオ例

### シナリオ: 糖質制限中のユーザーが昼食を記録

| ステップ | ユーザー行動 | システム応答 |
|---------|------------|-------------|
| 1 | アプリにアクセス | ホーム画面表示 |
| 2 | 「鯖定食」を撮影 | - |
| 3 | 画像をドラッグ&ドロップ | プレビュー表示 |
| 4 | 自動分析開始 | ローディング表示 |
| 5 | 待機（3-5秒） | Gemini API処理 |
| 6 | - | 認識食品: ご飯、鯖、味噌汁、サラダ |
| 7 | - | 糖質62g（超過警告）表示 |
| 8 | - | レーダーチャート表示 |
| 9 | - | 「サラダ→鯖→ご飯」の順推奨 |
| 10 | 「昼食」を選択 | 保存フォーム更新 |
| 11 | 「保存」クリック | 処理中表示 |
| 12 | - | 保存完了メッセージ |
| 13 | 「新しい食事を分析」クリック | 画面リセット |
