'use client'
import { useState, useMemo } from 'react'
import type { HubEntry, PositionEntry, BandEntry, SalaryRange } from '@/lib/salary-bands'
import { lookupBand, fmtBandValue, normaliseToMonthlyEur, RESEARCH_COUNTRY_MAP } from '@/lib/salary-bands'
import type { LocationMeta } from '@/lib/types'
import { useLang } from '@/context/LangContext'

interface Props {
  hubs: HubEntry[]
  positions: PositionEntry[]
  bands: BandEntry[]
  locationMeta: Record<string, LocationMeta>
}

const PERIOD_LABEL: Record<string, { en: string; ru: string }> = {
  annual:  { en: 'annual gross', ru: 'год гросс' },
  monthly: { en: 'monthly',      ru: 'месяц' },
}

const TYPE_LABEL: Record<string, { en: string; ru: string }> = {
  gross: { en: 'gross', ru: 'гросс' },
  nett:  { en: 'net',   ru: 'нетт'  },
}

function BandIndicator({ salary, lang }: { salary: SalaryRange; lang: string }) {
  const isRu = salary.currency === 'RUB'
  const sym = isRu ? '₽' : '€'
  const fmt = (v: number) => {
    if (isRu) return `${Math.round(v / 1000)}K ${sym}`
    if (salary.period === 'annual') return `${sym}${Math.round(v / 1000)}K /yr`
    return `${sym}${Math.round(v / 1000)}K /mo`
  }
  const period = PERIOD_LABEL[salary.period]?.[lang as 'en' | 'ru'] ?? salary.period
  const type = TYPE_LABEL[salary.type]?.[lang as 'en' | 'ru'] ?? salary.type
  return (
    <div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
        {fmt(salary.min)} – {fmt(salary.max)}
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
        {lang === 'ru' ? 'медиана' : 'median'}: {fmt(salary.median)}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 1 }}>
        {period} · {type}
      </div>
    </div>
  )
}

// Level → approximate grade label for display
const LEVEL_GRADE: Record<string, string> = {
  O1: 'Junior−', O2: 'Junior', O3: 'Junior+', P1: 'Junior+',
  P2: 'Middle', P3: 'Senior−', M0: 'Senior−',
  P4: 'Senior', M1: 'Senior', P5: 'Lead', M2: 'Lead',
  M3: 'Head', M4: 'Director', M5: 'VP',
}

