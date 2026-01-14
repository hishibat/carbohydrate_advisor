'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from './AuthForm'

export default function Header() {
  const { user, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      <header className="bg-primary-600 text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-bold hover:text-primary-100">
              糖質管理アドバイザー
            </Link>
            <p className="text-primary-100 text-sm">食事画像から栄養素を分析</p>
          </div>

          <nav className="flex items-center gap-4">
            {loading ? (
              <span className="text-sm text-primary-200">読み込み中...</span>
            ) : user ? (
              <>
                <Link
                  href="/history"
                  className="text-sm hover:text-primary-200 transition-colors"
                >
                  食事履歴
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-primary-200">
                    {user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1 text-sm bg-primary-700 hover:bg-primary-800 rounded transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 text-sm bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
              >
                ログイン / 登録
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 認証モーダル */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              閉じる
            </button>
            <AuthForm onSuccess={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}
    </>
  )
}
