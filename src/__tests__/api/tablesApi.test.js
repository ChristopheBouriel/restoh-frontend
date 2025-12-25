import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import { getAvailableTables } from '../../api/tablesApi'

vi.mock('../../api/apiClient')

describe('Tables API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAvailableTables', () => {
    it('should fetch available tables with required params', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          availableTables: [1, 2, 3],
          occupiedTables: [4, 5],
          notEligibleTables: [6]
        }
      })

      const result = await getAvailableTables('2024-12-25', 3, 4)

      expect(apiClient.get).toHaveBeenCalledWith('/tables/available', {
        params: { date: '2024-12-25', slot: 3, capacity: 4 }
      })
      expect(result.success).toBe(true)
      expect(result.availableTables).toEqual([1, 2, 3])
      expect(result.occupiedTables).toEqual([4, 5])
      expect(result.notEligibleTables).toEqual([6])
    })

    it('should include excludeReservationId when provided', async () => {
      apiClient.get.mockResolvedValue({ data: { availableTables: [] } })

      await getAvailableTables('2024-12-25', 3, 4, 'res-123')

      expect(apiClient.get).toHaveBeenCalledWith('/tables/available', {
        params: { date: '2024-12-25', slot: 3, capacity: 4, excludeReservationId: 'res-123' }
      })
    })

    it('should handle response.data.data structure', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          data: {
            availableTables: [1, 2],
            occupiedTables: [3],
            notEligibleTables: []
          }
        }
      })

      const result = await getAvailableTables('2024-12-25', 3, 4)

      expect(result.availableTables).toEqual([1, 2])
    })

    it('should handle alternative field names (available, occupied, notEligible)', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          available: [1, 2],
          occupied: [3],
          notEligible: [4]
        }
      })

      const result = await getAvailableTables('2024-12-25', 3, 4)

      expect(result.availableTables).toEqual([1, 2])
      expect(result.occupiedTables).toEqual([3])
      expect(result.notEligibleTables).toEqual([4])
    })

    it('should return empty arrays on error', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'))

      const result = await getAvailableTables('2024-12-25', 3, 4)

      expect(result.success).toBe(false)
      expect(result.availableTables).toEqual([])
      expect(result.occupiedTables).toEqual([])
      expect(result.notEligibleTables).toEqual([])
    })

    it('should extract error message from response', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { error: 'Invalid date format' } }
      })

      const result = await getAvailableTables('invalid-date', 3, 4)

      expect(result.error).toBe('Invalid date format')
    })
  })
})
