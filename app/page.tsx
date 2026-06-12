import { Suspense } from 'react'
import {
  loadPositions, loadLocations, getLocationMeta,
  loadAllCandidatesForPosition, loadCountryData, getResearchDate,
} from '@/lib/dataLoader'
import type { CandidateWithLocation, GradeRow } from '@/lib/types'
import HomeClient from './HomeClient'

function HomeContent() {
  const positions = loadPositions()
  const locationsByPosition: Record<string, ReturnType<typeof getLocationMeta>[]> = {}
  const candidatesByPosition: Record<string, CandidateWithLocation[]> = {}
  const allLocationMeta: Record<string, ReturnType<typeof getLocationMeta>> = {}
  // benchmark grades: position → location → GradeRow[]
  const benchmarkGrades: Record<string, Record<string, GradeRow[]>> = {}
  // research dates: position → location → latest data_date string (e.g. "2026-05")
  const researchDates: Record<string, Record<string, string>> = {}

  for (const pos of positions) {
    const locs = loadLocations(pos.slug)
    locationsByPosition[pos.slug] = locs
    candidatesByPosition[pos.slug] = loadAllCandidatesForPosition(pos.slug)
    benchmarkGrades[pos.slug] = {}
    researchDates[pos.slug] = {}
    for (const loc of locs) {
      allLocationMeta[loc.slug] = loc
      benchmarkGrades[pos.slug][loc.slug] = loadCountryData(pos.slug, loc.slug).grades
      researchDates[pos.slug][loc.slug] = getResearchDate(pos.slug, loc.slug)
    }
  }

  return (
    <HomeClient
      positions={positions}
      locationsByPosition={locationsByPosition}
      candidatesByPosition={candidatesByPosition}
      locationMeta={allLocationMeta}
      benchmarkGrades={benchmarkGrades}
      researchDates={researchDates}
    />
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <HomeContent />
    </Suspense>
  )
}
