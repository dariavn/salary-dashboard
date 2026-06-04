'use client'
import type { GradeRow } from '@/lib/types'
import type { Segment } from '@/lib/types'
import { t, GRADE_ORDER, SEGMENT_ORDER, GRADE_KEY, GRADE_VAR } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'
import ConfidenceBadge from './ConfidenceBadge'

function fmtVal(n: number, cur: string, period: 'annual' | 'monthly') {
  if (cur === 'RUB') return Math.round(n / 1000) + 'K ₽'
  if (period === 'monthly') return '€' + (n / 1000).toFixed(1) + 'K'
  return '€' + Math.round(n / 1000) + 'K'
}

interface Props {
  rows: GradeRow[]
  segment: Segment | 'all'
  period: 'annual' | 'monthly'
  lang?: Lang
}

const CONF_RANK = { high: 3, medium: 2, low: 1 } as const

export default function GradesTable({ rows, segment, period, lang: langProp }: Props) {
  const ctx = useLang()
  const lang = langProp ?? ctx.lang

  const lo = (r: GradeRow) => period === 'annual' ? r.annual_gross_min : r.monthly_gross_min
  const hi = (r: GradeRow) => period === 'annual' ? r.annual_gross_max : r.monthly_gross_max

  // When "all sizes": collapse to one row per grade (full-market range, no segment column)
  type DisplayRow = { grade: string; exp_years: string; currency: string; min: number; max: number; confidence: GradeRow['confidence'] }

  let displayRows: DisplayRow[]

  if (segment === 'all') {
    displayRows = GRADE_ORDER.flatMap(grade => {
      const gradeRows = rows.filter(r => r.grade === grade)
      if (!gradeRows.length) return []
      const currency = gradeRows[0].currency
      const min = Math.min(...gradeRows.map(lo))
      const max = Math.max(...gradeRows.map(hi))
      const avgRank = gradeRows.reduce((s, r) => s + (CONF_RANK[r.confidence] ?? 1), 0) / gradeRows.length
      const confidence: GradeRow['confidence'] = avgRank >= 2.5 ? 'high' : avgRank >= 1.7 ? 'medium' : 'low'
      return [{ grade, exp_years: gradeRows[0].exp_years, currency, min, max, confidence }]
    })
  } else {
    const filtered = rows
      .filter(r => r.segment === segment)
      .sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade))
    displayRows = filtered.map(r => ({ grade: r.grade, exp_years: r.exp_years, currency: r.currency, min: lo(r), max: hi(r), confidence: r.confidence }))
  }

  if (!displayRows.length) return <p style={{ color: 'var(--muted)', padding: 16, fontSize: 14 }}>{t(lang, 'noData')}</p>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data">
        <thead>
          <tr>
            <th>{t(lang, 'grade')}</th>
            <th style={{ textAlign: 'right' }}>{t(lang, period === 'annual' ? 'annual' : 'monthly')}</th>
            <th style={{ textAlign: 'right', width: 1 }}></th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((r, i) => (
            <tr key={i}>
              <td style={{ whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span className="dot" style={{ background: GRADE_VAR[r.grade], width: 8, height: 8 }} />
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{t(lang, GRADE_KEY[r.grade]!)}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{r.exp_years} {t(lang, 'years')}</span>
                </span>
              </td>
              <td className="mono" style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {fmtVal(r.min, r.currency, period)} – {fmtVal(r.max, r.currency, period)}
              </td>
              <td style={{ textAlign: 'right', width: 1, paddingLeft: 6 }}>
                <ConfidenceBadge value={r.confidence} lang={lang} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
