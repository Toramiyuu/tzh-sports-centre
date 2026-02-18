import { describe, it, expect } from 'vitest'
import {
  getUniqueBrands,
  getStringsByBrand,
  getStringById,
  getPriceRange,
  filterStrings,
  STRING_INVENTORY,
} from '@/lib/stringing-config'

describe('getUniqueBrands', () => {
  it('returns unique brand names', () => {
    const brands = getUniqueBrands()
    expect(brands.length).toBeGreaterThan(0)
    expect(new Set(brands).size).toBe(brands.length)
  })

  it('includes expected brands', () => {
    const brands = getUniqueBrands()
    expect(brands).toContain('Kizuna')
    expect(brands).toContain('Victor')
    expect(brands).toContain('Li-Ning')
    expect(brands).toContain('Yonex')
  })
})

describe('getStringsByBrand', () => {
  it('returns strings for a specific brand', () => {
    const kizunaStrings = getStringsByBrand('Kizuna')
    expect(kizunaStrings.length).toBeGreaterThan(0)
    expect(kizunaStrings.every(s => s.brand === 'Kizuna')).toBe(true)
  })

  it('returns empty array for unknown brand', () => {
    const result = getStringsByBrand('UnknownBrand')
    expect(result).toEqual([])
  })

  it('is case-sensitive', () => {
    const result = getStringsByBrand('kizuna')
    expect(result).toEqual([])
  })
})

describe('getStringById', () => {
  it('returns string product for valid ID', () => {
    const string = getStringById('kizuna-z58')
    expect(string).toBeDefined()
    expect(string?.id).toBe('kizuna-z58')
    expect(string?.brand).toBe('Kizuna')
  })

  it('returns undefined for unknown ID', () => {
    const string = getStringById('unknown-id')
    expect(string).toBeUndefined()
  })
})

describe('getPriceRange', () => {
  it('returns min and max prices from inventory', () => {
    const range = getPriceRange()
    expect(range.min).toBeGreaterThan(0)
    expect(range.max).toBeGreaterThanOrEqual(range.min)
  })

  it('returns prices within expected range', () => {
    const range = getPriceRange()
    expect(range.min).toBeGreaterThanOrEqual(30)
    expect(range.max).toBeLessThanOrEqual(60)
  })
})

describe('filterStrings', () => {
  it('returns all strings with no filters', () => {
    const result = filterStrings({})
    expect(result.length).toBe(STRING_INVENTORY.length)
  })

  it('filters by search term', () => {
    const result = filterStrings({ search: 'Z58' })
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(s => s.name.includes('Z58'))).toBe(true)
  })

  it('search is case-insensitive', () => {
    const result1 = filterStrings({ search: 'kizuna' })
    const result2 = filterStrings({ search: 'KIZUNA' })
    expect(result1.length).toBe(result2.length)
    expect(result1.length).toBeGreaterThan(0)
  })

  it('filters by single brand', () => {
    const result = filterStrings({ brands: ['Victor'] })
    expect(result.every(s => s.brand === 'Victor')).toBe(true)
  })

  it('filters by multiple brands', () => {
    const result = filterStrings({ brands: ['Victor', 'Kizuna'] })
    expect(result.every(s => s.brand === 'Victor' || s.brand === 'Kizuna')).toBe(true)
  })

  it('returns all strings when brands array is empty', () => {
    const result = filterStrings({ brands: [] })
    expect(result.length).toBe(STRING_INVENTORY.length)
  })

  it('filters by minimum price', () => {
    const result = filterStrings({ minPrice: 45 })
    expect(result.every(s => s.price >= 45)).toBe(true)
  })

  it('filters by maximum price', () => {
    const result = filterStrings({ maxPrice: 45 })
    expect(result.every(s => s.price <= 45)).toBe(true)
  })

  it('filters by price range', () => {
    const result = filterStrings({ minPrice: 40, maxPrice: 50 })
    expect(result.every(s => s.price >= 40 && s.price <= 50)).toBe(true)
  })

  it('filters by type', () => {
    const result = filterStrings({ type: 'repulsion' })
    expect(result.every(s => s.type === 'repulsion')).toBe(true)
  })

  it('combines multiple filters', () => {
    const result = filterStrings({
      brands: ['Kizuna'],
      minPrice: 45,
      type: 'repulsion',
    })
    expect(result.every(s =>
      s.brand === 'Kizuna' &&
      s.price >= 45 &&
      s.type === 'repulsion'
    )).toBe(true)
  })

  it('returns empty array when no matches', () => {
    const result = filterStrings({
      search: 'NonexistentString',
      minPrice: 1000,
    })
    expect(result).toEqual([])
  })
})