export default function SalaryBandsTab({ hubs, positions, bands, locationMeta }: Props) {
  const { lang } = useLang()
  const [query, setQuery] = useState('')
  const [selectedPos, setSelectedPos] = useState<PositionEntry | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Filter positions by search query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || q.length < 2) return []
    return positions
      .filter(p => p.position.toLowerCase().includes(q))
      .slice(0, 20)
  }, [query, positions])

  // Countries to show (our 9 research countries)
  const researchCountries = Object.entries(RESEARCH_COUNTRY_MAP)
    .map(([slug, country]) => ({ slug, country, meta: locationMeta[slug] }))
    .filter(c => c.meta)

  // Compute band results for selected position
  const results = useMemo(() => {
    if (!selectedPos) return []
    return researchCountries.map(({ slug, country, meta }) => {
      const result = lookupBand(hubs, bands, selectedPos, country)
      return { slug, country, meta, result }
    })
  }, [selectedPos, hubs, bands])

  const hasResults = results.some(r => r.result != null)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          💰 {lang === 'ru' ? 'Salary Bands' : 'Salary Bands'}
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>
          {lang === 'ru'
            ? 'Внутренние зарплатные вилки компании · Введите название позиции для поиска'
            : 'Internal company salary bands · Type a position name to search'}
        </p>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 560, marginBottom: 32, position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); setSelectedPos(null) }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={lang === 'ru' ? 'Например: Backend Developer, Data Analyst…' : 'e.g. Backend Developer, Data Analyst…'}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-strong)', background: 'var(--surface)',
            color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 15,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {showDropdown && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-2)', maxHeight: 320, overflowY: 'auto',
          }}>
            {suggestions.map((p, i) => (
              <button
                key={i}
                onMouseDown={() => { setSelectedPos(p); setQuery(p.position); setShowDropdown(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, flex: 1 }}>{p.position}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface-2)', padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  {p.level} · {p.salaryBand.length > 30 ? p.salaryBand.substring(0, 30) + '…' : p.salaryBand}
                </span>
              </button>
            ))}
          </div>
        )}
        {showDropdown && query.length >= 2 && suggestions.length === 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', fontSize: 13 }}>
            {lang === 'ru' ? 'Позиция не найдена' : 'Position not found'}
          </div>
        )}
      </div>

      {/* Selected position info */}
      {selectedPos && (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedPos.position}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                <span style={{ fontWeight: 600 }}>{selectedPos.level}</span>
                {' · '}
                <span style={{ fontSize: 11.5, color: 'var(--accent)' }}>
                  {LEVEL_GRADE[selectedPos.level] ?? selectedPos.level}
                </span>
                {' · '}
                {selectedPos.salaryBand}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results table */}
      {selectedPos && !hasResults && (
        <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>
          {lang === 'ru' ? 'Нет данных для этой позиции' : 'No band data for this position'}
        </div>
      )}

      {selectedPos && hasResults && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16, minWidth: 140 }}>
                  {lang === 'ru' ? 'Локация' : 'Location'}
                </th>
                <th style={{ minWidth: 60, textAlign: 'center' }}>Hub</th>
                <th style={{ minWidth: 200 }}>
                  {lang === 'ru' ? 'Вилка (мин – макс)' : 'Band range (min – max)'}
                </th>
                <th style={{ textAlign: 'right', minWidth: 110 }}>
                  {lang === 'ru' ? 'Медиана' : 'Median'}
                </th>
                <th style={{ textAlign: 'center', minWidth: 100 }}>
                  {lang === 'ru' ? 'Период / тип' : 'Period / type'}
                </th>
                <th style={{ textAlign: 'right', minWidth: 120, paddingRight: 16 }}>
                  {lang === 'ru' ? '≈ €/мес (сравнение)' : '≈ €/mo (compare)'}
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ slug, meta, result }) => {
                if (!result) return (
                  <tr key={slug}>
                    <td style={{ paddingLeft: 16 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <span>{meta.flag}</span><span>{meta.name[lang as 'en' | 'ru']}</span>
                      </span>
                    </td>
                    <td colSpan={5} style={{ color: 'var(--muted-2)', fontSize: 12, fontStyle: 'italic', paddingRight: 16 }}>
                      {lang === 'ru' ? 'Нет данных' : 'No data'}
                    </td>
                  </tr>
                )
                const { salary, hub, hubCity } = result
                const norm = normaliseToMonthlyEur(salary)
                const isCY = hub === 'CY'
                const isRU = hub === 'RU'
                return (
                  <tr key={slug}>
                    <td style={{ paddingLeft: 16 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <span>{meta.flag}</span>
                        <span>{meta.name[lang as 'en' | 'ru']}</span>
                      </span>
                      <div style={{ fontSize: 10.5, color: 'var(--muted-2)', paddingLeft: 22, marginTop: 1 }}>{hubCity}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                        {hub}
                      </span>
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {fmtBandValue(salary, salary.min)} – {fmtBandValue(salary, salary.max)}
                      </div>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                      {fmtBandValue(salary, salary.median)}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted)' }}>
                      {salary.period === 'annual' ? (lang === 'ru' ? 'год' : 'annual') : (lang === 'ru' ? 'месяц' : 'monthly')}
                      {' · '}
                      {salary.type === 'gross' ? 'gross' : (lang === 'ru' ? 'нетт' : 'net')}
                      {isCY && <div style={{ fontSize: 10, color: 'var(--warn)', marginTop: 2 }}>cap €85K</div>}
                      {isRU && <div style={{ fontSize: 10, color: 'var(--warn)', marginTop: 2 }}>₽ нетт</div>}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 13, color: 'var(--muted)', paddingRight: 16 }}>
                      €{norm.min}K – €{norm.max}K
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', fontSize: 11.5, color: 'var(--muted-2)', borderTop: '1px solid var(--border)' }}>
            {lang === 'ru'
              ? '«≈ €/мес» — приблизительная нормализация к EUR/месяц gross для сопоставления между локациями (CY: /12; RU: /98 × 1.15). Используйте основные вилки для офферов.'
              : '"≈ €/mo" — approximate normalisation to EUR/month gross for cross-location comparison (CY: /12; RU: /98 × 1.15). Use original values for offers.'}
          </div>
        </div>
      )}

      {!selectedPos && (
        <div style={{ color: 'var(--muted)', fontSize: 14, padding: '12px 0' }}>
          {lang === 'ru'
            ? 'Начните вводить название позиции — например «Backend Developer», «Product Manager», «QA Engineer»'
            : 'Start typing a position name — e.g. "Backend Developer", "Product Manager", "QA Engineer"'}
        </div>
      )}
    </div>
  )
}
