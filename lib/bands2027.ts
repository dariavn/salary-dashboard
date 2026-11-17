// Salary Bands 2027 Research — types + statistics (client-safe, no fs)

export type PointType = 'resume' | 'vacancy' | 'survey'
export type Industry = 'fintech' | 'igaming' | 'gaming' | 'bigtech' | 'it_product' | 'other'

export interface RawPoint {
  type: PointType
  title: string
  company?: string
  industry?: Industry | string
  city?: string
  value: number
  raw?: string
  url?: string
  date?: string
  match?: 'high' | 'medium' | string
  note?: string
  evidence?: string
}

export interface RawLocation {
  currency: 'RUB' | 'EUR'
  basis: 'net_monthly' | 'gross_annual'
  queries?: string[]
  screened_total?: number
  points: RawPoint[]
}

export interface RawPosition {
  slug: string
  position: string
  hrbp: string
  level: string
  team?: string
  matching_criteria?: string
  matching_criteria_en?: string
  ru?: RawLocation
  cy?: RawLocation
  caveats?: string
  caveats_en?: string
  notion_url?: string
}

export interface LocStats {
  n: number
  p25: number
  median: number
  p75: number
  min: number
  max: number
  byType: Record<string, number>
  byIndustry: Record<string, number>
  screened: number
  confidence: 'high' | 'medium' | 'low' | 'none'
}

export interface Position2027 extends RawPosition {
  stats: { ru: LocStats | null; cy: LocStats | null }
}

// Linear-interpolation percentile (same as Excel PERCENTILE.INC / numpy default)
export function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function countBy(points: RawPoint[], key: 'type' | 'industry') {
  const out: Record<string, number> = {}
  for (const p of points) {
    const k = (p[key] as string) || 'other'
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}

// Confidence by sample size: RF market is deep (hh.ru), Cyprus is thin — different thresholds
export function confidenceFor(loc: 'ru' | 'cy', n: number): LocStats['confidence'] {
  if (n === 0) return 'none'
  if (loc === 'ru') return n >= 30 ? 'high' : n >= 15 ? 'medium' : 'low'
  return n >= 12 ? 'high' : n >= 6 ? 'medium' : 'low'
}

export function computeStats(loc: 'ru' | 'cy', data?: RawLocation): LocStats | null {
  if (!data) return null
  const pts = (data.points ?? []).filter(p => Number.isFinite(p.value) && p.value > 0 && p.match !== 'low')
  if (!pts.length) return null
  const v = pts.map(p => p.value).sort((a, b) => a - b)
  return {
    n: pts.length,
    p25: percentile(v, 0.25),
    median: percentile(v, 0.5),
    p75: percentile(v, 0.75),
    min: v[0],
    max: v[v.length - 1],
    byType: countBy(pts, 'type'),
    byIndustry: countBy(pts, 'industry'),
    screened: data.screened_total ?? 0,
    confidence: confidenceFor(loc, pts.length),
  }
}

// RU is stored net monthly, CY gross annual. Convert to requested period.
export function toPeriod(loc: 'ru' | 'cy', value: number, period: 'month' | 'year'): number {
  if (loc === 'ru') return period === 'month' ? value : value * 12
  return period === 'year' ? value : value / 12
}

export function fmtMoney(loc: 'ru' | 'cy', value: number): string {
  const rounded = loc === 'ru'
    ? Math.round(value / 1000) * 1000
    : Math.round(value / 100) * 100
  const s = rounded.toLocaleString('ru-RU').replace(/ /g, ' ')
  return loc === 'ru' ? `${s} ₽` : `€${s}`
}

export function fmtShort(loc: 'ru' | 'cy', value: number): string {
  if (loc === 'ru') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M ₽`
    return `${Math.round(value / 1000)}K ₽`
  }
  return `€${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)}K`
}
