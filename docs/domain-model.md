# Domain Model (Data Model)

糖質管理アドバイザーのドメインモデル図

## エンティティ関連図 (ER図)

```mermaid
erDiagram
    USER ||--o{ MEAL : "記録する"
    USER ||--o| USER_PROFILE : "持つ"
    MEAL ||--|| NUTRITION_DATA : "含む"

    USER {
        uuid id PK "Supabase Auth管理"
        string email "メールアドレス"
        timestamp created_at "作成日時"
        timestamp last_sign_in_at "最終ログイン"
    }

    USER_PROFILE {
        uuid id PK
        uuid user_id FK "ユーザーID"
        string display_name "表示名"
        decimal target_carbs_per_meal "目標糖質量/食"
        decimal target_protein_per_meal "目標たんぱく質量/食"
        decimal target_fat_per_meal "目標脂質量/食"
        timestamp created_at "作成日時"
        timestamp updated_at "更新日時"
    }

    MEAL {
        uuid id PK
        uuid user_id FK "ユーザーID"
        varchar meal_type "食事タイプ(breakfast/lunch/dinner/snack)"
        date meal_date "食事日"
        text image_url "画像URL(Storage)"
        timestamp created_at "作成日時"
        timestamp updated_at "更新日時"
    }

    NUTRITION_DATA {
        uuid id PK
        uuid meal_id FK "食事ID"
        decimal calories "カロリー(kcal)"
        decimal carbs "糖質(g)"
        decimal protein "たんぱく質(g)"
        decimal fat "脂質(g)"
        decimal fiber "食物繊維(g)"
        decimal salt "塩分(g)"
        jsonb food_items "認識食品リスト"
        jsonb eating_order "推奨食べ順"
        text advice "AIアドバイス"
        timestamp created_at "作成日時"
    }
```

## ドメインオブジェクト詳細

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +Timestamp createdAt
        +Timestamp lastSignInAt
        +authenticate()
        +signOut()
    }

    class UserProfile {
        +UUID id
        +UUID userId
        +String displayName
        +Decimal targetCarbsPerMeal
        +Decimal targetProteinPerMeal
        +Decimal targetFatPerMeal
        +updateTargets()
    }

    class Meal {
        +UUID id
        +UUID userId
        +MealType mealType
        +Date mealDate
        +String imageUrl
        +Timestamp createdAt
        +save()
        +delete()
    }

    class NutritionData {
        +UUID id
        +UUID mealId
        +Decimal calories
        +Decimal carbs
        +Decimal protein
        +Decimal fat
        +Decimal fiber
        +Decimal salt
        +List~FoodItem~ foodItems
        +List~String~ eatingOrder
        +String advice
        +calculateTotals()
        +compareWithTargets()
    }

    class FoodItem {
        +String name
        +FoodCategory category
        +Decimal carbs
        +BoundingBox boundingBox
    }

    class BoundingBox {
        +Float x
        +Float y
        +Float width
        +Float height
        +toPixels()
    }

    class MealType {
        <<enumeration>>
        BREAKFAST
        LUNCH
        DINNER
        SNACK
    }

    class FoodCategory {
        <<enumeration>>
        CARBS
        PROTEIN
        VEGETABLE
        SOUP
        OTHER
    }

    class NutritionStandards {
        +DailyTargets dailyTargets
        +MealTargets mealTargets
        +EatingOrder eatingOrder
        +getTargetForNutrient()
    }

    User "1" --> "*" Meal : owns
    User "1" --> "0..1" UserProfile : has
    Meal "1" --> "1" NutritionData : contains
    NutritionData "1" --> "*" FoodItem : includes
    FoodItem "1" --> "1" BoundingBox : locatedAt
    FoodItem --> FoodCategory : categorizedAs
    Meal --> MealType : classifiedAs
```

## 値オブジェクト (Value Objects)

```mermaid
classDiagram
    class NutrientValue {
        <<value object>>
        +Decimal value
        +String unit
        +isWithinRange()
        +format()
    }

    class NutrientRange {
        <<value object>>
        +Decimal min
        +Decimal max
        +String unit
        +String note
        +contains()
    }

    class ImageFile {
        <<value object>>
        +Bytes data
        +String mimeType
        +Integer size
        +validate()
        +compress()
        +removeExif()
    }

    class Coordinate {
        <<value object>>
        +Float x
        +Float y
        +normalize()
        +toPixel()
    }

    NutrientValue --> NutrientRange : comparedWith
```

## 集約とリポジトリ

```mermaid
flowchart TB
    subgraph 食事集約["食事集約 (Meal Aggregate)"]
        MealRoot["Meal<br/>集約ルート"]
        NutritionDataEntity["NutritionData"]
        FoodItemsVO["FoodItems[]<br/>値オブジェクト"]

        MealRoot --> NutritionDataEntity
        NutritionDataEntity --> FoodItemsVO
    end

    subgraph ユーザー集約["ユーザー集約 (User Aggregate)"]
        UserRoot["User<br/>集約ルート<br/>(Supabase Auth)"]
        ProfileEntity["UserProfile"]

        UserRoot --> ProfileEntity
    end

    subgraph リポジトリ["リポジトリ層"]
        MealRepo["MealRepository<br/>(Supabase)"]
        UserRepo["UserRepository<br/>(Supabase Auth)"]
    end

    subgraph 外部サービス["外部サービス"]
        AnalyzerService["NutritionAnalyzer<br/>(Gemini API)"]
        StorageService["ImageStorage<br/>(Supabase Storage)"]
    end

    MealRepo --> 食事集約
    UserRepo --> ユーザー集約
    AnalyzerService -.->|分析結果| NutritionDataEntity
    StorageService -.->|画像URL| MealRoot

    style 食事集約 fill:#e3f2fd
    style ユーザー集約 fill:#fff8e1
    style リポジトリ fill:#e8f5e9
    style 外部サービス fill:#f3e5f5
