'use client'

import { useState, useEffect } from 'react'
import ImageUploader from '@/components/ImageUploader'
import NutritionResult from '@/components/NutritionResult'
import SaveMealForm from '@/components/SaveMealForm'
import { NutritionData, NutritionStandards } from '@/types/nutrition'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nutrition, setNutrition] = useState<NutritionData | null>(null)
  const [standards, setStandards] = useState<NutritionStandards | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [saved, setSaved] = useState(false)

  // 基準値を取得
  useEffect(() => {
    fetch(`${API_URL}/api/standards`)
      .then((res) => res.json())
      .then((data) => setStandards(data))
      .catch((err) => console.error('基準値の取得に失敗:', err))
  }, [])

  const handleUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)
    setSaved(false)
    setUploadedFile(file)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '分析に失敗しました')
      }

      const data: NutritionData = await response.json()
      setNutrition(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
      setNutrition(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaved = () => {
    setSaved(true)
  }

  const handleNewAnalysis = () => {
    setNutrition(null)
    setUploadedFile(null)
    setSaved(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 説明セクション */}
      <section className="text-center">
        <p className="text-gray-600">
          食事の写真をアップロードすると、AIが栄養素を分析し、
          <br />
          医師監修の基準値に基づいたアドバイスを提供します。
        </p>
        {standards?.source && (
          <p className="text-xs text-gray-400 mt-2">
            基準値出典: {standards.source}
          </p>
        )}
        {!user && (
          <p className="text-sm text-amber-600 mt-2">
            ログインすると食事記録を保存できます
          </p>
        )}
      </section>

      {/* アップロードセクション */}
      {!nutrition && (
        <section>
          <ImageUploader onUpload={handleUpload} isLoading={isLoading} />
        </section>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">エラー</p>
          <p>{error}</p>
        </div>
      )}

      {/* 結果表示 */}
      {nutrition && standards && (
        <>
          {/* 保存フォーム（ログイン時のみ） */}
          {user && !saved && (
            <SaveMealForm
              nutrition={nutrition}
              imageFile={uploadedFile}
              onSaved={handleSaved}
            />
          )}

          {/* 保存完了メッセージ */}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-medium">食事記録を保存しました</p>
              <button
                onClick={handleNewAnalysis}
                className="mt-2 text-sm text-green-600 hover:text-green-700 underline"
              >
                新しい食事を分析する
              </button>
            </div>
          )}

          {/* 新しい分析ボタン */}
          {!saved && (
            <div className="text-center">
              <button
                onClick={handleNewAnalysis}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                別の食事を分析する
              </button>
            </div>
          )}

          <section>
            <NutritionResult nutrition={nutrition} standards={standards} />
          </section>
        </>
      )}

      {/* 基準値の参考情報（分析前に表示） */}
      {standards && !nutrition && (
        <div className="space-y-6">
          {/* 1食あたりの目安 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              1食あたりの栄養摂取目安
            </h2>
            <p className="text-sm text-gray-500 mb-4">{standards.meal_targets.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* 主食（糖質） */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-sm text-amber-700 font-medium">主食（糖質）</div>
                <div className="text-2xl font-bold text-amber-600">
                  {standards.meal_targets.carbs.min}-{standards.meal_targets.carbs.max}g
                </div>
                {standards.meal_targets.carbs.visual_guide && (
                  <div className="text-xs text-amber-600 mt-1">
                    目安: {standards.meal_targets.carbs.visual_guide}
                  </div>
                )}
              </div>

              {/* 主菜（たんぱく質） */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-700 font-medium">主菜（たんぱく質）</div>
                <div className="text-2xl font-bold text-blue-600">
                  {standards.meal_targets.protein.min}-{standards.meal_targets.protein.max}g
                </div>
                {standards.meal_targets.protein.visual_guide && (
                  <div className="text-xs text-blue-600 mt-1">
                    目安: {standards.meal_targets.protein.visual_guide}
                  </div>
                )}
              </div>

              {/* 副菜（野菜） */}
              {standards.meal_targets.vegetables && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700 font-medium">副菜（野菜）</div>
                  <div className="text-2xl font-bold text-green-600">
                    {standards.meal_targets.vegetables.min}-{standards.meal_targets.vegetables.max}g
                  </div>
                  {standards.meal_targets.vegetables.note && (
                    <div className="text-xs text-green-600 mt-1">
                      {standards.meal_targets.vegetables.note}
                    </div>
                  )}
                </div>
              )}

              {/* 脂質 */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-sm text-orange-700 font-medium">脂質</div>
                <div className="text-2xl font-bold text-orange-600">
                  {standards.meal_targets.fat.min}-{standards.meal_targets.fat.max}g
                </div>
              </div>

              {/* 食物繊維 */}
              {standards.meal_targets.fiber && (
                <div className="p-4 bg-lime-50 rounded-lg border border-lime-200">
                  <div className="text-sm text-lime-700 font-medium">食物繊維</div>
                  <div className="text-2xl font-bold text-lime-600">
                    {standards.meal_targets.fiber.min}-{standards.meal_targets.fiber.max}g
                  </div>
                </div>
              )}

              {/* 塩分 */}
              {standards.meal_targets.salt && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-700 font-medium">塩分</div>
                  <div className="text-2xl font-bold text-gray-600">
                    {standards.meal_targets.salt.max}g以下
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 食べる順番（ベジファースト） */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {standards.eating_order.title}
            </h2>
            <div className="space-y-4">
              {standards.eating_order.steps.map((step) => (
                <div key={step.order} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-lg">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{step.category}</div>
                    <div className="text-sm text-gray-500">{step.examples}</div>
                    <div className="text-xs text-primary-600 mt-1">{step.effect}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* アドバイス */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              食事のポイント
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* 炭水化物のコツ */}
              <div>
                <h3 className="font-medium text-amber-700 mb-2">炭水化物を摂る際のポイント</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {standards.advice.carbs_tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* たんぱく質のコツ */}
              <div>
                <h3 className="font-medium text-blue-700 mb-2">たんぱく質を摂る際のポイント</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {standards.advice.protein_tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 食事のタイミング */}
              <div>
                <h3 className="font-medium text-purple-700 mb-2">食事のタイミング</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {standards.advice.timing_tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 一般的なコツ */}
              <div>
                <h3 className="font-medium text-green-700 mb-2">その他のポイント</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {standards.advice.general_tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ご飯の量の参考 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {standards.rice_reference.title}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-600">料理名</th>
                    <th className="text-right py-2 text-gray-600">ご飯量</th>
                    <th className="text-right py-2 text-gray-600">糖質</th>
                    <th className="text-right py-2 text-gray-600">おにぎり換算</th>
                  </tr>
                </thead>
                <tbody>
                  {standards.rice_reference.items.map((item, index) => (
                    <tr key={index} className={`border-b ${item.name === '推奨（握りこぶし）' ? 'bg-primary-50 font-medium' : ''}`}>
                      <td className="py-2">{item.name}</td>
                      <td className="text-right py-2">{item.rice_g}g</td>
                      <td className="text-right py-2">{item.carbs_g}g</td>
                      <td className="text-right py-2">{item.onigiri || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
