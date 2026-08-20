'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { PositionMeta, LocationMeta, CountryData, CandidateRow } from '@/lib/types'
import type { Segment } from '@/lib/types'
import type { PositionEntry } from '@/lib/salary-bands'
import type { SalaryBandsData } from '@/lib/salary-bands-loader'
import { lookupBand, normaliseToMonthlyEur, fmtBandValue, RESEARCH_COUNTRY_MAP } from '@/lib/salary-bands'
import { useLang } from '@/context/LangContext'
import { t, SERIES, GRADE_VAR, GRADE_KEY, GRADE_ORDER, fmtK, isHeadLevelRole } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import { UserButton } from '@clerk/nextjs'
import RangeChart from '@/components/RangeChart'
import SummaryCards from '@/components/SummaryCards'
import GradesTable from '@/components/GradesTable'
import DomainsGrid from '@/components/DomainsGrid'
import SourcesList from '@/components/SourcesList'
import InternalSection from '@/components/InternalSection'

interface Entry { meta: LocationMeta; data: CountryData; candidates: CandidateRow[] }
interface Props {
  positionMeta: PositionMeta
  allData: Entry[]
  initialSource?: 'market' | 'ats'
  initialPeriod?: 'annual' | 'monthly'
  salaryBandsData?: SalaryBandsData
}
type Tab = 'overview' | 'grades' | 'domains' | 'sources'

function Toggle({ options, value, onChange }: { options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.v} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  )
}

function MarketNote({ allData, lang }: { allData: Entry[]; lang: string }) {
  const withNote = allData.filter(e => e.data.marketNote)
  if (!withNote.length) return null
  return (
    <>
      {withNote.map(entry => (
        <div key={entry.meta.slug} className="card" style={{ padding: '16px 18px', marginBottom: 18, background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>{entry.meta.flag}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {entry.data.sources.length} {t(lang as any, 'sourcesAnalyzedNote')}
            </span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-2)', margin: 0, whiteSpace: 'pre-line' }}>
            {entry.data.marketNote?.[lang as 'en' | 'ru']}
          </p>
        </div>
      ))}
    </>
  )
}

function CurrencyNote({ allData, lang }: { allData: Entry[]; lang: string }) {
  const mixed = new Set(allData.map(e => e.data.currency)).size > 1
  const hasRussia = allData.some(e => e.meta.slug === 'russia')
  return (
    <>
      {mixed && (
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 'var(--r-md)', background: 'var(--warn-bg)', border: '1px solid color-mix(in srgb, var(--warn) 28%, transparent)', marginBottom: 10, fontSize: 13, color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--warn)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>!</span>
          <span>{t(lang as any, 'currencyWarning')}</span>
        </div>
      )}
      {hasRussia && (
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', border: '1px solid var(--accent-ring)', marginBottom: 18, fontSize: 13, color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>₽</span>
          <span>{t(lang as any, 'russiaNetNote')}</span>
        </div>
      )}
    </>
  )
}

