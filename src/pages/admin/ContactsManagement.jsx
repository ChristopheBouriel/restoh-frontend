import { useState, useEffect, useRef } from 'react'
import { Mail, Eye, Check, Reply, Archive, RotateCcw, Filter, Clock, User, Phone, Send } from 'lucide-react'
import useContactsStore from '../../store/contactsStore'
import { useAuth } from '../../hooks/useAuth'
import { toast } from 'react-hot-toast'

const ContactsManagement = () => {
  const { user } = useAuth()
  const {
    messages,
    deletedMessages,
    isLoading,
    fetchMessages,
    fetchDeletedMessages,
    markAsRead,
    markAsClosed,
    archiveMessage,
    restoreMessage,
    addReply,
    getMessagesStats,
    markDiscussionMessageAsRead,
    updateMessageStatus
  } = useContactsStore()

  const [activeTab, setActiveTab] = useState('active') // 'active' or 'archived'
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const discussionEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    fetchDeletedMessages()
  }, [fetchMessages, fetchDeletedMessages])

  // Update selectedMessage when messages change (after refresh)
  useEffect(() => {
    if (selectedMessage && messages.length > 0) {
      const updatedMessage = messages.find(m => m.id === selectedMessage.id)
      if (updatedMessage) {
        setSelectedMessage(updatedMessage)
      }
    }
  }, [messages])

  // Scroll to bottom of discussion when modal opens or discussion updates
  useEffect(() => {
    if (selectedMessage && discussionEndRef.current) {
      discussionEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedMessage])

  const statusConfig = {
    new: {
      label: 'New',
      color: 'bg-blue-100 text-blue-800',
      icon: Mail
    },
    read: {
      label: 'Read',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Eye
    },
    replied: {
      label: 'Replied',
      color: 'bg-green-100 text-green-800',
      icon: Check
    },
    newlyReplied: {
      label: 'New Reply',
      color: 'bg-purple-100 text-purple-800',
      icon: Mail
    },
    closed: {
      label: 'Closed',
      color: 'bg-gray-100 text-gray-800',
      icon: Check
    }
  }

  const filteredMessages = messages.filter(message => {
    if (filterStatus === 'all') return true
    return message.status === filterStatus
  })

  const handleArchiveMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to archive this message?')) {
      const result = await archiveMessage(messageId)
      if (result.success) {
        toast.success('Message archived')
        await fetchDeletedMessages()
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null)
        }
      } else {
        toast.error(result.error || 'Error archiving message')
      }
    }
  }

  const handleRestoreMessage = async (messageId) => {
    const result = await restoreMessage(messageId)
    if (result.success) {
      toast.success('Message restored')
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
    } else {
      toast.error(result.error || 'Error restoring message')
    }
  }

  const handleMarkAsClosed = async (messageId) => {
    if (window.confirm('Are you sure you want to mark this conversation as closed?')) {
      const result = await markAsClosed(messageId)
      if (result.success) {
        toast.success('Conversation marked as closed')
        await fetchMessages()
        setSelectedMessage(null)
      } else {
        toast.error(result.error || 'Error closing conversation')
      }
    }
  }

  const handleMessageClick = async (message) => {
    setSelectedMessage(message)

    // If the message has new replies from user, mark them as read
    if (message.status === 'newlyReplied' && message.discussion && message.discussion.length > 0) {
      // Find all discussion messages from user with status 'new'
      const unreadUserMessages = message.discussion.filter(
        reply => reply.role !== 'admin' && reply.status === 'new'
      )

      // Mark each unread user message as read
      for (const reply of unreadUserMessages) {
        if (reply.id) {
          await markDiscussionMessageAsRead(message.id, reply.id)
        }
      }

      // Refresh messages to get updated statuses
      if (unreadUserMessages.length > 0) {
        await fetchMessages()
      }
    } else if (message.status === 'new') {
      // Mark the contact as read if it's a new message
      await markAsRead(message.id)
      await fetchMessages()
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()

    if (!replyText.trim()) {
      toast.error('Please write a message')
      return
    }

    if (replyText.length > 1000) {
      toast.error('Message is too long (max 1000 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await addReply(selectedMessage.id, replyText)

      if (result.success) {
        toast.success('Reply sent successfully')
        setReplyText('')
        // Refresh messages to get the updated discussion (useEffect will update selectedMessage)
        // Backend automatically changes contact status to 'replied'
        await fetchMessages()
      } else {
        toast.error(result.error || 'Error sending reply')
      }
    } catch (error) {
      toast.error('Error sending reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = getMessagesStats()

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages Management</h1>
        <p className="text-gray-600">Manage messages received via the contact form</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <p className="text-sm font-medium text-gray-500">New</p>
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
              <p className="text-sm font-medium text-gray-500">Read</p>
              <p className="text-lg font-semibold text-yellow-600">{stats.read}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">New Reply</p>
              <p className="text-lg font-semibold text-purple-600">{stats.newlyReplied}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Replied</p>
              <p className="text-lg font-semibold text-green-600">{stats.replied}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Check className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Closed</p>
              <p className="text-lg font-semibold text-gray-600">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Active/Archived */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => { setActiveTab('active'); setFilterStatus('all') }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'active'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
              activeTab === 'archived'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archived ({deletedMessages.length})</span>
          </button>
        </div>
      </div>

      {/* Filtres - Only for active tab */}
      {activeTab === 'active' && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex space-x-2 flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus('new')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'new'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                New ({stats.new})
              </button>
              <button
                onClick={() => setFilterStatus('read')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'read'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Read ({stats.read})
              </button>
              <button
                onClick={() => setFilterStatus('newlyReplied')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'newlyReplied'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                New Reply ({stats.newlyReplied})
              </button>
              <button
                onClick={() => setFilterStatus('replied')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'replied'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Replied ({stats.replied})
              </button>
              <button
                onClick={() => setFilterStatus('closed')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'closed'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Closed ({stats.closed})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des messages */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {activeTab === 'active' ? (
          // Active messages list
          filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
              <p className="text-gray-500">
                {filterStatus === 'all'
                  ? 'No messages received yet.'
                  : `No messages with status "${statusConfig[filterStatus]?.label}".`
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
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium w-24 ${statusConfig[message.status]?.color}`}>
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
          )
        ) : (
          // Archived messages list
          deletedMessages.length === 0 ? (
            <div className="p-8 text-center">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No archived messages</h3>
              <p className="text-gray-500">Archived messages will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {deletedMessages.map((message) => {
                const StatusIcon = statusConfig[message.status]?.icon || Mail
                return (
                  <div
                    key={message.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer bg-gray-50"
                    onClick={() => setSelectedMessage({ ...message, isArchived: true })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium w-24 ${statusConfig[message.status]?.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[message.status]?.label}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-800">
                              {message.subject}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Archive className="w-3 h-3 mr-1" />
                              Archived
                            </span>
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
                          </div>
                          {message.deletedBy && (
                            <p className="text-xs text-red-500 mt-1">
                              Archived by {message.deletedBy.firstName} {message.deletedBy.lastName} on {new Date(message.deletedAt).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {message.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestoreMessage(message.id)
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Restore</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Modal de détail du message */}
      {selectedMessage && (() => {
        const StatusIcon = statusConfig[selectedMessage.status]?.icon || Mail
        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMessage(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
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
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-gray-900">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{selectedMessage.email}</p>
                  </div>
                  {selectedMessage.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
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

              {/* Discussion Thread */}
              <div className="space-y-4 mb-6">
                {/* Original Message */}
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{selectedMessage.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(selectedMessage.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {/* Discussion Replies */}
                {selectedMessage.discussion && selectedMessage.discussion.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Discussion</h3>
                    {selectedMessage.discussion.map((reply, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-4 border-l-4 ${
                          reply.role === 'admin'
                            ? 'bg-green-50 border-green-400'
                            : 'bg-blue-50 border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {reply.userId === user.id ? 'You' : reply.name}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              reply.status === 'read'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {reply.status === 'read' ? 'Read' : 'New'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(reply.date)}
                          </span>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={discussionEndRef} />

                {/* Reply Form */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Add a reply</h3>
                  {selectedMessage.status === 'closed' ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center mb-4">
                      <p className="text-gray-600">This conversation is closed. No more replies can be added.</p>
                    </div>
                  ) : !selectedMessage.userId || selectedMessage.userId === 'deleted-user' ? (
                    <div className="bg-yellow-50 p-4 rounded-lg text-center mb-4 border border-yellow-200">
                      <p className="text-gray-700">
                        <strong>Unregistered user.</strong> Please contact them by email or phone.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReply} className="space-y-4 mb-4">
                      <div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your message here..."
                          rows={4}
                          maxLength={1000}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {replyText.length} / 1000 characters
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmitting || !replyText.trim()}
                          className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmitting ? 'Sending...' : 'Send Reply'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Management buttons - always visible */}
                  <div className="flex space-x-3 pt-4 border-t">
                    {selectedMessage.isArchived ? (
                      // Archived message - show restore button
                      <button
                        type="button"
                        onClick={() => handleRestoreMessage(selectedMessage.id)}
                        className="px-4 py-2 text-green-600 border border-green-600 rounded-md hover:bg-green-50 flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore</span>
                      </button>
                    ) : (
                      // Active message - show archive button
                      <button
                        type="button"
                        onClick={() => handleArchiveMessage(selectedMessage.id)}
                        className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Archive className="w-4 h-4" />
                        <span>Archive</span>
                      </button>
                    )}

                    {/* Mark as Replied button - only for unregistered users and active messages */}
                    {!selectedMessage.isArchived &&
                     (!selectedMessage.userId || selectedMessage.userId === 'deleted-user') &&
                     selectedMessage.status !== 'replied' &&
                     selectedMessage.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await updateMessageStatus(selectedMessage.id, 'replied')
                          if (result.success) {
                            toast.success('Message marked as replied')
                            await fetchMessages()
                          } else {
                            toast.error(result.error || 'Error updating status')
                          }
                        }}
                        className="px-4 py-2 text-green-600 border border-green-600 rounded-md hover:bg-green-50 flex items-center space-x-2"
                      >
                        <Reply className="w-4 h-4" />
                        <span>Mark as Replied</span>
                      </button>
                    )}

                    {!selectedMessage.isArchived && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsClosed(selectedMessage.id)}
                        disabled={selectedMessage.status === 'closed'}
                        className="px-4 py-2 text-gray-600 border border-gray-600 rounded-md hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-4 h-4" />
                        <span>{selectedMessage.status === 'closed' ? 'Closed' : 'Mark as Closed'}</span>
                      </button>
                    )}
                  </div>
                </div>
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