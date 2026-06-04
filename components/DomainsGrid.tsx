'use client'
import type { DomainRow } from '@/lib/types'
import type { Lang } from '@/lib/i18n'
import { t, TIER_LABELS, PRESENCE_LABELS, GRADE_KEY, fmtK } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'
import ConfidenceBadge from './ConfidenceBadge'

const TIER_COLOR: Record<string, string> = {
  top: 'var(--s1)', high: 'var(--s2)', mid: 'var(--s3)', base: 'var(--neutral)',
}

function TierTag({ tier, lang }: { tier: string; lang: Lang }) {
  const c = TIER_COLOR[tier] || 'var(--neutral)'
  return (
    <span className="tag" style={{ color: c, background: `color-mix(in srgb, ${c} 13%, transparent)` }}>
      {TIER_LABELS[tier]?.[lang] ?? tier}
    </span>
  )
}

interface DomainsGridProps {
  domains: DomainRow[]
  currency: string
  period: 'annual' | 'monthly'
  lang?: Lang
}

export default function DomainsGrid({ domains, currency, period, lang: langProp }: DomainsGridProps) {
  const ctx = useLang()
  const lang = langProp ?? ctx.lang

  if (!domains.length) return <p style={{ color: 'var(--muted)', padding: 16 }}>{t(lang, 'noData')}</p>

  const sorted = [...domains].sort((a, b) => {
    const order = ['top', 'high', 'mid', 'base']
    return order.indexOf(a.tier) - order.indexOf(b.tier)
  })

  const suf = period === 'monthly' ? 'monthly' : 'annual'
  const cols: [string, string][] = [['Junior', 'jun'], ['Middle', 'mid'], ['Senior', 'sen'], ['Lead', 'lead'], ['Head', 'head']]

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table className="data" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: 16 }}>{t(lang, 'domain')}</th>
            {cols.map(([g]) => (
              <th key={g} style={{ textAlign: 'right' }}>{t(lang, GRADE_KEY[g]!)}</th>
            ))}
            <th style={{ textAlign: 'right', paddingRight: 16 }}>{t(lang, 'tier')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 16, minWidth: 160 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.domain.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {t(lang, PRESENCE_LABELS[d.presence_in_region] ?? 'moderate')}
                </div>
              </td>
              {cols.map(([, pre]) => {
                const mn = (d as any)[`${pre}_${suf}_min`] as number | null
                const mx = (d as any)[`${pre}_${suf}_max`] as number | null
                return (
                  <td key={pre} className="mono" style={{ textAlign: 'right', fontSize: 12.5, whiteSpace: 'nowrap', color: mn == null ? 'var(--muted-2)' : 'var(--text)' }}>
                    {mn == null && mx == null ? '—' : `${fmtK(mn, currency)}–${fmtK(mx, currency)}`}
                  </td>
                )
              })}
              <td style={{ textAlign: 'right', paddingRight: 16, whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <TierTag tier={d.tier} lang={lang} />
                  <ConfidenceBadge value={d.confidence} lang={lang} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
