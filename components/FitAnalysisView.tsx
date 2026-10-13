'use client'
import { useMemo, useState } from 'react'
import type { FitAnalysis, FitCandidate, BlockScore } from '@/lib/types'
import type { Lang } from '@/lib/i18n'

interface Props { fit: FitAnalysis; countryLabel: string; lang: Lang }

const L = {
  en: {
    title: 'Best-fit analysis', top: 'Best fit', topHint: 'Candidates with the strongest coverage of all 5 blocks',
    budget: 'Recommended budget', funnel: 'Funnel: full match', blocks: 'The 5 blocks',
    market: 'Market', howToClose: 'How to close', all: 'All', search: 'Search…',
    candidate: 'Candidate', coverage: 'Coverage', exp: 'Exp.', city: 'City', expect: 'Expectations',
    of5: 'of 5', partial: 'partial', missing: 'No', half: 'Partial', allConfirmed: 'All blocks confirmed by experience',
    method: 'Method', updated: 'Updated', nothing: 'No candidates match the filter',
  },
  ru: {
    title: 'Фит-анализ', top: 'Самый фитовый фит', topHint: 'Кандидаты с наибольшим покрытием 5 блоков',
    budget: 'Рекомендуемый бюджет', funnel: 'Воронка: полное совпадение', blocks: '5 блоков роли',
    market: 'Рынок', howToClose: 'Как закрывать', all: 'Все', search: 'Поиск…',
    candidate: 'Кандидат', coverage: 'Покрытие', exp: 'Опыт', city: 'Город', expect: 'Ожидания',
    of5: 'из 5', partial: 'частично', missing: 'Нет', half: 'Частично', allConfirmed: 'Все блоки подтверждены опытом',
    method: 'Методология', updated: 'Обновлено', nothing: 'Нет кандидатов под фильтр',
  },
}

const MARK: Record<BlockScore, string> = { 2: '✓', 1: '◐', 0: '✕' }
const MARK_STYLE: Record<BlockScore, { color: string; background: string }> = {
  2: { color: 'var(--pos)', background: 'var(--pos-bg)' },
  1: { color: 'var(--warn)', background: 'var(--warn-bg)' },
  0: { color: 'var(--muted-2)', background: 'var(--surface-2)' },
}

const full = (c: FitCandidate) => c.blocks.filter(b => b === 2).length
const part = (c: FitCandidate) => c.blocks.filter(b => b === 1).length

function coverageColor(n: number) {
  return n === 5 ? 'var(--pos)' : n >= 4 ? 'var(--accent)' : n >= 3 ? 'var(--warn)' : 'var(--muted)'
}

