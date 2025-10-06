import axios from 'axios'
import { toast } from 'react-hot-toast'

// URL de base de l'API (depuis les variables d'environnement)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Créer l'instance axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur de requêtes - Ajouter le token JWT automatiquement
apiClient.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le localStorage
    const authStorage = localStorage.getItem('auth-storage')

    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage)
        const token = state?.token

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur de réponses - Gérer les erreurs globalement
apiClient.interceptors.response.use(
  (response) => {
    // Retourner directement la data pour simplifier l'usage
    return response.data
  },
  (error) => {
    // Gérer les différents codes d'erreur HTTP
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          // Bad Request - Erreur de validation
          console.error('Validation error:', data)
          break

        case 401:
          // Unauthorized - Token invalide ou expiré
          console.error('Authentication error:', data)

          // Nettoyer le localStorage et rediriger vers login
          localStorage.removeItem('auth-storage')

          // Toast uniquement si pas déjà sur la page de login
          if (!window.location.pathname.includes('/login')) {
            toast.error('Session expirée. Veuillez vous reconnecter.')
            window.location.href = '/login'
          }
          break

        case 403:
          // Forbidden - Pas les permissions
          console.error('Permission denied:', data)
          toast.error('Vous n\'avez pas les permissions nécessaires')
          break

        case 404:
          // Not Found
          console.error('Resource not found:', data)
          break

        case 409:
          // Conflict - Ex: email déjà utilisé
          console.error('Conflict error:', data)
          break

        case 500:
          // Internal Server Error
          console.error('Server error:', data)
          toast.error('Erreur serveur. Veuillez réessayer plus tard.')
          break

        default:
          console.error('API error:', data)
      }

      // Rejeter avec un objet d'erreur structuré
      return Promise.reject({
        success: false,
        error: data?.error || data?.message || 'Une erreur est survenue',
        code: data?.code,
        status,
        details: data?.details
      })
    } else if (error.request) {
      // La requête a été faite mais pas de réponse
      console.error('Network error:', error.request)
      toast.error('Erreur de connexion au serveur')

      return Promise.reject({
        success: false,
        error: 'Impossible de contacter le serveur',
        code: 'NETWORK_ERROR'
      })
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Request setup error:', error.message)

      return Promise.reject({
        success: false,
        error: error.message,
        code: 'REQUEST_ERROR'
      })
    }
  }
)

export default apiClient
