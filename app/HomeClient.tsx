'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PositionMeta, LocationMeta, CandidateWithLocation } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import AtsPipelineView from '@/components/AtsPipelineView'

interface Props {
  positions: PositionMeta[]
  locationsByPosition: Record<string, LocationMeta[]>
  candidatesByPosition: Record<string, CandidateWithLocation[]>
  locationMeta: Record<string, LocationMeta>
}

type HomeTab = 'market' | 'ats'

function Logo() {
  return (
    <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff' }}>
      <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
        <rect x={3} y={13} width={4.5} height={8} rx={1} />
        <rect x={9.75} y={8} width={4.5} height={13} rx={1} opacity={0.8} />
        <rect x={16.5} y={3} width={4.5} height={18} rx={1} opacity={0.62} />
      </svg>
    </span>
  )
}

export default function HomeClient({ positions, locationsByPosition, candidatesByPosition, locationMeta }: Props) {
  const { lang } = useLang()
  const router = useRouter()
  const [homeTab, setHomeTab] = useState<HomeTab>('market')
  const [selectedPosition, setSelectedPosition] = useState<string>(positions[0]?.slug ?? '')
  const [selected, setSelected] = useState<string[]>([])

  const locations = locationsByPosition[selectedPosition] ?? []
  const hasCandidates = Object.values(candidatesByPosition).some(c => c.length > 0)

  function toggle(slug: string) {
    setSelected(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : prev.length >= 4 ? prev : [...prev, slug])
  }

  function handleCompare() {
    if (!selected.length) return
    router.push(`/compare?position=${selectedPosition}&countries=${selected.join(',')}`)
  }

  const tabs: { key: HomeTab; label: string; icon: string }[] = [
    { key: 'market', icon: '↗', label: t(lang, 'marketTab') },
    { key: 'ats',    icon: '🏢', label: t(lang, 'atsTab') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, transparent)', backdropFilter: 'blur(10px)' }}>
        <div className="wrap" style={{ height: 58, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Logo />
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{t(lang, 'appTitle')}</span>
          </div>
          <div style={{ marginLeft: 'auto' }}><LanguageToggle /></div>
        </div>

        {/* Tab bar */}
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="wrap" style={{ display: 'flex', gap: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setHomeTab(tab.key)}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  padding: '13px 4px', marginRight: 18,
                  fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)',
                  color: homeTab === tab.key ? 'var(--text)' : 'var(--muted)',
                  borderBottom: '2px solid ' + (homeTab === tab.key ? 'var(--accent)' : 'transparent'),
                  marginBottom: -1, transition: 'color .14s, border-color .14s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ——— MARKET RESEARCH TAB ——— */}
      {homeTab === 'market' && (
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 28px 80px' }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              {t(lang, 'marketSourceTitle')}
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>{t(lang, 'marketSourceDesc')}</p>
          </div>

          {/* Step 1: Role */}
          <div style={{ marginBottom: 30 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t(lang, 'selectPosition')}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {positions.map(p => (
                <button
                  key={p.slug}
                  onClick={() => { setSelectedPosition(p.slug); setSelected([]) }}
                  style={{
                    fontFamily: 'var(--font-ui)', fontSize: 14,
                    fontWeight: selectedPosition === p.slug ? 600 : 500,
                    padding: '9px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                    borderColor: selectedPosition === p.slug ? 'var(--accent)' : 'var(--border-strong)',
                    background: selectedPosition === p.slug ? 'var(--accent-soft)' : 'var(--surface)',
                    color: selectedPosition === p.slug ? 'var(--text)' : 'var(--text-2)',
                    border: '1px solid', transition: 'all .14s',
                  }}
                >
                  {p.name[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Locations */}
          {selectedPosition && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <div className="eyebrow">{t(lang, 'selectCountries')}</div>
                <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{t(lang, 'selectCountriesHint')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {locations.map(loc => {
                  const on = selected.includes(loc.slug)
                  const dis = !on && selected.length >= 4
                  return (
                    <button
                      key={loc.slug}
                      onClick={() => !dis && toggle(loc.slug)}
                      disabled={dis}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                        textAlign: 'left', justifyContent: 'flex-start', fontFamily: 'var(--font-ui)',
                        cursor: dis ? 'not-allowed' : 'pointer',
                        fontWeight: on ? 600 : 500, fontSize: 14,
                        borderRadius: 'var(--r-md)', border: '1px solid',
                        borderColor: on ? 'var(--accent)' : 'var(--border-strong)',
                        background: on ? 'var(--accent-soft)' : 'var(--surface)',
                        color: on ? 'var(--text)' : 'var(--text-2)',
                        opacity: dis ? 0.4 : 1, transition: 'all .14s',
                      }}
                    >
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{loc.flag}</span>
                      <span style={{ marginRight: 'auto' }}>{loc.name[lang]}</span>
                      {loc.currency === 'RUB' && <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>₽</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24 }}>
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, border: 'none', background: 'transparent', color: 'var(--muted)', padding: '9px 4px', cursor: 'pointer' }}
              >
                {t(lang, 'clear')}
              </button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.length}/4 {t(lang, 'selected')}</span>
              <button
                disabled={!selected.length}
                onClick={handleCompare}
                style={{
                  fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
                  padding: '11px 26px', borderRadius: 'var(--r-md)',
                  cursor: selected.length ? 'pointer' : 'not-allowed',
                  background: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff',
                  opacity: selected.length ? 1 : 0.45, transition: 'all .14s',
                }}
              >
                {t(lang, 'compareBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— ATS PIPELINE TAB ——— */}
      {homeTab === 'ats' && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px 80px' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              🏢 {t(lang, 'atsSourceTitle')}
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>{t(lang, 'atsSourceDesc')}</p>
          </div>
          <AtsPipelineView
            positions={positions}
            candidatesByPosition={candidatesByPosition}
            locationMeta={locationMeta}
          />
        </div>
      )}
    </div>
  )
}
