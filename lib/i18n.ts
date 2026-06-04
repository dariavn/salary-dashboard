export type Lang = 'en' | 'ru'

const strings = {
  en: {
    appTitle: 'Salary Research',
    appSubtitle: 'IT compensation benchmarks · Product Manager',
    selectPosition: 'Role',
    selectCountries: 'Locations',
    selectCountriesHint: 'Choose up to 4 to compare',
    maxCountries: 'Up to 4 locations',
    clear: 'Clear',
    compareBtn: 'Compare',
    selected: 'selected',
    overview: 'Overview',
    grades: 'By grade',
    domains: 'By domain',
    sources: 'Sources',
    grade: 'Grade',
    expYears: 'Exp.',
    years: 'yrs',
    segment: 'Company size',
    range: 'Range',
    midpoint: 'Midpoint',
    currency: 'Currency',
    confidence: 'Confidence',
    notes: 'Notes',
    annual: 'Annual',
    monthly: 'Monthly',
    gross: 'gross',
    perMonth: '/mo',
    perYear: '/yr',
    salaryRange: 'Salary range by grade',
    allSizesNote: 'Full market · all company sizes',
    noData: 'No data',
    currencyWarning: 'Mixed currencies — Russia is shown in RUB, all others in EUR. Values are not directly comparable.',
    sourceName: 'Source',
    sourceType: 'Type',
    dataDate: 'Updated',
    domain: 'Industry / domain',
    tier: 'Pay tier',
    presence: 'Presence',
    junior: 'Junior', middle: 'Middle', senior: 'Senior', lead: 'Lead', head: 'Head',
    local_sme: 'Small (1–200)',
    mid_market: 'Mid-size (200–2K)',
    premium: 'Large / BigTech (2K+)',
    allSegments: 'All sizes',
    backHome: 'Locations',
    midMarketNote: 'Bands span the full market: lower edge = local / SME, upper edge = premium (iGaming / FinTech).',
    confHigh: 'High', confMedium: 'Medium', confLow: 'Low',
    median: 'Senior midpoint', sourcesCount: 'sources', avgConfidence: 'Avg. confidence',
    footer: 'Benchmark data aggregated from public salary sources · figures are gross, before tax',
    strong: 'Strong', moderate: 'Moderate', limited: 'Limited', negligible: 'Negligible',
    aggregator: 'Aggregator', salary_survey: 'Salary survey', job_posting: 'Job postings', recruiter_report: 'Recruiter report',
  },
  ru: {
    appTitle: 'Salary Research',
    appSubtitle: 'Бенчмарки IT-зарплат · Product Manager',
    selectPosition: 'Роль',
    selectCountries: 'Локации',
    selectCountriesHint: 'Выберите до 4 для сравнения',
    maxCountries: 'До 4 локаций',
    clear: 'Сбросить',
    compareBtn: 'Сравнить',
    selected: 'выбрано',
    overview: 'Обзор',
    grades: 'По грейдам',
    domains: 'По доменам',
    sources: 'Источники',
    grade: 'Грейд',
    expYears: 'Опыт',
    years: 'лет',
    segment: 'Размер компании',
    range: 'Диапазон',
    midpoint: 'Медиана',
    currency: 'Валюта',
    confidence: 'Достоверность',
    notes: 'Примечания',
    annual: 'Год',
    monthly: 'Месяц',
    gross: 'гросс',
    perMonth: '/мес',
    perYear: '/год',
    salaryRange: 'Диапазон зарплат по грейдам',
    allSizesNote: 'Весь рынок · все размеры компаний',
    noData: 'Нет данных',
    currencyWarning: 'Разные валюты — Россия показана в рублях, остальные в EUR. Значения не сопоставимы напрямую.',
    sourceName: 'Источник',
    sourceType: 'Тип',
    dataDate: 'Обновлено',
    domain: 'Индустрия / домен',
    tier: 'Уровень оплаты',
    presence: 'Присутствие',
    junior: 'Junior', middle: 'Middle', senior: 'Senior', lead: 'Lead', head: 'Head',
    local_sme: 'Малый (1–200)',
    mid_market: 'Средний (200–2К)',
    premium: 'Крупный / BigTech (2К+)',
    allSegments: 'Все размеры',
    backHome: 'Локации',
    midMarketNote: 'Диапазон охватывает весь рынок: нижняя граница — local / SME, верхняя — premium (iGaming / FinTech).',
    confHigh: 'Высокая', confMedium: 'Средняя', confLow: 'Низкая',
    median: 'Медиана Senior', sourcesCount: 'источников', avgConfidence: 'Ср. достоверность',
    footer: 'Данные агрегированы из публичных источников · значения gross, до налогов',
    strong: 'Сильное', moderate: 'Умеренное', limited: 'Ограниченное', negligible: 'Незначит.',
    aggregator: 'Агрегатор', salary_survey: 'Зарплатный опрос', job_posting: 'Вакансии', recruiter_report: 'Отчёт рекрутёра',
  },
} as const

export type StringKey = keyof (typeof strings)['en']

export function t(lang: Lang, key: StringKey): string {
  return strings[lang]?.[key] ?? key
}

export const GRADE_ORDER = ['Junior', 'Middle', 'Senior', 'Lead', 'Head']
export const SEGMENT_ORDER = ['local_sme', 'mid_market', 'premium']
export const GRADE_KEY: Record<string, StringKey> = {
  Junior: 'junior', Middle: 'middle', Senior: 'senior', Lead: 'lead', Head: 'head',
}

export const GRADE_VAR: Record<string, string> = {
  Junior: 'var(--grade-jun)', Middle: 'var(--grade-mid)', Senior: 'var(--grade-sen)',
  Lead: 'var(--grade-lead)', Head: 'var(--grade-head)',
}

export const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)']

export const TIER_LABELS: Record<string, { en: string; ru: string }> = {
  top:  { en: 'Top',  ru: 'Топ' },
  high: { en: 'High', ru: 'High' },
  mid:  { en: 'Mid',  ru: 'Mid' },
  base: { en: 'Base', ru: 'Base' },
}

export const PRESENCE_LABELS: Record<string, StringKey> = {
  strong: 'strong', moderate: 'moderate', limited: 'limited', negligible: 'negligible',
}

export function fmtK(n: number | null | undefined, currency: string): string {
  if (n == null) return '—'
  if (currency === 'RUB') return Math.round(n / 1000) + 'K ₽'
  return '€' + Math.round(n / 1000) + 'K'
}

export function fmtFull(n: number | null | undefined, currency: string): string {
  if (n == null) return '—'
  if (currency === 'RUB') return n.toLocaleString('ru-RU') + ' ₽'
  return '€' + n.toLocaleString('en-US')
}
