'use client'
import type { DomainRow } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t, TIER_LABELS, TIER_STYLES, PRESENCE_LABELS } from '@/lib/i18n'
import ConfidenceBadge from './ConfidenceBadge'

function fmt(n: number | null, currency: string): string {
  if (n == null) return '—'
  if (currency === 'RUB') return `${Math.round(n / 1000)}K`
  return `€${Math.round(n / 1000)}K`
}

function SalaryCell({ min, max, currency }: { min: number | null; max: number | null; currency: string }) {
  if (min == null && max == null) return <span style={{ color: 'var(--border)' }}>—</span>
  return (
    <span className="font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text)' }}>
      {fmt(min, currency)}<span style={{ color: 'var(--muted)' }}>–</span>{fmt(max, currency)}
    </span>
  )
}

interface DomainsGridProps {
  domains: DomainRow[]
  currency: string
  period: 'annual' | 'monthly'
}

export default function DomainsGrid({ domains, currency, period }: DomainsGridProps) {
  const { lang } = useLang()

  if (!domains.length) return <p className="text-sm py-4" style={{ color: 'var(--muted)' }}>{t(lang, 'noData')}</p>

  const sorted = [...domains].sort((a, b) => {
    const order = ['top', 'high', 'mid', 'base']
    return order.indexOf(a.tier) - order.indexOf(b.tier)
  })

  const isMonthly = period === 'monthly'

  const gradeFields: { label: string; minKey: keyof DomainRow; maxKey: keyof DomainRow }[] = isMonthly
    ? [
        { label: 'Jun',  minKey: 'jun_monthly_min',  maxKey: 'jun_monthly_max' },
        { label: 'Mid',  minKey: 'mid_monthly_min',  maxKey: 'mid_monthly_max' },
        { label: 'Sen',  minKey: 'sen_monthly_min',  maxKey: 'sen_monthly_max' },
        { label: 'Lead', minKey: 'lead_monthly_min', maxKey: 'lead_monthly_max' },
        { label: 'Head', minKey: 'head_monthly_min', maxKey: 'head_monthly_max' },
      ]
    : [
        { label: 'Jun',  minKey: 'jun_annual_min',  maxKey: 'jun_annual_max' },
        { label: 'Mid',  minKey: 'mid_annual_min',  maxKey: 'mid_annual_max' },
        { label: 'Sen',  minKey: 'sen_annual_min',  maxKey: 'sen_annual_max' },
        { label: 'Lead', minKey: 'lead_annual_min', maxKey: 'lead_annual_max' },
        { label: 'Head', minKey: 'head_annual_min', maxKey: 'head_annual_max' },
      ]

  return (
    <div
      className="rounded-xl overflow-x-auto"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      {/* Table header */}
      <table className="text-xs" style={{ width: '100%', minWidth: 560 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--card2)' }}>
            <th className="py-2 px-4 text-left font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              {t(lang, 'domain')}
            </th>
            {gradeFields.map(f => (
              <th key={f.label} className="py-2 px-2 text-right font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                {f.label}
              </th>
            ))}
            <th className="py-2 px-3 text-left font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              {t(lang, 'tier')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => {
            const ts = TIER_STYLES[d.tier] ?? TIER_STYLES.base
            const borderLeft = `3px solid ${ts.text}`
            return (
              <tr
                key={i}
                style={{
                  borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : undefined,
                  borderLeft,
                }}
                className="hover:bg-white/[0.02] transition-colors"
              >
                {/* Domain name */}
                <td className="py-3 px-4">
                  <div className="font-medium" style={{ color: 'var(--text)' }}>
                    {d.domain.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {PRESENCE_LABELS[d.presence_in_region]?.[lang] ?? d.presence_in_region}
                  </div>
                </td>

                {/* Salary per grade */}
                {gradeFields.map(f => (
                  <td key={f.label} className="py-3 px-2 text-right">
                    <SalaryCell
                      min={d[f.minKey] as number | null}
                      max={d[f.maxKey] as number | null}
                      currency={currency}
                    />
                  </td>
                ))}

                {/* Tier + confidence */}
                <td className="py-3 px-3">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                    style={{ color: ts.text, background: ts.bg }}
                  >
                    {TIER_LABELS[d.tier]?.[lang] ?? d.tier}
                  </span>
                  <div className="mt-1"><ConfidenceBadge value={d.confidence} /></div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
