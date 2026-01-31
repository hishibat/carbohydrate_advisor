# Architecture Pattern & Boundary Map

糖質管理アドバイザーのアーキテクチャ構成図

```mermaid
flowchart TB
    subgraph クライアント層["クライアント層 (Vercel)"]
        Browser["ブラウザ"]

        subgraph NextJS["Next.js 14 フロントエンド"]
            Pages["ページ"]
            Components["コンポーネント"]
            Contexts["認証コンテキスト"]
            Libs["ユーティリティ"]
        end
    end

    subgraph API層["API層 (Railway)"]
        subgraph FastAPI["FastAPI バックエンド"]
            Endpoints["APIエンドポイント"]
            Services["ビジネスロジック"]
            Config["設定管理"]
        end
    end

    subgraph 外部サービス層["外部サービス層"]
        subgraph Supabase["Supabase Platform"]
            Auth["認証サービス<br/>(JWT発行)"]
            PostgreSQL["PostgreSQL<br/>(RLS有効)"]
            Storage["ストレージ<br/>(meal-images)"]
        end

        Gemini["Google Gemini 2.5 Flash<br/>(画像認識・栄養推定)"]
    end

    %% クライアント層の内部接続
    Browser --> Pages
    Pages --> Components
    Components --> Contexts
    Components --> Libs

    %% API層の内部接続
    Endpoints --> Services
    Services --> Config

    %% クライアント → API
    NextJS -->|"REST API<br/>/api/analyze<br/>/api/standards"| FastAPI

    %% クライアント → Supabase（直接接続）
    NextJS -->|"Supabase JS SDK<br/>(認証・CRUD)"| Auth
    NextJS -->|"RLS保護<br/>クエリ"| PostgreSQL
    NextJS -->|"画像アップロード"| Storage

    %% API → 外部サービス
    Services -->|"画像分析リクエスト<br/>(Base64)"| Gemini
    Gemini -->|"栄養データ<br/>JSON応答"| Services

    %% Supabase内部
    Auth -->|"JWT検証"| PostgreSQL

    %% スタイル
    classDef clientStyle fill:#e1f5fe,stroke:#01579b
    classDef apiStyle fill:#fff3e0,stroke:#e65100
    classDef externalStyle fill:#f3e5f5,stroke:#7b1fa2
    classDef dbStyle fill:#e8f5e9,stroke:#2e7d32

    class Browser,NextJS,Pages,Components,Contexts,Libs clientStyle
    class FastAPI,Endpoints,Services,Config apiStyle
    class Gemini externalStyle
    class Auth,PostgreSQL,Storage dbStyle
```

## コンポーネント詳細

### クライアント層 (Next.js 14 + React 18)

| コンポーネント | 役割 |
|---------------|------|
| `page.tsx` | メインページ（画像分析UI） |
| `ImageUploader` | ドラッグ&ドロップ画像アップロード |
| `NutritionResult` | 栄養分析結果表示 |
| `NutritionChart` | レーダーチャート（Chart.js） |
| `FoodDetectionOverlay` | 食品位置のバウンディングボックス表示 |
| `SaveMealForm` | 食事記録保存フォーム |
| `AuthContext` | Supabase認証状態管理 |

### API層 (FastAPI + Python 3.11)

| エンドポイント | 機能 |
|---------------|------|
| `POST /api/analyze` | 食事画像分析（Gemini API連携） |
| `GET /api/standards` | 栄養基準値取得 |
| `GET /` | ヘルスチェック |

### 外部サービス層

| サービス | 用途 |
|---------|------|
| Supabase Auth | ユーザー認証・JWT発行 |
| Supabase PostgreSQL | データ永続化（RLS保護） |
| Supabase Storage | 食事画像保存 |
| Google Gemini 2.5 Flash | 画像認識・栄養推定・アドバイス生成 |

## 境界とデータフロー

```mermaid
flowchart LR
    subgraph 信頼境界_クライアント["信頼境界: クライアント"]
        UI["UI Layer"]
    end

    subgraph 信頼境界_認証["信頼境界: 認証"]
        JWT["JWT Token"]
    end

    subgraph 信頼境界_API["信頼境界: API"]
        API["REST API"]
    end

    subgraph 信頼境界_データ["信頼境界: データ"]
        DB["PostgreSQL<br/>(RLS)"]
        Files["Storage"]
    end

    subgraph 信頼境界_外部["信頼境界: 外部AI"]
        AI["Gemini API"]
    end

    UI -->|"1. 認証要求"| JWT
    JWT -->|"2. JWT発行"| UI
    UI -->|"3. Bearer Token"| API
    UI -->|"4. 認証済みクエリ"| DB
    UI -->|"5. 画像保存"| Files
    API -->|"6. 画像分析"| AI
    AI -->|"7. 栄養データ"| API
    API -->|"8. 結果返却"| UI

    style 信頼境界_クライアント fill:#e3f2fd
    style 信頼境界_認証 fill:#fff8e1
    style 信頼境界_API fill:#fce4ec
    style 信頼境界_データ fill:#e8f5e9
    style 信頼境界_外部 fill:#f3e5f5
```

## セキュリティ境界

| 境界 | 保護機構 |
|------|---------|
| クライアント ↔ API | CORS, HTTPS |
| クライアント ↔ Supabase | JWT認証, RLS |
| API ↔ Gemini | APIキー（環境変数） |
| データベース | Row Level Security |
| ストレージ | バケットポリシー |
