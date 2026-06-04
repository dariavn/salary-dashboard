import { loadCountryData, getLocationMeta, getPositionMeta } from '@/lib/dataLoader'
import CompareClient from './CompareClient'

interface Props {
  searchParams: Promise<{ position?: string; countries?: string }>
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams
  const position = params.position ?? 'product_manager'
  const locationSlugs = (params.countries ?? '').split(',').filter(Boolean).slice(0, 3)

  const positionMeta = getPositionMeta(position)
  const allData = locationSlugs.map((slug) => ({
    meta: getLocationMeta(slug),
    data: loadCountryData(position, slug),
  }))

  return <CompareClient positionMeta={positionMeta} allData={allData} />
}
