import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as contactsApi from '../api/contactsApi'

const useContactsStore = create(
  persist(
    (set, get) => ({
      // État
      messages: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Récupérer tous les messages (admin uniquement)
      fetchMessages: async () => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.getAllContacts()

          if (result.success) {
            set({
              messages: result.data || [],
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors du chargement des messages'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Créer un nouveau message (appelé depuis le formulaire de contact)
      createMessage: async (messageData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.sendContactMessage(messageData)

          if (result.success) {
            set({ isLoading: false })
            return { success: true, messageId: result.data._id || result.data.id }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de l\'envoi du message'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Mettre à jour le statut d'un message (admin)
      updateMessageStatus: async (messageId, status) => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.updateContactStatus(messageId, status)

          if (result.success) {
            // Recharger les messages après mise à jour
            await get().fetchMessages()
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de la mise à jour du statut'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Marquer un message comme lu (helper pour updateMessageStatus)
      markAsRead: async (messageId) => {
        return await get().updateMessageStatus(messageId, 'read')
      },

      // Marquer un message comme répondu (helper pour updateMessageStatus)
      markAsReplied: async (messageId) => {
        return await get().updateMessageStatus(messageId, 'replied')
      },

      // Répondre à un message (admin)
      replyToMessage: async (messageId, replyData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.replyToContact(messageId, replyData)

          if (result.success) {
            // Recharger les messages après réponse
            await get().fetchMessages()
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de l\'envoi de la réponse'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Supprimer un message (si l'API le supporte)
      deleteMessage: async (messageId) => {
        set({ isLoading: true, error: null })

        try {
          // Note: Si le backend ne supporte pas la suppression,
          // on pourrait utiliser updateMessageStatus avec un statut 'deleted'
          const result = await contactsApi.deleteContact?.(messageId)
          if (!result) {
            throw new Error('Suppression non supportée par l\'API')
          }

          if (result.success) {
            // Recharger les messages après suppression
            await get().fetchMessages()
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de la suppression du message'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Getters et filtres (calculs locaux)
      getMessagesByStatus: (status) => {
        return get().messages.filter(message => message.status === status)
      },

      getNewMessagesCount: () => {
        return get().messages.filter(message => message.status === 'new').length
      },

      // Statistiques (calculées localement)
      getMessagesStats: () => {
        const messages = get().messages
        return {
          total: messages.length,
          new: messages.filter(m => m.status === 'new').length,
          read: messages.filter(m => m.status === 'read').length,
          replied: messages.filter(m => m.status === 'replied').length
        }
      }
    }),
    {
      name: 'contacts-storage',
      partialize: (state) => ({
        messages: state.messages
      }),
    }
  )
)

export default useContactsStore
