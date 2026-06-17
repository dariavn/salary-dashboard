// Salary Bands types + lookup logic

export interface HubEntry {
  country: string
  city: string
  hub: string
  costOfLivingIndex: number
}

export interface PositionEntry {
  position: string
  salaryBand: string
  level: string
}

export interface SalaryRange {
  min: number
  median: number
  max: number
  currency: string
  period: 'annual' | 'monthly'
  type: 'gross' | 'nett'
}

export interface BandEntry {
  levels: string[]
  levelDisplay: string
  salaryBand: string
  cy: SalaryRange
  ru: SalaryRange
  hub1: SalaryRange
  hub2: SalaryRange
  hub3: SalaryRange
}

export interface BandLookupResult {
  hub: string
  hubCity: string
  costOfLiving: number
  salary: SalaryRange
}

// Hub → column in BandEntry
const HUB_COL: Record<string, keyof BandEntry> = {
  CY: 'cy', RU: 'ru', '1': 'hub1', '2': 'hub2', '3': 'hub3',
}

export function findHub(hubs: HubEntry[], country: string): HubEntry | null {
  return hubs.find(h => h.country.toLowerCase() === country.toLowerCase()) ?? null
}

export function findBand(bands: BandEntry[], level: string, salaryBand: string): BandEntry | null {
  return bands.find(b => b.levels.includes(level) && b.salaryBand === salaryBand) ?? null
}

export function lookupBand(
  hubs: HubEntry[],
  bands: BandEntry[],
  pos: PositionEntry,
  country: string,
): BandLookupResult | null {
  const hubEntry = findHub(hubs, country)
  if (!hubEntry) return null
  const band = findBand(bands, pos.level, pos.salaryBand)
  if (!band) return null
  const col = HUB_COL[hubEntry.hub] as keyof BandEntry
  const salary = band[col] as SalaryRange | undefined
  if (!salary || salary.median === 0) return null
  return { hub: hubEntry.hub, hubCity: hubEntry.city, costOfLiving: hubEntry.costOfLivingIndex, salary }
}

// Cyprus cap business rule (€85k gross annual cap)
export function cyprusCap(annualGross: number) {
  const cap = 85_000
  const contractGross = Math.min(annualGross, cap)
  const overflow = Math.max(annualGross - cap, 0)
  const monthlyNetAlt = overflow > 0 ? (overflow / 12) * 0.8 : 0
  return { contractGross, overflow, monthlyNetAlt }
}

// Normalise any SalaryRange value to monthly EUR gross (for cross-country comparison)
export function toMonthlyEur(salary: SalaryRange, value: number): number {
  let v = value
  if (salary.period === 'annual') v /= 12                          // annual → monthly
  if (salary.currency === 'RUB') v /= 98                           // RUB → EUR
  if (salary.type === 'nett' && salary.currency === 'RUB') v *= 1.15  // nett RUB → gross
  return Math.round(v)
}

// Convenience: normalise min/median/max together
export function normaliseToMonthlyEur(salary: SalaryRange) {
  return {
    min: toMonthlyEur(salary, salary.min),
    median: toMonthlyEur(salary, salary.median),
    max: toMonthlyEur(salary, salary.max),
  }
}

// Format a SalaryRange value for display (respects original currency/period)
export function fmtBandValue(salary: SalaryRange, value: number): string {
  const v = Math.round(value)
  if (salary.currency === 'RUB') return v.toLocaleString('ru-RU') + ' ₽'
  return '€' + v.toLocaleString('en-US')
}

// Is a candidate salary (monthly EUR) within / above / below a band?
export function compareToBand(
  candidateMonthlyEur: number | null,
  salary: SalaryRange,
): 'within' | 'above' | 'below' | 'unknown' {
  if (candidateMonthlyEur == null) return 'unknown'
  const { min, max } = normaliseToMonthlyEur(salary)
  if (candidateMonthlyEur < min) return 'below'
  if (candidateMonthlyEur > max) return 'above'
  return 'within'
}

// Our 9 research countries → country name for hub lookup
export const RESEARCH_COUNTRY_MAP: Record<string, string> = {
  cyprus:   'Cyprus',
  poland:   'Poland',
  serbia:   'Serbia',
  georgia:  'Georgia',
  armenia:  'Armenia',
  russia:   'Russia',
  belarus:  'Belarus',
  spain:    'Spain',
  portugal: 'Portugal',
}
