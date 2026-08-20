'use client'
import type { CountryData } from '@/lib/types'
import type { LocationMeta } from '@/lib/types'
import type { Lang } from '@/lib/i18n'
import { t, SERIES, fmtK, fmtFull } from '@/lib/i18n'
import ConfidenceBadge from './ConfidenceBadge'
import type { Confidence } from '@/lib/types'

function avgConf(rows: { confidence: string }[]): Confidence {
  const map: Record<string, number> = { high: 3, medium: 2, low: 1 }
  if (!rows.length) return 'low'
  const a = rows.reduce((s, r) => s + (map[r.confidence] || 1), 0) / rows.length
  return a >= 2.5 ? 'high' : a >= 1.7 ? 'medium' : 'low'
}

interface Entry { meta: LocationMeta; data: CountryData }

interface Props {
  allData: Entry[]
  period: 'annual' | 'monthly'
  lang: Lang
}

export default function SummaryCards({ allData, period, lang }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: allData.length <= 3 ? `repeat(${allData.length}, 1fr)` : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
      {allData.map((entry, i) => {
        const allRows = entry.data.grades
        const lo = (r: typeof allRows[0]) => period === 'annual' ? r.annual_gross_min : r.monthly_gross_min
        const hi = (r: typeof allRows[0]) => period === 'annual' ? r.annual_gross_max : r.monthly_gross_max
        const min = allRows.length ? Math.min(...allRows.map(lo)) : null
        const max = allRows.length ? Math.max(...allRows.map(hi)) : null
        const cur = entry.data.currency
        const conf = avgConf(entry.data.grades)

        // Average across every grade/segment row we actually have data for
        const avgAllGrades = allRows.length
          ? Math.round(allRows.reduce((s, r) => s + (lo(r) + hi(r)) / 2, 0) / allRows.length)
          : null

        return (
          <div key={entry.meta.slug} className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
            {/* Series color bar */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: SERIES[i] }} />
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>{entry.meta.flag}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{entry.meta.name[lang]}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', letterSpacing: '0.03em' }}>{cur}</span>
            </div>
            {/* Average across all grades */}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>
              {t(lang, 'avgAllGrades')}
            </div>
            <div className="mono" style={{ fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {avgAllGrades != null ? fmtFull(avgAllGrades, cur) : '—'}
            </div>
            {min != null && max != null && (
              <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {fmtK(min, cur)} – {fmtK(max, cur)} {period === 'annual' ? t(lang, 'perYear') : t(lang, 'perMonth')}
              </div>
            )}
            {/* Footer stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{entry.data.sources.length}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{t(lang, 'sourcesCount')}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <ConfidenceBadge value={conf} lang={lang} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
