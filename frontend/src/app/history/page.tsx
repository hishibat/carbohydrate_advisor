'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getMeals, deleteMeal, MealType, MEAL_TYPE_LABELS, getNutritionSummary } from '@/lib/meals'
import { MealWithNutrition } from '@/lib/supabase'

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [meals, setMeals] = useState<MealWithNutrition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedMealType, setSelectedMealType] = useState<MealType | ''>('')
  const [summary, setSummary] = useState<{
    totalCalories: number
    totalCarbs: number
    totalProtein: number
    totalFat: number
    mealCount: number
    avgCalories: number
    avgCarbs: number
  } | null>(null)

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // 食事履歴を取得
  useEffect(() => {
    if (!user) return

    const fetchMeals = async () => {
      setLoading(true)
      setError(null)

      try {
        const options: {
          startDate?: string
          endDate?: string
          mealType?: MealType
          limit: number
        } = { limit: 50 }

        if (selectedDate) {
          options.startDate = selectedDate
          options.endDate = selectedDate
        }
        if (selectedMealType) {
          options.mealType = selectedMealType
        }

        const { meals: fetchedMeals, error: fetchError } = await getMeals(user.id, options)

        if (fetchError) {
          throw fetchError
        }

        setMeals(fetchedMeals)

        // サマリーを取得（過去7日間）
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)

        const { summary: fetchedSummary } = await getNutritionSummary(
          user.id,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        setSummary(fetchedSummary)
      } catch (err) {
        setError(err instanceof Error ? err.message : '履歴の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchMeals()
  }, [user, selectedDate, selectedMealType])

  const handleDelete = async (mealId: string) => {
    if (!confirm('この食事記録を削除しますか？')) return

    const { error: deleteError } = await deleteMeal(mealId)
    if (deleteError) {
      alert('削除に失敗しました: ' + deleteError.message)
      return
    }

    setMeals(meals.filter(m => m.id !== mealId))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">食事履歴</h1>

      {/* 週間サマリー */}
      {summary && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            過去7日間のサマリー
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">記録した食事</p>
              <p className="text-2xl font-bold text-gray-800">{summary.mealCount}食</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-700">平均糖質</p>
              <p className="text-2xl font-bold text-amber-600">{summary.avgCarbs.toFixed(1)}g</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">総カロリー</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalCalories.toFixed(0)}kcal</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">総たんぱく質</p>
              <p className="text-2xl font-bold text-green-600">{summary.totalProtein.toFixed(1)}g</p>
            </div>
          </div>
        </section>
      )}

      {/* フィルター */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">絞り込み</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 mb-2">
              日付
            </label>
            <input
              id="filterDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              食事タイプ
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMealType('')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMealType === ''
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedMealType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMealType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {MEAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
        {(selectedDate || selectedMealType) && (
          <button
            onClick={() => {
              setSelectedDate('')
              setSelectedMealType('')
            }}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            フィルターをクリア
          </button>
        )}
      </section>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* 食事一覧 */}
      <section className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : meals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">食事記録がありません</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-primary-600 hover:text-primary-700 underline"
            >
              食事を分析する
            </button>
          </div>
        ) : (
          meals.map((meal) => {
            const nutrition = meal.nutrition_data?.[0]
            return (
              <div key={meal.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        meal.meal_type === 'breakfast' ? 'bg-yellow-100 text-yellow-800' :
                        meal.meal_type === 'lunch' ? 'bg-orange-100 text-orange-800' :
                        meal.meal_type === 'dinner' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {MEAL_TYPE_LABELS[meal.meal_type as MealType]}
                      </span>
                      <p className="mt-2 text-gray-600">{formatDate(meal.meal_date)}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(meal.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>

                  {nutrition && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">カロリー</p>
                        <p className="text-lg font-semibold text-gray-800">{nutrition.calories}</p>
                        <p className="text-xs text-gray-400">kcal</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">糖質</p>
                        <p className="text-lg font-semibold text-amber-600">{nutrition.carbs}</p>
                        <p className="text-xs text-gray-400">g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">たんぱく質</p>
                        <p className="text-lg font-semibold text-blue-600">{nutrition.protein}</p>
                        <p className="text-xs text-gray-400">g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">脂質</p>
                        <p className="text-lg font-semibold text-orange-600">{nutrition.fat}</p>
                        <p className="text-xs text-gray-400">g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">食物繊維</p>
                        <p className="text-lg font-semibold text-green-600">{nutrition.fiber}</p>
                        <p className="text-xs text-gray-400">g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">塩分</p>
                        <p className="text-lg font-semibold text-gray-600">{nutrition.salt}</p>
                        <p className="text-xs text-gray-400">g</p>
                      </div>
                    </div>
                  )}

                  {nutrition?.food_items && nutrition.food_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">認識した食品:</span>{' '}
                        {nutrition.food_items.join(', ')}
                      </p>
                    </div>
                  )}

                  {meal.image_url && (
                    <div className="mt-4">
                      <img
                        src={meal.image_url}
                        alt="食事画像"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
