-- =====================================================
-- 糖質管理アドバイザー - データベーススキーマ
-- Supabase SQL Editor で実行してください
-- =====================================================

-- 1. 食事記録テーブル
CREATE TABLE IF NOT EXISTS meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 栄養データテーブル
CREATE TABLE IF NOT EXISTS nutrition_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    calories DECIMAL(10,2) DEFAULT 0,
    carbs DECIMAL(10,2) DEFAULT 0,
    protein DECIMAL(10,2) DEFAULT 0,
    fat DECIMAL(10,2) DEFAULT 0,
    fiber DECIMAL(10,2) DEFAULT 0,
    salt DECIMAL(10,2) DEFAULT 0,
    food_items JSONB DEFAULT '[]'::jsonb,
    eating_order JSONB DEFAULT '[]'::jsonb,
    advice TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ユーザープロフィールテーブル（オプション）
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR(100),
    target_carbs_per_meal DECIMAL(10,2) DEFAULT 55,
    target_protein_per_meal DECIMAL(10,2) DEFAULT 25,
    target_fat_per_meal DECIMAL(10,2) DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- インデックス
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_meal_date ON meals(meal_date);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_data_meal_id ON nutrition_data(meal_id);

-- =====================================================
-- Row Level Security (RLS) ポリシー
-- =====================================================

-- meals テーブル
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
    ON meals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
    ON meals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
    ON meals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
    ON meals FOR DELETE
    USING (auth.uid() = user_id);

-- nutrition_data テーブル
ALTER TABLE nutrition_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition data"
    ON nutrition_data FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM meals
            WHERE meals.id = nutrition_data.meal_id
            AND meals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own nutrition data"
    ON nutrition_data FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM meals
            WHERE meals.id = nutrition_data.meal_id
            AND meals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own nutrition data"
    ON nutrition_data FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM meals
            WHERE meals.id = nutrition_data.meal_id
            AND meals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own nutrition data"
    ON nutrition_data FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM meals
            WHERE meals.id = nutrition_data.meal_id
            AND meals.user_id = auth.uid()
        )
    );

-- user_profiles テーブル
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- Storage バケット設定（Supabase Dashboard で設定）
-- =====================================================
-- 1. Storage > New bucket で "meal-images" を作成
-- 2. Public bucket: OFF（認証必要）
-- 3. Allowed MIME types: image/jpeg, image/png, image/webp
-- 4. Max file size: 10MB

-- Storage ポリシー（SQL Editor で実行）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', false);

-- CREATE POLICY "Users can upload own meal images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'meal-images'
--     AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Users can view own meal images"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'meal-images'
--     AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Users can delete own meal images"
-- ON storage.objects FOR DELETE
-- USING (
--     bucket_id = 'meal-images'
--     AND auth.uid()::text = (storage.foldername(name))[1]
-- );
