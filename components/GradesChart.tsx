'use client'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid,
} from 'recharts'
import type { GradeRow } from '@/lib/types'
import type { Segment } from '@/lib/types'
import { GRADE_ORDER } from '@/lib/i18n'

const COUNTRY_COLORS = ['#6c63ff', '#ffd166', '#00d4aa', '#f38ba8']

interface CountrySeries {
  location: string
  label: string
  rows: GradeRow[]
  color: string
  currency: string
}

interface Props {
  series: CountrySeries[]
  segment: Segment | 'all'
  period: 'annual' | 'monthly'
}

function fmtK(n: number, currency: string) {
  if (currency === 'RUB') return `${Math.round(n / 1000)}K ₽`
  return `€${Math.round(n / 1000)}K`
}

export default function GradesChart({ series, segment, period }: Props) {
  const data = GRADE_ORDER.map((grade) => {
    const entry: Record<string, string | number> = { grade }
    series.forEach((s) => {
      const rows = s.rows.filter(
        (r) => r.grade === grade && (segment === 'all' || r.segment === segment)
      )
      if (!rows.length) return
      const row = rows.find((r) => r.segment === 'mid_market') ?? rows[0]
      const min = period === 'annual' ? row.annual_gross_min : row.monthly_gross_min
      const max = period === 'annual' ? row.annual_gross_max : row.monthly_gross_max
      entry[`${s.location}_min`] = min
      entry[`${s.location}_range`] = max - min
      entry[`${s.location}_currency`] = row.currency
    })
    return entry
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-xl p-3 text-sm shadow-xl" style={{ background: '#22263a', border: '1px solid #2d3148' }}>
        <p className="font-semibold mb-2" style={{ color: '#e8eaf0' }}>{label}</p>
        {series.map((s) => {
          const minEntry = payload.find((p: any) => p.dataKey === `${s.location}_min`)
          const rangeEntry = payload.find((p: any) => p.dataKey === `${s.location}_range`)
          if (!minEntry && !rangeEntry) return null
          const min = Number(minEntry?.value ?? 0)
          const max = min + Number(rangeEntry?.value ?? 0)
          if (!max) return null
          return (
            <div key={s.location} className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
              <span style={{ color: '#8b90a8' }}>{s.label}:</span>
              <span className="font-mono font-medium" style={{ color: '#e8eaf0' }}>
                {fmtK(min, s.currency)} – {fmtK(max, s.currency)}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,49,72,0.6)" vertical={false} />
        <XAxis
          dataKey="grade"
          tick={{ fontSize: 12, fontWeight: 600, fill: '#8b90a8' }}
          axisLine={{ stroke: '#2d3148' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => {
            const currency = series[0]?.currency ?? 'EUR'
            return currency === 'RUB' ? `${Math.round(v / 1000)}K` : `€${Math.round(v / 1000)}K`
          }}
          tick={{ fontSize: 11, fill: '#8b90a8' }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.05)' }} />
        {series.length > 1 && (
          <Legend
            wrapperStyle={{ paddingTop: 12 }}
            formatter={(value) => {
              const s = series.find((s) => value.startsWith(s.location))
              return <span style={{ color: '#8b90a8', fontSize: 11 }}>{s?.label ?? value}</span>
            }}
          />
        )}
        {series.flatMap((s) => [
          <Bar key={`${s.location}_min`} dataKey={`${s.location}_min`} stackId={s.location} fill="transparent" legendType="none" />,
          <Bar key={`${s.location}_range`} dataKey={`${s.location}_range`} stackId={s.location} fill={s.color} opacity={0.85} name={s.label} radius={[4, 4, 0, 0]} />,
        ])}
      </BarChart>
    </ResponsiveContainer>
  )
}
