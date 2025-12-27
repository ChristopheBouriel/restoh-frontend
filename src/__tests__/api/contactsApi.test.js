import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import {
  sendContactMessage,
  getMyContactMessages,
  getAllContacts,
  updateContactStatus,
  addReplyToDiscussion,
  deleteContact,
  getDeletedContacts,
  restoreContact,
  markDiscussionMessageAsRead
} from '../../api/contactsApi'

vi.mock('../../api/apiClient')

describe('Contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendContactMessage', () => {
    it('should send message to correct endpoint', async () => {
      const messageData = { subject: 'Question', message: 'Hello', email: 'test@example.com' }
      apiClient.post.mockResolvedValue({ contact: { id: 'contact-1' } })

      const result = await sendContactMessage(messageData)

      expect(apiClient.post).toHaveBeenCalledWith('/contact', messageData)
      expect(result.success).toBe(true)
    })

    it('should handle error', async () => {
      apiClient.post.mockRejectedValue({ error: 'Invalid email' })

      const result = await sendContactMessage({ subject: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email')
    })
  })

  describe('getMyContactMessages', () => {
    it('should fetch user messages', async () => {
      apiClient.get.mockResolvedValue({ messages: [{ id: '1' }] })

      const result = await getMyContactMessages()

      expect(apiClient.get).toHaveBeenCalledWith('/contact/my-messages')
      expect(result.success).toBe(true)
    })
  })

  describe('getAllContacts', () => {
    it('should fetch all contacts without status filter', async () => {
      apiClient.get.mockResolvedValue({ contacts: [] })

      await getAllContacts()

      expect(apiClient.get).toHaveBeenCalledWith('/contact/admin/messages', { params: { limit: 1000 } })
    })

    it('should pass status filter when provided', async () => {
      apiClient.get.mockResolvedValue({ contacts: [] })

      await getAllContacts('new')

      expect(apiClient.get).toHaveBeenCalledWith('/contact/admin/messages', { params: { limit: 1000, status: 'new' } })
    })
  })

  describe('updateContactStatus', () => {
    it('should update status at correct endpoint', async () => {
      apiClient.patch.mockResolvedValue({ contact: { id: '1', status: 'read' } })

      const result = await updateContactStatus('contact-1', 'read')

      expect(apiClient.patch).toHaveBeenCalledWith('/contact/admin/messages/contact-1/status', { status: 'read' })
      expect(result.success).toBe(true)
    })
  })

  describe('addReplyToDiscussion', () => {
    it('should add reply to correct endpoint', async () => {
      apiClient.patch.mockResolvedValue({ contact: { id: '1' } })

      const result = await addReplyToDiscussion('contact-1', 'Reply text')

      expect(apiClient.patch).toHaveBeenCalledWith('/contact/contact-1/reply', { text: 'Reply text' })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteContact', () => {
    it('should call delete endpoint (soft delete/archive)', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteContact('contact-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/contact/admin/messages/contact-1')
      expect(result.success).toBe(true)
    })
  })

  describe('getDeletedContacts', () => {
    it('should fetch archived contacts with params', async () => {
      apiClient.get.mockResolvedValue({ contacts: [] })

      await getDeletedContacts({ page: 2 })

      expect(apiClient.get).toHaveBeenCalledWith('/contact/admin/messages/deleted', { params: { limit: 1000, page: 2 } })
    })
  })

  describe('restoreContact', () => {
    it('should restore archived contact', async () => {
      apiClient.patch.mockResolvedValue({ contact: { id: '1' } })

      const result = await restoreContact('contact-1')

      expect(apiClient.patch).toHaveBeenCalledWith('/contact/admin/messages/contact-1/restore')
      expect(result.success).toBe(true)
    })
  })

  describe('markDiscussionMessageAsRead', () => {
    it('should mark message as read at correct endpoint', async () => {
      apiClient.patch.mockResolvedValue({})

      const result = await markDiscussionMessageAsRead('contact-1', 'discussion-1')

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/contact/contact-1/discussion/discussion-1/status',
        { status: 'read' }
      )
      expect(result.success).toBe(true)
    })
  })
})
