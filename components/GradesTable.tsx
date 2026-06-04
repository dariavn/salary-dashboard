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

export default function GradesTable({ rows, segment, period, lang: langProp }: Props) {
  const ctx = useLang()
  const lang = langProp ?? ctx.lang

  const filtered = rows
    .filter(r => segment === 'all' || r.segment === segment)
    .sort((a, b) => {
      const gi = GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)
      return gi !== 0 ? gi : SEGMENT_ORDER.indexOf(a.segment) - SEGMENT_ORDER.indexOf(b.segment)
    })

  if (!filtered.length) return <p style={{ color: 'var(--muted)', padding: 16, fontSize: 14 }}>{t(lang, 'noData')}</p>

  const lo = (r: GradeRow) => period === 'annual' ? r.annual_gross_min : r.monthly_gross_min
  const hi = (r: GradeRow) => period === 'annual' ? r.annual_gross_max : r.monthly_gross_max

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data">
        <thead>
          <tr>
            <th>{t(lang, 'grade')}</th>
            {segment === 'all' && <th>{t(lang, 'segment')}</th>}
            <th style={{ textAlign: 'right' }}>{t(lang, period === 'annual' ? 'annual' : 'monthly')}</th>
            <th style={{ textAlign: 'right', width: 1 }}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              <td style={{ whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span className="dot" style={{ background: GRADE_VAR[r.grade], width: 8, height: 8 }} />
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{t(lang, GRADE_KEY[r.grade]!)}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{r.exp_years} {t(lang, 'years')}</span>
                </span>
              </td>
              {segment === 'all' && (
                <td><span style={{ fontSize: 12, color: 'var(--text-2)' }}>{t(lang, r.segment as 'local_sme' | 'mid_market' | 'premium')}</span></td>
              )}
              <td className="mono" style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {fmtVal(lo(r), r.currency, period)} – {fmtVal(hi(r), r.currency, period)}
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
