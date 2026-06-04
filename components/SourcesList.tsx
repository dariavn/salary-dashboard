'use client'
import { useState } from 'react'
import type { SourceRow } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import ConfidenceBadge from './ConfidenceBadge'

const TYPE_BADGE: Record<string, string> = {
  aggregator:       'bg-sky-100 text-sky-800',
  salary_survey:    'bg-purple-100 text-purple-800',
  job_posting:      'bg-orange-100 text-orange-800',
  recruiter_report: 'bg-pink-100 text-pink-800',
}

interface Props {
  sources: SourceRow[]
  countryLabel: string
}

export default function SourcesList({ sources, countryLabel }: Props) {
  const { lang } = useLang()
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-800">{countryLabel}</span>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="py-2 px-4">{t(lang, 'sourceName')}</th>
                <th className="py-2 px-4">{t(lang, 'sourceType')}</th>
                <th className="py-2 px-4">{t(lang, 'dataDate')}</th>
                <th className="py-2 px-4">{t(lang, 'confidence')}</th>
                <th className="py-2 px-4 max-w-xs">{t(lang, 'notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sources.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium text-gray-800">{s.source_name}</td>
                  <td className="py-2 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[s.source_type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {s.source_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-500">{s.data_date}</td>
                  <td className="py-2 px-4"><ConfidenceBadge value={s.confidence} /></td>
                  <td className="py-2 px-4 text-gray-500 text-xs max-w-xs" title={s.notes}>{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
