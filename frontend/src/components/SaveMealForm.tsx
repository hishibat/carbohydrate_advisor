'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { saveMeal, MealType, MEAL_TYPE_LABELS } from '@/lib/meals'
import { NutritionData } from '@/types/nutrition'

interface Props {
  nutrition: NutritionData
  imageFile: File | null
  onSaved: () => void
}

export default function SaveMealForm({ nutrition, imageFile, onSaved }: Props) {
  const { user } = useAuth()
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [mealDate, setMealDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!user) {
      setError('ログインが必要です')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { meal, error: saveError } = await saveMeal(
        user.id,
        mealType,
        mealDate,
        nutrition,
        imageFile || undefined
      )

      if (saveError) {
        throw saveError
      }

      if (meal) {
        onSaved()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        食事記録を保存
      </h3>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* 食事タイプ選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            食事タイプ
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mealType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* 日付選択 */}
        <div>
          <label htmlFor="mealDate" className="block text-sm font-medium text-gray-700 mb-2">
            日付
          </label>
          <input
            id="mealDate"
            type="date"
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 保存する内容のプレビュー */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 mb-2">保存する内容:</p>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>カロリー: {nutrition.calories} kcal</li>
          <li>糖質: {nutrition.carbs}g</li>
          <li>たんぱく質: {nutrition.protein}g</li>
          <li>脂質: {nutrition.fat}g</li>
          <li>食物繊維: {nutrition.fiber}g</li>
          <li>塩分: {nutrition.salt}g</li>
          {nutrition.food_items && nutrition.food_items.length > 0 && (
            <li>食品: {nutrition.food_items.join(', ')}</li>
          )}
        </ul>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? '保存中...' : '食事記録を保存'}
      </button>
    </div>
  )
}
