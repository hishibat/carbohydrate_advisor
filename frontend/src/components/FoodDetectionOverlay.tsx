'use client'

import { useRef, useState, useEffect } from 'react'
import { DetectedFood } from '@/types/nutrition'

interface Props {
  imageUrl: string
  detectedFoods: DetectedFood[]
}

// カテゴリ別の色設定
const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  carbs: {
    border: 'border-orange-500',
    bg: 'bg-orange-500',
    text: 'text-white'
  },
  protein: {
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    text: 'text-white'
  },
  vegetable: {
    border: 'border-green-500',
    bg: 'bg-green-500',
    text: 'text-white'
  },
  soup: {
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    text: 'text-white'
  },
  other: {
    border: 'border-gray-500',
    bg: 'bg-gray-500',
    text: 'text-white'
  }
}

// カテゴリの日本語名
const categoryLabels: Record<string, string> = {
  carbs: '主食',
  protein: '主菜',
  vegetable: '副菜',
  soup: '汁物',
  other: 'その他'
}

export default function FoodDetectionOverlay({ imageUrl, detectedFoods }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  // 画像読み込み後にコンテナサイズを取得
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setImageDimensions({ width: rect.width, height: rect.height })
      }
    }

    // ResizeObserverでコンテナサイズの変更を監視
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // バウンディングボックス付きの食品のみフィルタリング
  const foodsWithBoxes = detectedFoods.filter(food => food.bounding_box)

  return (
    <div className="space-y-4">
      {/* 画像とオーバーレイ */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden shadow-lg"
      >
        {/* 食事画像 */}
        <img
          src={imageUrl}
          alt="分析した食事"
          className="w-full h-auto"
          onLoad={() => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect()
              setImageDimensions({ width: rect.width, height: rect.height })
            }
          }}
        />

        {/* バウンディングボックスオーバーレイ */}
        {imageDimensions.width > 0 && foodsWithBoxes.map((food, index) => {
          const box = food.bounding_box!
          const colors = categoryColors[food.category] || categoryColors.other

          // 正規化座標をピクセル座標に変換
          const left = box.x * 100
          const top = box.y * 100
          const width = box.width * 100
          const height = box.height * 100

          return (
            <div
              key={index}
              className={`absolute border-2 ${colors.border} pointer-events-none`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
              }}
            >
              {/* ラベル */}
              <div
                className={`absolute -top-6 left-0 px-2 py-0.5 ${colors.bg} ${colors.text} text-xs font-medium rounded-t whitespace-nowrap`}
                style={{ fontSize: '10px' }}
              >
                {food.name}: ~{food.carbs.toFixed(1)}g
              </div>
            </div>
          )
        })}
      </div>

      {/* 凡例 */}
      {foodsWithBoxes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">検出された食品</h4>
          <div className="flex flex-wrap gap-2">
            {foodsWithBoxes.map((food, index) => {
              const colors = categoryColors[food.category] || categoryColors.other
              return (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${colors.bg} ${colors.text}`}
                >
                  <span className="font-medium">{food.name}</span>
                  <span className="opacity-80">({categoryLabels[food.category]})</span>
                  <span>~{food.carbs.toFixed(1)}g</span>
                </div>
              )
            })}
          </div>

          {/* カテゴリ凡例 */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-orange-500 rounded"></span>
                主食（糖質）
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-500 rounded"></span>
                主菜（たんぱく質）
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded"></span>
                副菜（野菜）
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-purple-500 rounded"></span>
                汁物
              </span>
            </div>
          </div>
        </div>
      )}

      {/* バウンディングボックスがない場合 */}
      {foodsWithBoxes.length === 0 && detectedFoods.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
          食品の位置情報は取得できませんでしたが、栄養分析は完了しています。
        </div>
      )}
    </div>
  )
}
