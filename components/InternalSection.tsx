'use client'
import type { CandidateRow } from '@/lib/types'
import type { LocationMeta } from '@/lib/types'
import type { Lang } from '@/lib/i18n'
import { t, GRADE_ORDER, GRADE_VAR, SERIES } from '@/lib/i18n'

interface Entry {
  meta: LocationMeta
  candidates: CandidateRow[]
  color: string
}

interface Props {
  allData: Entry[]
  period: 'annual' | 'monthly'
  lang: Lang
}

function fmtEur(n: number, period: 'annual' | 'monthly') {
  const v = period === 'annual' ? n * 12 : n
  return '€' + Math.round(v / 1000) + 'K'
}

function confFromN(n: number): { label: string; color: string } {
  if (n >= 5) return { label: '▲ high', color: 'var(--pos)' }
  if (n >= 3) return { label: '◆ med', color: 'var(--warn)' }
  return { label: '▽ low', color: 'var(--neutral)' }
}

export default function InternalSection({ allData, period, lang }: Props) {
  // Aggregate candidates per entry per grade (exclude outliers)
  function aggregateByGrade(candidates: CandidateRow[]) {
    const filtered = candidates.filter(c => !c.outlier && c.salary_monthly_eur != null)
    const byGrade: Record<string, number[]> = {}
    for (const c of filtered) {
      const g = c.exp_grade === 'unknown' ? null : c.exp_grade
      if (!g) continue
      if (!byGrade[g]) byGrade[g] = []
      byGrade[g].push(c.salary_monthly_eur!)
    }
    return byGrade
  }

  // Collect latest data_as_of across all candidates
  function latestDate(candidates: CandidateRow[]) {
    const dates = candidates.map(c => c.data_as_of).filter(Boolean).sort()
    if (!dates.length) return ''
    const d = dates[dates.length - 1] // e.g. "2026-06"
    const [y, m] = d.split('-')
    const months: Record<string, string> = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
    }
    const monthsRu: Record<string, string> = {
      '01': 'янв', '02': 'фев', '03': 'мар', '04': 'апр',
      '05': 'май', '06': 'июн', '07': 'июл', '08': 'авг',
      '09': 'сен', '10': 'окт', '11': 'ноя', '12': 'дек',
    }
    return lang === 'ru' ? `${monthsRu[m] ?? m} ${y}` : `${months[m] ?? m} ${y}`
  }

  const hasAny = allData.some(e => e.candidates.length > 0)

  if (!hasAny) {
    return (
      <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: 14 }}>
        {t(lang, 'noAtsData')}
      </div>
    )
  }

  const gridCols = allData.length <= 2 ? `repeat(${allData.length}, 1fr)` : 'repeat(3, 1fr)'

  return (
    <div>
      {/* ATS notice banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', border: '1px solid var(--accent-ring)', fontSize: 13, color: 'var(--text-2)' }}>
        <span style={{ fontSize: 16 }}>🏢</span>
        <span>{t(lang, 'atsNotice')}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {t(lang, 'atsOutlierNote')}
        </span>
      </div>

      {/* Per-country tables */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 18 }}>
        {allData.map((entry, i) => {
          const byGrade = aggregateByGrade(entry.candidates)
          const totalN = entry.candidates.filter(c => !c.outlier && c.salary_monthly_eur != null).length
          const outlierN = entry.candidates.filter(c => c.outlier).length
          const updated = latestDate(entry.candidates)

          return (
            <div key={entry.meta.slug} className="card" style={{ padding: '4px 4px 0', overflow: 'hidden' }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 10px' }}>
                <span className="dot" style={{ background: entry.color, width: 8, height: 8 }} />
                <span style={{ fontSize: 16 }}>{entry.meta.flag}</span>
                <span style={{ fontWeight: 600 }}>{entry.meta.name[lang]}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--muted-2)' }}>EUR</span>
              </div>

              {/* ATS source badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px 10px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-ring)' }}>
                  🏢 {t(lang, 'atsLabel')}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  N={totalN} {t(lang, 'atsCandidates')}
                  {outlierN > 0 && ` (${outlierN} excl.)`}
                </span>
                {updated && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-2)' }}>
                    {t(lang, 'atsUpdated')}: {updated}
                  </span>
                )}
              </div>

              {/* Grades table */}
              {totalN === 0 ? (
                <div style={{ padding: '12px 14px 16px', color: 'var(--muted)', fontSize: 13 }}>{t(lang, 'noAtsData')}</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data">
                    <thead>
                      <tr>
                        <th>{t(lang, 'grade')}</th>
                        <th style={{ textAlign: 'right' }}>{t(lang, period === 'annual' ? 'annual' : 'monthly')}</th>
                        <th style={{ textAlign: 'right', width: 1 }}>N</th>
                        <th style={{ textAlign: 'right', width: 1 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRADE_ORDER.map(grade => {
                        const vals = byGrade[grade]
                        if (!vals || !vals.length) return null
                        const min = Math.min(...vals)
                        const max = Math.max(...vals)
                        const conf = confFromN(vals.length)
                        return (
                          <tr key={grade}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                <span className="dot" style={{ background: GRADE_VAR[grade], width: 8, height: 8 }} />
                                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{grade}</span>
                              </span>
                            </td>
                            <td className="mono" style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                              {fmtEur(min, period)}
                              {min !== max && <> – {fmtEur(max, period)}</>}
                            </td>
                            <td className="mono" style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)', paddingLeft: 6 }}>{vals.length}</td>
                            <td style={{ textAlign: 'right', paddingLeft: 6 }}>
                              <span className="dot" title={conf.label} style={{ background: conf.color, width: 9, height: 9, display: 'inline-block' }} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