function Coverage({ c, blockKeys, lang, big }: { c: FitCandidate; blockKeys: string[]; lang: Lang; big?: boolean }) {
  const s = L[lang]
  const f = full(c), p = part(c)
  const miss = blockKeys.filter((_, i) => c.blocks[i] === 0)
  const half = blockKeys.filter((_, i) => c.blocks[i] === 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="mono" style={{ fontSize: big ? 22 : 15, fontWeight: 700, color: coverageColor(f) }}>{f} {s.of5}</span>
        {p > 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>+ {p} {s.partial}</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
        {blockKeys.map((k, i) => (
          <span key={k} style={{ ...MARK_STYLE[c.blocks[i]], fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {MARK[c.blocks[i]]} {k}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: miss.length || half.length ? 'var(--muted)' : 'var(--pos)', marginTop: 6 }}>
        {miss.length || half.length
          ? [miss.length ? `${s.missing}: ${miss.join(', ')}` : '', half.length ? `${s.half}: ${half.join(', ')}` : ''].filter(Boolean).join(' · ')
          : s.allConfirmed}
      </div>
    </div>
  )
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{children}</h3>
      {hint && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{hint}</span>}
    </div>
  )
}

export default function FitAnalysisView({ fit, countryLabel, lang }: Props) {
  const s = L[lang]
  const blockKeys = fit.blocks.map(b => b.key)
  const [group, setGroup] = useState<string>('all')
  const [q, setQ] = useState('')

  const sorted = useMemo(
    () => [...fit.candidates].sort((a, b) => full(b) - full(a) || part(b) - part(a)),
    [fit.candidates],
  )
  const top = sorted.slice(0, 3)
  const groupKeys = Object.keys(fit.groups).filter(g => fit.candidates.some(c => c.group === g))
  const rows = sorted.filter(c =>
    (group === 'all' || c.group === group) &&
    (!q || [c.title, c.summary, c.city, c.expectations].join(' ').toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Answer */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span className="eyebrow">{countryLabel} · {s.title}</span>
          <span style={{ fontSize: 11.5, color: 'var(--muted-2)', marginLeft: 'auto' }}>{s.updated}: {fit.updated}</span>
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{fit.question}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>{fit.answer}</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', border: '1px solid var(--accent-ring)' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>₽</span>
          <span style={{ fontSize: 13.5, lineHeight: 1.55 }}><b>{s.budget}:</b> {fit.budget}</span>
        </div>
      </div>

      {/* Best fit */}
      <div>
        <SectionTitle hint={s.topHint}>★ {s.top}</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {top.map((c, i) => (
            <div key={c.url} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, borderColor: i === 0 ? 'var(--pos)' : undefined, boxShadow: i === 0 ? '0 0 0 1px var(--pos)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--muted-2)', paddingTop: 2 }}>#{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.city} · {c.experience}</div>
                </div>
              </div>
              <Coverage c={c} blockKeys={blockKeys} lang={lang} big />
              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-2)', margin: 0, flex: 1 }}>{c.summary}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--muted)' }}>{s.expect}: {c.expectations}</span>
                <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>hh →</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel + blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <SectionTitle>{s.funnel}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fit.funnel.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 'var(--r-md)', background: f.highlight ? 'var(--pos-bg)' : 'var(--surface-2)', marginLeft: Math.min(i, 5) * 8 }}>
                <span style={{ fontSize: 13, flex: 1, color: 'var(--text-2)' }}>{f.label}</span>
                <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: f.highlight ? 'var(--pos)' : 'var(--text)' }}>{f.value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)', margin: '12px 0 0' }}>{fit.funnelNote}</p>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <SectionTitle>{s.blocks}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fit.blocks.map(b => (
              <div key={b.key}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.45 }}>{b.where}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        {[{ title: s.market, items: fit.insights }, { title: s.howToClose, items: fit.howToClose }].map(block => (
          <div key={block.title} className="card" style={{ padding: '18px 20px' }}>
            <SectionTitle>{block.title}</SectionTitle>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {block.items.map((it, i) => <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* All candidates */}
      <div className="card" style={{ padding: '18px 4px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '0 16px 12px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{s.candidate} · {fit.candidates.length}</h3>
          <div className="seg" style={{ marginLeft: 'auto', flexWrap: 'wrap' }}>
            <button aria-pressed={group === 'all'} onClick={() => setGroup('all')}>{s.all}</button>
            {groupKeys.map(g => (
              <button key={g} aria-pressed={group === g} onClick={() => setGroup(g)} title={fit.groups[g]}>
                {g === 'S' ? '★' : g}
              </button>
            ))}
          </div>
          <input
            value={q} onChange={e => setQ(e.target.value)} placeholder={s.search}
            style={{ padding: '6px 10px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 13, width: 160 }}
          />
        </div>
        {group !== 'all' && (
          <div style={{ padding: '0 16px 10px', fontSize: 12.5, color: 'var(--muted)' }}>{fit.groups[group]}</div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>{s.candidate}</th>
                <th>{s.coverage}</th>
                <th>{s.exp}</th>
                <th>{s.city}</th>
                <th style={{ textAlign: 'right' }}>{s.expect}</th>
                <th>CV</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.url}>
                  <td className="mono" style={{ color: 'var(--muted-2)', verticalAlign: 'top' }}>{i + 1}</td>
                  <td style={{ verticalAlign: 'top', minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span title={fit.groups[c.group]} style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: c.group === 'S' ? 'var(--pos-bg)' : 'var(--surface-3)', color: c.group === 'S' ? 'var(--pos)' : 'var(--text-2)' }}>
                        {c.group === 'S' ? '★' : c.group}
                      </span>
                      <b style={{ fontSize: 13.5 }}>{c.title}</b>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.45 }}>{c.summary}</div>
                  </td>
                  <td style={{ verticalAlign: 'top', minWidth: 230 }}><Coverage c={c} blockKeys={blockKeys} lang={lang} /></td>
                  <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap', fontSize: 13 }}>{c.experience}</td>
                  <td style={{ verticalAlign: 'top', fontSize: 13 }}>{c.city}</td>
                  <td className="mono" style={{ verticalAlign: 'top', textAlign: 'right', fontSize: 12.5 }}>{c.expectations}</td>
                  <td style={{ verticalAlign: 'top' }}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>hh →</a>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{s.nothing}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--muted)', margin: 0 }}>
        <b>{s.method}:</b> {fit.method}
      </p>
    </div>
  )
}
