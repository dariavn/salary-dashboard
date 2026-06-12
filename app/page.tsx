import { loadPositions, loadLocations, getLocationMeta, loadAllCandidatesForPosition } from '@/lib/dataLoader'
import type { CandidateWithLocation } from '@/lib/types'
import HomeClient from './HomeClient'

export default function HomePage() {
  const positions = loadPositions()
  const locationsByPosition: Record<string, ReturnType<typeof getLocationMeta>[]> = {}
  const candidatesByPosition: Record<string, CandidateWithLocation[]> = {}
  const allLocationMeta: Record<string, ReturnType<typeof getLocationMeta>> = {}

  for (const pos of positions) {
    const locs = loadLocations(pos.slug)
    locationsByPosition[pos.slug] = locs
    candidatesByPosition[pos.slug] = loadAllCandidatesForPosition(pos.slug)
    for (const loc of locs) allLocationMeta[loc.slug] = loc
  }

  return (
    <HomeClient
      positions={positions}
      locationsByPosition={locationsByPosition}
      candidatesByPosition={candidatesByPosition}
      locationMeta={allLocationMeta}
    />
  )
}
