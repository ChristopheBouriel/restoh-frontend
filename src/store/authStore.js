import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hashPassword, verifyPassword } from '../utils/crypto'

// Hashs pré-calculés pour les comptes par défaut (SHA-256)
const DEFAULT_PASSWORDS = {
  admin: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
  client: '186474c1f2c2f735a54c2cf82ee8e87f2a5cd30940e280029363fecedfc5328c'  // client123
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      // État
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        
        try {
          // TODO: Remplacer par l'appel API réel
          console.log('Login attempt:', credentials)
          
          // Simulation d'appel API
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Simuler la récupération des données utilisateur depuis une "base de données"
          // En réalité, cela viendrait de l'API backend
          const storedUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
          const existingUser = storedUsers.find(user => user.email === credentials.email)
          
          let mockUser
          if (existingUser) {
            // Vérifier le mot de passe pour l'utilisateur enregistré (hashé)
            const isValidPassword = await verifyPassword(credentials.password, existingUser.password)
            if (!isValidPassword) {
              throw new Error('Mot de passe incorrect')
            }
            // Utiliser les données de l'utilisateur enregistré
            mockUser = {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              role: existingUser.role || 'user'
            }
          } else if (credentials.email === 'admin@restoh.fr') {
            // Vérifier le mot de passe admin (hashé)
            const isValidPassword = await verifyPassword(credentials.password, DEFAULT_PASSWORDS.admin)
            if (!isValidPassword) {
              throw new Error('Mot de passe incorrect')
            }
            // Utilisateur admin par défaut
            mockUser = {
              id: 'admin',
              email: credentials.email,
              name: 'Administrateur',
              role: 'admin'
            }
          } else if (credentials.email === 'client@example.com') {
            // Vérifier le mot de passe client (hashé)
            const isValidPassword = await verifyPassword(credentials.password, DEFAULT_PASSWORDS.client)
            if (!isValidPassword) {
              throw new Error('Mot de passe incorrect')
            }
            // Utilisateur client par défaut  
            mockUser = {
              id: 'client',
              email: credentials.email,
              name: 'Client',
              role: 'user'
            }
          } else {
            // Utilisateur non autorisé
            throw new Error('Utilisateur non trouvé. Veuillez vous inscrire d\'abord.')
          }
          
          const mockToken = 'mock-jwt-token-' + Date.now()
          
          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Erreur de connexion',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          // TODO: Remplacer par l'appel API réel
          console.log('Register attempt:', userData)
          
          // Simulation d'appel API
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Hasher le mot de passe avant de le stocker
          const hashedPassword = await hashPassword(userData.password)
          
          const newUser = {
            id: Date.now(),
            email: userData.email,
            name: userData.name,
            password: hashedPassword, // Stocker le mot de passe hashé
            role: 'user'
          }
          
          // Sauvegarder l'utilisateur dans le localStorage pour simulation
          const storedUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
          storedUsers.push(newUser)
          localStorage.setItem('registered-users', JSON.stringify(storedUsers))
          
          const mockToken = 'mock-jwt-token-' + Date.now()
          
          set({
            user: newUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Erreur lors de l\'inscription',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })
        
        try {
          // TODO: Remplacer par l'appel API réel
          console.log('Update profile:', profileData)
          
          // Simulation d'appel API
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const currentUser = get().user
          const updatedUser = { ...currentUser, ...profileData }
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null
          })
          
          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Erreur lors de la mise à jour',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      deleteAccount: async (password) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('Delete account request')
          
          // Simulation d'appel API
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          const currentUser = get().user
          if (!currentUser) {
            throw new Error('Aucun utilisateur connecté')
          }

          // Vérifier le mot de passe (simulation)
          const registeredUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
          const userToDelete = registeredUsers.find(u => u.email === currentUser.email)
          
          if (userToDelete) {
            // Vérifier le mot de passe hashé
            const { verifyPassword } = await import('../utils/crypto')
            const isValidPassword = await verifyPassword(password, userToDelete.password)
            if (!isValidPassword) {
              throw new Error('Mot de passe incorrect')
            }
          } else if (currentUser.email === 'admin@restoh.fr' || currentUser.email === 'client@example.com') {
            // Pour les comptes par défaut, on vérifie avec les mots de passe par défaut
            const { verifyPassword } = await import('../utils/crypto')
            const defaultPasswords = {
              'admin@restoh.fr': '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
              'client@example.com': '186474c1f2c2f735a54c2cf82ee8e87f2a5cd30940e280029363fecedfc5328c'  // client123
            }
            
            const expectedHash = defaultPasswords[currentUser.email]
            if (expectedHash) {
              const isValidPassword = await verifyPassword(password, expectedHash)
              if (!isValidPassword) {
                throw new Error('Mot de passe incorrect')
              }
            }
          }

          // Supprimer les données utilisateur de tous les stores
          await get().cleanupUserData(currentUser.id)
          
          // Déconnecter l'utilisateur
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
          
          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Erreur lors de la suppression du compte',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Nettoyer toutes les données utilisateur du localStorage
      cleanupUserData: async (userId) => {
        try {
          // 1. Supprimer de registered-users
          const registeredUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
          const filteredUsers = registeredUsers.filter(user => user.id !== userId)
          localStorage.setItem('registered-users', JSON.stringify(filteredUsers))

          // 2. Anonymiser les commandes (garder pour les stats mais supprimer les données perso)
          const orders = JSON.parse(localStorage.getItem('admin-orders-v2') || '[]')
          const anonymizedOrders = orders.map(order => 
            order.userId === userId 
              ? {
                  ...order,
                  userId: 'deleted-user',
                  userEmail: 'deleted@account.com',
                  userName: 'Utilisateur supprimé',
                  deliveryAddress: 'Adresse supprimée',
                  phone: 'Téléphone supprimé',
                  notes: order.notes ? 'Notes supprimées' : ''
                }
              : order
          )
          localStorage.setItem('admin-orders-v2', JSON.stringify(anonymizedOrders))

          // 3. Anonymiser les réservations
          const reservations = JSON.parse(localStorage.getItem('admin-reservations') || '[]')
          const anonymizedReservations = reservations.map(reservation => 
            reservation.userId === userId 
              ? {
                  ...reservation,
                  userId: 'deleted-user',
                  userEmail: 'deleted@account.com',
                  userName: 'Utilisateur supprimé',
                  phone: 'Téléphone supprimé',
                  specialRequests: reservation.specialRequests ? 'Demandes supprimées' : ''
                }
              : reservation
          )
          localStorage.setItem('admin-reservations', JSON.stringify(anonymizedReservations))

          // 4. Nettoyer le panier de l'utilisateur
          const cartData = JSON.parse(localStorage.getItem('cart-storage') || '{}')
          if (cartData.state && cartData.state.userCarts && cartData.state.userCarts[userId]) {
            delete cartData.state.userCarts[userId]
            localStorage.setItem('cart-storage', JSON.stringify(cartData))
          }

          console.log('Données utilisateur nettoyées avec succès')
        } catch (error) {
          console.error('Erreur lors du nettoyage des données:', error)
        }
      },

      // Changer le mot de passe
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('Change password request')
          
          // Simulation d'appel API
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const currentUser = get().user
          if (!currentUser) {
            throw new Error('Aucun utilisateur connecté')
          }

          // Vérifier le mot de passe actuel
          const registeredUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
          const userIndex = registeredUsers.findIndex(u => u.email === currentUser.email)
          
          if (userIndex !== -1) {
            // Utilisateur enregistré - vérifier avec son hash
            const { verifyPassword, hashPassword } = await import('../utils/crypto')
            const user = registeredUsers[userIndex]
            const isValidCurrentPassword = await verifyPassword(currentPassword, user.password)
            
            if (!isValidCurrentPassword) {
              throw new Error('Mot de passe actuel incorrect')
            }
            
            // Hasher le nouveau mot de passe
            const newHashedPassword = await hashPassword(newPassword)
            
            // Mettre à jour le mot de passe
            registeredUsers[userIndex].password = newHashedPassword
            localStorage.setItem('registered-users', JSON.stringify(registeredUsers))
            
          } else if (currentUser.email === 'admin@restoh.fr' || currentUser.email === 'client@example.com') {
            // Comptes par défaut - vérifier avec les hash par défaut et migrer vers registered-users
            const { verifyPassword, hashPassword } = await import('../utils/crypto')
            const defaultPasswords = {
              'admin@restoh.fr': '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
              'client@example.com': '186474c1f2c2f735a54c2cf82ee8e87f2a5cd30940e280029363fecedfc5328c'  // client123
            }
            
            const expectedHash = defaultPasswords[currentUser.email]
            if (!expectedHash || !(await verifyPassword(currentPassword, expectedHash))) {
              throw new Error('Mot de passe actuel incorrect')
            }
            
            // Créer l'utilisateur dans registered-users avec le nouveau mot de passe
            const newHashedPassword = await hashPassword(newPassword)
            const newUser = {
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name,
              role: currentUser.role,
              password: newHashedPassword,
              phone: currentUser.phone || '',
              createdAt: new Date().toISOString()
            }
            
            registeredUsers.push(newUser)
            localStorage.setItem('registered-users', JSON.stringify(registeredUsers))
          } else {
            throw new Error('Utilisateur introuvable')
          }
          
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Erreur lors du changement de mot de passe',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

export default useAuthStore