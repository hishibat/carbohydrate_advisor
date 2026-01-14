import { createClient, Meal, NutritionDataRecord, MealWithNutrition } from './supabase'
import { NutritionData } from '@/types/nutrition'

const supabase = createClient()

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食',
}

/**
 * 食事記録を保存する
 */
export async function saveMeal(
  userId: string,
  mealType: MealType,
  mealDate: string,
  nutrition: NutritionData,
  imageFile?: File
): Promise<{ meal: Meal | null; error: Error | null }> {
  try {
    let imageUrl: string | null = null

    // 画像をアップロード
    if (imageFile) {
      const fileName = `${userId}/${Date.now()}-${imageFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, imageFile)

      if (uploadError) {
        console.error('Image upload error:', uploadError)
      } else if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('meal-images')
          .getPublicUrl(uploadData.path)
        imageUrl = urlData.publicUrl
      }
    }

    // 食事記録を作成
    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        meal_type: mealType,
        meal_date: mealDate,
        image_url: imageUrl,
      })
      .select()
      .single()

    if (mealError) {
      throw mealError
    }

    // 栄養データを保存
    const { error: nutritionError } = await supabase
      .from('nutrition_data')
      .insert({
        meal_id: mealData.id,
        calories: nutrition.calories,
        carbs: nutrition.carbs,
        protein: nutrition.protein,
        fat: nutrition.fat,
        fiber: nutrition.fiber,
        salt: nutrition.salt,
        food_items: nutrition.food_items,
        eating_order: nutrition.eating_order,
        advice: nutrition.advice,
      })

    if (nutritionError) {
      throw nutritionError
    }

    return { meal: mealData, error: null }
  } catch (error) {
    return { meal: null, error: error as Error }
  }
}

/**
 * ユーザーの食事記録を取得する
 */
export async function getMeals(
  userId: string,
  options?: {
    startDate?: string
    endDate?: string
    mealType?: MealType
    limit?: number
    offset?: number
  }
): Promise<{ meals: MealWithNutrition[]; error: Error | null }> {
  try {
    let query = supabase
      .from('meals')
      .select(`
        *,
        nutrition_data (*)
      `)
      .eq('user_id', userId)
      .order('meal_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (options?.startDate) {
      query = query.gte('meal_date', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('meal_date', options.endDate)
    }
    if (options?.mealType) {
      query = query.eq('meal_type', options.mealType)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return { meals: data as MealWithNutrition[], error: null }
  } catch (error) {
    return { meals: [], error: error as Error }
  }
}

/**
 * 特定の日付の食事記録を取得する
 */
export async function getMealsByDate(
  userId: string,
  date: string
): Promise<{ meals: MealWithNutrition[]; error: Error | null }> {
  return getMeals(userId, { startDate: date, endDate: date })
}

/**
 * 食事記録を削除する
 */
export async function deleteMeal(mealId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * 日付範囲の栄養サマリーを取得する
 */
export async function getNutritionSummary(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{
  summary: {
    totalCalories: number
    totalCarbs: number
    totalProtein: number
    totalFat: number
    totalFiber: number
    totalSalt: number
    mealCount: number
    avgCalories: number
    avgCarbs: number
    avgProtein: number
    avgFat: number
  } | null
  error: Error | null
}> {
  try {
    const { meals, error } = await getMeals(userId, { startDate, endDate })

    if (error) {
      throw error
    }

    if (meals.length === 0) {
      return {
        summary: null,
        error: null,
      }
    }

    let totalCalories = 0
    let totalCarbs = 0
    let totalProtein = 0
    let totalFat = 0
    let totalFiber = 0
    let totalSalt = 0

    for (const meal of meals) {
      if (meal.nutrition_data && meal.nutrition_data.length > 0) {
        const nutrition = meal.nutrition_data[0]
        totalCalories += nutrition.calories
        totalCarbs += nutrition.carbs
        totalProtein += nutrition.protein
        totalFat += nutrition.fat
        totalFiber += nutrition.fiber
        totalSalt += nutrition.salt
      }
    }

    const mealCount = meals.length

    return {
      summary: {
        totalCalories,
        totalCarbs,
        totalProtein,
        totalFat,
        totalFiber,
        totalSalt,
        mealCount,
        avgCalories: totalCalories / mealCount,
        avgCarbs: totalCarbs / mealCount,
        avgProtein: totalProtein / mealCount,
        avgFat: totalFat / mealCount,
      },
      error: null,
    }
  } catch (error) {
    return { summary: null, error: error as Error }
  }
}
