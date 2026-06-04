import { loadPositions, loadLocations, getLocationMeta } from '@/lib/dataLoader'
import HomeClient from './HomeClient'

export default function HomePage() {
  const positions = loadPositions()
  const locationsByPosition: Record<string, ReturnType<typeof getLocationMeta>[]> = {}
  for (const pos of positions) {
    locationsByPosition[pos.slug] = loadLocations(pos.slug)
  }
  return <HomeClient positions={positions} locationsByPosition={locationsByPosition} />
}
