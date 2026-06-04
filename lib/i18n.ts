export type Lang = 'en' | 'ru'

const strings = {
  en: {
    appTitle: 'Salary Research',
    appSubtitle: 'IT salary benchmarks by role, location and seniority',
    selectPosition: 'Select Position',
    selectCountries: 'Select up to 3 locations',
    compareBtn: 'Compare',
    grades: 'Grades',
    domains: 'Domains',
    sources: 'Sources',
    grade: 'Grade',
    expYears: 'Exp.',
    segment: 'Company',
    annualMin: 'Annual Min',
    annualMax: 'Annual Max',
    monthlyMin: 'Monthly Min',
    monthlyMax: 'Monthly Max',
    currency: 'Currency',
    confidence: 'Conf.',
    sourcesCol: 'Sources',
    notes: 'Notes',
    annual: 'Annual',
    monthly: 'Monthly',
    salaryRange: 'Salary Range',
    noData: 'No data',
    currencyWarning: 'Note: Scales differ — Russia data is in RUB, other countries in EUR.',
    sourceName: 'Source',
    sourceType: 'Type',
    dataDate: 'Date',
    figuresFound: 'Data',
    domain: 'Domain',
    tier: 'Tier',
    presence: 'Presence',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
    head: 'Head',
    local_sme: 'Small (1–200)',
    mid_market: 'Mid-size (200–2K)',
    premium: 'Large / BigTech (2K+)',
    allSegments: 'All sizes',
    backHome: '← Back',
    maxCountries: 'Maximum 3 locations selected',
    midMarketNote: 'Range reflects full market. Bottom — local/SME, top — premium (iGaming/FinTech).',
  },
  ru: {
    appTitle: 'Salary Research',
    appSubtitle: 'Зарплаты IT по роли, стране и грейду',
    selectPosition: 'Выберите позицию',
    selectCountries: 'Выберите до 3 локаций',
    compareBtn: 'Сравнить',
    grades: 'Грейды',
    domains: 'Домены',
    sources: 'Источники',
    grade: 'Грейд',
    expYears: 'Опыт',
    segment: 'Компания',
    annualMin: 'Год, мин',
    annualMax: 'Год, макс',
    monthlyMin: 'Месяц, мин',
    monthlyMax: 'Месяц, макс',
    currency: 'Валюта',
    confidence: 'Уверен.',
    sourcesCol: 'Источники',
    notes: 'Примечания',
    annual: 'Год',
    monthly: 'Месяц',
    salaryRange: 'Диапазон зарплат',
    noData: 'Нет данных',
    currencyWarning: 'Внимание: разные валюты — Россия в рублях, остальные в EUR.',
    sourceName: 'Источник',
    sourceType: 'Тип',
    dataDate: 'Дата',
    figuresFound: 'Данные',
    domain: 'Домен',
    tier: 'Уровень',
    presence: 'Присутствие',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
    head: 'Head',
    local_sme: 'Малый (1–200)',
    mid_market: 'Средний (200–2К)',
    premium: 'Крупный / BigTech (2К+)',
    allSegments: 'Все размеры',
    backHome: '← Назад',
    maxCountries: 'Максимум 3 локации',
    midMarketNote: 'Диапазон отражает рынок в целом. Нижний край — local/SME, верхний — iGaming/FinTech.',
  },
} as const

export type StringKey = keyof (typeof strings)['en']

export function t(lang: Lang, key: StringKey): string {
  return strings[lang][key] ?? key
}

export const GRADE_ORDER = ['Junior', 'Middle', 'Senior', 'Lead', 'Head']
export const SEGMENT_ORDER = ['local_sme', 'mid_market', 'premium']

export const GRADE_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  Junior: { text: '#74c7ec', bg: 'rgba(116,199,236,0.12)', border: 'rgba(116,199,236,0.3)' },
  Middle: { text: '#89dceb', bg: 'rgba(137,220,235,0.12)', border: 'rgba(137,220,235,0.3)' },
  Senior: { text: '#cba6f7', bg: 'rgba(203,166,247,0.12)', border: 'rgba(203,166,247,0.3)' },
  Lead:   { text: '#f38ba8', bg: 'rgba(243,139,168,0.12)', border: 'rgba(243,139,168,0.3)' },
  Head:   { text: '#fab387', bg: 'rgba(250,179,135,0.12)', border: 'rgba(250,179,135,0.3)' },
}

export const TIER_LABELS: Record<string, { en: string; ru: string }> = {
  top:  { en: 'TOP',  ru: 'ТОП' },
  high: { en: 'HIGH', ru: 'HIGH' },
  mid:  { en: 'MID',  ru: 'MID' },
  base: { en: 'BASE', ru: 'BASE' },
}

export const TIER_STYLES: Record<string, { text: string; bg: string }> = {
  top:  { text: '#f38ba8', bg: 'rgba(243,139,168,0.15)' },
  high: { text: '#cba6f7', bg: 'rgba(203,166,247,0.15)' },
  mid:  { text: '#89dceb', bg: 'rgba(137,220,235,0.15)' },
  base: { text: '#8b90a8', bg: 'rgba(139,144,168,0.12)' },
}

export const PRESENCE_LABELS: Record<string, { en: string; ru: string }> = {
  strong:     { en: 'Strong',     ru: 'Сильное' },
  moderate:   { en: 'Moderate',   ru: 'Умеренное' },
  limited:    { en: 'Limited',    ru: 'Ограниченное' },
  negligible: { en: 'Negligible', ru: 'Незначит.' },
}
