import apiClient from './apiClient'

/**
 * API des messages de contact
 */

// Envoyer un message de contact
export const sendContactMessage = async (messageData) => {
  try {
    const response = await apiClient.post('/contacts', messageData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de l\'envoi du message' }
  }
}

// Récupérer tous les messages (ADMIN)
export const getAllContacts = async (status = null) => {
  try {
    const params = status ? { status } : {}
    const response = await apiClient.get('/contacts', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération des messages' }
  }
}

// Mettre à jour le statut d'un message (ADMIN)
export const updateContactStatus = async (contactId, status) => {
  try {
    const response = await apiClient.patch(`/contacts/${contactId}/status`, { status })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la mise à jour du statut' }
  }
}

// Répondre à un message (ADMIN)
export const replyToContact = async (contactId, reply) => {
  try {
    const response = await apiClient.post(`/contacts/${contactId}/reply`, { reply })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de l\'envoi de la réponse' }
  }
}
