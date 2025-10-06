import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useOrdersStore = create(
  persist(
    (set, get) => ({
      // État
      orders: [],
      isLoading: false,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      // Initialiser avec des données de test
      initializeOrders: () => {
        const stored = localStorage.getItem('admin-orders-v2')
        if (stored) {
          set({ orders: JSON.parse(stored) })
        } else {
          // Calculer les dates récentes
          const today = new Date()
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          const twoDaysAgo = new Date(today)
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
          const threeDaysAgo = new Date(today)
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
          
          // Données initiales pour la démo
          const initialOrders = [
            {
              id: 'order-001',
              userId: 'client',
              userEmail: 'client@example.com',
              userName: 'Client',
              deliveryAddress: '123 Rue de la République, 75001 Paris',
              phone: '06 12 34 56 78',
              items: [
                { id: 1, name: 'Pizza Margherita', price: 15.90, quantity: 2, image: 'pizza-margherita.jpg' },
                { id: 2, name: 'Salade César', price: 12.50, quantity: 1, image: 'salade-cesar.jpg' }
              ],
              totalAmount: 44.30,
              status: 'preparing', // pending, confirmed, preparing, ready, delivered, cancelled
              paymentMethod: 'card',
              isPaid: true,
              createdAt: today.toISOString(),
              updatedAt: today.toISOString(),
              notes: 'Commande en cours de préparation'
            },
            {
              id: 'order-002',
              userId: 'client',
              userEmail: 'client@example.com', 
              userName: 'Client',
              deliveryAddress: '123 Rue de la République, 75001 Paris',
              phone: '06 12 34 56 78',
              items: [
                { id: 3, name: 'Burger Gourmand', price: 18.00, quantity: 1, image: 'burger-gourmand.jpg' }
              ],
              totalAmount: 18.00,
              status: 'delivered',
              paymentMethod: 'cash',
              isPaid: true,
              createdAt: yesterday.toISOString(),
              updatedAt: yesterday.toISOString(),
              notes: 'Payé à la réception - commande livrée'
            },
            {
              id: 'order-003',
              userId: 'client',
              userEmail: 'client@example.com', 
              userName: 'Client',
              deliveryAddress: '123 Rue de la République, 75001 Paris',
              phone: '06 12 34 56 78',
              items: [
                { id: 4, name: 'Pasta Carbonara', price: 16.50, quantity: 1, image: 'pasta-carbonara.jpg' },
                { id: 5, name: 'Tiramisu', price: 8.00, quantity: 1, image: 'tiramisu.jpg' }
              ],
              totalAmount: 24.50,
              status: 'delivered',
              paymentMethod: 'card',
              isPaid: true,
              createdAt: twoDaysAgo.toISOString(),
              updatedAt: twoDaysAgo.toISOString(),
              notes: 'Commande livrée avec succès'
            },
            {
              id: 'order-004',
              userId: 'client',
              userEmail: 'client@example.com', 
              userName: 'Client',
              deliveryAddress: '123 Rue de la République, 75001 Paris',
              phone: '06 12 34 56 78',
              items: [
                { id: 6, name: 'Risotto aux champignons', price: 19.00, quantity: 1, image: 'risotto.jpg' }
              ],
              totalAmount: 19.00,
              status: 'cancelled',
              paymentMethod: 'card',
              isPaid: true,
              createdAt: threeDaysAgo.toISOString(),
              updatedAt: threeDaysAgo.toISOString(),
              notes: 'Commande annulée par le client - remboursement effectué'
            },
            {
              id: 'order-005',
              userId: 'client',
              userEmail: 'client@example.com',
              userName: 'Client',
              deliveryAddress: '123 Rue de la République, 75001 Paris',
              phone: '06 12 34 56 78',
              items: [
                { id: 7, name: 'Salade de Saison', price: 14.50, quantity: 1, image: 'salade-saison.jpg' }
              ],
              totalAmount: 14.50,
              status: 'ready',
              paymentMethod: 'cash',
              isPaid: false,
              createdAt: today.toISOString(),
              updatedAt: today.toISOString(),
              notes: 'Commande prête - paiement à la réception'
            },
            {
              id: 'order-006',
              userId: 'deleted-user',
              userEmail: 'deleted@account.com',
              userName: 'Utilisateur supprimé',
              deliveryAddress: 'Adresse supprimée',
              phone: 'Téléphone supprimé',
              items: [
                { id: 8, name: 'Pizza Pepperoni', price: 17.50, quantity: 1, image: 'pizza-pepperoni.jpg' }
              ],
              totalAmount: 17.50,
              status: 'confirmed',
              paymentMethod: 'card',
              isPaid: true,
              createdAt: yesterday.toISOString(),
              updatedAt: yesterday.toISOString(),
              notes: 'Commande d\'un utilisateur supprimé - payée'
            },
            {
              id: 'order-007',
              userId: 'deleted-user',
              userEmail: 'deleted@account.com',
              userName: 'Utilisateur supprimé',
              deliveryAddress: 'Adresse supprimée',
              phone: 'Téléphone supprimé',
              items: [
                { id: 9, name: 'Soupe du jour', price: 8.50, quantity: 1, image: 'soupe.jpg' }
              ],
              totalAmount: 8.50,
              status: 'preparing',
              paymentMethod: 'cash',
              isPaid: false,
              createdAt: twoDaysAgo.toISOString(),
              updatedAt: twoDaysAgo.toISOString(),
              notes: 'Commande d\'un utilisateur supprimé - non payée'
            }
          ]
          
          set({ orders: initialOrders })
          localStorage.setItem('admin-orders-v2', JSON.stringify(initialOrders))
        }
      },

      // Créer une nouvelle commande (appelé depuis le panier)
      createOrder: async (orderData) => {
        set({ isLoading: true })
        
        try {
          // Simulation d'appel API
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // Appliquer la logique de paiement automatique
          const isPaid = orderData.paymentMethod === 'card'
          
          const newOrder = {
            id: `order-${Date.now()}`,
            ...orderData,
            status: 'pending',
            isPaid: isPaid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const updatedOrders = [newOrder, ...get().orders]
          set({ orders: updatedOrders, isLoading: false })
          localStorage.setItem('admin-orders-v2', JSON.stringify(updatedOrders))
          
          return { success: true, orderId: newOrder.id }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Mettre à jour le statut d'une commande
      updateOrderStatus: async (orderId, newStatus) => {
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const updatedOrders = get().orders.map(order => {
            if (order.id === orderId) {
              const updatedOrder = { ...order, status: newStatus, updatedAt: new Date().toISOString() }
              
              // Logique automatique de paiement en espèces
              if (newStatus === 'delivered' && order.paymentMethod === 'cash' && !order.isPaid) {
                updatedOrder.isPaid = true
                updatedOrder.notes = updatedOrder.notes 
                  ? `${updatedOrder.notes} - Payé à la livraison`
                  : 'Payé à la livraison'
              }
              
              return updatedOrder
            }
            return order
          })
          
          set({ orders: updatedOrders, isLoading: false })
          localStorage.setItem('admin-orders-v2', JSON.stringify(updatedOrders))
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Getters
      getOrdersByStatus: (status) => {
        return get().orders.filter(order => order.status === status)
      },

      getOrdersByUser: (userId) => {
        return get().orders.filter(order => order.userId === userId)
      },

      getTodaysOrders: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().orders.filter(order => 
          order.createdAt.startsWith(today)
        )
      },

      // Statistiques
      getOrdersStats: () => {
        const orders = get().orders
        return {
          total: orders.length,
          pending: orders.filter(o => o.status === 'pending').length,
          confirmed: orders.filter(o => o.status === 'confirmed').length,
          preparing: orders.filter(o => o.status === 'preparing').length,
          ready: orders.filter(o => o.status === 'ready').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length,
          totalRevenue: orders
            .filter(o => ['delivered'].includes(o.status))
            .reduce((sum, order) => sum + order.totalAmount, 0)
        }
      }
    }),
    {
      name: 'orders-storage',
      partialize: (state) => ({ 
        orders: state.orders 
      }),
    }
  )
)

export default useOrdersStore