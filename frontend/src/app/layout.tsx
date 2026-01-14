import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: '糖質管理アドバイザー',
  description: '食事画像から栄養素を分析し、糖質制限のアドバイスを提供します',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-gray-100 py-4 mt-8 border-t">
            <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
              食事の栄養分析は推定値です。正確な数値は栄養士にご相談ください。
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
