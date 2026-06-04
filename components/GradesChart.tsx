'use client'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, Cell, LabelList,
} from 'recharts'
import type { GradeRow } from '@/lib/types'
import type { Segment } from '@/lib/types'
import { GRADE_ORDER } from '@/lib/i18n'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'

const COUNTRY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']

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
  const { lang } = useLang()

  // Build chart data: one entry per grade
  const data = GRADE_ORDER.map((grade) => {
    const entry: Record<string, string | number> = { grade }
    series.forEach((s) => {
      const rows = s.rows.filter(
        (r) => r.grade === grade && (segment === 'all' || r.segment === segment)
      )
      if (!rows.length) return
      // Use mid_market as primary, fallback to first row
      const row = rows.find((r) => r.segment === 'mid_market') ?? rows[0]
      const min = period === 'annual' ? row.annual_gross_min : row.monthly_gross_min
      const max = period === 'annual' ? row.annual_gross_max : row.monthly_gross_max
      entry[`${s.location}_min`] = min
      entry[`${s.location}_max`] = max
      entry[`${s.location}_range`] = max - min
      entry[`${s.location}_currency`] = row.currency
    })
    return entry
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {series.map((s) => {
          const min = payload.find((p: any) => p.dataKey === `${s.location}_min`)?.value
          const max = payload.find((p: any) => p.dataKey === `${s.location}_range`)
          if (min == null) return null
          const maxVal = Number(min) + Number(max?.value ?? 0)
          return (
            <div key={s.location} className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
              <span className="text-gray-700">{s.label}:</span>
              <span className="font-mono font-medium">
                {fmtK(Number(min), s.currency)} – {fmtK(maxVal, s.currency)}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="grade" tick={{ fontSize: 13, fontWeight: 600 }} />
        <YAxis
          tickFormatter={(v) => {
            const currency = series[0]?.currency ?? 'EUR'
            if (currency === 'RUB') return `${Math.round(v / 1000)}K`
            return `€${Math.round(v / 1000)}K`
          }}
          tick={{ fontSize: 11 }}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        {series.length > 1 && (
          <Legend
            formatter={(value) => {
              const s = series.find((s) => value.startsWith(s.location))
              return s?.label ?? value
            }}
          />
        )}
        {series.flatMap((s) => [
          // invisible base bar — lifts the colored range off the axis
          <Bar
            key={`${s.location}_min`}
            dataKey={`${s.location}_min`}
            stackId={s.location}
            fill="transparent"
            legendType="none"
          />,
          <Bar
            key={`${s.location}_range`}
            dataKey={`${s.location}_range`}
            stackId={s.location}
            fill={s.color}
            opacity={0.8}
            name={s.label}
            radius={[4, 4, 0, 0]}
          />,
        ])}
      </BarChart>
    </ResponsiveContainer>
  )
}
