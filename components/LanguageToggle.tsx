'use client'
import { useLang } from '@/context/LangContext'

export default function LanguageToggle() {
  const { lang, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-100 transition-colors"
    >
      {lang === 'en' ? 'RU' : 'EN'}
    </button>
  )
}
