import type { Confidence } from '@/lib/types'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

const CFG: Record<Confidence, { color: string; bg: string; key: 'confHigh' | 'confMedium' | 'confLow' }> = {
  high:   { color: 'var(--pos)',     bg: 'var(--pos-bg)',     key: 'confHigh' },
  medium: { color: 'var(--warn)',    bg: 'var(--warn-bg)',    key: 'confMedium' },
  low:    { color: 'var(--neutral)', bg: 'var(--neutral-bg)', key: 'confLow' },
}

interface Props { value: Confidence; lang?: Lang; compact?: boolean }

export default function ConfidenceBadge({ value, lang = 'en', compact }: Props) {
  const { color, bg, key } = CFG[value] ?? CFG.low
  if (compact) {
    return (
      <span
        className="dot inline-block"
        title={t(lang, key)}
        style={{ background: color, width: 9, height: 9 }}
      />
    )
  }
  return (
    <span className="pill" style={{ color, background: bg }}>
      <span className="dot" style={{ background: color }} />
      {t(lang, key)}
    </span>
  )
}
