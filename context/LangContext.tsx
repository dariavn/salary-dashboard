'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Lang } from '@/lib/i18n'

type Theme = 'light' | 'dark'

interface AppCtx {
  lang: Lang
  toggleLang: () => void
  theme: Theme
  toggleTheme: () => void
}

const Ctx = createContext<AppCtx>({ lang: 'en', toggleLang: () => {}, theme: 'light', toggleTheme: () => {} })

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const savedLang = localStorage.getItem('sr_lang') as Lang | null
    const savedTheme = localStorage.getItem('sr_theme') as Theme | null
    if (savedLang === 'en' || savedLang === 'ru') setLang(savedLang)
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sr_theme', theme)
  }, [theme])

  function toggleLang() {
    setLang(l => {
      const next = l === 'en' ? 'ru' : 'en'
      localStorage.setItem('sr_lang', next)
      return next
    })
  }

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  return <Ctx.Provider value={{ lang, toggleLang, theme, toggleTheme }}>{children}</Ctx.Provider>
}

// Legacy export for backwards compat
export const LangProvider = AppProvider

export function useLang() {
  return useContext(Ctx)
}
