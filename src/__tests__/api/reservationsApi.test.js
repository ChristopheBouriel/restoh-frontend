import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import {
  getUserReservations,
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservationStatus,
  assignTable,
  updateReservation,
  cancelReservation,
  getReservationsByUserId,
  getRecentReservations,
  getHistoricalReservations
} from '../../api/reservationsApi'

vi.mock('../../api/apiClient')

describe('Reservations API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserReservations', () => {
    it('should fetch user reservations with default params', async () => {
      apiClient.get.mockResolvedValue({ reservations: [] })

      await getUserReservations()

      expect(apiClient.get).toHaveBeenCalledWith('/reservations', {
        params: { limit: 30, page: 1 }
      })
    })

    it('should pass custom pagination params', async () => {
      apiClient.get.mockResolvedValue({ reservations: [] })

      await getUserReservations({ limit: 10, page: 2 })

      expect(apiClient.get).toHaveBeenCalledWith('/reservations', {
        params: { limit: 10, page: 2 }
      })
    })
  })

  describe('getAllReservations', () => {
    it('should fetch all reservations without filters', async () => {
      apiClient.get.mockResolvedValue({ reservations: [] })

      await getAllReservations()

      expect(apiClient.get).toHaveBeenCalledWith('/reservations/admin', {
        params: { limit: 1000, page: 1 }
      })
    })

    it('should pass status and date filters', async () => {
      apiClient.get.mockResolvedValue({ reservations: [] })

      await getAllReservations({ status: 'pending', date: '2024-12-20' })

      expect(apiClient.get).toHaveBeenCalledWith('/reservations/admin', {
        params: { limit: 1000, page: 1, status: 'pending', date: '2024-12-20' }
      })
    })
  })

  describe('getReservationById', () => {
    it('should fetch reservation by id', async () => {
      apiClient.get.mockResolvedValue({ reservation: { id: 'res-1' } })

      const result = await getReservationById('res-1')

      expect(apiClient.get).toHaveBeenCalledWith('/reservations/res-1')
      expect(result.success).toBe(true)
    })
  })

  describe('createReservation', () => {
    it('should create reservation with data', async () => {
      const reservationData = { date: '2024-12-25', time: '19:00', guests: 4 }
      apiClient.post.mockResolvedValue({ reservation: { id: 'res-1' } })

      const result = await createReservation(reservationData)

      expect(apiClient.post).toHaveBeenCalledWith('/reservations', reservationData)
      expect(result.success).toBe(true)
    })

    it('should return code and details on validation error', async () => {
      apiClient.post.mockRejectedValue({
        error: 'No tables available',
        code: 'NO_TABLES_AVAILABLE',
        details: { availableSlots: ['18:00', '21:00'] }
      })

      const result = await createReservation({ date: '2024-12-25', time: '19:00' })

      expect(result.success).toBe(false)
      expect(result.code).toBe('NO_TABLES_AVAILABLE')
      expect(result.details).toEqual({ availableSlots: ['18:00', '21:00'] })
    })
  })

  describe('updateReservationStatus', () => {
    it('should update reservation status', async () => {
      apiClient.patch.mockResolvedValue({ reservation: { id: 'res-1', status: 'confirmed' } })

      const result = await updateReservationStatus('res-1', 'confirmed')

      expect(apiClient.patch).toHaveBeenCalledWith('/reservations/admin/res-1/status', { status: 'confirmed' })
      expect(result.success).toBe(true)
    })
  })

  describe('assignTable', () => {
    it('should assign table to reservation', async () => {
      apiClient.patch.mockResolvedValue({ reservation: { id: 'res-1', tableNumber: 5 } })

      const result = await assignTable('res-1', 5)

      expect(apiClient.patch).toHaveBeenCalledWith('/reservations/admin/res-1/table', { tableNumber: 5 })
      expect(result.success).toBe(true)
    })
  })

  describe('updateReservation', () => {
    it('should update user reservation', async () => {
      const updateData = { guests: 6 }
      apiClient.put.mockResolvedValue({ reservation: { id: 'res-1', guests: 6 } })

      const result = await updateReservation('res-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/reservations/res-1', updateData)
      expect(result.success).toBe(true)
    })

    it('should return code and details on error', async () => {
      apiClient.put.mockRejectedValue({
        error: 'Cannot modify',
        code: 'RESERVATION_LOCKED',
        details: { reason: 'Too close to reservation time' }
      })

      const result = await updateReservation('res-1', { guests: 10 })

      expect(result.code).toBe('RESERVATION_LOCKED')
      expect(result.details).toEqual({ reason: 'Too close to reservation time' })
    })
  })

  describe('cancelReservation', () => {
    it('should cancel user reservation', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await cancelReservation('res-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/reservations/res-1')
      expect(result.success).toBe(true)
    })

    it('should return code and details on error', async () => {
      apiClient.delete.mockRejectedValue({
        error: 'Cannot cancel',
        code: 'CANCELLATION_NOT_ALLOWED',
        details: { hoursRemaining: 2 }
      })

      const result = await cancelReservation('res-1')

      expect(result.code).toBe('CANCELLATION_NOT_ALLOWED')
    })
  })

  describe('getReservationsByUserId', () => {
    it('should fetch reservations for specific user', async () => {
      apiClient.get.mockResolvedValue({ reservations: [{ id: 'res-1' }] })

      const result = await getReservationsByUserId('user-1')

      expect(apiClient.get).toHaveBeenCalledWith('/admin/users/user-1/reservations')
      expect(result.reservations).toEqual([{ id: 'res-1' }])
    })

    it('should handle response.data.reservations structure', async () => {
      apiClient.get.mockResolvedValue({ data: { reservations: [{ id: 'res-1' }] } })

      const result = await getReservationsByUserId('user-1')

      expect(result.reservations).toEqual([{ id: 'res-1' }])
    })

    it('should return empty array on error', async () => {
      apiClient.get.mockRejectedValue({ error: 'User not found' })

      const result = await getReservationsByUserId('invalid-user')

      expect(result.success).toBe(false)
      expect(result.reservations).toEqual([])
    })
  })

  describe('getRecentReservations', () => {
    it('should fetch recent reservations with default params', async () => {
      apiClient.get.mockResolvedValue({ reservations: [] })

      await getRecentReservations()

      expect(apiClient.get).toHaveBeenCalledWith('/reservations/admin/recent', {
        params: { limit: 50, page: 1 }
      })
    })

    it('should pass status filter', async () => {
      apiClient.get.mockResolvedValue({ reservations: [] })

      await getRecentReservations({ status: 'pending' })

      expect(apiClient.get).toHaveBeenCalledWith('/reservations/admin/recent', {
        params: { limit: 50, page: 1, status: 'pending' }
      })
    })
  })

  describe('getHistoricalReservations', () => {
    it('should require startDate and endDate', async () => {
      const result = await getHistoricalReservations({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Start date and end date are required')
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('should fetch historical reservations with date range', async () => {
      apiClient.get.mockResolvedValue({ reservations: [] })

      await getHistoricalReservations({
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        status: 'completed',
        search: 'smith'
      })

      expect(apiClient.get).toHaveBeenCalledWith('/reservations/admin/history', {
        params: {
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          limit: 20,
          page: 1,
          status: 'completed',
          search: 'smith'
        }
      })
    })
  })
})
