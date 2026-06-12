'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CandidateWithLocation, GradeRow } from '@/lib/types'
import type { PositionMeta, LocationMeta } from '@/lib/types'
import { t, GRADE_ORDER, GRADE_VAR } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'

interface Props {
  positions: PositionMeta[]
  candidatesByPosition: Record<string, CandidateWithLocation[]>
  locationMeta: Record<string, LocationMeta>
  // position → location → GradeRow[] (market benchmark)
  benchmarkGrades: Record<string, Record<string, GradeRow[]>>
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

export default function AtsPipelineView({ positions, candidatesByPosition, locationMeta, benchmarkGrades }: Props) {
  const { lang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Default: first position that has ATS data, fallback to positions[0]
  const defaultPos = positions.find(p => (candidatesByPosition[p.slug]?.length ?? 0) > 0)?.slug
    ?? positions[0]?.slug ?? ''

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

  // Helper: persist all ATS state to URL without pushing history
  const syncUrl = useCallback((overrides: {
    pos?: string; period?: string; grade?: string; salary?: string; locs?: string[]
  }) => {
    const p = new URLSearchParams()
    p.set('tab', 'ats')
    p.set('atsPos', overrides.pos ?? position)
    p.set('atsPeriod', overrides.period ?? period)
    p.set('atsGrade', overrides.grade ?? gradeFilter)
    p.set('atsSalary', overrides.salary ?? salaryPeriod)
    const locs = overrides.locs ?? locationFilter
    if (locs.length) p.set('atsLoc', locs.join(','))
    router.replace(`/?${p.toString()}`, { scroll: false })
  }, [position, period, gradeFilter, salaryPeriod, locationFilter, router])

  // On mount: always write current state to URL (ensures back navigation restores position)
  const didMount = useRef(false)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      syncUrl({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function toggleLocation(slug: string) {
    setLocationFilter(prev =>
      prev.includes(slug) ? prev.filter(l => l !== slug) : [...prev, slug]
    )
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
              {positions.map(p => (
                <button key={p.slug} aria-pressed={position === p.slug}
                  onClick={() => { setPosition(p.slug); setLocationFilter([]) }}>
                  {p.name[lang]}
                </button>
              ))}
            </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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
            return (
              <button
                key={slug}
                onClick={() => toggleLocation(slug)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 13, fontWeight: on ? 600 : 400, padding: '4px 12px',
                  borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  border: '1px solid',
                  borderColor: on ? 'var(--accent)' : 'var(--border-strong)',
                  background: on ? 'var(--accent-soft)' : 'var(--surface)',
                  color: on ? 'var(--text)' : 'var(--text-2)',
                  transition: 'all .12s',
                }}
              >
                <span>{loc?.flag ?? '🌐'}</span>
                <span>{loc?.name[lang] ?? slug}</span>
              </button>
            )
          })}
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
          <table className="data">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16, minWidth: 90 }}>{t(lang, 'grade')}</th>
                <th style={{ minWidth: 130 }}>{t(lang, 'locationCol')}</th>
                <th style={{ textAlign: 'right', minWidth: 110 }}>
                  {salaryPeriod === 'monthly' ? t(lang, 'salaryMonthly') : t(lang, 'annualApprox')}
                </th>
                <th style={{ minWidth: 60, textAlign: 'center' }}
                  title={lang === 'ru' ? 'Сравнение с медианой mid-market бенчмарка для этой локации' : 'vs mid-market benchmark median for this location'}>
                  {lang === 'ru' ? 'vs рынок' : 'vs market'}
                </th>
                <th style={{ minWidth: 160 }}>{t(lang, 'originalSalary')}</th>
                <th style={{ textAlign: 'right', width: 55 }}>{t(lang, 'expYears')}</th>
                <th style={{ textAlign: 'center', width: 70 }}>{t(lang, 'dataDate')}</th>
                <th style={{ paddingRight: 16, width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const loc = locationMeta[c.location]
                const dg = displayGrade(c.exp_grade)   // Lead/Head → Senior
                const gradeColor = GRADE_VAR[dg]
                const bmGrades = benchmarkGrades[position]?.[c.location] ?? []
                const bm = getBenchmark(c.salary_monthly_eur, c.location, dg, bmGrades)
                return (
                  <tr key={i}>
                    {/* Grade (Lead/Head shown as Senior) */}
                    <td style={{ paddingLeft: 16 }}>
                      {dg && dg !== 'unknown' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span className="dot" style={{ background: gradeColor, width: 8, height: 8 }} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{dg}</span>
                        </span>
                      ) : <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>}
                    </td>
                    {/* Location */}
                    <td>
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
                    {/* Benchmark indicator */}
                    <td style={{ textAlign: 'center' }}>
                      <BenchmarkBadge result={bm} lang={lang} />
                    </td>
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
                    {/* Compare */}
                    <td style={{ paddingRight: 16 }}>
                      <button
                        onClick={() => goCompare(c.location)}
                        style={{
                          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          padding: '4px 10px', borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border-strong)', background: 'var(--surface-2)',
                          color: 'var(--text-2)', whiteSpace: 'nowrap', transition: 'all .12s',
                        }}
                      >
                        ↗ {t(lang, 'compareWithMarket')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
