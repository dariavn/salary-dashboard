'use client'
import { useLang } from '@/context/LangContext'

export default function LanguageToggle() {
  const { lang, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
      style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
    >
      {lang === 'en' ? 'RU' : 'EN'}
    </button>
  )
}
