import { useState, useEffect } from 'react'
import { MessageSquare, Mail, Clock, Send, ChevronLeft, User } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useContactsStore from '../../store/contactsStore'
import { useAuth } from '../../hooks/useAuth'

const MyMessages = () => {
  const { user } = useAuth()
  const { myMessages, isLoading, fetchMyMessages, addReply } = useContactsStore()
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchMyMessages()
  }, [fetchMyMessages])

  const statusConfig = {
    new: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: Mail },
    read: { label: 'Read', color: 'bg-yellow-100 text-yellow-800', icon: Mail },
    replied: { label: 'Replied', color: 'bg-green-100 text-green-800', icon: MessageSquare }
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
      const result = await addReply(selectedMessage._id, replyText, user.name)

      if (result.success) {
        toast.success('Reply sent successfully')
        setReplyText('')
        // Refresh messages to get the updated discussion
        await fetchMyMessages()
        // Update selected message with the new discussion
        const updatedMessage = myMessages.find(m => m._id === selectedMessage._id)
        if (updatedMessage) {
          setSelectedMessage(updatedMessage)
        }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Messages</h1>
          <p className="text-gray-600">View and reply to your contact messages</p>
        </div>

        {selectedMessage ? (
          /* Message Detail View */
          <div className="bg-white rounded-lg shadow-sm border">
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
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedMessage.status]?.color}`}>
                  {statusConfig[selectedMessage.status]?.label}
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
                        reply.from === user.name
                          ? 'bg-blue-50 border-blue-400'
                          : 'bg-green-50 border-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {reply.from}
                            {reply.from === user.name && ' (You)'}
                            {reply.from !== user.name && ' (Admin)'}
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

              {/* Reply Form */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Add a reply</h3>
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
              </div>
            </div>
          </div>
        ) : (
          /* Messages List View */
          <div className="bg-white rounded-lg shadow-sm border">
            {myMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600">
                  You haven't sent any contact messages yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {myMessages.map((message) => {
                  const StatusIcon = statusConfig[message.status]?.icon || Mail
                  const hasUnreadReplies = message.discussion && message.discussion.length > 0 && message.status === 'replied'

                  return (
                    <div
                      key={message._id}
                      className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                        hasUnreadReplies ? 'bg-green-50' : ''
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[message.status]?.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[message.status]?.label}
                            </span>
                            {hasUnreadReplies && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                New reply
                              </span>
                            )}
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
