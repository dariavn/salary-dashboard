import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/context/LangContext'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Salary Research',
  description: 'IT salary benchmarks by role, location and seniority',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
