'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PositionMeta, LocationMeta } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'

interface Props {
  positions: PositionMeta[]
  locationsByPosition: Record<string, LocationMeta[]>
}

export default function HomeClient({ positions, locationsByPosition }: Props) {
  const { lang } = useLang()
  const router = useRouter()
  const [selectedPosition, setSelectedPosition] = useState<string>(positions[0]?.slug ?? '')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])

  const locations = locationsByPosition[selectedPosition] ?? []

  function toggleLocation(slug: string) {
    setSelectedLocations((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 3) return prev
      return [...prev, slug]
    })
  }

  function handleCompare() {
    if (!selectedLocations.length) return
    router.push(`/compare?position=${selectedPosition}&countries=${selectedLocations.join(',')}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t(lang, 'appTitle')}</h1>
            <p className="text-xs text-gray-500">{t(lang, 'appSubtitle')}</p>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Step 1: Position */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            1. {t(lang, 'selectPosition')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {positions.map((p) => (
              <button
                key={p.slug}
                onClick={() => { setSelectedPosition(p.slug); setSelectedLocations([]) }}
                className={`px-5 py-2.5 rounded-xl font-medium border-2 transition-all ${
                  selectedPosition === p.slug
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {p.name[lang]}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Locations */}
        {selectedPosition && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              2. {t(lang, 'selectCountries')}
            </h2>
            {selectedLocations.length >= 3 && (
              <p className="text-xs text-amber-600 mb-3">{t(lang, 'maxCountries')}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
              {locations.map((loc) => {
                const selected = selectedLocations.includes(loc.slug)
                const disabled = !selected && selectedLocations.length >= 3
                return (
                  <button
                    key={loc.slug}
                    onClick={() => !disabled && toggleLocation(loc.slug)}
                    disabled={disabled}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all
                      ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : ''}
                      ${!selected && !disabled ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300' : ''}
                      ${disabled ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-xl">{loc.flag}</span>
                    <span>{loc.name[lang]}</span>
                    {loc.currency === 'RUB' && (
                      <span className="ml-auto text-xs text-gray-400">₽</span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Compare button */}
        <div className="flex justify-end">
          <button
            onClick={handleCompare}
            disabled={!selectedLocations.length}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-base shadow-md
              hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t(lang, 'compareBtn')} {selectedLocations.length > 0 && `(${selectedLocations.length})`}
          </button>
        </div>
      </main>
    </div>
  )
}
