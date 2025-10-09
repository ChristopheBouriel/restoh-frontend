import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as contactsApi from '../api/contactsApi'

const useContactsStore = create(
  persist(
    (set, get) => ({
      // State
      messages: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Fetch all messages (admin only)
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
          const errorMessage = error.error || 'Error loading messages'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Create new message (called from contact form)
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
          const errorMessage = error.error || 'Error sending message'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Update message status (admin)
      updateMessageStatus: async (messageId, status) => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.updateContactStatus(messageId, status)

          if (result.success) {
            // Reload messages after update
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
          const errorMessage = error.error || 'Error updating status'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Mark message as read (helper for updateMessageStatus)
      markAsRead: async (messageId) => {
        return await get().updateMessageStatus(messageId, 'read')
      },

      // Mark message as replied (helper for updateMessageStatus)
      markAsReplied: async (messageId) => {
        return await get().updateMessageStatus(messageId, 'replied')
      },

      // Reply to message (admin)
      replyToMessage: async (messageId, replyData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.replyToContact(messageId, replyData)

          if (result.success) {
            // Reload messages after reply
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
          const errorMessage = error.error || 'Error sending reply'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Delete message (if API supports it)
      deleteMessage: async (messageId) => {
        set({ isLoading: true, error: null })

        try {
          // Note: If backend doesn't support deletion,
          // we could use updateMessageStatus with 'deleted' status
          const result = await contactsApi.deleteContact?.(messageId)
          if (!result) {
            throw new Error('Deletion not supported by API')
          }

          if (result.success) {
            // Reload messages after deletion
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
          const errorMessage = error.error || 'Error deleting message'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Getters and filters (local computations)
      getMessagesByStatus: (status) => {
        return get().messages.filter(message => message.status === status)
      },

      getNewMessagesCount: () => {
        return get().messages.filter(message => message.status === 'new').length
      },

      // Statistics (computed locally)
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
