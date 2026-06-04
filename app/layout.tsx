import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/LangContext'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--loaded-plex-sans',
})
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--loaded-plex-mono',
})

export const metadata: Metadata = {
  title: 'Salary Research — PM compensation benchmarks',
  description: 'IT salary benchmarks by role, location and seniority',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable} min-h-screen`}
        style={{ fontFamily: 'var(--font-ui)' }}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
