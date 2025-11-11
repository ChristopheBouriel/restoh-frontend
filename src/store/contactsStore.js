import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as contactsApi from '../api/contactsApi'

const useContactsStore = create(
  persist(
    (set, get) => ({
      // State
      messages: [],
      myMessages: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Fetch user's own messages
      fetchMyMessages: async () => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.getMyContactMessages()

          if (result.success) {
            set({
              myMessages: result.data || [],
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

      // Mark message as closed (helper for updateMessageStatus)
      markAsClosed: async (messageId) => {
        return await get().updateMessageStatus(messageId, 'closed')
      },

      // Add reply to discussion (user or admin)
      addReply: async (messageId, text) => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.addReplyToDiscussion(messageId, text)

          if (result.success) {
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
          const errorMessage = error.error || 'Error adding reply'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Mark discussion message as read
      markDiscussionMessageAsRead: async (contactId, discussionId) => {
        set({ isLoading: true, error: null })

        try {
          const result = await contactsApi.markDiscussionMessageAsRead(contactId, discussionId)

          if (result.success) {
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
          const errorMessage = error.error || 'Error marking message as read'
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
        return get().messages.filter(message => message.status === 'new' || message.status === 'newlyReplied').length
      },

      // Statistics (computed locally)
      getMessagesStats: () => {
        const messages = get().messages
        return {
          total: messages.length,
          new: messages.filter(m => m.status === 'new').length,
          read: messages.filter(m => m.status === 'read').length,
          replied: messages.filter(m => m.status === 'replied').length,
          newlyReplied: messages.filter(m => m.status === 'newlyReplied').length,
          closed: messages.filter(m => m.status === 'closed').length
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
