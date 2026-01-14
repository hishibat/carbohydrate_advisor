'use client'

import { NutritionData, NutritionStandards } from '@/types/nutrition'
import NutritionChart from './NutritionChart'

interface Props {
  nutrition: NutritionData
  standards: NutritionStandards
}

export default function NutritionResult({ nutrition, standards }: Props) {
  const mealTargets = standards.meal_targets

  // 基準値を取得
  const fiberMax = mealTargets.fiber?.max || 8
  const saltMax = mealTargets.salt?.max || 2
  const vegetablesMax = mealTargets.vegetables?.max || 150

  const getStatusColor = (value: number, max: number, isLowerBetter = false) => {
    const ratio = value / max
    if (isLowerBetter) {
      if (ratio <= 0.8) return 'text-green-600 bg-green-50'
      if (ratio <= 1.0) return 'text-yellow-600 bg-yellow-50'
      return 'text-red-600 bg-red-50'
    } else {
      if (ratio >= 0.8 && ratio <= 1.2) return 'text-green-600 bg-green-50'
      if (ratio >= 0.5) return 'text-yellow-600 bg-yellow-50'
      return 'text-red-600 bg-red-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* 認識した食品 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">認識した食品</h3>
        <div className="flex flex-wrap gap-2">
          {nutrition.food_items.length > 0 ? (
            nutrition.food_items.map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-gray-500">食品を認識できませんでした</span>
          )}
        </div>
      </div>

      {/* 栄養素グラフ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          栄養バランス（医師推奨基準値との比較）
        </h3>
        <NutritionChart nutrition={nutrition} mealTargets={mealTargets} />
      </div>

      {/* 栄養素詳細 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">栄養素詳細</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <NutrientCard
            label="カロリー"
            value={nutrition.calories}
            unit="kcal"
            target={600}
            statusClass={getStatusColor(nutrition.calories, 600)}
          />
          <NutrientCard
            label="糖質（主食）"
            value={nutrition.carbs}
            unit="g"
            target={mealTargets.carbs.max}
            statusClass={getStatusColor(nutrition.carbs, mealTargets.carbs.max, true)}
            highlight
            visualGuide={mealTargets.carbs.visual_guide}
          />
          <NutrientCard
            label="たんぱく質（主菜）"
            value={nutrition.protein}
            unit="g"
            target={mealTargets.protein.max}
            statusClass={getStatusColor(nutrition.protein, mealTargets.protein.max)}
            visualGuide={mealTargets.protein.visual_guide}
          />
          <NutrientCard
            label="脂質"
            value={nutrition.fat}
            unit="g"
            target={mealTargets.fat.max}
            statusClass={getStatusColor(nutrition.fat, mealTargets.fat.max, true)}
          />
          <NutrientCard
            label="食物繊維"
            value={nutrition.fiber}
            unit="g"
            target={fiberMax}
            statusClass={getStatusColor(nutrition.fiber, fiberMax)}
          />
          <NutrientCard
            label="塩分"
            value={nutrition.salt}
            unit="g"
            target={saltMax}
            statusClass={getStatusColor(nutrition.salt, saltMax, true)}
          />
        </div>
      </div>

      {/* 食べる順番の推奨（AIからの推奨） */}
      {nutrition.eating_order.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            この食事での推奨される食べる順番
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            血糖値スパイクを防ぐため、以下の順番で食べることをお勧めします
          </p>
          <ol className="space-y-2">
            {nutrition.eating_order.map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 医師推奨の食べ順（標準） */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {standards.eating_order.title}
        </h3>
        <div className="space-y-3">
          {standards.eating_order.steps.map((step) => (
            <div key={step.order} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-sm">
                {step.order}
              </span>
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-sm">{step.category}</div>
                <div className="text-xs text-gray-500">{step.examples}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* アドバイス */}
      <div className="bg-primary-50 rounded-lg shadow p-6 border border-primary-200">
        <h3 className="text-lg font-semibold text-primary-800 mb-3">
          この食事へのアドバイス
        </h3>
        <p className="text-primary-700 whitespace-pre-wrap">{nutrition.advice}</p>
      </div>

      {/* 追加のポイント */}
      <div className="bg-gray-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          食事のポイント（医師推奨）
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-amber-700 mb-2">炭水化物のコツ</h4>
            <ul className="space-y-1 text-gray-600">
              {standards.advice.carbs_tips.slice(0, 2).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-500 text-xs">•</span>
                  <span className="text-xs">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-700 mb-2">タイミングのコツ</h4>
            <ul className="space-y-1 text-gray-600">
              {standards.advice.timing_tips.slice(0, 2).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-500 text-xs">•</span>
                  <span className="text-xs">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NutrientCardProps {
  label: string
  value: number
  unit: string
  target: number
  statusClass: string
  highlight?: boolean
  visualGuide?: string
}

function NutrientCard({ label, value, unit, target, statusClass, highlight, visualGuide }: NutrientCardProps) {
  return (
    <div
      className={`p-4 rounded-lg ${statusClass} ${
        highlight ? 'ring-2 ring-primary-500' : ''
      }`}
    >
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold">
        {value.toFixed(1)}
        <span className="text-sm font-normal ml-1">{unit}</span>
      </div>
      <div className="text-xs opacity-70">
        目安: {target}{unit}
        {visualGuide && (
          <span className="block mt-1">({visualGuide})</span>
        )}
      </div>
    </div>
  )
}
