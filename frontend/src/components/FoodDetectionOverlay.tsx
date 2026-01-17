'use client'

import { useRef, useState, useCallback } from 'react'
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
  const imgRef = useRef<HTMLImageElement>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  // 画像読み込み完了時に実際の描画サイズを取得
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    // clientWidth/clientHeight で実際にブラウザに描画された画像のサイズを取得
    // getBoundingClientRect() より信頼性が高く、スクロールやズームの影響を受けない
    const width = img.clientWidth
    const height = img.clientHeight
    console.log(`[FoodDetectionOverlay] Image loaded: clientWidth=${width}, clientHeight=${height}, naturalWidth=${img.naturalWidth}, naturalHeight=${img.naturalHeight}`)
    setImageSize({ width, height })
  }, [])

  // バウンディングボックス付きの食品のみフィルタリング
  const foodsWithBoxes = detectedFoods.filter(food => food.bounding_box)

  return (
    <div className="space-y-4">
      {/* 画像とオーバーレイのコンテナ */}
      <div className="relative inline-block w-full">
        {/* 食事画像 */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="分析した食事"
          className="w-full h-auto rounded-lg shadow-lg"
          onLoad={handleImageLoad}
        />

        {/* オーバーレイコンテナ: 画像と完全に同じサイズで重ねる */}
        {imageSize.width > 0 && (
          <div
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${imageSize.width}px`,
              height: `${imageSize.height}px`,
            }}
          >
            {/* バウンディングボックス */}
            {foodsWithBoxes.map((food, index) => {
              const box = food.bounding_box!
              const colors = categoryColors[food.category] || categoryColors.other

              // 正規化座標（0-1）をピクセル値に変換
              const left = box.x * imageSize.width
              const top = box.y * imageSize.height
              const width = box.width * imageSize.width
              const height = box.height * imageSize.height

              // デバッグログ: 座標変換を確認
              console.log(`[FoodDetectionOverlay] ${food.name}: normalized(x=${box.x.toFixed(3)}, y=${box.y.toFixed(3)}, w=${box.width.toFixed(3)}, h=${box.height.toFixed(3)}) -> pixels(left=${left.toFixed(1)}, top=${top.toFixed(1)}, width=${width.toFixed(1)}, height=${height.toFixed(1)})`)

              // ラベル位置: 上端に近い場合は内側に表示
              const labelOnTop = box.y > 0.08

              return (
                <div
                  key={index}
                  className={`absolute border-2 ${colors.border}`}
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                  }}
                >
                  {/* ラベル */}
                  <div
                    className={`absolute ${labelOnTop ? '-top-6' : 'top-0'} left-0 px-2 py-0.5 ${colors.bg} ${colors.text} text-xs font-medium whitespace-nowrap`}
                    style={{
                      fontSize: '10px',
                      borderRadius: labelOnTop ? '4px 4px 0 0' : '0 0 4px 4px'
                    }}
                  >
                    {food.name}: ~{food.carbs.toFixed(1)}g
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
