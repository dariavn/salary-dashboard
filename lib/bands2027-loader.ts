import fs from 'fs'
import path from 'path'
import { computeStats, type Position2027, type RawPosition } from './bands2027'

const BASE = path.join(process.cwd(), 'data', 'bands-2027')

interface PositionIndexEntry {
  slug: string
  position: string
  team: string
  level: string
  hrbp: string
  notion_url?: string
}

export interface Bands2027Data {
  positions: Position2027[]
  updated: string
  notionUrl: string | null
}

export function loadBands2027(): Bands2027Data {
  const indexPath = path.join(BASE, 'positions.json')
  if (!fs.existsSync(indexPath)) return { positions: [], updated: '', notionUrl: null }
  const index: PositionIndexEntry[] = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  const metaPath = path.join(BASE, 'meta.json')
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf-8')) : {}

  const positions: Position2027[] = index.map(entry => {
    const rawPath = path.join(BASE, 'raw', `${entry.slug}.json`)
    let raw: Partial<RawPosition> = {}
    if (fs.existsSync(rawPath)) {
      try { raw = JSON.parse(fs.readFileSync(rawPath, 'utf-8')) } catch { raw = {} }
    }
    const merged: RawPosition = {
      ...raw,
      slug: entry.slug,
      position: entry.position,
      team: entry.team,
      level: entry.level,
      hrbp: entry.hrbp,
      notion_url: entry.notion_url ?? raw.notion_url,
    }
    return {
      ...merged,
      stats: { ru: computeStats('ru', merged.ru), cy: computeStats('cy', merged.cy) },
    }
  })

  return { positions, updated: meta.updated ?? '', notionUrl: meta.notion_url ?? null }
}
