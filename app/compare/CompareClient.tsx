'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { PositionMeta, LocationMeta, CountryData, CandidateRow } from '@/lib/types'
import type { Segment } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t, SERIES, GRADE_VAR, GRADE_KEY, GRADE_ORDER, fmtK } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import RangeChart from '@/components/RangeChart'
import SummaryCards from '@/components/SummaryCards'
import GradesTable from '@/components/GradesTable'
import DomainsGrid from '@/components/DomainsGrid'
import SourcesList from '@/components/SourcesList'
import InternalSection from '@/components/InternalSection'

interface Entry { meta: LocationMeta; data: CountryData; candidates: CandidateRow[] }
interface Props { positionMeta: PositionMeta; allData: Entry[]; initialSource?: 'market' | 'ats' }
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

function CurrencyNote({ allData, lang }: { allData: Entry[]; lang: string }) {
  const mixed = new Set(allData.map(e => e.data.currency)).size > 1
  if (!mixed) return null
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 'var(--r-md)', background: 'var(--warn-bg)', border: '1px solid color-mix(in srgb, var(--warn) 28%, transparent)', marginBottom: 18, fontSize: 13, color: 'var(--text-2)' }}>
      <span style={{ color: 'var(--warn)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>!</span>
      <span>{t(lang as any, 'currencyWarning')}</span>
    </div>
  )
}

function GradeMatrix({ allData, segment, period, lang }: { allData: Entry[]; segment: Segment | 'all'; period: 'annual' | 'monthly'; lang: any }) {
  const lo = (r: any) => period === 'annual' ? r.annual_gross_min : r.monthly_gross_min
  const hi = (r: any) => period === 'annual' ? r.annual_gross_max : r.monthly_gross_max
  function rng(en: CountryData, g: string) {
    const f = en.grades.filter(r => r.grade === g && (segment === 'all' || r.segment === segment))
    if (!f.length) return null
    if (segment === 'all') return { min: Math.min(...f.map(lo)), max: Math.max(...f.map(hi)) }
    const row = f.find(r => r.segment === 'mid_market') || f[0]
    return { min: lo(row), max: hi(row) }
  }
  return (
    <div className="card" style={{ overflowX: 'auto', padding: '4px 4px' }}>
      <table className="data">
        <thead>
          <tr>
            <th style={{ paddingLeft: 16 }}>{t(lang, 'grade')}</th>
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
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{t(lang, GRADE_KEY[g]!)}</span>
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
  if (n === 3) return 'repeat(3, 1fr)'
  return 'repeat(2, 1fr)'
}

export default function CompareClient({ positionMeta, allData, initialSource = 'market' }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<Tab>('overview')
  const [segment, setSegment] = useState<Segment | 'all'>('mid_market')
  const [period, setPeriod] = useState<'annual' | 'monthly'>('annual')
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

  const segOpts = [
    { v: 'mid_market', label: t(lang, 'mid_market') },
    { v: 'all',        label: t(lang, 'allSegments') },
    { v: 'local_sme',  label: t(lang, 'local_sme') },
    { v: 'premium',    label: t(lang, 'premium') },
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
          <div style={{ marginLeft: 'auto' }}><LanguageToggle /></div>
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
            <SummaryCards allData={allData} period={period} lang={lang} />
            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', rowGap: 10, marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>{t(lang, 'salaryRange')}</h3>
                <span style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t(lang, 'allSizesNote')}</span>
                <div style={{ marginLeft: 'auto' }}>
                  <Toggle options={periodOpts} value={period} onChange={v => setPeriod(v as 'annual' | 'monthly')} />
                </div>
              </div>
              <RangeChart series={series} period={period} lang={lang} />
            </div>
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
              {/* Market controls (hidden in ATS mode) */}
              {dataSource === 'market' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="eyebrow">{t(lang, 'segment')}</span>
                  <Toggle options={segOpts} value={segment} onChange={v => setSegment(v as Segment | 'all')} />
                </div>
              )}
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
                  <GradeMatrix allData={allData} segment={segment} period={period} lang={lang} />
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
                        <GradesTable rows={en.data.grades} segment={segment} period={period} lang={lang} />
                      </div>
                    ))}
                  </div>
                )}
                {segment === 'all' && (
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 16, maxWidth: 760 }}>
                    {t(lang, 'midMarketNote')}
                  </p>
                )}
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
