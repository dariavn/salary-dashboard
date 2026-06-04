'use client'
import { useState } from 'react'
import type { SourceRow } from '@/lib/types'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'
import ConfidenceBadge from './ConfidenceBadge'

const STYPE_COLOR: Record<string, string> = {
  aggregator:       'var(--s2)',
  salary_survey:    'var(--s1)',
  job_posting:      'var(--s3)',
  recruiter_report: 'var(--s4)',
}

interface Props {
  sources: SourceRow[]
  countryLabel: string
  lang?: Lang
}

export default function SourcesList({ sources, countryLabel, lang: langProp }: Props) {
  const ctx = useLang()
  const lang = langProp ?? ctx.lang
  const [open, setOpen] = useState(true)

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--surface-2)', border: 'none', borderBottom: open ? '1px solid var(--border)' : 'none', cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
      >
        <span style={{ fontWeight: 600 }}>{countryLabel}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {sources.length} {t(lang, 'sourcesCount')}</span>
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
      </button>
      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>{t(lang, 'sourceName')}</th>
                <th>{t(lang, 'sourceType')}</th>
                <th>{t(lang, 'dataDate')}</th>
                <th>{t(lang, 'confidence')}</th>
                <th style={{ paddingRight: 16 }}>{t(lang, 'notes')}</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s, i) => {
                const c = STYPE_COLOR[s.source_type] || 'var(--neutral)'
                return (
                  <tr key={i}>
                    <td style={{ paddingLeft: 16, fontWeight: 500, fontSize: 13.5 }}>{s.source_name}</td>
                    <td>
                      <span className="pill" style={{ color: c, background: `color-mix(in srgb, ${c} 13%, transparent)` }}>
                        {t(lang, s.source_type as 'aggregator' | 'salary_survey' | 'job_posting' | 'recruiter_report')}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{s.data_date}</td>
                    <td><ConfidenceBadge value={s.confidence} lang={lang} /></td>
                    <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 320, paddingRight: 16 }}>{s.notes}</td>
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
