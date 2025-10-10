import apiClient from './apiClient'

/**
 * Contact messages API
 */

// Send a contact message
export const sendContactMessage = async (messageData) => {
  try {
    const response = await apiClient.post('/contacts', messageData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error sending message' }
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
    const response = await apiClient.patch(`/contacts/${contactId}/status`, { status })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error updating status' }
  }
}

// Reply to a message (ADMIN)
export const replyToContact = async (contactId, reply) => {
  try {
    const response = await apiClient.post(`/contacts/${contactId}/reply`, { reply })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error sending reply' }
  }
}
