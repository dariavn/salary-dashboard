'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PositionMeta, LocationMeta, CandidateWithLocation, GradeRow } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import AtsPipelineView from '@/components/AtsPipelineView'

interface Props {
  positions: PositionMeta[]
  locationsByPosition: Record<string, LocationMeta[]>
  candidatesByPosition: Record<string, CandidateWithLocation[]>
  locationMeta: Record<string, LocationMeta>
  benchmarkGrades: Record<string, Record<string, GradeRow[]>>
  researchDates: Record<string, Record<string, string>>
}

type HomeTab = 'market' | 'ats'
type MarketPeriod = 'all' | '12m' | '6m' | '3m'

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

// Parse "2026-05" or "2026" into a comparable Date
function parseResearchDate(d: string): Date {
  if (!d) return new Date(0)
  const [y, m] = d.split('-').map(Number)
  return new Date(y, (m || 1) - 1)
}

function isWithinPeriod(dateStr: string, period: MarketPeriod): boolean {
  if (period === 'all') return true
  const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months)
  return parseResearchDate(dateStr) >= cutoff
}

export default function HomeClient({
  positions, locationsByPosition, candidatesByPosition,
  locationMeta, benchmarkGrades, researchDates,
}: Props) {
  const { lang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [homeTab, setHomeTab] = useState<HomeTab>(
    searchParams.get('tab') === 'ats' ? 'ats' : 'market'
  )
  const [selectedPosition, setSelectedPosition] = useState<string>(positions[0]?.slug ?? '')
  const [selected, setSelected] = useState<string[]>([])
  const [marketPeriod, setMarketPeriod] = useState<MarketPeriod>('all')

  const allLocations = locationsByPosition[selectedPosition] ?? []
  // Filter locations by research date period
  const locations = allLocations.filter(loc => {
    const d = researchDates[selectedPosition]?.[loc.slug] ?? ''
    return isWithinPeriod(d, marketPeriod)
  })

  function switchTab(tab: HomeTab) {
    setHomeTab(tab)
    router.replace(tab === 'ats' ? '/?tab=ats' : '/', { scroll: false })
  }

  function toggle(slug: string) {
    setSelected(prev => prev.includes(slug)
      ? prev.filter(s => s !== slug)
      : prev.length >= 4 ? prev : [...prev, slug]
    )
  }

  function handleCompare() {
    if (!selected.length) return
    router.push(`/compare?position=${selectedPosition}&countries=${selected.join(',')}`)
  }

  const periodOpts: { v: MarketPeriod; label: string }[] = [
    { v: 'all',  label: lang === 'ru' ? 'За всё время' : 'All time' },
    { v: '12m',  label: lang === 'ru' ? 'Последний год' : 'Last year' },
    { v: '6m',   label: lang === 'ru' ? 'Последние 6 мес.' : 'Last 6 months' },
    { v: '3m',   label: lang === 'ru' ? 'Последние 3 мес.' : 'Last 3 months' },
  ]

  const tabs: { key: HomeTab; icon: string; label: string }[] = [
    { key: 'market', icon: '↗', label: t(lang, 'marketTab') },
    { key: 'ats',    icon: '🏢', label: t(lang, 'atsTab') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, transparent)', backdropFilter: 'blur(10px)' }}>
        <div className="wrap" style={{ height: 58, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => { switchTab('market') }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--text)' }}
          >
            <Logo />
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{t(lang, 'appTitle')}</span>
          </button>
          <div style={{ marginLeft: 'auto' }}><LanguageToggle /></div>
        </div>
        {/* Tab bar */}
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="wrap" style={{ display: 'flex', gap: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
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
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ——— MARKET RESEARCH ——— */}
      {homeTab === 'market' && (
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 28px 80px' }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              {t(lang, 'marketSourceTitle')}
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>{t(lang, 'marketSourceDesc')}</p>
          </div>

          {/* Role */}
          <div style={{ marginBottom: 28 }}>
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

          {/* Period filter for market data */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <div className="eyebrow">{lang === 'ru' ? 'Период обновления данных' : 'Data updated'}</div>
              {marketPeriod !== 'all' && locations.length < allLocations.length && (
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {lang === 'ru'
                    ? `Показано ${locations.length} из ${allLocations.length} локаций`
                    : `Showing ${locations.length} of ${allLocations.length} locations`}
                </span>
              )}
            </div>
            <div className="seg">
              {periodOpts.map(o => (
                <button key={o.v} aria-pressed={marketPeriod === o.v}
                  onClick={() => { setMarketPeriod(o.v); setSelected([]) }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <div className="eyebrow">{t(lang, 'selectCountries')}</div>
              <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{t(lang, 'selectCountriesHint')}</span>
            </div>
            {locations.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                {lang === 'ru'
                  ? 'Нет данных за выбранный период. Попробуйте выбрать «За всё время».'
                  : 'No data for the selected period. Try "All time".'}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {locations.map(loc => {
                  const on = selected.includes(loc.slug)
                  const dis = !on && selected.length >= 4
                  const rd = researchDates[selectedPosition]?.[loc.slug]
                  return (
                    <button
                      key={loc.slug}
                      onClick={() => !dis && toggle(loc.slug)}
                      disabled={dis}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        gap: 2, padding: '10px 14px',
                        fontFamily: 'var(--font-ui)', cursor: dis ? 'not-allowed' : 'pointer',
                        borderRadius: 'var(--r-md)', border: '1px solid',
                        borderColor: on ? 'var(--accent)' : 'var(--border-strong)',
                        background: on ? 'var(--accent-soft)' : 'var(--surface)',
                        color: on ? 'var(--text)' : 'var(--text-2)',
                        opacity: dis ? 0.4 : 1, transition: 'all .14s',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{loc.flag}</span>
                        <span style={{ fontWeight: on ? 600 : 500, fontSize: 14, marginRight: 'auto' }}>{loc.name[lang]}</span>
                        {loc.currency === 'RUB' && <span style={{ fontSize: 10, color: 'var(--muted-2)' }}>₽</span>}
                      </span>
                      {rd && (
                        <span style={{ fontSize: 10.5, color: 'var(--muted-2)', paddingLeft: 26 }}>
                          {lang === 'ru' ? 'Данные: ' : 'Data: '}{rd}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24 }}>
            {selected.length > 0 && (
              <button onClick={() => setSelected([])}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, border: 'none', background: 'transparent', color: 'var(--muted)', padding: '9px 4px', cursor: 'pointer' }}>
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

      {/* ——— ATS PIPELINE ——— */}
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
            benchmarkGrades={benchmarkGrades}
          />
        </div>
      )}
    </div>
  )
}
