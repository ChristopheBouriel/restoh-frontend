import { useState, useEffect } from 'react'
import { Mail, Eye, Check, Reply, Trash2, Filter, Clock, User, Phone } from 'lucide-react'
import useContactsStore from '../../store/contactsStore'

const ContactsManagement = () => {
  const {
    messages,
    isLoading,
    fetchMessages,
    markAsRead,
    markAsReplied,
    deleteMessage,
    getMessagesStats
  } = useContactsStore()

  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState(null)

  useEffect(() => {
    // Charger tous les messages de contact (admin)
    fetchMessages()
  }, [fetchMessages])

  // Configuration des statuts
  const statusConfig = {
    new: {
      label: 'Nouveau',
      color: 'bg-blue-100 text-blue-800',
      icon: Mail
    },
    read: {
      label: 'Lu',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Eye
    },
    replied: {
      label: 'Répondu',
      color: 'bg-green-100 text-green-800',
      icon: Check
    }
  }

  // Filtrer les messages
  const filteredMessages = messages.filter(message => {
    if (filterStatus === 'all') return true
    return message.status === filterStatus
  })

  // Gérer les actions sur les messages
  const handleMarkAsRead = async (messageId) => {
    await markAsRead(messageId)
  }

  const handleMarkAsReplied = async (messageId) => {
    await markAsReplied(messageId)
  }

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      await deleteMessage(messageId)
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
    }
  }

  // Statistiques
  const stats = getMessagesStats()

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Messages</h1>
        <p className="text-gray-600">Gérez les messages reçus via le formulaire de contact</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Nouveaux</p>
              <p className="text-lg font-semibold text-blue-600">{stats.new}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Eye className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Lus</p>
              <p className="text-lg font-semibold text-yellow-600">{stats.read}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Répondus</p>
              <p className="text-lg font-semibold text-green-600">{stats.replied}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('new')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'new'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Nouveaux ({stats.new})
            </button>
            <button
              onClick={() => setFilterStatus('read')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'read'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Lus ({stats.read})
            </button>
            <button
              onClick={() => setFilterStatus('replied')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'replied'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Répondus ({stats.replied})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun message</h3>
            <p className="text-gray-500">
              {filterStatus === 'all' 
                ? 'Aucun message reçu pour le moment.'
                : `Aucun message avec le statut "${statusConfig[filterStatus]?.label}".`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => {
              const StatusIcon = statusConfig[message.status]?.icon || Mail
              return (
                <div
                  key={message.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer ${
                    message.status === 'new' ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                  }`}
                  onClick={() => {
                    setSelectedMessage(message)
                    if (message.status === 'new') {
                      handleMarkAsRead(message.id)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[message.status]?.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[message.status]?.label}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium ${message.status === 'new' ? 'text-gray-900 font-semibold' : 'text-gray-800'}`}>
                            {message.subject}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="w-4 h-4 mr-1" />
                            {message.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-4 h-4 mr-1" />
                            {message.email}
                          </div>
                          {message.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-4 h-4 mr-1" />
                              {message.phone}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {message.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(message.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de détail du message */}
      {selectedMessage && (() => {
        const StatusIcon = statusConfig[selectedMessage.status]?.icon || Mail
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedMessage.subject}
                    </h2>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusConfig[selectedMessage.status]?.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[selectedMessage.status]?.label}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

              {/* Informations du contact */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nom</p>
                    <p className="text-gray-900">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{selectedMessage.email}</p>
                  </div>
                  {selectedMessage.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Téléphone</p>
                      <p className="text-gray-900">{selectedMessage.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-gray-900">
                      {new Date(selectedMessage.createdAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Message</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
                
                {selectedMessage.status !== 'replied' && (
                  <button
                    onClick={() => {
                      handleMarkAsReplied(selectedMessage.id)
                      setSelectedMessage({ ...selectedMessage, status: 'replied' })
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
                  >
                    <Reply className="w-4 h-4" />
                    <span>Marquer comme répondu</span>
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Fermer
                </button>
              </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default ContactsManagement