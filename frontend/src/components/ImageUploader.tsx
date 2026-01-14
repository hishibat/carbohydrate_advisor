'use client'

import { useState, useCallback } from 'react'

interface Props {
  onUpload: (file: File) => void
  isLoading: boolean
}

export default function ImageUploader({ onUpload, isLoading }: Props) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    onUpload(file)
  }

  return (
    <div className="w-full">
      {/*
        標準的なlabel + input[type="file"]の実装
        - labelのhtmlForとinputのidを紐付け
        - inputは視覚的に隠すがDOMには存在させる(display:noneは使わない)
        - labelをクリックするとinputがトリガーされる(ブラウザ標準の挙動)
      */}
      <label
        htmlFor="meal-image-upload"
        className={`
          block
          border-2 border-dashed rounded-lg p-8
          text-center
          transition-colors
          cursor-pointer
          ${dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/*
          input[type="file"]を視覚的に隠す
          - display:noneやvisibility:hiddenは使わない(一部ブラウザで.click()が動作しない)
          - width/height: 1px, opacity: 0, position: absoluteで「存在するが見えない」状態に
          - overflow: hiddenで1px分の余白も見せない
        */}
        <input
          id="meal-image-upload"
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={isLoading}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0',
          }}
        />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="アップロードされた食事画像"
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-500">
              別の画像をアップロードするにはクリックまたはドラッグ
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl" aria-hidden="true">📷</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                食事の写真をアップロード
              </p>
              <p className="text-sm text-gray-500">
                クリックまたはドラッグ&ドロップ
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-primary-600 font-medium">分析中...</p>
          </div>
        )}
      </label>
    </div>
  )
}
