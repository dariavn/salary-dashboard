import type { Confidence } from '@/lib/types'

const cfg: Record<Confidence, { cls: string; label: string }> = {
  high:   { cls: 'bg-emerald-100 text-emerald-800',  label: 'high' },
  medium: { cls: 'bg-amber-100 text-amber-800',      label: 'medium' },
  low:    { cls: 'bg-red-100 text-red-700',           label: 'low ⚠' },
}

export default function ConfidenceBadge({ value }: { value: Confidence }) {
  const { cls, label } = cfg[value] ?? cfg.low
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
