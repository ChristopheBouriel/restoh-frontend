import apiClient from './apiClient'

/**
 * Contact messages API
 */

// Send a contact message
export const sendContactMessage = async (messageData) => {
  try {
    const response = await apiClient.post('/contact', messageData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error sending message' }
  }
}

// Get user's own messages (USER)
export const getMyContactMessages = async () => {
  try {
    const response = await apiClient.get('/contact/my-messages')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching messages' }
  }
}

// Get all messages (ADMIN)
export const getAllContacts = async (status = null) => {
  try {
    const params = status ? { status } : {}
    const response = await apiClient.get('/contact/admin/messages', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching messages' }
  }
}

// Update message status (ADMIN)
export const updateContactStatus = async (contactId, status) => {
  try {
    const response = await apiClient.patch(`/contact/admin/messages/${contactId}/status`, { status })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error updating status' }
  }
}

// Add reply to discussion (USER can reply to own, ADMIN to all)
export const addReplyToDiscussion = async (contactId, text) => {
  try {
    const response = await apiClient.patch(`/contact/${contactId}/reply`, { text })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error adding reply' }
  }
}

// Archive a message - soft delete (ADMIN)
export const deleteContact = async (contactId) => {
  try {
    const response = await apiClient.delete(`/contact/admin/messages/${contactId}`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error archiving message' }
  }
}

// Get archived/deleted messages (ADMIN)
export const getDeletedContacts = async (params = {}) => {
  try {
    const response = await apiClient.get('/contact/admin/messages/deleted', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching archived messages' }
  }
}

// Restore an archived message (ADMIN)
export const restoreContact = async (contactId) => {
  try {
    const response = await apiClient.patch(`/contact/admin/messages/${contactId}/restore`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error restoring message' }
  }
}

// Mark a discussion message as read (USER can mark admin messages, ADMIN can mark user messages)
export const markDiscussionMessageAsRead = async (contactId, discussionId) => {
  try {
    const response = await apiClient.patch(`/contact/${contactId}/discussion/${discussionId}/status`, { status: 'read' })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error marking message as read' }
  }
}
