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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(26,29,39,0.8)', backdropFilter: 'blur(8px)' }} className="sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ background: 'linear-gradient(90deg, #6c63ff, #00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              {t(lang, 'appTitle')}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{t(lang, 'appSubtitle')}</p>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Step 1 */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            1 — {t(lang, 'selectPosition')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {positions.map((p) => (
              <button
                key={p.slug}
                onClick={() => { setSelectedPosition(p.slug); setSelectedLocations([]) }}
                className="px-5 py-2.5 rounded-xl font-medium transition-all text-sm"
                style={
                  selectedPosition === p.slug
                    ? { border: '1px solid var(--accent)', background: 'rgba(108,99,255,0.12)', color: '#e8eaf0' }
                    : { border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted)' }
                }
              >
                {p.name[lang]}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2 */}
        {selectedPosition && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
              2 — {t(lang, 'selectCountries')}
            </h2>
            {selectedLocations.length >= 3 && (
              <p className="text-xs mb-3" style={{ color: 'var(--accent4)' }}>{t(lang, 'maxCountries')}</p>
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
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={
                      selected
                        ? { border: '1px solid var(--accent)', background: 'rgba(108,99,255,0.12)', color: '#e8eaf0' }
                        : disabled
                        ? { border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--border)', cursor: 'not-allowed' }
                        : { border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted)' }
                    }
                  >
                    <span className="text-xl">{loc.flag}</span>
                    <span>{loc.name[lang]}</span>
                    {loc.currency === 'RUB' && (
                      <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>₽</span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleCompare}
            disabled={!selectedLocations.length}
            className="px-8 py-3 rounded-xl font-semibold text-base transition-all active:scale-95"
            style={
              selectedLocations.length
                ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 20px rgba(108,99,255,0.4)' }
                : { background: 'var(--card2)', color: 'var(--border)', cursor: 'not-allowed' }
            }
          >
            {t(lang, 'compareBtn')} {selectedLocations.length > 0 && `(${selectedLocations.length})`}
          </button>
        </div>
      </main>
    </div>
  )
}
