'use client'
import type { DomainRow } from '@/lib/types'
import type { Tier } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t, TIER_LABELS, PRESENCE_LABELS } from '@/lib/i18n'
import ConfidenceBadge from './ConfidenceBadge'

const TIER_COLORS: Record<Tier, string> = {
  top:  'border-violet-400 bg-violet-50',
  high: 'border-blue-400 bg-blue-50',
  mid:  'border-emerald-400 bg-emerald-50',
  base: 'border-gray-300 bg-gray-50',
}

const TIER_BADGE: Record<Tier, string> = {
  top:  'bg-violet-100 text-violet-800',
  high: 'bg-blue-100 text-blue-800',
  mid:  'bg-emerald-100 text-emerald-800',
  base: 'bg-gray-100 text-gray-700',
}

function fmt(n: number | null, currency: string): string {
  if (n == null) return '—'
  if (currency === 'RUB') return `${Math.round(n / 1000)}K ₽`
  return `€${Math.round(n / 1000)}K`
}

function SalaryRow({ label, min, max, currency }: { label: string; min: number | null; max: number | null; currency: string }) {
  if (min == null && max == null) return null
  return (
    <tr className="text-xs">
      <td className="text-gray-500 pr-3 py-0.5">{label}</td>
      <td className="font-mono text-gray-700 text-right py-0.5">{fmt(min, currency)}</td>
      <td className="text-gray-400 px-1">–</td>
      <td className="font-mono text-gray-900 font-medium py-0.5">{fmt(max, currency)}</td>
    </tr>
  )
}

export default function DomainsGrid({ domains, currency }: { domains: DomainRow[]; currency: string }) {
  const { lang } = useLang()

  if (!domains.length) return <p className="text-gray-400 text-sm py-4">{t(lang, 'noData')}</p>

  const sorted = [...domains].sort((a, b) => {
    const order = ['top', 'high', 'mid', 'base']
    return order.indexOf(a.tier) - order.indexOf(b.tier)
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sorted.map((d, i) => (
        <div key={i} className={`rounded-xl border-2 p-4 ${TIER_COLORS[d.tier]}`}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <h4 className="font-bold text-gray-900 text-base leading-tight">
              {d.domain.replace(/_/g, ' ')}
            </h4>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_BADGE[d.tier]}`}>
                {TIER_LABELS[d.tier]?.[lang] ?? d.tier}
              </span>
              <span className="text-xs text-gray-500">
                {PRESENCE_LABELS[d.presence_in_region]?.[lang] ?? d.presence_in_region}
              </span>
            </div>
          </div>

          <table className="w-full mb-2">
            <tbody>
              <SalaryRow label="Jun" min={d.jun_annual_min} max={d.jun_annual_max} currency={currency} />
              <SalaryRow label="Mid" min={d.mid_annual_min} max={d.mid_annual_max} currency={currency} />
              <SalaryRow label="Sen" min={d.sen_annual_min} max={d.sen_annual_max} currency={currency} />
              <SalaryRow label="Lead" min={d.lead_annual_min} max={d.lead_annual_max} currency={currency} />
              <SalaryRow label="Head" min={d.head_annual_min} max={d.head_annual_max} currency={currency} />
            </tbody>
          </table>

          <div className="flex items-center justify-between">
            <ConfidenceBadge value={d.confidence} />
            {d.notes && (
              <p className="text-xs text-gray-500 ml-2 text-right line-clamp-2" title={d.notes}>
                {d.notes.split(';')[0]}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
