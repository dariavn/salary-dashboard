import fs from 'fs'
import path from 'path'
import type { HubEntry, PositionEntry, BandEntry } from './salary-bands'

const BASE = path.join(process.cwd(), 'data', 'salary-bands')

export function loadSalaryBandsHubs(): HubEntry[] {
  return JSON.parse(fs.readFileSync(path.join(BASE, 'hubs.json'), 'utf-8'))
}

export function loadSalaryBandsPositions(): PositionEntry[] {
  return JSON.parse(fs.readFileSync(path.join(BASE, 'positions.json'), 'utf-8'))
}

export function loadSalaryBandsBands(): BandEntry[] {
  return JSON.parse(fs.readFileSync(path.join(BASE, 'bands.json'), 'utf-8'))
}

export interface SalaryBandsData {
  hubs: HubEntry[]
  positions: PositionEntry[]
  bands: BandEntry[]
}

export function loadSalaryBandsData(): SalaryBandsData {
  return {
    hubs: loadSalaryBandsHubs(),
    positions: loadSalaryBandsPositions(),
    bands: loadSalaryBandsBands(),
  }
}
