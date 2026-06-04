'use client'
import type { GradeRow } from '@/lib/types'
import type { Segment } from '@/lib/types'
import { t, GRADE_ORDER, SEGMENT_ORDER } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'
import ConfidenceBadge from './ConfidenceBadge'

function fmt(n: number, currency: string) {
  if (currency === 'RUB') return `${(n / 1000).toFixed(0)}K ₽`
  return `€${n.toLocaleString()}`
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

  if (!filtered.length) return <p className="text-gray-400 text-sm py-4">{t(lang, 'noData')}</p>

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
            <th className="py-2 pr-4">{t(lang, 'grade')}</th>
            <th className="py-2 pr-4">{t(lang, 'expYears')}</th>
            <th className="py-2 pr-4">{t(lang, 'segment')}</th>
            <th className="py-2 pr-4 text-right">{t(lang, period === 'annual' ? 'annualMin' : 'monthlyMin')}</th>
            <th className="py-2 pr-4 text-right">{t(lang, period === 'annual' ? 'annualMax' : 'monthlyMax')}</th>
            <th className="py-2 pr-4">{t(lang, 'confidence')}</th>
            <th className="py-2 max-w-xs">{t(lang, 'notes')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((r, i) => {
            const min = period === 'annual' ? r.annual_gross_min : r.monthly_gross_min
            const max = period === 'annual' ? r.annual_gross_max : r.monthly_gross_max
            return (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-2 pr-4 font-semibold text-gray-900">{r.grade}</td>
                <td className="py-2 pr-4 text-gray-500">{r.exp_years} yr</td>
                <td className="py-2 pr-4">
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {t(lang, r.segment as 'local_sme' | 'mid_market' | 'premium')}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right font-mono text-gray-700">{fmt(min, r.currency)}</td>
                <td className="py-2 pr-4 text-right font-mono text-gray-900 font-medium">{fmt(max, r.currency)}</td>
                <td className="py-2 pr-4"><ConfidenceBadge value={r.confidence} /></td>
                <td className="py-2 text-gray-500 text-xs max-w-xs truncate" title={r.notes}>{r.notes}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
