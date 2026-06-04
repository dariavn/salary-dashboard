'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { PositionMeta, LocationMeta, CountryData } from '@/lib/types'
import type { Segment } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import GradesChart from '@/components/GradesChart'
import GradesTable from '@/components/GradesTable'
import DomainsGrid from '@/components/DomainsGrid'
import SourcesList from '@/components/SourcesList'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444']

interface Entry {
  meta: LocationMeta
  data: CountryData
}

interface Props {
  positionMeta: PositionMeta
  allData: Entry[]
}

type Tab = 'grades' | 'domains' | 'sources'

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
    color: COLORS[i],
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm shrink-0">
              {t(lang, 'backHome')}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-800 truncate">{positionMeta.name[lang]}</span>
            {allData.map((e) => (
              <span key={e.meta.slug} className="flex items-center gap-1 text-sm text-gray-600">
                <span>·</span>
                <span>{e.meta.flag}</span>
                <span className="hidden sm:inline">{e.meta.name[lang]}</span>
              </span>
            ))}
          </div>
          <LanguageToggle />
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Currency warning */}
      {hasMixedCurrencies && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-amber-800 text-sm">
            ⚠️ {t(lang, 'currencyWarning')}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* GRADES TAB */}
        {tab === 'grades' && (
          <div>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex gap-1">
                {segments.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSegment(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      segment === key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      period === p
                        ? 'bg-gray-800 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t(lang, p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                {t(lang, 'salaryRange')} — {t(lang, period)}
              </h3>
              <GradesChart series={chartSeries} segment={segment} period={period} />
            </div>

            {/* Tables per country */}
            <div className={`grid gap-6 ${allData.length === 1 ? 'grid-cols-1' : allData.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>
              {allData.map((entry, i) => (
                <div key={entry.meta.slug} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                    <span className="text-base font-bold text-gray-800">
                      {entry.meta.flag} {entry.meta.name[lang]}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">{entry.data.currency}</span>
                  </div>
                  <GradesTable rows={entry.data.grades} segment={segment} period={period} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DOMAINS TAB */}
        {tab === 'domains' && (
          <div className={`grid gap-6 ${allData.length === 1 ? 'grid-cols-1' : allData.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>
            {allData.map((entry) => (
              <div key={entry.meta.slug}>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                  <span>{entry.meta.flag}</span>
                  <span>{entry.meta.name[lang]}</span>
                  <span className="text-xs font-normal text-gray-400 ml-1">{entry.data.currency}</span>
                </h3>
                <DomainsGrid domains={entry.data.domains} currency={entry.data.currency} />
              </div>
            ))}
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
