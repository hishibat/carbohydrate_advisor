import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 型定義
export interface Meal {
  id: string
  user_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  meal_date: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface NutritionDataRecord {
  id: string
  meal_id: string
  calories: number
  carbs: number
  protein: number
  fat: number
  fiber: number
  salt: number
  food_items: string[]
  eating_order: string[]
  advice: string | null
  created_at: string
}

export interface MealWithNutrition extends Meal {
  nutrition_data: NutritionDataRecord[]
}

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  target_carbs_per_meal: number
  target_protein_per_meal: number
  target_fat_per_meal: number
  created_at: string
  updated_at: string
}
