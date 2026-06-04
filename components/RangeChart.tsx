'use client'
import type { GradeRow } from '@/lib/types'
import { GRADE_ORDER, GRADE_KEY, GRADE_VAR, SERIES, fmtK, t } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

interface Series {
  slug: string
  label: string
  rows: GradeRow[]
  color: string
  currency: string
}

interface Props {
  series: Series[]
  period: 'annual' | 'monthly'
  lang: Lang
}

function niceMax(v: number) {
  if (v <= 0) return 10
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * pow
}

export default function RangeChart({ series, period, lang }: Props) {
  const lo = (r: GradeRow) => period === 'annual' ? r.annual_gross_min : r.monthly_gross_min
  const hi = (r: GradeRow) => period === 'annual' ? r.annual_gross_max : r.monthly_gross_max

  // full-market range (all company sizes) per series per grade
  function rng(s: Series, g: string) {
    const f = s.rows.filter((r) => r.grade === g)
    if (!f.length) return null
    return { min: Math.min(...f.map(lo)), max: Math.max(...f.map(hi)) }
  }

  const currencies = Array.from(new Set(series.map(s => s.currency)))
  const mixed = currencies.length > 1

  const maxByCur: Record<string, number> = {}
  GRADE_ORDER.forEach(g => series.forEach(s => {
    const r = rng(s, g)
    if (r) maxByCur[s.currency] = Math.max(maxByCur[s.currency] || 0, r.max)
  }))
  const capByCur: Record<string, number> = {}
  Object.keys(maxByCur).forEach(k => { capByCur[k] = niceMax(maxByCur[k] * 1.02) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {GRADE_ORDER.map(g => {
        const hasSome = series.some(s => rng(s, g) != null)
        if (!hasSome) return null
        return (
          <div key={g}>
            {/* Grade label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
              <span className="dot" style={{ background: GRADE_VAR[g], width: 9, height: 9 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {t(lang, GRADE_KEY[g]!)}
              </span>
            </div>
            {/* One row per country */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {series.map(s => {
                const r = rng(s, g)
                const cap = capByCur[s.currency] || 1
                return (
                  <div
                    key={s.slug}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(96px, 132px) 1fr minmax(116px, auto)',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    {/* Country label */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      <span className="dot" style={{ background: s.color, width: 8, height: 8 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
                    </span>
                    {/* Track */}
                    <div style={{ position: 'relative', height: 12, borderRadius: 999, background: 'var(--surface-3)' }}>
                      {r && (
                        <span style={{
                          position: 'absolute', top: 0, height: '100%',
                          left: (r.min / cap * 100) + '%',
                          width: Math.max(1.5, (r.max - r.min) / cap * 100) + '%',
                          background: s.color, borderRadius: 999,
                        }} />
                      )}
                    </div>
                    {/* Labeled value */}
                    <span className="mono" style={{ fontSize: 13, fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap', color: r ? 'var(--text)' : 'var(--muted-2)' }}>
                      {r ? fmtK(r.min, s.currency) + ' – ' + fmtK(r.max, s.currency) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {mixed && (
        <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--warn)', fontWeight: 700 }}>%</span>
          {lang === 'ru'
            ? 'Шкала относительная — валюты разные. Точные значения в строках справа.'
            : 'Relative scale — currencies differ. Exact values shown right.'}
        </div>
      )}
    </div>
  )
}
