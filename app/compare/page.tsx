import { loadCountryData, getLocationMeta, getPositionMeta, loadCandidates } from '@/lib/dataLoader'
import { loadSalaryBandsData } from '@/lib/salary-bands-loader'
import CompareClient from './CompareClient'

interface Props {
  searchParams: Promise<{ position?: string; countries?: string; source?: string; period?: string }>
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams
  const position = params.position ?? 'product_manager'
  const locationSlugs = (params.countries ?? '').split(',').filter(Boolean).slice(0, 9)
  const source = (params.source === 'ats' ? 'ats' : 'market') as 'market' | 'ats'
  const initialPeriod = (params.period === 'monthly' ? 'monthly' : 'annual') as 'annual' | 'monthly'

  const positionMeta = getPositionMeta(position)
  const allData = locationSlugs.map((slug) => ({
    meta: getLocationMeta(slug),
    data: loadCountryData(position, slug),
    candidates: loadCandidates(position, slug),
  }))
  const salaryBandsData = loadSalaryBandsData()

  return <CompareClient positionMeta={positionMeta} allData={allData} initialSource={source} initialPeriod={initialPeriod} salaryBandsData={salaryBandsData} />
}