```

## データフロー

```mermaid
flowchart LR
    subgraph 入力["入力データ"]
        Image["食事画像<br/>(JPEG/PNG)"]
        UserInput["ユーザー入力<br/>・食事タイプ<br/>・日付"]
    end

    subgraph 処理["処理・変換"]
        ImageProcess["画像処理<br/>・EXIF除去<br/>・圧縮"]
        AIAnalysis["AI分析<br/>・食品認識<br/>・栄養推定"]
        DataMapping["データマッピング<br/>・JSON→エンティティ"]
    end

    subgraph 出力["出力データ"]
        NutritionResult["栄養データ<br/>NutritionData"]
        VisualResult["可視化データ<br/>・チャート<br/>・オーバーレイ"]
        StoredData["永続化データ<br/>・meals<br/>・nutrition_data"]
    end

    Image --> ImageProcess
    ImageProcess --> AIAnalysis
    AIAnalysis --> DataMapping
    UserInput --> DataMapping
    DataMapping --> NutritionResult
    NutritionResult --> VisualResult
    NutritionResult --> StoredData
```

## JSONB フィールド構造

### food_items (認識食品リスト)

```mermaid
flowchart TD
    subgraph food_items["food_items: JSONB[]"]
        Item1["食品1"]
        Item2["食品2"]
        ItemN["..."]
    end

    subgraph ItemStructure["FoodItem構造"]
        Name["name: string<br/>例: 'ご飯'"]
        Category["category: string<br/>例: 'carbs'"]
        Carbs["carbs: number<br/>例: 55.0"]
        BBox["bounding_box: object"]
    end

    subgraph BBoxStructure["BoundingBox構造"]
        X["x: float (0-1)<br/>左上X座標"]
        Y["y: float (0-1)<br/>左上Y座標"]
        Width["width: float (0-1)<br/>幅"]
        Height["height: float (0-1)<br/>高さ"]
    end

    Item1 --> ItemStructure
    BBox --> BBoxStructure
```

### eating_order (推奨食べ順)

```json
[
  "野菜・サラダを最初に",
  "たんぱく質（魚・肉）",
  "炭水化物（ご飯）を最後に"
]
```

## 栄養基準値モデル

```mermaid
classDiagram
    class NutritionStandards {
        +String source
        +DailyTargets dailyTargets
        +MealTargets mealTargets
        +EatingOrder eatingOrder
        +Advice advice
        +RiceReference riceReference
        +ProteinReference proteinReference
        +FiberReference fiberReference
    }

    class DailyTargets {
        +NutrientRange calories
        +NutrientRange carbs
        +NutrientRange protein
        +NutrientRange fat
        +NutrientRange fiber
        +NutrientRange salt
    }

    class MealTargets {
        +NutrientRange carbs
        +NutrientRange protein
        +NutrientRange fat
    }

    class EatingOrder {
        +String first
        +String second
        +String third
        +String reason
    }

    NutritionStandards --> DailyTargets
    NutritionStandards --> MealTargets
    NutritionStandards --> EatingOrder
```

## Row Level Security ポリシー

```mermaid
flowchart TD
    subgraph RLSポリシー["Row Level Security"]
        subgraph meals_table["meals テーブル"]
            SELECT_M["SELECT: auth.uid() = user_id"]
            INSERT_M["INSERT: auth.uid() = user_id"]
            UPDATE_M["UPDATE: auth.uid() = user_id"]
            DELETE_M["DELETE: auth.uid() = user_id"]
        end

        subgraph nutrition_data_table["nutrition_data テーブル"]
            SELECT_N["SELECT: meal.user_id = auth.uid()"]
            INSERT_N["INSERT: meal.user_id = auth.uid()"]
            UPDATE_N["UPDATE: meal.user_id = auth.uid()"]
            DELETE_N["DELETE: meal.user_id = auth.uid()"]
        end

        subgraph user_profiles_table["user_profiles テーブル"]
            SELECT_P["SELECT: auth.uid() = user_id"]
            INSERT_P["INSERT: auth.uid() = user_id"]
            UPDATE_P["UPDATE: auth.uid() = user_id"]
        end
    end

    JWT["JWT Token<br/>auth.uid()"] --> RLSポリシー

    style RLSポリシー fill:#ffebee
```

## インデックス構成

| テーブル | インデックス | カラム | 用途 |
|---------|------------|--------|------|
| meals | idx_meals_user_id | user_id | ユーザー別検索 |
| meals | idx_meals_meal_date | meal_date | 日付検索 |
| meals | idx_meals_user_date | user_id, meal_date | 複合検索 |
| nutrition_data | idx_nutrition_data_meal_id | meal_id | 食事との結合 |

## TypeScript 型定義

```typescript
// フロントエンドの型定義 (types/nutrition.ts)

interface NutritionData {
  food_items: string[];
  detected_foods?: DetectedFood[];
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  salt: number;
  advice: string;
  eating_order?: string[];
}

interface DetectedFood {
  name: string;
  category: 'carbs' | 'protein' | 'vegetable' | 'soup' | 'other';
  carbs: number;
  bounding_box?: BoundingBox;
}

interface BoundingBox {
  x: number;      // 0-1 正規化座標
  y: number;
  width: number;
  height: number;
}

interface Meal {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_date: string;
  image_url?: string;
  created_at: string;
  nutrition_data?: NutritionData;
}
```
