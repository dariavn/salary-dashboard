'use client'
import { useLang } from '@/context/LangContext'

function SunIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx={12} cy={12} r={4} />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

export default function LanguageToggle() {
  const { lang, toggleLang, theme, toggleTheme } = useLang()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Language segmented control */}
      <div className="seg">
        <button aria-pressed={lang === 'en'} onClick={() => lang !== 'en' && toggleLang()}>EN</button>
        <button aria-pressed={lang === 'ru'} onClick={() => lang !== 'ru' && toggleLang()}>RU</button>
      </div>

      {/* Theme toggle */}
      <button
        title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        onClick={toggleTheme}
        style={{
          display: 'grid', placeItems: 'center',
          padding: '8px 10px', lineHeight: 1, cursor: 'pointer',
          background: 'var(--surface)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-md)', color: 'var(--text-2)',
          transition: 'background .14s, border-color .14s, color .14s',
        }}
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>
    </div>
  )
}
