import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const CSV_BASE = path.join(process.cwd(), 'data', 'csv')

function parseNum(v: string | undefined): number | null {
  if (!v || v.trim() === '') return null
  const n = parseFloat(v.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

export function parseCSV<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  return result.data as unknown as T[]
}

export function readGrades(position: string, location: string) {
  const file = path.join(CSV_BASE, position, `${location}_grades.csv`)
  const rows = parseCSV<Record<string, string>>(file)
  return rows.map((r) => ({
    grade: r.grade?.trim() ?? '',
    exp_years: r.exp_years?.trim() ?? '',
    segment: (r.segment?.trim() ?? 'mid_market') as import('./types').Segment,
    annual_gross_min: parseNum(r.annual_gross_min) ?? 0,
    annual_gross_max: parseNum(r.annual_gross_max) ?? 0,
    monthly_gross_min: parseNum(r.monthly_gross_min) ?? 0,
    monthly_gross_max: parseNum(r.monthly_gross_max) ?? 0,
    currency: r.currency?.trim() ?? 'EUR',
    confidence: (r.confidence?.trim() ?? 'low') as import('./types').Confidence,
    sources: r.sources?.trim() ?? '',
    notes: r.notes?.trim() ?? '',
  }))
}

export function readDomains(position: string, location: string) {
  const file = path.join(CSV_BASE, position, `${location}_domains.csv`)
  const rows = parseCSV<Record<string, string>>(file)
  return rows.map((r) => ({
    domain: r.domain?.trim() ?? '',
    tier: (r.tier?.trim() ?? 'mid') as import('./types').Tier,
    presence_in_region: (r.presence_in_region?.trim() ?? 'moderate') as import('./types').Presence,
    jun_annual_min: parseNum(r.jun_annual_min),
    jun_annual_max: parseNum(r.jun_annual_max),
    mid_annual_min: parseNum(r.mid_annual_min),
    mid_annual_max: parseNum(r.mid_annual_max),
    sen_annual_min: parseNum(r.sen_annual_min),
    sen_annual_max: parseNum(r.sen_annual_max),
    lead_annual_min: parseNum(r.lead_annual_min),
    lead_annual_max: parseNum(r.lead_annual_max),
    head_annual_min: parseNum(r.head_annual_min),
    head_annual_max: parseNum(r.head_annual_max),
    jun_monthly_min: parseNum(r.jun_monthly_min),
    jun_monthly_max: parseNum(r.jun_monthly_max),
    mid_monthly_min: parseNum(r.mid_monthly_min),
    mid_monthly_max: parseNum(r.mid_monthly_max),
    sen_monthly_min: parseNum(r.sen_monthly_min),
    sen_monthly_max: parseNum(r.sen_monthly_max),
    lead_monthly_min: parseNum(r.lead_monthly_min),
    lead_monthly_max: parseNum(r.lead_monthly_max),
    head_monthly_min: parseNum(r.head_monthly_min),
    head_monthly_max: parseNum(r.head_monthly_max),
    currency: r.currency?.trim() ?? 'EUR',
    confidence: (r.confidence?.trim() ?? 'low') as import('./types').Confidence,
    notes: r.notes?.trim() ?? '',
  }))
}

export function readSources(position: string, location: string) {
  const file = path.join(CSV_BASE, position, `${location}_sources.csv`)
  const rows = parseCSV<Record<string, string>>(file)
  return rows.map((r) => ({
    source_name: r.source_name?.trim() ?? '',
    source_type: (r.source_type?.trim() ?? 'aggregator') as import('./types').SourceType,
    url_or_reference: r.url_or_reference?.trim() ?? '',
    data_date: r.data_date?.trim() ?? '',
    figures_found: r.figures_found?.trim() ?? '',
    confidence: (r.confidence?.trim() ?? 'low') as import('./types').Confidence,
    notes: r.notes?.trim() ?? '',
  }))
}