function GradeMatrix({ allData, segment, period, lang, expMode }: { allData: Entry[]; segment: Segment | 'all'; period: 'annual' | 'monthly'; lang: any; expMode?: boolean }) {
  const lo = (r: any) => period === 'annual' ? r.annual_gross_min : r.monthly_gross_min
  const hi = (r: any) => period === 'annual' ? r.annual_gross_max : r.monthly_gross_max
  function rng(en: CountryData, g: string) {
    const f = en.grades.filter(r => r.grade === g && (segment === 'all' || r.segment === segment))
    if (!f.length) return null
    if (segment === 'all') return { min: Math.min(...f.map(lo)), max: Math.max(...f.map(hi)) }
    const row = f.find(r => r.segment === 'mid_market') || f[0]
    return { min: lo(row), max: hi(row) }
  }
  // For expMode: find exp_years label for each grade from the first country that has data
  function expLabel(g: string): string {
    for (const en of allData) {
      const row = en.data.grades.find(r => r.grade === g)
      if (row?.exp_years) return row.exp_years + ' ' + t(lang, 'years')
    }
    return g
  }
  return (
    <div className="card" style={{ overflowX: 'auto', padding: '4px 4px' }}>
      <table className="data">
        <thead>
          <tr>
            <th style={{ paddingLeft: 16 }}>{expMode ? t(lang, 'expLabel') : t(lang, 'grade')}</th>
            {allData.map((en, i) => (
              <th key={en.meta.slug} style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="dot" style={{ background: SERIES[i], width: 7, height: 7 }} />
                  {en.meta.flag + ' ' + en.meta.name[lang as 'en' | 'ru']}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRADE_ORDER.map(g => (
            <tr key={g}>
              <td style={{ paddingLeft: 16, whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span className="dot" style={{ background: GRADE_VAR[g], width: 8, height: 8 }} />
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {expMode ? expLabel(g) : t(lang, GRADE_KEY[g]!)}
                  </span>
                </span>
              </td>
              {allData.map(en => {
                const r = rng(en.data, g)
                return (
                  <td key={en.meta.slug} className="mono" style={{ textAlign: 'right', fontSize: 13, whiteSpace: 'nowrap', color: r ? 'var(--text)' : 'var(--muted-2)' }}>
                    {r ? fmtK(r.min, en.data.currency) + ' – ' + fmtK(r.max, en.data.currency) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function gridCols(n: number) {
  if (n <= 1) return '1fr'
  if (n === 2) return 'repeat(2, 1fr)'
  if (n <= 4) return 'repeat(3, 1fr)'
  return 'repeat(3, 1fr)' // 5–9 countries: 3-col wrapping grid
}

export default function CompareClient({ positionMeta, allData, initialSource = 'market', initialPeriod = 'annual', salaryBandsData }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<Tab>('overview')
  const segment = 'all' as const
  const expMode = isHeadLevelRole(positionMeta.slug)
  const [bandQuery, setBandQuery] = useState('')
  const [bandRef, setBandRef] = useState<PositionEntry | null>(null)
  const [showBandDropdown, setShowBandDropdown] = useState(false)

  // Band position autocomplete
  const bandSuggestions = useMemo(() => {
    if (!salaryBandsData) return []
    const q = bandQuery.trim().toLowerCase()
    if (!q || q.length < 2) return []
    return salaryBandsData.positions.filter(p => p.position.toLowerCase().includes(q)).slice(0, 12)
  }, [bandQuery, salaryBandsData])

  // Compute band for each country in comparison
  const bandResults = useMemo(() => {
    if (!bandRef || !salaryBandsData) return {}
    const out: Record<string, ReturnType<typeof lookupBand>> = {}
    for (const entry of allData) {
      const country = RESEARCH_COUNTRY_MAP[entry.meta.slug] ?? entry.meta.slug
      out[entry.meta.slug] = lookupBand(salaryBandsData.hubs, salaryBandsData.bands, bandRef, country)
    }
    return out
  }, [bandRef, salaryBandsData, allData])   // always show full market range; segments kept in CSV for data integrity
  const [period, setPeriod] = useState<'annual' | 'monthly'>(initialPeriod)
  const [detail, setDetail] = useState<'columns' | 'matrix'>('columns')
  const [dataSource, setDataSource] = useState<'market' | 'ats'>(initialSource)

  const cols = gridCols(allData.length)
  const series = allData.map((en, i) => ({
    slug: en.meta.slug, label: en.meta.name[lang],
    rows: en.data.grades, color: SERIES[i], currency: en.data.currency,
  }))

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: t(lang, 'overview') },
    { key: 'grades',   label: t(lang, 'grades') },
    { key: 'domains',  label: t(lang, 'domains') },
    { key: 'sources',  label: t(lang, 'sources') },
  ]

  const periodOpts = [
    { v: 'annual',  label: t(lang, 'annual') },
    { v: 'monthly', label: t(lang, 'monthly') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'color-mix(in srgb, var(--surface) 88%, transparent)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap" style={{ height: 58, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--text)', textDecoration: 'none' }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
                <rect x={3} y={13} width={4.5} height={8} rx={1} />
                <rect x={9.75} y={8} width={4.5} height={13} rx={1} opacity={0.8} />
                <rect x={16.5} y={3} width={4.5} height={18} rx={1} opacity={0.62} />
              </svg>
            </span>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{t(lang, 'appTitle')}</span>
          </Link>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, color: 'var(--muted)', fontSize: 13 }}>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{positionMeta.name[lang]}</span>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            {allData.map((en, i) => (
              <span key={en.meta.slug} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="dot" style={{ background: SERIES[i], width: 7, height: 7 }} />
                <span>{en.meta.flag}</span>
                <span className="hide-sm">{en.meta.name[lang]}</span>
              </span>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <LanguageToggle />
            <UserButton />
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 58, zIndex: 20 }}>
          <div className="wrap" style={{ display: 'flex', gap: 4 }}>
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  padding: '14px 4px', marginRight: 18,
                  fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)',
                  color: tab === key ? 'var(--text)' : 'var(--muted)',
                  borderBottom: '2px solid ' + (tab === key ? 'var(--accent)' : 'transparent'),
                  marginBottom: -1, transition: 'color .14s, border-color .14s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="wrap" style={{ padding: '26px 28px 60px' }}>
        <CurrencyNote allData={allData} lang={lang} />

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            {/* Period toggle — prominent, above the cards */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Toggle options={periodOpts} value={period} onChange={v => setPeriod(v as 'annual' | 'monthly')} />
            </div>
            <SummaryCards allData={allData} period={period} lang={lang} />
            <MarketNote allData={allData} lang={lang} />
            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', rowGap: 6, marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>{t(lang, 'salaryRange')}</h3>
                <span style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t(lang, 'allSizesNote')}</span>
              </div>
              <RangeChart series={series} period={period} lang={lang} expMode={expMode} />
            </div>

            {/* SALARY BAND REFERENCE */}
            {salaryBandsData && (
              <div className="card" style={{ padding: '20px 22px', marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>💰 {lang === 'ru' ? 'Salary Band — эталон' : 'Salary Band reference'}</span>
                  <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
                    <input
                      type="text" value={bandQuery}
                      onChange={e => { setBandQuery(e.target.value); setShowBandDropdown(true); if (!e.target.value) setBandRef(null) }}
                      onFocus={() => setShowBandDropdown(true)}
                      onBlur={() => setTimeout(() => setShowBandDropdown(false), 150)}
                      placeholder={lang === 'ru' ? 'Выберите позицию…' : 'Select a position…'}
                      style={{ width: '100%', padding: '7px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                    {showBandDropdown && bandSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)', maxHeight: 240, overflowY: 'auto' }}>
                        {bandSuggestions.map((p, i) => (
                          <button key={i} onMouseDown={() => { setBandRef(p); setBandQuery(p.position); setShowBandDropdown(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ fontSize: 13, flex: 1 }}>{p.position}</span>
                            <span style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>{p.level}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {bandRef && <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{bandRef.level} · {bandRef.salaryBand}</span>}
                </div>
                {!bandRef && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                    {lang === 'ru'
                      ? 'Выберите позицию выше, чтобы сравнить внутренние вилки с рыночными данными'
                      : 'Select a position above to compare internal bands with market data'}
                  </p>
                )}
                {bandRef && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data">
                      <thead>
                        <tr>
                          <th style={{ paddingLeft: 0 }}>{lang === 'ru' ? 'Локация' : 'Location'}</th>
                          <th style={{ textAlign: 'right' }}>{lang === 'ru' ? 'Band мин–макс (€/мес ≈)' : 'Band min–max (≈€/mo)'}</th>
                          <th style={{ textAlign: 'right' }}>{lang === 'ru' ? 'Band медиана' : 'Band median'}</th>
                          <th style={{ textAlign: 'right' }}>{lang === 'ru' ? 'Рынок Senior (≈€/мес)' : 'Market Senior (≈€/mo)'}</th>
                          <th style={{ textAlign: 'center' }}>{lang === 'ru' ? 'Статус' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allData.map((entry, i) => {
                          const br = bandResults[entry.meta.slug]
                          if (!br) return (
                            <tr key={entry.meta.slug}>
                              <td style={{ paddingLeft: 0 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <span className="dot" style={{ background: SERIES[i], width: 7, height: 7 }} />
                                  <span>{entry.meta.flag} {entry.meta.name[lang]}</span>
                                </span>
                              </td>
                              <td colSpan={4} style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</td>
                            </tr>
                          )
                          const norm = normaliseToMonthlyEur(br.salary)
                          // Market Senior midpoint (all segments)
                          const seniors = entry.data.grades.filter(r => r.grade === 'Senior')
                          const senMin = seniors.length ? Math.min(...seniors.map(r => r.monthly_gross_min)) : null
                          const senMax = seniors.length ? Math.max(...seniors.map(r => r.monthly_gross_max)) : null
                          const senMid = senMin != null && senMax != null ? Math.round((senMin + senMax) / 2) : null
                          // Compare band median vs market senior midpoint
                          let status = '—'
                          let statusColor = 'var(--muted)'
                          if (senMid != null) {
                            const diff = ((norm.median - senMid) / senMid) * 100
                            if (diff > 10) { status = `↑ +${Math.round(diff)}%`; statusColor = 'var(--pos)' }
                            else if (diff < -10) { status = `↓ ${Math.round(diff)}%`; statusColor = 'var(--warn)' }
                            else { status = `≈ ${diff > 0 ? '+' : ''}${Math.round(diff)}%`; statusColor = 'var(--muted)' }
                          }
                          return (
                            <tr key={entry.meta.slug}>
                              <td style={{ paddingLeft: 0 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <span className="dot" style={{ background: SERIES[i], width: 7, height: 7 }} />
                                  <span>{entry.meta.flag} {entry.meta.name[lang]}</span>
                                </span>
                              </td>
                              <td className="mono" style={{ textAlign: 'right', fontSize: 13 }}>
                                €{norm.min}K – €{norm.max}K
                                <div style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>
                                  {fmtBandValue(br.salary, br.salary.min)} – {fmtBandValue(br.salary, br.salary.max)} orig
                                </div>
                              </td>
                              <td className="mono" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
                                €{norm.median}K
                              </td>
                              <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>
                                {senMid != null ? `€${Math.round(senMid / 1000)}K` : '—'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{status}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div style={{ padding: '8px 0', fontSize: 11, color: 'var(--muted-2)' }}>
                      {lang === 'ru'
                        ? 'Статус = Band медиана vs рыночный Senior (медиана). ↑ band выше рынка. ↓ band ниже рынка.'
                        : 'Status = Band median vs market Senior midpoint. ↑ band above market. ↓ band below market.'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BY GRADE */}
        {tab === 'grades' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              {/* Data source toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="eyebrow">{t(lang, 'dataSource')}</span>
                <Toggle
                  options={[
                    { v: 'market', label: t(lang, 'market') + ' ↗' },
                    { v: 'ats', label: '🏢 ' + t(lang, 'atsData') },
                  ]}
                  value={dataSource}
                  onChange={v => setDataSource(v as 'market' | 'ats')}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                {dataSource === 'market' && allData.length > 1 && (
                  <Toggle
                    options={[{ v: 'columns', label: lang === 'ru' ? 'Колонки' : 'Columns' }, { v: 'matrix', label: lang === 'ru' ? 'Матрица' : 'Matrix' }]}
                    value={detail}
                    onChange={v => setDetail(v as 'columns' | 'matrix')}
                  />
                )}
                <Toggle options={periodOpts} value={period} onChange={v => setPeriod(v as 'annual' | 'monthly')} />
              </div>
            </div>

            {/* ATS MODE */}
            {dataSource === 'ats' && (
              <InternalSection
                allData={allData.map((e, i) => ({ meta: e.meta, candidates: e.candidates, color: SERIES[i] }))}
                period={period}
                lang={lang}
              />
            )}

            {/* MARKET MODE */}
            {dataSource === 'market' && (
              <div>
                {detail === 'matrix' ? (
                  <GradeMatrix allData={allData} segment={segment} period={period} lang={lang} expMode={expMode} />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 18 }}>
                    {allData.map((en, i) => (
                      <div key={en.meta.slug} className="card" style={{ padding: '4px 4px 0', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 10px' }}>
                          <span className="dot" style={{ background: SERIES[i], width: 8, height: 8 }} />
                          <span style={{ fontSize: 16 }}>{en.meta.flag}</span>
                          <span style={{ fontWeight: 600 }}>{en.meta.name[lang]}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--muted-2)' }}>{en.data.currency}</span>
                        </div>
                        <GradesTable rows={en.data.grades} segment={segment} period={period} lang={lang} expMode={expMode} />
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 16, maxWidth: 760 }}>
                  {t(lang, 'midMarketNote')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* BY DOMAIN */}
        {tab === 'domains' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
              <Toggle options={periodOpts} value={period} onChange={v => setPeriod(v as 'annual' | 'monthly')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {allData.map(en => (
                <div key={en.meta.slug}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{en.meta.flag}</span>
                    <span style={{ fontWeight: 600 }}>{en.meta.name[lang]}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)' }}>{en.data.currency}</span>
                  </div>
                  <DomainsGrid domains={en.data.domains} currency={en.data.currency} period={period} lang={lang} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOURCES */}
        {tab === 'sources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {allData.map(en => (
              <SourcesList key={en.meta.slug} sources={en.data.sources} countryLabel={`${en.meta.flag} ${en.meta.name[lang]}`} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div className="wrap" style={{ padding: '20px 28px', fontSize: 12, color: 'var(--muted-2)' }}>
          {t(lang, 'footer')}
        </div>
      </div>
    </div>
  )
}
