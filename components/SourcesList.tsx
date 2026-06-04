'use client'
import { useState } from 'react'
import type { SourceRow } from '@/lib/types'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import ConfidenceBadge from './ConfidenceBadge'

const TYPE_STYLES: Record<string, { text: string; bg: string }> = {
  aggregator:       { text: '#89dceb', bg: 'rgba(137,220,235,0.15)' },
  salary_survey:    { text: '#cba6f7', bg: 'rgba(203,166,247,0.15)' },
  job_posting:      { text: '#ffd166', bg: 'rgba(255,209,102,0.15)' },
  recruiter_report: { text: '#f38ba8', bg: 'rgba(243,139,168,0.15)' },
}

interface Props {
  sources: SourceRow[]
  countryLabel: string
}

export default function SourcesList({ sources, countryLabel }: Props) {
  const { lang } = useLang()
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 transition-colors"
        style={{ background: 'var(--card2)', color: 'var(--text)' }}
      >
        <span className="font-semibold">{countryLabel}</span>
        <span style={{ color: 'var(--muted)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="overflow-x-auto" style={{ background: 'var(--card)' }}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                <th className="py-2 px-4 text-left">{t(lang, 'sourceName')}</th>
                <th className="py-2 px-4 text-left">{t(lang, 'sourceType')}</th>
                <th className="py-2 px-4 text-left">{t(lang, 'dataDate')}</th>
                <th className="py-2 px-4 text-left">{t(lang, 'confidence')}</th>
                <th className="py-2 px-4 text-left">{t(lang, 'notes')}</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s, i) => {
                const ts = TYPE_STYLES[s.source_type] ?? { text: '#8b90a8', bg: 'rgba(139,144,168,0.12)' }
                return (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: i < sources.length - 1 ? '1px solid var(--border)' : undefined }}
                  >
                    <td className="py-2.5 px-4 font-medium" style={{ color: 'var(--text)' }}>{s.source_name}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: ts.text, background: ts.bg }}>
                        {s.source_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--muted)' }}>{s.data_date}</td>
                    <td className="py-2.5 px-4"><ConfidenceBadge value={s.confidence} /></td>
                    <td className="py-2.5 px-4 text-xs max-w-xs" style={{ color: 'var(--muted)' }} title={s.notes}>{s.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
