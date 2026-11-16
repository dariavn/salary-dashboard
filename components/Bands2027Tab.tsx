'use client'
import { useMemo, useState, Fragment } from 'react'
import { useLang } from '@/context/LangContext'
import {
  toPeriod, fmtMoney, fmtShort,
  type Position2027, type LocStats, type RawLocation,
} from '@/lib/bands2027'

type Period = 'month' | 'year'
type Loc = 'cy' | 'ru'

interface Props {
  positions: Position2027[]
  updated: string
  notionUrl: string | null
}

const LOC_META: Record<Loc, { flag: string; ru: string; en: string; basisRu: string; basisEn: string; color: string }> = {
  cy: { flag: '🇨🇾', ru: 'Кипр', en: 'Cyprus', basisRu: 'GROSS · EUR', basisEn: 'GROSS · EUR', color: 'var(--s4)' },
  ru: { flag: '🇷🇺', ru: 'Россия', en: 'Russia', basisRu: 'NET (на руки) · RUB', basisEn: 'NET (take-home) · RUB', color: 'var(--s5)' },
}

const TYPE_LABEL: Record<string, { ru: string; en: string }> = {
  resume: { ru: 'резюме', en: 'CVs' },
  vacancy: { ru: 'вакансии', en: 'vacancies' },
  survey: { ru: 'обзоры/отчёты', en: 'surveys' },
}

const IND_LABEL: Record<string, string> = {
  fintech: 'FinTech', igaming: 'iGaming', gaming: 'Gaming', bigtech: 'BigTech',
  it_product: 'IT product', other: 'Other',
}

const CONF: Record<LocStats['confidence'], { ru: string; en: string; color: string; bg: string }> = {
  high:   { ru: 'высокая достоверность', en: 'high confidence',   color: 'var(--pos)',     bg: 'var(--pos-bg)' },
  medium: { ru: 'средняя достоверность', en: 'medium confidence', color: 'var(--warn)',    bg: 'var(--warn-bg)' },
  low:    { ru: 'мало данных',           en: 'thin data',         color: '#c0392b',        bg: 'rgba(192,57,43,.10)' },
  none:   { ru: 'нет данных',            en: 'no data',           color: 'var(--neutral)', bg: 'var(--neutral-bg)' },
}

function Pill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, color, background: bg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function P75Cell({ loc, stats, period, lang }: { loc: Loc; stats: LocStats | null; period: Period; lang: 'ru' | 'en' }) {
  if (!stats) {
    return <div style={{ color: 'var(--muted-2)', fontSize: 13 }}>{lang === 'ru' ? 'нет данных' : 'no data'}</div>
  }
  const c = CONF[stats.confidence]
  const span = stats.max - stats.min || 1
  const pct = (x: number) => `${((x - stats.min) / span) * 100}%`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.1 }}>
        {fmtMoney(loc, toPeriod(loc, stats.p75, period))}
      </div>
      {/* range bar: min..max, IQR shaded, P75 tick */}
      <div style={{ position: 'relative', height: 6, background: 'var(--surface-3)', borderRadius: 3, maxWidth: 220 }} title={`min ${fmtShort(loc, toPeriod(loc, stats.min, period))} · P25 ${fmtShort(loc, toPeriod(loc, stats.p25, period))} · P50 ${fmtShort(loc, toPeriod(loc, stats.median, period))} · P75 ${fmtShort(loc, toPeriod(loc, stats.p75, period))} · max ${fmtShort(loc, toPeriod(loc, stats.max, period))}`}>
        <div style={{ position: 'absolute', left: pct(stats.p25), width: `calc(${pct(stats.p75)} - ${pct(stats.p25)})`, top: 0, bottom: 0, background: `color-mix(in srgb, ${LOC_META[loc].color} 30%, transparent)`, borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: pct(stats.p75), top: -3, width: 3, height: 12, marginLeft: -1.5, background: LOC_META[loc].color, borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
          n = {stats.n}
        </span>
        <Pill color={c.color} bg={c.bg}>● {lang === 'ru' ? c.ru : c.en}</Pill>
      </div>
    </div>
  )
}

