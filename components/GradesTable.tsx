'use client'
import type { GradeRow } from '@/lib/types'
import type { Segment } from '@/lib/types'
import { t, GRADE_ORDER, SEGMENT_ORDER, GRADE_STYLES } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'
import ConfidenceBadge from './ConfidenceBadge'

function fmt(n: number, currency: string) {
  if (currency === 'RUB') return `${Math.round(n / 1000)}K ₽`
  return `€${n.toLocaleString()}`
}

function fmtShort(n: number, currency: string) {
  if (currency === 'RUB') return `${Math.round(n / 1000)}K`
  return `€${Math.round(n / 1000)}K`
}

interface Props {
  rows: GradeRow[]
  segment: Segment | 'all'
  period: 'annual' | 'monthly'
}

export default function GradesTable({ rows, segment, period }: Props) {
  const { lang } = useLang()

  const filtered = rows
    .filter((r) => segment === 'all' || r.segment === segment)
    .sort((a, b) => {
      const gi = GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)
      if (gi !== 0) return gi
      return SEGMENT_ORDER.indexOf(a.segment) - SEGMENT_ORDER.indexOf(b.segment)
    })

  if (!filtered.length) return <p className="text-sm py-4" style={{ color: 'var(--muted)' }}>{t(lang, 'noData')}</p>

  const overallMax = Math.max(...filtered.map((r) =>
    period === 'annual' ? r.annual_gross_max : r.monthly_gross_max
  ), 1)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            <th className="py-2 pr-4 text-left">{t(lang, 'grade')}</th>
            <th className="py-2 pr-4 text-left">{t(lang, 'segment')}</th>
            <th className="py-2 pr-4 text-left" style={{ minWidth: 180 }}>Range</th>
            <th className="py-2 pr-4 text-right whitespace-nowrap">{t(lang, period === 'annual' ? 'annual' : 'monthly')}</th>
            <th className="py-2 pr-2 text-left">{t(lang, 'confidence')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => {
            const min = period === 'annual' ? r.annual_gross_min : r.monthly_gross_min
            const max = period === 'annual' ? r.annual_gross_max : r.monthly_gross_max
            const style = GRADE_STYLES[r.grade] ?? GRADE_STYLES['Head']
            const leftPct = (min / overallMax) * 100
            const widthPct = ((max - min) / overallMax) * 100
            const monthly = r.monthly_gross_min && r.monthly_gross_max
              ? `${fmtShort(r.monthly_gross_min, r.currency)} – ${fmtShort(r.monthly_gross_max, r.currency)}`
              : '—'
            const annual = `${fmt(r.annual_gross_min, r.currency)} – ${fmt(r.annual_gross_max, r.currency)}`

            return (
              <tr
                key={i}
                style={{ borderBottom: '1px solid var(--border)' }}
                className="transition-colors hover:bg-white/[0.02]"
              >
                {/* Grade badge */}
                <td className="py-3 pr-4 whitespace-nowrap">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ color: style.text, background: style.bg, border: `1px solid ${style.border}` }}
                  >
                    {r.grade}
                  </span>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.exp_years} yr</div>
                </td>

                {/* Company size */}
                <td className="py-3 pr-4">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--card2)', color: 'var(--muted)' }}>
                    {t(lang, r.segment as 'local_sme' | 'mid_market' | 'premium')}
                  </span>
                </td>

                {/* Range bar */}
                <td className="py-3 pr-4" style={{ minWidth: 180 }}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full relative" style={{ background: 'var(--border)', minWidth: 80 }}>
                      <div
                        className="absolute top-0 h-full rounded-full"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: style.text }}
                      />
                    </div>
                    <span className="text-xs whitespace-nowrap font-mono" style={{ color: 'var(--muted)' }}>
                      {period === 'annual' ? annual : monthly}
                    </span>
                  </div>
                </td>

                {/* Monthly (shown when period=annual, as secondary info) */}
                <td className="py-3 pr-4 text-right">
                  {period === 'annual' ? (
                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>{monthly}/mo</span>
                  ) : (
                    <span className="text-xs font-mono whitespace-nowrap" style={{ color: style.text }}>{annual}/yr</span>
                  )}
                </td>

                {/* Confidence */}
                <td className="py-3"><ConfidenceBadge value={r.confidence} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
