export type Confidence = 'high' | 'medium' | 'low'
export type Segment = 'local_sme' | 'mid_market' | 'premium'
export type Tier = 'top' | 'high' | 'mid' | 'base'
export type Presence = 'strong' | 'moderate' | 'limited' | 'negligible'
export type SourceType = 'aggregator' | 'salary_survey' | 'job_posting' | 'recruiter_report' | 'open_cv' | 'ats_pipeline'

export interface GradeRow {
  grade: string
  exp_years: string
  segment: Segment
  annual_gross_min: number
  annual_gross_max: number
  monthly_gross_min: number
  monthly_gross_max: number
  currency: string
  confidence: Confidence
  sources: string
  notes: string
}

export interface DomainRow {
  domain: string
  tier: Tier
  presence_in_region: Presence
  jun_annual_min: number | null
  jun_annual_max: number | null
  mid_annual_min: number | null
  mid_annual_max: number | null
  sen_annual_min: number | null
  sen_annual_max: number | null
  lead_annual_min: number | null
  lead_annual_max: number | null
  head_annual_min: number | null
  head_annual_max: number | null
  jun_monthly_min: number | null
  jun_monthly_max: number | null
  mid_monthly_min: number | null
  mid_monthly_max: number | null
  sen_monthly_min: number | null
  sen_monthly_max: number | null
  lead_monthly_min: number | null
  lead_monthly_max: number | null
  head_monthly_min: number | null
  head_monthly_max: number | null
  currency: string
  confidence: Confidence
  notes: string
}

export interface SourceRow {
  source_name: string
  source_type: SourceType
  url_or_reference: string
  data_date: string
  figures_found: string
  confidence: Confidence
  notes: string
}

export interface CountryData {
  position: string
  location: string
  grades: GradeRow[]
  domains: DomainRow[]
  sources: SourceRow[]
  currency: string
  marketNote?: { en: string; ru: string }
  fit?: FitAnalysis
}

// Optional "best fit" candidate analysis ({location}_fit.json). Content is written in the
// research language; only UI labels are translated.
export type BlockScore = 0 | 1 | 2   // 0 = none, 1 = partial, 2 = confirmed by work experience

export interface FitCandidate {
  group: string
  title: string
  summary: string
  blocks: BlockScore[]
  experience: string
  city: string
  expectations: string
  url: string
}

export interface FitAnalysis {
  updated: string
  question: string
  answer: string
  blocks: { key: string; name: string; where: string }[]
  funnel: { label: string; value: string; highlight?: boolean }[]
  funnelNote: string
  budget: string
  insights: string[]
  howToClose: string[]
  groups: Record<string, string>
  method: string
  candidates: FitCandidate[]
}

export interface LocationMeta {
  slug: string
  name: { en: string; ru: string }
  flag: string
  currency: string
}

export interface PositionMeta {
  slug: string
  name: { en: string; ru: string }
}

// Internal ATS candidate with location attached (for home page table)
export interface CandidateWithLocation extends CandidateRow {
  location: string
}

// Internal ATS candidate data
export interface CandidateRow {
  candidate_id: string
  status: 'active' | 'declined'
  go_exp_years: number | null
  exp_grade: string          // Junior | Middle | Senior | Lead | Head | unknown
  salary_monthly_eur: number | null  // normalized to EUR monthly gross
  salary_original_raw: string
  currency_original: string
  gross_net: string          // gross | net | b2b | unclear
  data_as_of: string         // YYYY-MM
  outlier: boolean
  notes: string
}