function StripPlot({ loc, data, stats, period, lang }: { loc: Loc; data: RawLocation; stats: LocStats; period: Period; lang: 'ru' | 'en' }) {
  const pts = data.points.filter(p => p.value > 0 && p.match !== 'low')
  const W = 640, H = 92, padL = 12, padR = 12
  const lo = stats.min, hi = stats.max, span = hi - lo || 1
  const x = (v: number) => padL + ((v - lo) / span) * (W - padL - padR)
  const typeColor: Record<string, string> = { resume: 'var(--s1)', vacancy: 'var(--s2)', survey: 'var(--s3)' }
  const marks: { v: number; label: string; strong?: boolean }[] = [
    { v: stats.p25, label: 'P25' },
    { v: stats.median, label: 'P50' },
    { v: stats.p75, label: 'P75', strong: true },
  ]
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} role="img" aria-label={lang === 'ru' ? 'Распределение точек данных' : 'Data point distribution'}>
        <line x1={padL} x2={W - padR} y1={52} y2={52} stroke="var(--grid)" strokeWidth={1} />
        {marks.map(m => (
          <g key={m.label}>
            <line x1={x(m.v)} x2={x(m.v)} y1={14} y2={70} stroke={m.strong ? LOC_META[loc].color : 'var(--border-strong)'} strokeWidth={m.strong ? 2.5 : 1} strokeDasharray={m.strong ? undefined : '3 3'} />
            <text x={x(m.v)} y={10} textAnchor="middle" fontSize={m.strong ? 11 : 10} fontWeight={m.strong ? 700 : 500} fill={m.strong ? LOC_META[loc].color : 'var(--muted)'} fontFamily="var(--font-mono)">{m.label}</text>
          </g>
        ))}
        {pts.map((p, i) => (
          <circle key={i} cx={x(p.value)} cy={52 + (((i * 37) % 23) - 11)} r={4} fill={typeColor[p.type] ?? 'var(--muted)'} fillOpacity={0.7} stroke="var(--surface)" strokeWidth={1}>
            <title>{`${fmtMoney(loc, toPeriod(loc, p.value, period))} — ${p.title}${p.company ? ' · ' + p.company : ''}`}</title>
          </circle>
        ))}
        <text x={padL} y={H - 4} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{fmtShort(loc, toPeriod(loc, lo, period))}</text>
        <text x={W - padR} y={H - 4} fontSize={10} fill="var(--muted)" textAnchor="end" fontFamily="var(--font-mono)">{fmtShort(loc, toPeriod(loc, hi, period))}</text>
      </svg>
      <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--muted)', marginTop: 4, flexWrap: 'wrap' }}>
        {Object.entries(typeColor).filter(([k]) => stats.byType[k]).map(([k, c]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />
            {TYPE_LABEL[k]?.[lang] ?? k}: <b style={{ color: 'var(--text-2)' }}>{stats.byType[k]}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

function RawTable({ loc, data, period, lang }: { loc: Loc; data: RawLocation; period: Period; lang: 'ru' | 'en' }) {
  const pts = [...data.points].filter(p => p.value > 0 && p.match !== 'low').sort((a, b) => b.value - a.value)
  return (
    <div style={{ maxHeight: 340, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-2)', zIndex: 1 }}>
          <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
            <th style={{ padding: '7px 10px', textAlign: 'right' }}>{lang === 'ru' ? 'Сумма' : 'Value'}</th>
            <th style={{ padding: '7px 10px' }}>{lang === 'ru' ? 'Тип' : 'Type'}</th>
            <th style={{ padding: '7px 10px' }}>{lang === 'ru' ? 'Позиция' : 'Title'}</th>
            <th style={{ padding: '7px 10px' }}>{lang === 'ru' ? 'Компания' : 'Company'}</th>
            <th style={{ padding: '7px 10px' }}>{lang === 'ru' ? 'Индустрия' : 'Industry'}</th>
            <th style={{ padding: '7px 10px' }}>{lang === 'ru' ? 'Исходно' : 'Raw'}</th>
          </tr>
        </thead>
        <tbody>
          {pts.map((p, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="mono" style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoney(loc, toPeriod(loc, p.value, period))}</td>
              <td style={{ padding: '6px 10px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{TYPE_LABEL[p.type]?.[lang] ?? p.type}</td>
              <td style={{ padding: '6px 10px' }}>
                {p.url ? <a href={p.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{p.title} ↗</a> : p.title}
                {p.evidence && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{p.evidence}</div>}
              </td>
              <td style={{ padding: '6px 10px', color: 'var(--text-2)' }}>{p.company ?? '—'}</td>
              <td style={{ padding: '6px 10px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{IND_LABEL[p.industry ?? ''] ?? p.industry ?? '—'}</td>
              <td style={{ padding: '6px 10px', color: 'var(--muted)', fontSize: 11 }}>{p.raw ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LocDetail({ loc, pos, period, lang }: { loc: Loc; pos: Position2027; period: Period; lang: 'ru' | 'en' }) {
  const [showRaw, setShowRaw] = useState(false)
  const data = pos[loc]
  const stats = pos.stats[loc]
  const m = LOC_META[loc]
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16 }}>{m.flag}</span>
        <span style={{ fontWeight: 600 }}>{lang === 'ru' ? m.ru : m.en}</span>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{lang === 'ru' ? m.basisRu : m.basisEn}</span>
      </div>
      {!data || !stats ? (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{lang === 'ru' ? 'Данных пока нет.' : 'No data yet.'}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
            {[
              { k: 'P25', v: stats.p25 },
              { k: 'P50', v: stats.median },
              { k: 'P75', v: stats.p75, strong: true },
              { k: 'n', v: stats.n, count: true },
            ].map(s => (
              <div key={s.k} style={{ padding: '8px 10px', borderRadius: 'var(--r-md)', background: s.strong ? `color-mix(in srgb, ${m.color} 12%, transparent)` : 'var(--surface-2)', border: s.strong ? `1px solid ${m.color}` : '1px solid transparent' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: s.strong ? m.color : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{s.k}</div>
                <div className="mono" style={{ fontSize: 13.5, fontWeight: s.strong ? 700 : 600 }}>
                  {s.count ? s.v : fmtShort(loc, toPeriod(loc, s.v, period))}
                </div>
              </div>
            ))}
          </div>
          <StripPlot loc={loc} data={data} stats={stats} period={period} lang={lang} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {Object.entries(stats.byIndustry).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
              <Pill key={k} color="var(--text-2)" bg="var(--surface-2)">{IND_LABEL[k] ?? k} · {n}</Pill>
            ))}
          </div>
          {stats.screened > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
              {lang === 'ru'
                ? `Просмотрено ${stats.screened} профилей/вакансий → в расчёт вошли ${stats.n} релевантных`
                : `Screened ${stats.screened} profiles/postings → ${stats.n} relevant used`}
            </div>
          )}
          <button onClick={() => setShowRaw(v => !v)}
            style={{ marginTop: 10, fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-2)', borderRadius: 'var(--r-sm)', padding: '5px 10px', cursor: 'pointer' }}>
            {showRaw ? '▾' : '▸'} {lang === 'ru' ? `Сырые данные (${stats.n})` : `Raw data (${stats.n})`}
          </button>
          {showRaw && <div style={{ marginTop: 8 }}><RawTable loc={loc} data={data} period={period} lang={lang} /></div>}
        </>
      )}
    </div>
  )
}

export default function Bands2027Tab({ positions, updated, notionUrl }: Props) {
  const { lang } = useLang()
  const [period, setPeriod] = useState<Period>('month')
  const [level, setLevel] = useState<string>('all')
  const [open, setOpen] = useState<string | null>(null)

  const rows = positions.filter(p => level === 'all' || p.level === level)
  const totals = useMemo(() => {
    let ru = 0, cy = 0
    for (const p of positions) { ru += p.stats.ru?.n ?? 0; cy += p.stats.cy?.n ?? 0 }
    return { ru, cy }
  }, [positions])

  const segBtn = (on: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: on ? 600 : 500, padding: '6px 12px',
    borderRadius: 999, cursor: 'pointer', border: '1px solid',
    borderColor: on ? 'var(--accent)' : 'var(--border-strong)',
    background: on ? 'var(--accent-soft)' : 'var(--surface)',
    color: on ? 'var(--text)' : 'var(--text-2)',
  })

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          📐 Salary Bands 2027 Research
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14, maxWidth: 760 }}>
          {lang === 'ru'
            ? 'Рыночные ориентиры для внутренних бэндов: Lead и Head позиции. Сопоставление — по реальному скоупу роли у нас (описания HRBP), а не только по названию.'
            : 'Market anchors for internal bands: Lead and Head roles. Matched on the actual scope of each role at our company (HRBP descriptions), not just the title.'}
        </p>
      </div>

      {/* Methodology banner — must be impossible to miss */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginBottom: 22 }}>
        <div style={{ padding: '12px 14px', borderRadius: 'var(--r-lg)', background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 3 }}>
            {lang === 'ru' ? 'Показатель' : 'Metric'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {lang === 'ru' ? '75-й перцентиль (P75)' : '75th percentile (P75)'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            {lang === 'ru' ? 'Базовый оклад, без бонусов. 75% рынка получают столько или меньше.' : 'Base salary, no bonuses. 75% of the market earns this or less.'}
          </div>
        </div>
        {(['cy', 'ru'] as Loc[]).map(l => (
          <div key={l} style={{ padding: '12px 14px', borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: `1px solid ${LOC_META[l].color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LOC_META[l].color, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 3 }}>
              {LOC_META[l].flag} {lang === 'ru' ? LOC_META[l].ru : LOC_META[l].en}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'ru' ? LOC_META[l].basisRu : LOC_META[l].basisEn}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              {l === 'cy'
                ? (lang === 'ru' ? 'Gross — до вычета налогов и соц. взносов' : 'Gross — before tax and social insurance')
                : (lang === 'ru' ? 'Net — на руки, после НДФЛ' : 'Net — take-home, after income tax')}
              {' · '}{lang === 'ru' ? `${l === 'cy' ? totals.cy : totals.ru} точек данных` : `${l === 'cy' ? totals.cy : totals.ru} data points`}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div className="seg">
          <button aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>{lang === 'ru' ? 'В месяц' : 'Monthly'}</button>
          <button aria-pressed={period === 'year'} onClick={() => setPeriod('year')}>{lang === 'ru' ? 'В год' : 'Annual'}</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={segBtn(level === 'all')} onClick={() => setLevel('all')}>{lang === 'ru' ? 'Все уровни' : 'All levels'}</button>
          {['Lead', 'Head'].map(l => <button key={l} style={segBtn(level === l)} onClick={() => setLevel(l)}>{l}</button>)}
        </div>
      </div>

      {/* Main table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{lang === 'ru' ? 'Позиция' : 'Position'}</th>
                {(['cy', 'ru'] as Loc[]).map(l => (
                  <th key={l} style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text)' }}>{LOC_META[l].flag} {lang === 'ru' ? LOC_META[l].ru : LOC_META[l].en}</span>
                    {' · '}<span style={{ color: LOC_META[l].color, fontWeight: 700 }}>P75</span>
                    {' · '}{l === 'cy' ? 'gross €' : 'net ₽'}{' / '}{period === 'month' ? (lang === 'ru' ? 'мес' : 'mo') : (lang === 'ru' ? 'год' : 'yr')}
                  </th>
                ))}
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const isOpen = open === p.slug
                return (
                  <Fragment key={p.slug}>
                    <tr onClick={() => setOpen(isOpen ? null : p.slug)}
                      style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', background: isOpen ? 'var(--accent-soft)' : undefined }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{p.position}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Pill color={p.level === 'Head' ? 'var(--grade-head)' : 'var(--grade-lead)'} bg={p.level === 'Head' ? 'color-mix(in srgb, var(--grade-head) 14%, transparent)' : 'color-mix(in srgb, var(--grade-lead) 14%, transparent)'}>{p.level}</Pill>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.team}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}><P75Cell loc="cy" stats={p.stats.cy} period={period} lang={lang} /></td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}><P75Cell loc="ru" stats={p.stats.ru} period={period} lang={lang} /></td>
                      <td style={{ padding: '14px 12px', color: 'var(--muted)', verticalAlign: 'top', fontSize: 14 }}>{isOpen ? '▾' : '▸'}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={4} style={{ padding: '4px 16px 18px', background: 'var(--accent-soft)' }}>
                          {p.matching_criteria && (
                            <div style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '6px 0 12px' }}>
                              <b>{lang === 'ru' ? 'Критерий релевантности: ' : 'Matching criteria: '}</b>{p.matching_criteria}
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                            <LocDetail loc="cy" pos={p} period={period} lang={lang} />
                            <LocDetail loc="ru" pos={p} period={period} lang={lang} />
                          </div>
                          {p.caveats && (
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>⚠︎ {p.caveats}</div>
                          )}
                          {p.notion_url && (
                            <a href={p.notion_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>
                              {lang === 'ru' ? '↗ Все сырые данные и запросы в Notion' : '↗ Full raw data & queries in Notion'}
                            </a>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology footer */}
      <div style={{ marginTop: 22, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 860 }}>
        <b style={{ color: 'var(--text-2)' }}>{lang === 'ru' ? 'Методология. ' : 'Methodology. '}</b>
        {lang === 'ru'
          ? 'РФ: желаемая зарплата в резюме hh.ru (на руки) + вилки вакансий hh.ru (gross переведён в net по прогрессивной шкале НДФЛ 13/15/18%). Кипр: вакансии с вилками (LinkedIn, hh.ru Limassol, местные порталы), отчёты рекрутинговых агентств и агрегаторы; всё в gross. Приоритет — FinTech (трейдинг, платежи), iGaming, Gaming и BigTech (Ozon, WB, Т-Банк, Aviasales, Plata и др.). В расчёт идут только точки, где скоуп близок к нашей роли. P75 — перцентиль с линейной интерполяцией. Годовое = месячное × 12 (для Кипра месячное = годовое / 12).'
          : 'RF: desired salary in hh.ru CVs (take-home) + hh.ru vacancy ranges (gross converted to net using the 13/15/18% progressive income tax). Cyprus: postings with ranges (LinkedIn, hh.ru Limassol, local boards), recruiter reports and aggregators; all gross. Priority employers: FinTech (trading, payments), iGaming, Gaming and BigTech (Ozon, WB, T-Bank, Aviasales, Plata etc.). Only points with scope close to our role are used. P75 uses linear interpolation. Annual = monthly × 12 (Cyprus monthly = annual / 12).'}
        {updated && <> {lang === 'ru' ? ' Обновлено: ' : ' Updated: '}{updated}.</>}
        {notionUrl && <> <a href={notionUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>{lang === 'ru' ? 'Сырые данные в Notion ↗' : 'Raw data in Notion ↗'}</a></>}
      </div>
    </div>
  )
}
