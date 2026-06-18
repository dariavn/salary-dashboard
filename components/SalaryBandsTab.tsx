'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import type { HubEntry, PositionEntry, BandEntry, SalaryRange } from '@/lib/salary-bands'
import {
  lookupBand, fmtBandValue, normaliseToMonthlyEur, RESEARCH_COUNTRY_MAP,
} from '@/lib/salary-bands'
import type { LocationMeta } from '@/lib/types'
import { useLang } from '@/context/LangContext'

interface Props {
  hubs: HubEntry[]
  positions: PositionEntry[]
  bands: BandEntry[]
  locationMeta: Record<string, LocationMeta>
}

const HUB_COLORS: Record<string, string> = {
  '1': '#4a52c4', '2': '#0e8d7e', '3': '#c2710c', CY: '#b23a5e', RU: '#7b3fa0',
}

const LEVEL_GRADE: Record<string, string> = {
  O1: 'Junior−', O2: 'Junior', O3: 'Junior+', P1: 'Junior+',
  P2: 'Middle', P3: 'Senior−', M0: 'Senior−',
  P4: 'Senior', M1: 'Senior', P5: 'Lead', M2: 'Lead',
  M3: 'Head', M4: 'Director', M5: 'VP',
}

const FLAG_MAP: Record<string, string> = {
  'Singapore': '🇸🇬', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧',
  'Netherlands': '🇳🇱', 'Israel': '🇮🇱', 'Australia': '🇦🇺', 'Germany': '🇩🇪',
  'Estonia': '🇪🇪', 'Italy': '🇮🇹', 'Latvia': '🇱🇻', 'Lithuania': '🇱🇹',
  'United Arab Emirates': '🇦🇪', 'Spain': '🇪🇸', 'Czech Republic': '🇨🇿',
  'Greece': '🇬🇷', 'Cyprus': '🇨🇾', 'Taiwan': '🇹🇼', 'Portugal': '🇵🇹',
  'Poland': '🇵🇱', 'Hungary': '🇭🇺', 'Argentina': '🇦🇷', 'Serbia': '🇷🇸',
  'Armenia': '🇦🇲', 'Montenegro': '🇲🇪', 'Thailand': '🇹🇭', 'Mauritius': '🇲🇺',
  'Russia': '🇷🇺', 'Moldova': '🇲🇩', 'Georgia': '🇬🇪', 'Philippines': '🇵🇭',
  'Brazil': '🇧🇷', 'Colombia': '🇨🇴', 'Bali (Indonesia)': '🇮🇩', 'Indonesia': '🇮🇩',
  'Uzbekistan': '🇺🇿', 'Algeria': '🇩🇿', 'Kyrgyzstan': '🇰🇬', 'Kazakhstan': '🇰🇿',
  'Vietnam': '🇻🇳', 'Belarus': '🇧🇾', 'India': '🇮🇳', 'Egypt': '🇪🇬',
  'Pakistan': '🇵🇰',
}

function flag(country: string) { return FLAG_MAP[country] ?? '🌐' }

function BandResultRow({ hubEntry, salary }: { hubEntry: HubEntry; salary: SalaryRange }) {
  const isCY = hubEntry.hub === 'CY'
  const isRU = hubEntry.hub === 'RU'
  return (
    <tr>
      <td style={{ paddingLeft: 16, whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 18 }}>{flag(hubEntry.country)}</span>
          <span>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{hubEntry.country}</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>{hubEntry.city}</div>
          </span>
        </span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `color-mix(in srgb, ${HUB_COLORS[hubEntry.hub] ?? '#666'} 15%, transparent)`, color: HUB_COLORS[hubEntry.hub] ?? '#666' }}>
          {hubEntry.hub}
        </span>
      </td>
      <td className="mono" style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {fmtBandValue(salary, salary.min)} – {fmtBandValue(salary, salary.max)}
      </td>
      <td className="mono" style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
        {fmtBandValue(salary, salary.median)}
      </td>
      <td style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted)', paddingRight: 16 }}>
        {salary.period === 'annual' ? 'annual' : 'monthly'} · {salary.type}
        {isCY && <div style={{ fontSize: 10, color: 'var(--warn)' }}>cap €85K</div>}
        {isRU && <div style={{ fontSize: 10, color: 'var(--warn)' }}>₽ нетт</div>}
      </td>
    </tr>
  )
}

