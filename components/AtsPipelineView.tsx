'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { CandidateWithLocation } from '@/lib/types'
import type { PositionMeta, LocationMeta } from '@/lib/types'
import type { Lang } from '@/lib/i18n'
import { t, GRADE_ORDER, GRADE_VAR } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'

interface Props {
  positions: PositionMeta[]
  candidatesByPosition: Record<string, CandidateWithLocation[]>
  locationMeta: Record<string, LocationMeta>
}

function filterByPeriod(candidates: CandidateWithLocation[], period: string): CandidateWithLocation[] {
  if (period === 'all') return candidates
  const months = period === '3m' ? 3 : 6
  const now = new Date()
  return candidates.filter(c => {
    if (!c.data_as_of) return true
    const [y, m] = c.data_as_of.split('-').map(Number)
    const d = new Date(y, m - 1)
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months)
    return d >= cutoff
  })
}

function fmtSalary(n: number | null, period: 'monthly' | 'annual'): string {
  if (n == null) return '—'
  const v = period === 'annual' ? n * 12 : n
  return '€' + Math.round(v / 1000) + 'K'
}

export default function AtsPipelineView({ positions, candidatesByPosition, locationMeta }: Props) {
  const { lang } = useLang()
  const router = useRouter()
  const [position, setPosition] = useState(positions[0]?.slug ?? '')
  const [period, setPeriod] = useState<'all' | '6m' | '3m'>('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [salaryPeriod, setSalaryPeriod] = useState<'monthly' | 'annual'>('monthly')

  const allCandidates = candidatesByPosition[position] ?? []
  const periodFiltered = filterByPeriod(allCandidates, period)
  const filtered = gradeFilter === 'all'
    ? periodFiltered
    : periodFiltered.filter(c => c.exp_grade === gradeFilter)

  // Sort: grade order first, then by salary desc
  const sorted = [...filtered].sort((a, b) => {
    const ga = GRADE_ORDER.indexOf(a.exp_grade)
    const gb = GRADE_ORDER.indexOf(b.exp_grade)
    if (ga !== gb) return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb)
    return (b.salary_monthly_eur ?? 0) - (a.salary_monthly_eur ?? 0)
  })

  const hasData = sorted.length > 0
  const totalAll = allCandidates.length
  const activeN = allCandidates.filter(c => c.status === 'active').length
  const declinedN = allCandidates.filter(c => c.status === 'declined').length

  // Get unique dates for "last updated" badge
  const dates = [...new Set(allCandidates.map(c => c.data_as_of).filter(Boolean))].sort()
  const lastUpdated = dates[dates.length - 1] ?? ''

  function formatDate(d: string) {
    if (!d) return ''
    const [y, m] = d.split('-')
    const months = { '01': 'Jan','02': 'Feb','03': 'Mar','04': 'Apr','05': 'May','06': 'Jun','07': 'Jul','08': 'Aug','09': 'Sep','10': 'Oct','11': 'Nov','12': 'Dec' }
    const monthsRu = { '01': 'янв','02': 'фев','03': 'мар','04': 'апр','05': 'май','06': 'июн','07': 'июл','08': 'авг','09': 'сен','10': 'окт','11': 'ноя','12': 'дек' }
    return lang === 'ru' ? `${(monthsRu as any)[m] ?? m} ${y}` : `${(months as any)[m] ?? m} ${y}`
  }

  const periodOpts: { v: 'all' | '6m' | '3m'; label: string }[] = [
    { v: 'all', label: t(lang, 'periodAll') },
    { v: '6m',  label: t(lang, 'period6m') },
    { v: '3m',  label: t(lang, 'period3m') },
  ]

  const gradeOpts = ['all', ...GRADE_ORDER]

  function goCompare(loc: string) {
    router.push(`/compare?position=${position}&countries=${loc}&source=ats`)
  }

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20, alignItems: 'center' }}>
        {/* Role selector */}
        {positions.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="eyebrow">{t(lang, 'selectPosition')}</span>
            <div className="seg">
              {positions.map(p => (
                <button key={p.slug} aria-pressed={position === p.slug} onClick={() => setPosition(p.slug)}>
                  {p.name[lang]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Period filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow">{t(lang, 'atsPeriodLabel')}</span>
          <div className="seg">
            {periodOpts.map(o => (
              <button key={o.v} aria-pressed={period === o.v} onClick={() => setPeriod(o.v)}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* Grade filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow">{t(lang, 'gradeFilter')}</span>
          <div className="seg">
            {gradeOpts.map(g => (
              <button key={g} aria-pressed={gradeFilter === g} onClick={() => setGradeFilter(g)}>
                {g === 'all' ? t(lang, 'allGrades') : g}
              </button>
            ))}
          </div>
        </div>

        {/* Salary period */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <div className="seg">
            <button aria-pressed={salaryPeriod === 'monthly'} onClick={() => setSalaryPeriod('monthly')}>{t(lang, 'monthly')}</button>
            <button aria-pressed={salaryPeriod === 'annual'} onClick={() => setSalaryPeriod('annual')}>{t(lang, 'annual')}</button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {totalAll > 0 && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 12.5, color: 'var(--muted)' }}>
          <span>
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{totalAll}</span> {t(lang, 'atsCandidates')}
          </span>
          <span>
            <span className="dot" style={{ background: 'var(--pos)', width: 7, height: 7, display: 'inline-block', marginRight: 4 }} />
            {activeN} {t(lang, 'statusActive').toLowerCase()}
          </span>
          <span>
            <span className="dot" style={{ background: 'var(--neutral)', width: 7, height: 7, display: 'inline-block', marginRight: 4 }} />
            {declinedN} {t(lang, 'statusDeclined').toLowerCase()}
          </span>
          {lastUpdated && (
            <span style={{ marginLeft: 'auto' }}>
              {t(lang, 'atsUpdated')}: <span style={{ color: 'var(--text-2)' }}>{formatDate(lastUpdated)}</span>
            </span>
          )}
        </div>
      )}

      {!hasData ? (
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
                <th style={{ textAlign: 'right', minWidth: 120 }}>
                  {salaryPeriod === 'monthly' ? t(lang, 'salaryMonthly') : t(lang, 'annualApprox')}
                </th>
                <th style={{ minWidth: 160 }}>{t(lang, 'originalSalary')}</th>
                <th style={{ textAlign: 'right', width: 60 }}>{t(lang, 'expYears')}</th>
                <th style={{ textAlign: 'center', width: 80 }}>{t(lang, 'sourceType')}</th>
                <th style={{ textAlign: 'center', width: 70 }}>{t(lang, 'dataDate')}</th>
                <th style={{ paddingRight: 16, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const loc = locationMeta[c.location]
                const isOutlier = c.outlier
                const isActive = c.status === 'active'
                const gradeColor = GRADE_VAR[c.exp_grade]
                return (
                  <tr key={i} style={isOutlier ? { opacity: 0.6 } : undefined}>
                    {/* Grade */}
                    <td style={{ paddingLeft: 16 }}>
                      {c.exp_grade && c.exp_grade !== 'unknown' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span className="dot" style={{ background: gradeColor, width: 8, height: 8 }} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{c.exp_grade}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
                      )}
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
                        <span style={{ color: isOutlier ? 'var(--warn)' : 'var(--text)' }}>
                          {fmtSalary(c.salary_monthly_eur, salaryPeriod)}
                          {isOutlier && <span title={t(lang, 'outlierBadge')} style={{ marginLeft: 4, fontSize: 11, color: 'var(--warn)' }}>⚠</span>}
                        </span>
                      ) : '—'}
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
                    {/* Status */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="dot" title={isActive ? t(lang, 'statusActive') : t(lang, 'statusDeclined')}
                        style={{ background: isActive ? 'var(--pos)' : 'var(--neutral)', width: 8, height: 8, display: 'inline-block' }}
                      />
                    </td>
                    {/* Date */}
                    <td className="mono" style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted-2)' }}>
                      {formatDate(c.data_as_of)}
                    </td>
                    {/* Compare button */}
                    <td style={{ paddingRight: 16 }}>
                      <button
                        onClick={() => goCompare(c.location)}
                        style={{
                          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          padding: '4px 10px', borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border-strong)', background: 'var(--surface-2)',
                          color: 'var(--text-2)', whiteSpace: 'nowrap',
                          transition: 'all .12s',
                        }}
                        title={`${t(lang, 'compareWithMarket')} — ${loc?.name[lang] ?? c.location}`}
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

      <p style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 12 }}>
        {lang === 'ru'
          ? '⚠ Выбросы помечены знаком ⚠ и показаны с пониженной яркостью. Все значения нормализованы в EUR monthly gross.'
          : '⚠ Outliers are marked with ⚠ and shown at reduced opacity. All values normalized to EUR monthly gross.'}
      </p>
    </div>
  )
}
