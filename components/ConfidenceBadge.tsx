import type { Confidence } from '@/lib/types'

const cfg: Record<Confidence, { text: string; bg: string; label: string }> = {
  high:   { text: '#00d4aa', bg: 'rgba(0,212,170,0.15)',   label: '▲ high' },
  medium: { text: '#ffd166', bg: 'rgba(255,209,102,0.15)', label: '◆ medium' },
  low:    { text: '#8b90a8', bg: 'rgba(139,144,168,0.12)', label: '▽ low' },
}

export default function ConfidenceBadge({ value }: { value: Confidence }) {
  const { text, bg, label } = cfg[value] ?? cfg.low
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ color: text, background: bg }}
    >
      {label}
    </span>
  )
}
