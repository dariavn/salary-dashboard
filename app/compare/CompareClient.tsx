'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { PositionMeta, LocationMeta, CountryData, GradeRow } from '@/lib/types'
import type { Segment } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t, GRADE_ORDER, GRADE_STYLES } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import GradesChart from '@/components/GradesChart'
import GradesTable from '@/components/GradesTable'
import DomainsGrid from '@/components/DomainsGrid'
import SourcesList from '@/components/SourcesList'

const COUNTRY_COLORS = ['#6c63ff', '#ffd166', '#00d4aa', '#f38ba8']

interface Entry { meta: LocationMeta; data: CountryData }
interface Props { positionMeta: PositionMeta; allData: Entry[] }
type Tab = 'grades' | 'domains' | 'sources'

function fmtShort(n: number, currency: string) {
  if (currency === 'RUB') return `${Math.round(n / 1000)}K ₽`
  return `€${Math.round(n / 1000)}K`
}

function KPICards({ rows, segment, period, currency }: { rows: GradeRow[]; segment: Segment | 'all'; period: 'annual' | 'monthly'; currency: string }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${GRADE_ORDER.length}, 1fr)` }}>
      {GRADE_ORDER.map((grade) => {
        const gradeRows = rows.filter(r => r.grade === grade && (segment === 'all' || r.segment === segment))
        const row = gradeRows.find(r => r.segment === 'mid_market') ?? gradeRows[0]
        if (!row) return (
          <div key={grade} className="rounded-xl p-3 opacity-30" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
            <div className="text-xs uppercase" style={{ color: 'var(--muted)' }}>{grade}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>—</div>
          </div>
        )
        const min = period === 'annual' ? row.annual_gross_min : row.monthly_gross_min
        const max = period === 'annual' ? row.annual_gross_max : row.monthly_gross_max
        const style = GRADE_STYLES[grade] ?? GRADE_STYLES['Head']
        return (
          <div
            key={grade}
            className="rounded-xl p-3 relative overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--card)', borderTop: `3px solid ${style.text}` }}
          >
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>{grade}</div>
            <div className="text-sm font-bold whitespace-nowrap" style={{ color: style.text }}>
              {fmtShort(min, currency)}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>– {fmtShort(max, currency)}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function CompareClient({ positionMeta, allData }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<Tab>('grades')
  const [segment, setSegment] = useState<Segment | 'all'>('mid_market')
  const [period, setPeriod] = useState<'annual' | 'monthly'>('annual')

  const hasMixedCurrencies = new Set(allData.map((e) => e.data.currency)).size > 1

  const chartSeries = allData.map((e, i) => ({
    location: e.meta.slug,
    label: e.meta.name[lang],
    rows: e.data.grades,
    color: COUNTRY_COLORS[i],
    currency: e.data.currency,
  }))

  const tabs: { key: Tab; label: string }[] = [
    { key: 'grades',  label: t(lang, 'grades') },
    { key: 'domains', label: t(lang, 'domains') },
    { key: 'sources', label: t(lang, 'sources') },
  ]

  const segments: { key: Segment | 'all'; label: string }[] = [
    { key: 'all',        label: t(lang, 'allSegments') },
    { key: 'local_sme',  label: t(lang, 'local_sme') },
    { key: 'mid_market', label: t(lang, 'mid_market') },
    { key: 'premium',    label: t(lang, 'premium') },
  ]

  const gridCls = allData.length === 1 ? 'grid-cols-1' : allData.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(26,29,39,0.9)', backdropFilter: 'blur(8px)' }} className="sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-sm transition-colors" style={{ color: 'var(--muted)' }}>
              {t(lang, 'backHome')}
            </Link>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span className="font-semibold truncate" style={{ color: 'var(--text)' }}>{positionMeta.name[lang]}</span>
            {allData.map((e) => (
              <span key={e.meta.slug} className="flex items-center gap-1 text-sm shrink-0" style={{ color: 'var(--muted)' }}>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span>{e.meta.flag}</span>
                <span className="hidden sm:inline">{e.meta.name[lang]}</span>
              </span>
            ))}
          </div>
          <LanguageToggle />
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              style={
                tab === key
                  ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                  : { borderColor: 'transparent', color: 'var(--muted)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Currency warning */}
      {hasMixedCurrencies && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="rounded-lg px-4 py-2 text-sm" style={{ background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.2)', color: '#ffd166' }}>
            ⚠️ {t(lang, 'currencyWarning')}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* GRADES TAB */}
        {tab === 'grades' && (
          <div>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex flex-wrap gap-1">
                {segments.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSegment(key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={
                      segment === key
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 ml-auto">
                {(['annual', 'monthly'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={
                      period === p
                        ? { background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)' }
                        : { background: 'transparent', color: 'var(--muted)', border: '1px solid transparent' }
                    }
                  >
                    {t(lang, p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
                {t(lang, 'salaryRange')} — {t(lang, period)}
              </h3>
              <GradesChart series={chartSeries} segment={segment} period={period} />
            </div>

            {/* KPI cards + tables per country */}
            <div className={`grid gap-6 ${gridCls}`}>
              {allData.map((entry, i) => (
                <div key={entry.meta.slug}>
                  {/* Country header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COUNTRY_COLORS[i] }} />
                    <span className="font-bold text-base" style={{ color: 'var(--text)' }}>
                      {entry.meta.flag} {entry.meta.name[lang]}
                    </span>
                    <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>{entry.data.currency}</span>
                  </div>

                  {/* KPI cards */}
                  <div className="mb-4">
                    <KPICards rows={entry.data.grades} segment={segment} period={period} currency={entry.data.currency} />
                  </div>

                  {/* Grade table */}
                  <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <GradesTable rows={entry.data.grades} segment={segment} period={period} />
                  </div>

                  {/* Range note */}
                  {segment === 'all' && (
                    <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--card2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                      ⚡ <span style={{ color: '#ffd166' }}>Note:</span> {t(lang, 'midMarketNote')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DOMAINS TAB */}
        {tab === 'domains' && (
          <div>
            <div className="flex justify-end mb-5">
              <div className="flex gap-1">
                {(['annual', 'monthly'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={
                      period === p
                        ? { background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)' }
                        : { background: 'transparent', color: 'var(--muted)', border: '1px solid transparent' }
                    }
                  >
                    {t(lang, p)}
                  </button>
                ))}
              </div>
            </div>
            <div className={`grid gap-8 ${gridCls}`}>
              {allData.map((entry) => (
                <div key={entry.meta.slug}>
                  <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: 'var(--text)' }}>
                    <span>{entry.meta.flag}</span>
                    <span>{entry.meta.name[lang]}</span>
                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--muted)' }}>{entry.data.currency}</span>
                  </h3>
                  <DomainsGrid domains={entry.data.domains} currency={entry.data.currency} period={period} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOURCES TAB */}
        {tab === 'sources' && (
          <div className="flex flex-col gap-4">
            {allData.map((entry) => (
              <SourcesList
                key={entry.meta.slug}
                sources={entry.data.sources}
                countryLabel={`${entry.meta.flag} ${entry.meta.name[lang]}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
