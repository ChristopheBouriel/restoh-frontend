import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Mail, Clock, Send, ChevronLeft, User } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useContactsStore from '../../store/contactsStore'
import { useAuth } from '../../hooks/useAuth'

const MyMessages = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { myMessages, isLoading, fetchMyMessages, addReply, markDiscussionMessageAsRead } = useContactsStore()
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const discussionEndRef = useRef(null)

  // Redirect admins to admin panel
  useEffect(() => {
    if (user?.role === 'admin') {
      toast.error('Admins should use the Contacts Management page')
      navigate('/admin/contacts')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user?.role !== 'admin') {
      fetchMyMessages()
    }
  }, [fetchMyMessages, user])

  // Update selectedMessage when myMessages change (after refresh)
  useEffect(() => {
    if (selectedMessage && myMessages.length > 0) {
      const updatedMessage = myMessages.find(m => m.id === selectedMessage.id)
      if (updatedMessage) {
        setSelectedMessage(updatedMessage)
      }
    }
  }, [myMessages])

  // Scroll to bottom of discussion when message opens or discussion updates
  useEffect(() => {
    if (selectedMessage && discussionEndRef.current) {
      discussionEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedMessage])

  const statusConfig = {
    new: { label: 'Sent', color: 'bg-terracotta-100 text-terracotta-800', icon: Mail },
    read: { label: 'Read', color: 'bg-brown-100 text-brown-800', icon: Mail },
    replied: { label: 'Replied', color: 'bg-green-100 text-green-800', icon: MessageSquare },
    newlyReplied: { label: 'New Reply', color: 'bg-apricot-100 text-apricot-800', icon: Mail },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: MessageSquare }
  }

  // Calculate the display status for a message
  const getDisplayStatus = (message) => {
    // If closed, always show closed
    if (message.status === 'closed') {
      return 'closed'
    }

    // If no discussion yet, show based on contact status
    if (!message.discussion || message.discussion.length === 0) {
      return message.status === 'new' ? 'new' : 'read'
    }

    // Get the last message in the discussion
    const lastDiscussionMessage = message.discussion[message.discussion.length - 1]

    // If last message is from user AND status is 'new' → "Replied"
    if (lastDiscussionMessage.role !== 'admin' && lastDiscussionMessage.status === 'new') {
      return 'replied'
    }

    // If last message is from admin AND status is 'new' AND contact status is 'replied' → "New Reply"
    if (lastDiscussionMessage.role === 'admin' &&
        lastDiscussionMessage.status === 'new' &&
        message.status === 'replied') {
      return 'newlyReplied'
    }

    // Otherwise → "Read"
    return 'read'
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

  const handleMessageClick = async (message) => {
    setSelectedMessage(message)

    // If there are unread admin messages, mark them as read
    if (message.discussion && message.discussion.length > 0) {
      // Find all discussion messages from admin with status 'new'
      const unreadAdminMessages = message.discussion.filter(
        reply => reply.role === 'admin' && reply.status === 'new'
      )

      // Mark each unread admin message as read
      for (const reply of unreadAdminMessages) {
        if (reply.id) {
          await markDiscussionMessageAsRead(message.id, reply.id)
        }
      }

      // Refresh messages to get updated statuses
      if (unreadAdminMessages.length > 0) {
        await fetchMyMessages()
      }
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
        await fetchMyMessages()
      } else {
        toast.error(result.error || 'Error sending reply')
      }
    } catch (error) {
      toast.error('Error sending reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && myMessages.length === 0) {
    return (
      <div className="min-h-screen bg-brown-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brown-200 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Messages</h1>
          <p className="text-gray-600">View and reply to your contact messages</p>
        </div>

        {selectedMessage ? (
          /* Message Detail View */
          <div className="bg-white rounded-lg shadow-sm border border-brown-400">
            {/* Header with back button */}
            <div className="p-6 border-b">
              <button
                onClick={() => setSelectedMessage(null)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to messages
              </button>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Sent on {formatDate(selectedMessage.createdAt)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[getDisplayStatus(selectedMessage)]?.color}`}>
                  {statusConfig[getDisplayStatus(selectedMessage)]?.label}
                </span>
              </div>
            </div>

            {/* Discussion Thread */}
            <div className="p-6 space-y-4">
              {/* Original Message */}
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">You</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(selectedMessage.createdAt)}
                  </span>
                </div>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {/* Discussion Replies */}
              {selectedMessage.discussion && selectedMessage.discussion.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="font-semibold text-gray-900">Discussion</h3>
                  {selectedMessage.discussion.map((reply, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 border-l-4 ${
                        reply.role === 'admin'
                          ? 'bg-green-50 border-green-400'
                          : 'bg-brown-50 border-brown-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {reply.userId === user.id ? 'You' : (reply.role === 'admin' ? 'Admin' : reply.name)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            reply.status === 'read'
                              ? 'bg-brown-100 text-brown-800'
                              : 'bg-terracotta-100 text-terracotta-800'
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
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Add a reply</h3>
                {selectedMessage.status === 'closed' ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-600">This conversation is closed. No more replies can be added.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReply} className="space-y-4">
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
              </div>
            </div>
          </div>
        ) : (
          /* Messages List View */
          <div className="bg-white rounded-lg shadow-sm border border-brown-400">
            {myMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600">
                  You haven't sent any contact messages yet.
                </p>
              </div>
            ) : (
              <div>
                {myMessages.map((message, index) => {
                  const displayStatus = getDisplayStatus(message)
                  const StatusIcon = statusConfig[displayStatus]?.icon || Mail
                  const hasNewReply = displayStatus === 'newlyReplied'

                  return (
                    <div key={message.id}>
                      {index > 0 && (
                        <div className="mx-6 h-px bg-primary-400" />
                      )}
                      <div
                        className={`p-6 hover:bg-primary-50 cursor-pointer transition-colors ${
                          hasNewReply ? 'bg-apricot-50' : ''
                        }`}
                        onClick={() => handleMessageClick(message)}
                      >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[displayStatus]?.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[displayStatus]?.label}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {message.subject}
                          </h3>

                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {message.message}
                          </p>

                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(message.createdAt)}
                            {message.discussion && message.discussion.length > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {message.discussion.length} {message.discussion.length === 1 ? 'reply' : 'replies'}
                              </>
                            )}
                          </div>
                        </div>

                        <ChevronLeft className="w-5 h-5 text-gray-400 transform rotate-180" />
                      </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyMessages
