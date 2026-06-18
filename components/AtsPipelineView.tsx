'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CandidateWithLocation, GradeRow } from '@/lib/types'
import type { PositionMeta, LocationMeta } from '@/lib/types'
import type { PositionEntry } from '@/lib/salary-bands'
import type { SalaryBandsData } from '@/lib/salary-bands-loader'
import { lookupBand, compareToBand, normaliseToMonthlyEur, RESEARCH_COUNTRY_MAP } from '@/lib/salary-bands'
import { t, GRADE_ORDER, GRADE_VAR } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'

interface Props {
  positions: PositionMeta[]
  candidatesByPosition: Record<string, CandidateWithLocation[]>
  locationMeta: Record<string, LocationMeta>
  benchmarkGrades: Record<string, Record<string, GradeRow[]>>
  salaryBandsData?: SalaryBandsData
}

type BenchmarkResult = { type: 'above' | 'below' | 'at' | 'unknown'; pct: number }

function getBenchmark(
  salaryMonthlyEur: number | null,
  location: string,
  grade: string,
  grades: GradeRow[]
): BenchmarkResult {
  if (!salaryMonthlyEur || grade === 'unknown') return { type: 'unknown', pct: 0 }
  const rows = grades.filter(r => r.grade === grade && r.segment === 'mid_market')
  if (!rows.length) return { type: 'unknown', pct: 0 }
  const row = rows[0]
  // Convert to EUR if RUB (approximate: 1 EUR ≈ 98 RUB)
  const toEur = (n: number) => row.currency === 'RUB' ? n / 98 : n
  const mid = (toEur(row.monthly_gross_min) + toEur(row.monthly_gross_max)) / 2
  if (!mid) return { type: 'unknown', pct: 0 }
  const diff = (salaryMonthlyEur - mid) / mid
  if (diff > 0.1) return { type: 'above', pct: Math.round(diff * 100) }
  if (diff < -0.1) return { type: 'below', pct: Math.round(Math.abs(diff) * 100) }
  return { type: 'at', pct: Math.round(Math.abs(diff) * 100) }
}

function BenchmarkBadge({ result, lang }: { result: BenchmarkResult; lang: string }) {
  if (result.type === 'unknown') return <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
  const cfg = {
    above: { icon: '↑', color: 'var(--warn)',    bg: 'var(--warn-bg)',    label: lang === 'ru' ? 'выше рынка'  : 'above market' },
    below: { icon: '↓', color: 'var(--pos)',     bg: 'var(--pos-bg)',    label: lang === 'ru' ? 'ниже рынка'  : 'below market' },
    at:    { icon: '≈', color: 'var(--muted)',   bg: 'var(--surface-3)', label: lang === 'ru' ? 'на уровне'   : 'at market' },
  }
  const { icon, color, bg, label } = cfg[result.type]
  const pctStr = result.type !== 'at' ? ` ${result.pct}%` : ''
  return (
    <span
      className="mono"
      title={`${label} (mid-market)`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        fontSize: 12, fontWeight: 600, padding: '2px 7px',
        borderRadius: 999, background: bg, color, whiteSpace: 'nowrap', cursor: 'default',
      }}
    >
      {icon}{pctStr}
    </span>
  )
}

function filterByPeriod(candidates: CandidateWithLocation[], period: string): CandidateWithLocation[] {
  if (period === 'all') return candidates
  const months = period === '3m' ? 3 : 6
  const now = new Date()
  return candidates.filter(c => {
    if (!c.data_as_of) return true
    const [y, m] = c.data_as_of.split('-').map(Number)
    return new Date(y, m - 1) >= new Date(now.getFullYear(), now.getMonth() - months)
  })
}

function fmtSalary(n: number | null, period: 'monthly' | 'annual'): string {
  if (n == null) return '—'
  const v = period === 'annual' ? n * 12 : n
  return '€' + Math.round(v / 1000) + 'K'
}

function formatDate(d: string, lang: string): string {
  if (!d) return ''
  const [y, m] = d.split('-')
  const mo = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' }
  const moRu = { '01':'янв','02':'фев','03':'мар','04':'апр','05':'май','06':'июн','07':'июл','08':'авг','09':'сен','10':'окт','11':'ноя','12':'дек' }
  return lang === 'ru' ? `${(moRu as any)[m] ?? m} ${y}` : `${(mo as any)[m] ?? m} ${y}`
}

export default function AtsPipelineView({ positions, candidatesByPosition, locationMeta, benchmarkGrades, salaryBandsData }: Props) {
  const { lang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Only positions with actual ATS candidates
  const positionsWithData = positions.filter(p => (candidatesByPosition[p.slug]?.length ?? 0) > 0)

  // Default: first position that has ATS data, fallback to positions[0]
  const defaultPos = positionsWithData[0]?.slug ?? positions[0]?.slug ?? ''

  // Initialise from URL so state survives browser back
  const [position, setPositionState] = useState(
    searchParams.get('atsPos') ?? defaultPos
  )
  const [period, setPeriodState] = useState<'all' | '6m' | '3m'>(
    (searchParams.get('atsPeriod') as any) ?? 'all'
  )
  const [gradeFilter, setGradeFilterState] = useState(
    searchParams.get('atsGrade') ?? 'all'
  )
  const [salaryPeriod, setSalaryPeriodState] = useState<'monthly' | 'annual'>(
    (searchParams.get('atsSalary') as any) ?? 'monthly'
  )
  const [locationFilter, setLocationFilterState] = useState<string[]>(
    searchParams.get('atsLoc') ? searchParams.get('atsLoc')!.split(',').filter(Boolean) : []
  )

  // Salary Band reference — initialise from URL so it survives back navigation
  const [bandRef, setBandRefState] = useState<PositionEntry | null>(() => {
    const bp = searchParams.get('atsBandPos')
    const bl = searchParams.get('atsBandLevel')
    if (!bp || !salaryBandsData) return null
    return salaryBandsData.positions.find(p => p.position === bp && p.level === bl) ?? null
  })
  const [bandQuery, setBandQuery] = useState(searchParams.get('atsBandPos') ?? '')
  const [showBandDropdown, setShowBandDropdown] = useState(false)

  // Helper: persist all ATS state to URL without pushing history
  const syncUrl = useCallback((overrides: {
    pos?: string; period?: string; grade?: string; salary?: string; locs?: string[]
    bandPos?: string | null; bandLevel?: string | null
  }) => {
    const p = new URLSearchParams()
    p.set('tab', 'ats')
    p.set('atsPos', overrides.pos ?? position)
    p.set('atsPeriod', overrides.period ?? period)
    p.set('atsGrade', overrides.grade ?? gradeFilter)
    p.set('atsSalary', overrides.salary ?? salaryPeriod)
    const locs = overrides.locs ?? locationFilter
    if (locs.length) p.set('atsLoc', locs.join(','))
    // Persist band reference
    const bp = overrides.bandPos !== undefined ? overrides.bandPos : (bandRef?.position ?? null)
    const bl = overrides.bandLevel !== undefined ? overrides.bandLevel : (bandRef?.level ?? null)
    if (bp) p.set('atsBandPos', bp)
    if (bl) p.set('atsBandLevel', bl)
    router.replace(`/?${p.toString()}`, { scroll: false })
  }, [position, period, gradeFilter, salaryPeriod, locationFilter, bandRef, router])

  function setBandRef(entry: PositionEntry | null) {
    setBandRefState(entry)
    syncUrl({ bandPos: entry?.position ?? null, bandLevel: entry?.level ?? null })
  }

  const bandSuggestions = useMemo(() => {
    if (!salaryBandsData) return []
    const q = bandQuery.trim().toLowerCase()
    if (!q || q.length < 2) return []
    return salaryBandsData.positions.filter(p => p.position.toLowerCase().includes(q)).slice(0, 10)
  }, [bandQuery, salaryBandsData])

  // No didMount syncUrl — each filter change calls syncUrl explicitly.
  // Removing it prevents overwriting the restored URL on browser back navigation.

  function setPosition(v: string)      { setPositionState(v);      syncUrl({ pos: v, locs: [] }); setLocationFilterState([]) }
  function setPeriod(v: 'all'|'6m'|'3m') { setPeriodState(v);     syncUrl({ period: v }) }
  function setGradeFilter(v: string)   { setGradeFilterState(v);   syncUrl({ grade: v }) }
  function setSalaryPeriod(v: 'monthly'|'annual') { setSalaryPeriodState(v); syncUrl({ salary: v }) }
  function setLocationFilter(v: string[] | ((p: string[]) => string[])) {
    setLocationFilterState(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      syncUrl({ locs: next })
      return next
    })
  }

  // Lead/Head → Senior for display purposes
  const DISPLAY_GRADE_MAP: Record<string, string> = { Lead: 'Senior', Head: 'Senior' }
  function displayGrade(g: string) { return DISPLAY_GRADE_MAP[g] ?? g }

  const allCandidates = candidatesByPosition[position] ?? []
  const periodFiltered = filterByPeriod(allCandidates, period)

  // Available locations in current period-filtered set
  const availableLocations = [...new Set(periodFiltered.map(c => c.location))].sort()
  const activeLocationFilter = locationFilter.filter(l => availableLocations.includes(l))

  // Apply location filter
  const locationFiltered = activeLocationFilter.length
    ? periodFiltered.filter(c => activeLocationFilter.includes(c.location))
    : periodFiltered

  // Grade options — using display grades (Lead/Head merged into Senior), only with data
  const DISPLAY_GRADE_ORDER = ['Junior', 'Middle', 'Senior']
  const gradesWithData = ['all', ...DISPLAY_GRADE_ORDER.filter(g =>
    locationFiltered.some(c => displayGrade(c.exp_grade) === g)
  )]
  const effectiveGradeFilter = gradesWithData.includes(gradeFilter) ? gradeFilter : 'all'

  const filtered = effectiveGradeFilter === 'all'
    ? locationFiltered
    : locationFiltered.filter(c => displayGrade(c.exp_grade) === effectiveGradeFilter)

  // Sort: Junior < Middle < Senior, then salary desc
  const sorted = [...filtered].sort((a, b) => {
    const ga = DISPLAY_GRADE_ORDER.indexOf(displayGrade(a.exp_grade))
    const gb = DISPLAY_GRADE_ORDER.indexOf(displayGrade(b.exp_grade))
    if (ga !== gb) return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb)
    return (b.salary_monthly_eur ?? 0) - (a.salary_monthly_eur ?? 0)
  })

  const dates = [...new Set(allCandidates.map(c => c.data_as_of).filter(Boolean))].sort()
  const lastUpdated = dates[dates.length - 1] ?? ''

  // Group sorted candidates by display grade — computed outside JSX so router closures work
  const gradeGroups = useMemo(() => {
    const groups: { grade: string; items: typeof sorted }[] = []
    for (const c of sorted) {
      const dg = displayGrade(c.exp_grade)
      const last = groups[groups.length - 1]
      if (last && last.grade === dg) last.items.push(c)
      else groups.push({ grade: dg, items: [c] })
    }
    return groups
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted])

  // Primary click: EXCLUSIVE select (radio-style, deselects others)
  function selectLocationExclusive(slug: string) {
    const isSelected = activeLocationFilter.includes(slug)
    setLocationFilter(isSelected ? [] : [slug])
  }
  // "+" click: ADDITIVE (add to existing multi-select)
  function addLocation(slug: string) {
    if (!activeLocationFilter.includes(slug))
      setLocationFilter(prev => [...prev, slug])
  }
  // Remove one from multi-select
  function removeLocation(slug: string) {
    setLocationFilter(prev => prev.filter(l => l !== slug))
  }

  function goCompare(loc: string) {
    router.push(`/compare?position=${position}&countries=${loc}&source=ats`)
  }

  const periodOpts: { v: 'all' | '6m' | '3m'; label: string }[] = [
    { v: 'all', label: t(lang, 'periodAll') },
    { v: '6m',  label: t(lang, 'period6m') },
    { v: '3m',  label: t(lang, 'period3m') },
  ]

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18, alignItems: 'center' }}>
        {/* Role */}
        {positions.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="eyebrow">{t(lang, 'selectPosition')}</span>
            <div className="seg">
              {positions.map(p => {
                const hasData = (candidatesByPosition[p.slug]?.length ?? 0) > 0
                return (
                  <button
                    key={p.slug}
                    aria-pressed={position === p.slug}
                    disabled={!hasData}
                    onClick={() => { if (hasData) { setPosition(p.slug); setLocationFilter([]) } }}
                    title={!hasData ? (lang === 'ru' ? 'Данные скоро появятся' : 'Coming soon') : undefined}
                    style={!hasData ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                  >
                    {p.name[lang]}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Salary Band reference picker */}
        {salaryBandsData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="eyebrow">💰 {lang === 'ru' ? 'Band-эталон' : 'Band ref'}</span>
            <div style={{ position: 'relative' }}>
              <input type="text" value={bandQuery}
                onChange={e => { setBandQuery(e.target.value); setShowBandDropdown(true); if (!e.target.value) setBandRef(null) }}
                onFocus={() => setShowBandDropdown(true)}
                onBlur={() => setTimeout(() => setShowBandDropdown(false), 150)}
                placeholder={lang === 'ru' ? 'Позиция…' : 'Position…'}
                style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 12, outline: 'none', width: 180 }}
              />
              {showBandDropdown && bandSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 2, width: 280, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)', maxHeight: 220, overflowY: 'auto' }}>
                  {bandSuggestions.map((p, i) => (
                    <button key={i} onMouseDown={() => { setBandRef(p); setBandQuery(p.position); setShowBandDropdown(false) }}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '7px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', fontSize: 12 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ color: 'var(--text)' }}>{p.position}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{p.level}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {bandRef && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{bandRef.level}</span>}
          </div>
        )}

        {/* Period */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow">{t(lang, 'atsPeriodLabel')}</span>
          <div className="seg">
            {periodOpts.map(o => (
              <button key={o.v} aria-pressed={period === o.v} onClick={() => setPeriod(o.v)}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* Grade — only grades with data (Lead/Head merged into Senior) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow">{t(lang, 'gradeFilter')}</span>
          <div className="seg">
            {gradesWithData.map(g => (
              <button key={g} aria-pressed={effectiveGradeFilter === g}
                onClick={() => setGradeFilter(g)}>
                {g === 'all' ? t(lang, 'allGrades') : g}
              </button>
            ))}
          </div>
        </div>


        {/* Monthly/Annual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <div className="seg">
            <button aria-pressed={salaryPeriod === 'monthly'} onClick={() => setSalaryPeriod('monthly')}>{t(lang, 'monthly')}</button>
            <button aria-pressed={salaryPeriod === 'annual'} onClick={() => setSalaryPeriod('annual')}>{t(lang, 'annual')}</button>
          </div>
        </div>
      </div>

      {/* Location filter pills */}
      {availableLocations.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="eyebrow">{t(lang, 'locationCol')}</span>

            {/* All pill */}
            <button
              onClick={() => setLocationFilter([])}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 13, fontWeight: activeLocationFilter.length === 0 ? 600 : 400,
                padding: '4px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                border: '1px solid',
                borderColor: activeLocationFilter.length === 0 ? 'var(--accent)' : 'var(--border-strong)',
                background: activeLocationFilter.length === 0 ? 'var(--accent-soft)' : 'var(--surface)',
                color: activeLocationFilter.length === 0 ? 'var(--text)' : 'var(--text-2)',
                transition: 'all .12s',
              }}
            >
              {lang === 'ru' ? 'Все' : 'All'}
            </button>

            {/* Individual location pills */}
            {availableLocations.map(slug => {
              const loc = locationMeta[slug]
              const on = activeLocationFilter.includes(slug)
              const hasFilter = activeLocationFilter.length > 0
              const pillStyle: React.CSSProperties = {
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 13, fontWeight: on ? 600 : 400,
                padding: on ? '4px 6px 4px 12px' : '4px 12px',
                borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                border: '1px solid',
                borderColor: on ? 'var(--accent)' : 'var(--border-strong)',
                background: on ? 'var(--accent-soft)' : 'var(--surface)',
                color: on ? 'var(--text)' : 'var(--text-2)',
                transition: 'all .12s',
              }

              if (on) {
                // Selected: show flag + name + × to deselect
                return (
                  <button key={slug} onClick={() => removeLocation(slug)} style={pillStyle}
                    title={lang === 'ru' ? 'Убрать из выборки' : 'Remove from selection'}>
                    <span>{loc?.flag ?? '🌐'}</span>
                    <span>{loc?.name[lang] ?? slug}</span>
                    <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 2 }}>×</span>
                  </button>
                )
              } else if (hasFilter) {
                // Other countries: pill = exclusive switch, + = additive
                return (
                  <span key={slug} style={{ display: 'inline-flex', gap: 2 }}>
                    <button onClick={() => selectLocationExclusive(slug)} style={{ ...pillStyle, borderRadius: '999px 0 0 999px', paddingRight: 8 }}
                      title={lang === 'ru' ? 'Показать только эту страну' : 'Show only this country'}>
                      <span>{loc?.flag ?? '🌐'}</span>
                      <span>{loc?.name[lang] ?? slug}</span>
                    </button>
                    <button onClick={() => addLocation(slug)}
                      title={lang === 'ru' ? 'Добавить к сравнению' : 'Add to comparison'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 26, borderRadius: '0 999px 999px 0', cursor: 'pointer',
                        fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
                        border: '1px solid var(--border-strong)', borderLeft: 'none',
                        background: 'var(--surface)', color: 'var(--muted)',
                        transition: 'all .12s',
                      }}>
                      +
                    </button>
                  </span>
                )
              } else {
                // No filter active: single click = exclusive select
                return (
                  <button key={slug} onClick={() => selectLocationExclusive(slug)} style={pillStyle}>
                    <span>{loc?.flag ?? '🌐'}</span>
                    <span>{loc?.name[lang] ?? slug}</span>
                  </button>
                )
              }
            })}
          </div>

          {/* Hint */}
          {activeLocationFilter.length === 1 && (
            <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 6, paddingLeft: 2 }}>
              {lang === 'ru'
                ? 'Нажмите «+» рядом с другой страной, чтобы добавить её к сравнению'
                : 'Click «+» next to another country to add it to the comparison'}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {allCandidates.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12.5, color: 'var(--muted)', alignItems: 'center' }}>
          <span>
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{sorted.length}</span>
            {filtered.length !== allCandidates.length && <span style={{ color: 'var(--muted-2)' }}> / {allCandidates.length}</span>}
            {' '}{t(lang, 'atsCandidates')}
          </span>
          {lastUpdated && (
            <span style={{ marginLeft: 'auto' }}>
              {t(lang, 'atsUpdated')}: <span style={{ color: 'var(--text-2)' }}>{formatDate(lastUpdated, lang)}</span>
            </span>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          {t(lang, 'noAtsDataForRole')}
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          {(() => {
            const colCount = bandRef ? 8 : 7
            return (
          <table className="data no-row-hover">
            <thead>
              <tr>
                <th style={{ minWidth: 130 }}>{t(lang, 'locationCol')}</th>
                <th style={{ textAlign: 'right', minWidth: 110 }}>
                  {salaryPeriod === 'monthly' ? t(lang, 'salaryMonthly') : t(lang, 'annualApprox')}
                </th>
                <th style={{ minWidth: 70, textAlign: 'center' }}
                  title={lang === 'ru' ? 'vs медиана mid-market для этой локации' : 'vs mid-market median for this location'}>
                  {lang === 'ru' ? 'vs рынок' : 'vs market'}
                </th>
                {bandRef && (
                  <th style={{ minWidth: 80, textAlign: 'center' }} title={`${bandRef.position} (${bandRef.level})`}>
                    💰 vs band
                  </th>
                )}
                <th style={{ minWidth: 160 }}>{t(lang, 'originalSalary')}</th>
                <th style={{ textAlign: 'right', width: 55 }}>{t(lang, 'expYears')}</th>
                <th style={{ textAlign: 'center', width: 70 }}>{t(lang, 'dataDate')}</th>
                <th style={{ paddingRight: 16 }}></th>
              </tr>
            </thead>
            <tbody>
              {gradeGroups.map(group => (
                <>
                  {/* Grade section header */}
                  <tr key={`hdr-${group.grade}`}>
                    <td colSpan={colCount} style={{
                      paddingTop: 14, paddingBottom: 6, paddingLeft: 16,
                      background: 'var(--surface-2)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span className="dot" style={{ background: GRADE_VAR[group.grade] ?? 'var(--muted)', width: 9, height: 9 }} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{group.grade}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>· {group.items.length}</span>
                      </span>
                    </td>
                  </tr>
                  {group.items.map((c, i) => {
                    const loc = locationMeta[c.location]
                    const dg = displayGrade(c.exp_grade)
                    const bmGrades = benchmarkGrades[position]?.[c.location] ?? []
                    const bm = getBenchmark(c.salary_monthly_eur, c.location, dg, bmGrades)
                    // Band indicator with %
                    let bandStatus: 'within' | 'above' | 'below' | 'unknown' = 'unknown'
                    let bandPct = 0
                    let bandNormStr = ''
                    if (bandRef && salaryBandsData && c.salary_monthly_eur) {
                      const country = RESEARCH_COUNTRY_MAP[c.location] ?? c.location
                      const br = lookupBand(salaryBandsData.hubs, salaryBandsData.bands, bandRef, country)
                      if (br) {
                        bandStatus = compareToBand(c.salary_monthly_eur, br.salary)
                        const norm = normaliseToMonthlyEur(br.salary)
                        bandNormStr = `€${norm.min}K–€${norm.max}K (median €${norm.median}K)`
                        if (norm.median > 0)
                          bandPct = Math.round(((c.salary_monthly_eur - norm.median) / norm.median) * 100)
                      }
                    }
                    const bandBtnStyle = {
                      fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      padding: '4px 10px', borderRadius: 'var(--r-sm)', whiteSpace: 'nowrap' as const,
                      border: '1px solid var(--border-strong)', background: 'var(--surface-2)',
                      color: 'var(--text-2)', transition: 'all .12s',
                    }
                    return (
                      <tr key={i}>
                        {/* Location */}
                        <td style={{ paddingLeft: 16 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <span>{loc?.flag ?? '🌐'}</span>
                            <span>{loc?.name[lang] ?? c.location}</span>
                          </span>
                        </td>
                        {/* Salary EUR */}
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 600, fontSize: 14 }}>
                          {c.salary_monthly_eur ? (
                            <span>
                              {fmtSalary(c.salary_monthly_eur, salaryPeriod)}
                              {c.outlier && <span title={t(lang, 'outlierBadge')} style={{ marginLeft: 4, fontSize: 11, color: 'var(--warn)' }}>⚠</span>}
                            </span>
                          ) : '—'}
                        </td>
                        {/* vs market */}
                        <td style={{ textAlign: 'center' }}>
                          <BenchmarkBadge result={bm} lang={lang} />
                        </td>
                        {/* vs band with % */}
                        {bandRef && (
                          <td style={{ textAlign: 'center' }}>
                            {bandStatus === 'unknown' ? (
                              <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
                            ) : (
                              <span className="mono" title={bandNormStr} style={{
                                fontSize: 11.5, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                                background: bandStatus === 'within' ? 'var(--pos-bg)' : bandStatus === 'above' ? 'var(--warn-bg)' : 'color-mix(in srgb, var(--accent) 12%, transparent)',
                                color: bandStatus === 'within' ? 'var(--pos)' : bandStatus === 'above' ? 'var(--warn)' : 'var(--accent)',
                              }}>
                                {bandStatus === 'above' ? '↑' : bandStatus === 'below' ? '↓' : '≈'}
                                {' '}{bandPct > 0 ? '+' : ''}{bandPct}%
                              </span>
                            )}
                          </td>
                        )}
                        {/* Original */}
                        <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 180 }} title={c.salary_original_raw}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.salary_original_raw}
                          </span>
                          {c.gross_net !== 'gross' && c.gross_net && (
                            <span style={{ fontSize: 10, color: 'var(--muted-2)', textTransform: 'uppercase' }}>{c.gross_net}</span>
                          )}
                        </td>
                        {/* Exp */}
                        <td className="mono" style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--muted)' }}>
                          {c.go_exp_years != null ? c.go_exp_years + 'y' : '—'}
                        </td>
                        {/* Date */}
                        <td className="mono" style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted-2)' }}>
                          {formatDate(c.data_as_of, lang)}
                        </td>
                        {/* Action buttons */}
                        <td style={{ paddingRight: 16 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => goCompare(c.location)} style={bandBtnStyle}>
                              ↗ {t(lang, 'compareWithMarket')}
                            </button>
                            {bandRef && (
                              <button
                                onClick={() => router.push(`/?tab=bands&bandsPos=${encodeURIComponent(bandRef.position)}`)}
                                style={{ ...bandBtnStyle, borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', color: 'var(--accent)', background: 'var(--accent-soft)' }}
                                title={`${bandRef.position} · ${bandRef.level}`}
                              >
                                💰 Band
                              </button>
                            )}
                          </div>
                        </td>
                  </tr>
                )
              })}
                </>
              ))}
            </tbody>
          </table>
            )
          })()}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11.5, color: 'var(--muted-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, color: 'var(--muted)' }}>
          {lang === 'ru' ? 'vs рынок:' : 'vs market:'}
        </span>
        <span><span style={{ color: 'var(--warn)', fontWeight: 600 }}>↑</span> {lang === 'ru' ? 'выше mid-market бенчмарка (>+10%)' : 'above mid-market benchmark (>+10%)'}</span>
        <span><span style={{ color: 'var(--pos)',  fontWeight: 600 }}>↓</span> {lang === 'ru' ? 'ниже mid-market бенчмарка (>-10%)' : 'below mid-market benchmark (>-10%)'}</span>
        <span><span style={{ color: 'var(--muted)', fontWeight: 600 }}>≈</span> {lang === 'ru' ? 'на уровне рынка (±10%)' : 'at market rate (±10%)'}</span>
        <span style={{ marginLeft: 'auto' }}>
          {lang === 'ru'
            ? '⚠ выбросы помечены · все значения нормализованы в EUR/мес gross'
            : '⚠ outliers marked · all values normalized to EUR/mo gross'}
        </span>
      </div>
    </div>
  )
}
