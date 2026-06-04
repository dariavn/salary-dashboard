'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Lang } from '@/lib/i18n'

interface LangCtx {
  lang: Lang
  toggle: () => void
}

const Ctx = createContext<LangCtx>({ lang: 'en', toggle: () => {} })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved === 'en' || saved === 'ru') setLang(saved)
  }, [])

  function toggle() {
    setLang((l) => {
      const next = l === 'en' ? 'ru' : 'en'
      localStorage.setItem('lang', next)
      return next
    })
  }

  return <Ctx.Provider value={{ lang, toggle }}>{children}</Ctx.Provider>
}

export function useLang() {
  return useContext(Ctx)
}
