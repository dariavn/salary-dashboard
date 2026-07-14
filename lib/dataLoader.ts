import fs from 'fs'
import path from 'path'
import { readGrades, readDomains, readSources, readCandidates } from './csvParser'
import type { CountryData, LocationMeta, PositionMeta } from './types'

const CSV_BASE = path.join(process.cwd(), 'data', 'csv')

// Known location metadata — fallback for unknown slugs: capitalize slug, no flag
const LOCATION_META: Record<string, Omit<LocationMeta, 'slug'>> = {
  cyprus:   { name: { en: 'Cyprus',      ru: 'Кипр' },       flag: '🇨🇾', currency: 'EUR' },
  poland:   { name: { en: 'Poland',      ru: 'Польша' },     flag: '🇵🇱', currency: 'EUR' },
  serbia:   { name: { en: 'Serbia',      ru: 'Сербия' },     flag: '🇷🇸', currency: 'EUR' },
  georgia:  { name: { en: 'Georgia',     ru: 'Грузия' },     flag: '🇬🇪', currency: 'EUR' },
  armenia:  { name: { en: 'Armenia',     ru: 'Армения' },    flag: '🇦🇲', currency: 'EUR' },
  russia:   { name: { en: 'Russia',      ru: 'Россия' },     flag: '🇷🇺', currency: 'RUB' },
  belarus:  { name: { en: 'Belarus',     ru: 'Беларусь' },   flag: '🇧🇾', currency: 'EUR' },
  spain:    { name: { en: 'Spain',       ru: 'Испания' },    flag: '🇪🇸', currency: 'EUR' },
  portugal: { name: { en: 'Portugal',    ru: 'Португалия' }, flag: '🇵🇹', currency: 'EUR' },
  germany:  { name: { en: 'Germany',     ru: 'Германия' },   flag: '🇩🇪', currency: 'EUR' },
  ukraine:  { name: { en: 'Ukraine',     ru: 'Украина' },    flag: '🇺🇦', currency: 'EUR' },
  czechia:  { name: { en: 'Czechia',     ru: 'Чехия' },      flag: '🇨🇿', currency: 'EUR' },
  romania:  { name: { en: 'Romania',     ru: 'Румыния' },    flag: '🇷🇴', currency: 'EUR' },
  hungary:  { name: { en: 'Hungary',     ru: 'Венгрия' },    flag: '🇭🇺', currency: 'EUR' },
  netherlands: { name: { en: 'Netherlands', ru: 'Нидерланды' }, flag: '🇳🇱', currency: 'EUR' },
}

// Known position metadata — fallback: capitalize + replace underscores
const POSITION_META: Record<string, Omit<PositionMeta, 'slug'>> = {
  product_manager:    { name: { en: 'Product Manager',    ru: 'Product Manager' } },
  data_scientist:     { name: { en: 'Data Scientist',     ru: 'Data Scientist' } },
  ios_engineer:       { name: { en: 'iOS Engineer',       ru: 'iOS Engineer' } },
  android_engineer:   { name: { en: 'Android Engineer',   ru: 'Android Engineer' } },
  backend_developer:  { name: { en: 'Backend Developer',  ru: 'Backend Developer' } },
  frontend_developer: { name: { en: 'Frontend Developer', ru: 'Frontend Developer' } },
  devops_engineer:    { name: { en: 'DevOps Engineer',    ru: 'DevOps Engineer' } },
  ux_designer:        { name: { en: 'UX Designer',        ru: 'UX Designer' } },
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

export function getLocationMeta(slug: string): LocationMeta {
  const known = LOCATION_META[slug]
  if (known) return { slug, ...known }
  return { slug, name: { en: capitalize(slug), ru: capitalize(slug) }, flag: '', currency: 'EUR' }
}

export function getPositionMeta(slug: string): PositionMeta {
  const known = POSITION_META[slug]
  if (known) return { slug, ...known }
  return { slug, name: { en: capitalize(slug), ru: capitalize(slug) } }
}

export function loadPositions(): PositionMeta[] {
  if (!fs.existsSync(CSV_BASE)) return []
  return fs.readdirSync(CSV_BASE, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => getPositionMeta(d.name))
}

export function loadLocations(position: string): LocationMeta[] {
  const dir = path.join(CSV_BASE, position)
  if (!fs.existsSync(dir)) return []
  const slugs = new Set<string>()
  fs.readdirSync(dir).forEach((f) => {
    const m = f.match(/^(.+)_(grades|domains|sources)\.csv$/)
    if (m) slugs.add(m[1])
  })
  return Array.from(slugs).map(getLocationMeta)
}

export function loadCountryData(position: string, location: string): CountryData {
  const grades = readGrades(position, location)
  const domains = readDomains(position, location)
  const sources = readSources(position, location)
  const currency = grades[0]?.currency ?? getLocationMeta(location).currency
  return { position, location, grades, domains, sources, currency }
}

export function loadCandidates(position: string, location: string) {
  return readCandidates(position, location)
}

const MONTH_NUM: Record<string, string> = {
  jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
  jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
}

// Normalise a raw data_date string to "YYYY" or "YYYY-MM" for comparison.
// Filters out URL fragments, quarter codes, date ranges, and text-month formats.
function normalizeDateStr(d: string): string {
  if (!d) return ''
  // "MMM YYYY" or "MMM DD YYYY"
  const textM = d.match(/^([A-Za-z]{3})\s+(?:\d{1,2}\s+)?(\d{4})$/)
  if (textM) {
    const m = MONTH_NUM[textM[1].toLowerCase()]
    return m ? `${textM[2]}-${m}` : textM[2]
  }
  // "YYYY-QN" quarter → start month of quarter
  const qtr = d.match(/^(\d{4})-Q([1-4])$/)
  if (qtr) return `${qtr[1]}-${{ '1':'01','2':'04','3':'07','4':'10' }[qtr[2]]}`
  // "YYYY-YYYY" range → take later year
  const range = d.match(/^(\d{4})-(\d{4})$/)
  if (range) return range[2]
  // "YYYY" or "YYYY-MM" — already canonical
  if (/^\d{4}(-\d{2})?$/.test(d)) return d
  // anything else (URL fragment, etc.) — discard
  return ''
}

// Returns the most recent data_date from sources CSV — used to assess market data freshness
export function getResearchDate(position: string, location: string): string {
  const sources = readSources(position, location)
  const dates = sources.map(s => normalizeDateStr(s.data_date)).filter(Boolean).sort()
  return dates[dates.length - 1] ?? ''
}

export function loadAllCandidatesForPosition(position: string) {
  const locs = loadLocations(position)
  return locs.flatMap(loc =>
    readCandidates(position, loc.slug).map(c => ({ ...c, location: loc.slug }))
  )
}