export default function SalaryBandsTab({ hubs, positions, bands, locationMeta }: Props) {
  const { lang } = useLang()
  const searchParams = useSearchParams()
  const [posQuery, setPosQuery] = useState('')
  const [selectedPos, setSelectedPos] = useState<PositionEntry | null>(null)
  const [showPosDropdown, setShowPosDropdown] = useState(false)

  // Track last bandsPos from URL to detect changes
  const prevBandsPosRef = useRef<string | null>(searchParams.get('bandsPos'))

  // React to URL bandsPos changes:
  // - appears → pre-fill (came from ATS Band button)
  // - disappears → clear (user clicked Salary Bands tab directly)
  // - user manually searches → no bandsPos in URL → no action (prevRef stays null)
  useEffect(() => {
    const bandsPos = searchParams.get('bandsPos')
    const prev = prevBandsPosRef.current
    if (bandsPos && bandsPos !== prev) {
      // New pre-fill from URL
      const match = positions.find(p => p.position === bandsPos)
      if (match) { setSelectedPos(match); setPosQuery(match.position) }
      prevBandsPosRef.current = bandsPos
    } else if (!bandsPos && prev) {
      // bandsPos cleared → reset to clean state
      setSelectedPos(null); setPosQuery('')
      prevBandsPosRef.current = null
    }
  }, [searchParams, positions])
  const [locQuery, setLocQuery] = useState('')
  const [selectedHub, setSelectedHub] = useState<HubEntry | null>(null)
  const [showLocDropdown, setShowLocDropdown] = useState(false)

  // Position autocomplete
  const posSuggestions = useMemo(() => {
    const q = posQuery.trim().toLowerCase()
    if (!q || q.length < 2) return []
    return positions.filter(p => p.position.toLowerCase().includes(q)).slice(0, 20)
  }, [posQuery, positions])

  // Location autocomplete — all hubs entries
  const locSuggestions = useMemo(() => {
    const q = locQuery.trim().toLowerCase()
    if (!q || q.length < 1) return hubs.slice(0, 12)
    return hubs.filter(h =>
      h.country.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
    ).slice(0, 12)
  }, [locQuery, hubs])

  // Research countries for "all locations" view
  const researchCountries = Object.entries(RESEARCH_COUNTRY_MAP)
    .map(([slug, country]) => ({ slug, country, meta: locationMeta[slug] }))
    .filter(c => c.meta)

  // Single result mode (specific country selected)
  const singleResult = useMemo(() => {
    if (!selectedPos || !selectedHub) return null
    return lookupBand(hubs, bands, selectedPos, selectedHub.country)
  }, [selectedPos, selectedHub, hubs, bands])

  // All research countries result
  const allResults = useMemo(() => {
    if (!selectedPos || selectedHub) return []
    return researchCountries.map(({ slug, country, meta }) => ({
      slug, meta,
      hubEntry: hubs.find(h => h.country.toLowerCase() === country.toLowerCase()) ?? null,
      result: lookupBand(hubs, bands, selectedPos, country),
    })).filter(r => r.result)
  }, [selectedPos, selectedHub, hubs, bands])

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 'var(--r-md)',
    border: '1px solid var(--border-strong)', background: 'var(--surface)',
    color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          💰 Salary Bands
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>
          {lang === 'ru'
            ? 'Внутренние зарплатные вилки · выберите должность и локацию'
            : 'Internal salary bands · select a position and location'}
        </p>
      </div>

      {/* Search row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 840, marginBottom: 24 }}>
        {/* Position search */}
        <div style={{ position: 'relative' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{lang === 'ru' ? 'Должность' : 'Position'}</div>
          <input
            type="text" value={posQuery}
            onChange={e => { setPosQuery(e.target.value); setShowPosDropdown(true); setSelectedPos(null) }}
            onFocus={() => setShowPosDropdown(true)}
            onBlur={() => setTimeout(() => setShowPosDropdown(false), 150)}
            placeholder={lang === 'ru' ? 'Например: Backend Developer…' : 'e.g. Backend Developer…'}
            style={inputStyle}
          />
          {showPosDropdown && posSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)', maxHeight: 300, overflowY: 'auto' }}>
              {posSuggestions.map((p, i) => (
                <button key={i} onMouseDown={() => { setSelectedPos(p); setPosQuery(p.position); setShowPosDropdown(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500, flex: 1 }}>{p.position}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--muted)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {p.level} · {LEVEL_GRADE[p.level] ?? p.level}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location search */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="eyebrow">{lang === 'ru' ? 'Локация' : 'Location'}</span>
            {selectedHub && (
              <button onClick={() => { setSelectedHub(null); setLocQuery('') }}
                style={{ fontSize: 11, color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                × {lang === 'ru' ? 'Все наши страны' : 'all research countries'}
              </button>
            )}
          </div>
          <input
            type="text" value={locQuery}
            onChange={e => { setLocQuery(e.target.value); setShowLocDropdown(true); if (!e.target.value) setSelectedHub(null) }}
            onFocus={() => setShowLocDropdown(true)}
            onBlur={() => setTimeout(() => setShowLocDropdown(false), 150)}
            placeholder={lang === 'ru' ? 'Любая страна…' : 'Any country…'}
            style={inputStyle}
          />
          {showLocDropdown && locSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)', maxHeight: 300, overflowY: 'auto' }}>
              {locSuggestions.map((h, i) => (
                <button key={i} onMouseDown={() => { setSelectedHub(h); setLocQuery(`${h.country} — ${h.city}`); setShowLocDropdown(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{flag(h.country)}</span>
                  <span style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{h.country}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{h.city}</div>
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `color-mix(in srgb, ${HUB_COLORS[h.hub] ?? '#666'} 15%, transparent)`, color: HUB_COLORS[h.hub] ?? '#666', flexShrink: 0 }}>
                    Hub {h.hub}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected position badge */}
      {selectedPos && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedPos.position}</span>
          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{selectedPos.level}</span>
            {' · '}{LEVEL_GRADE[selectedPos.level]}
            {' · '}{selectedPos.salaryBand}
          </span>
        </div>
      )}

      {/* No position selected */}
      {!selectedPos && (
        <div style={{ color: 'var(--muted)', fontSize: 14, padding: '8px 0' }}>
          {lang === 'ru'
            ? 'Начните вводить название должности — например «Backend Developer», «Product Manager», «QA Engineer»'
            : 'Type a position name — e.g. "Backend Developer", "Product Manager", "QA Engineer"'}
        </div>
      )}

      {/* Single country result */}
      {selectedPos && selectedHub && (
        <div>
          {singleResult ? (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 16 }}>{lang === 'ru' ? 'Локация' : 'Location'}</th>
                    <th style={{ textAlign: 'center' }}>Hub</th>
                    <th>{lang === 'ru' ? 'Вилка (мин – макс)' : 'Band (min – max)'}</th>
                    <th style={{ textAlign: 'right' }}>{lang === 'ru' ? 'Медиана' : 'Median'}</th>
                    <th style={{ textAlign: 'center', paddingRight: 16 }}>{lang === 'ru' ? 'Период / тип' : 'Period / type'}</th>
                  </tr>
                </thead>
                <tbody>
                  <BandResultRow hubEntry={selectedHub} salary={singleResult.salary} />
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 14, padding: '16px 0' }}>
              {lang === 'ru' ? 'Нет данных для этой комбинации' : 'No band data for this combination'}
            </div>
          )}
        </div>
      )}

      {/* All research countries */}
      {selectedPos && !selectedHub && allResults.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12.5, color: 'var(--muted)' }}>
            {lang === 'ru'
              ? 'Наши исследованные страны · выберите локацию выше для любой другой страны'
              : 'Our research countries · select a location above for any other country'}
          </div>
          <table className="data">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>{lang === 'ru' ? 'Локация' : 'Location'}</th>
                <th style={{ textAlign: 'center' }}>Hub</th>
                <th>{lang === 'ru' ? 'Вилка (мин – макс)' : 'Band (min – max)'}</th>
                <th style={{ textAlign: 'right' }}>{lang === 'ru' ? 'Медиана' : 'Median'}</th>
                <th style={{ textAlign: 'center', paddingRight: 16 }}>{lang === 'ru' ? 'Период / тип' : 'Period / type'}</th>
              </tr>
            </thead>
            <tbody>
              {allResults.map(r => r.hubEntry && r.result && (
                <BandResultRow key={r.slug} hubEntry={r.hubEntry} salary={r.result.salary} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
