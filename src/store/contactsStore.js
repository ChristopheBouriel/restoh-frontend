import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useContactsStore = create(
  persist(
    (set, get) => ({
      // État
      messages: [],
      isLoading: false,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      // Initialiser avec des données de test
      initializeMessages: () => {
        const stored = localStorage.getItem('admin-messages')
        if (stored) {
          set({ messages: JSON.parse(stored) })
        } else {
          // Données initiales pour la démo
          const today = new Date()
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          const twoDaysAgo = new Date(today)
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
          
          const initialMessages = [
            {
              id: 'msg-001',
              name: 'Marie Dubois',
              email: 'marie.dubois@email.com',
              phone: '06 12 34 56 78',
              subject: 'Question sur les allergènes',
              message: 'Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ? J\'ai une allergie sévère. Merci.',
              status: 'new', // new, read, replied
              createdAt: today.toISOString(),
              readAt: null,
              repliedAt: null
            },
            {
              id: 'msg-002',
              name: 'Pierre Martin',
              email: 'pierre.martin@company.fr',
              phone: '01 23 45 67 89',
              subject: 'Réservation événement d\'entreprise',
              message: 'Nous souhaitons organiser un événement d\'entreprise pour 50 personnes le mois prochain. Proposez-vous des menus de groupe et avez-vous une salle privée disponible ?',
              status: 'read',
              createdAt: yesterday.toISOString(),
              readAt: yesterday.toISOString(),
              repliedAt: null
            },
            {
              id: 'msg-003',
              name: 'Sophie Laurent',
              email: 'sophie.l@email.com',
              phone: null,
              subject: 'Félicitations',
              message: 'Je voulais simplement vous féliciter pour l\'excellente soirée que nous avons passée hier soir. Le service était impeccable et les plats délicieux. Nous reviendrons très bientôt !',
              status: 'replied',
              createdAt: twoDaysAgo.toISOString(),
              readAt: twoDaysAgo.toISOString(),
              repliedAt: twoDaysAgo.toISOString()
            }
          ]
          
          set({ messages: initialMessages })
          localStorage.setItem('admin-messages', JSON.stringify(initialMessages))
        }
      },

      // Créer un nouveau message (appelé depuis le formulaire de contact)
      createMessage: async (messageData) => {
        set({ isLoading: true })
        
        try {
          // Simulation d'appel API
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const newMessage = {
            id: `msg-${Date.now()}`,
            ...messageData,
            status: 'new',
            createdAt: new Date().toISOString(),
            readAt: null,
            repliedAt: null
          }
          
          const updatedMessages = [newMessage, ...get().messages]
          set({ messages: updatedMessages, isLoading: false })
          localStorage.setItem('admin-messages', JSON.stringify(updatedMessages))
          
          return { success: true, messageId: newMessage.id }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Marquer un message comme lu
      markAsRead: async (messageId) => {
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          
          const updatedMessages = get().messages.map(message =>
            message.id === messageId 
              ? { 
                  ...message, 
                  status: message.status === 'new' ? 'read' : message.status,
                  readAt: message.readAt || new Date().toISOString()
                }
              : message
          )
          
          set({ messages: updatedMessages, isLoading: false })
          localStorage.setItem('admin-messages', JSON.stringify(updatedMessages))
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Marquer un message comme répondu
      markAsReplied: async (messageId) => {
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          
          const now = new Date().toISOString()
          const updatedMessages = get().messages.map(message =>
            message.id === messageId 
              ? { 
                  ...message, 
                  status: 'replied',
                  readAt: message.readAt || now,
                  repliedAt: now
                }
              : message
          )
          
          set({ messages: updatedMessages, isLoading: false })
          localStorage.setItem('admin-messages', JSON.stringify(updatedMessages))
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Supprimer un message
      deleteMessage: async (messageId) => {
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          
          const updatedMessages = get().messages.filter(message => message.id !== messageId)
          set({ messages: updatedMessages, isLoading: false })
          localStorage.setItem('admin-messages', JSON.stringify(updatedMessages))
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Getters et filtres
      getMessagesByStatus: (status) => {
        return get().messages.filter(message => message.status === status)
      },

      getNewMessagesCount: () => {
        return get().messages.filter(message => message.status === 'new').length
      },

      // Statistiques
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