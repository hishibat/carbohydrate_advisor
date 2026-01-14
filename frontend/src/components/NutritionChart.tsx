'use client'

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { NutritionData, MealTarget } from '@/types/nutrition'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

interface Props {
  nutrition: NutritionData
  mealTargets: {
    carbs: MealTarget;
    protein: MealTarget;
    fat: MealTarget;
    fiber?: MealTarget;
    salt?: MealTarget;
  }
}

export default function NutritionChart({ nutrition, mealTargets }: Props) {
  // 基準値に対する割合を計算（100%を超える場合もあり）
  const calculatePercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 150) // 最大150%まで表示
  }

  // 医師推奨の基準値（1食あたり）
  const fiberMax = mealTargets.fiber?.max || 8
  const saltMax = mealTargets.salt?.max || 2
  const caloriesMax = 600 // 1食あたり約600kcal目標

  const data = {
    labels: ['糖質', 'たんぱく質', '脂質', '食物繊維', '塩分'],
    datasets: [
      {
        label: '基準値 (100%)',
        data: [100, 100, 100, 100, 100],
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.5)',
        borderWidth: 2,
        borderDash: [5, 5],
      },
      {
        label: '今回の食事',
        data: [
          calculatePercentage(nutrition.carbs, mealTargets.carbs.max),
          calculatePercentage(nutrition.protein, mealTargets.protein.max),
          calculatePercentage(nutrition.fat, mealTargets.fat.max),
          calculatePercentage(nutrition.fiber, fiberMax),
          calculatePercentage(nutrition.salt, saltMax),
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 150,
        ticks: {
          stepSize: 50,
          callback: (value: number | string) => `${value}%`,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label?: string }; raw: unknown }) => {
            return `${context.dataset.label}: ${Math.round(context.raw as number)}%`
          },
        },
      },
    },
  }

  // 基準値超過の警告表示
  const warnings: string[] = []
  if (nutrition.carbs > mealTargets.carbs.max) {
    warnings.push(`糖質が目安(${mealTargets.carbs.max}g)を超えています`)
  }
  if (nutrition.salt > saltMax) {
    warnings.push(`塩分が目安(${saltMax}g)を超えています`)
  }
  if (nutrition.fat > mealTargets.fat.max) {
    warnings.push(`脂質が目安(${mealTargets.fat.max}g)を超えています`)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Radar data={data} options={options} />

      {/* 警告表示 */}
      {warnings.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-700 mb-1">注意</p>
          <ul className="text-xs text-amber-600 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 凡例の説明 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>100% = 1食あたりの目安量</p>
        <p>基準値: 糖質{mealTargets.carbs.max}g / たんぱく質{mealTargets.protein.max}g / 脂質{mealTargets.fat.max}g / 食物繊維{fiberMax}g / 塩分{saltMax}g</p>
      </div>
    </div>
  )
}
