/**
 * ContactService - Business logic for contact messages
 * Provides filtering, statistics, display helpers, and status management
 */

import { Mail, Eye, Check, MessageSquare } from 'lucide-react'
import {
  validateContactForm,
  validateReply,
  isContactFormComplete
} from './contactValidator'

/**
 * Contact status configuration for admin view
 */
const ADMIN_STATUS_CONFIG = {
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

/**
 * Contact status configuration for user view
 */
const USER_STATUS_CONFIG = {
  new: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-800',
    icon: Mail
  },
  read: {
    label: 'Read',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Mail
  },
  replied: {
    label: 'Replied',
    color: 'bg-green-100 text-green-800',
    icon: MessageSquare
  },
  newlyReplied: {
    label: 'New Reply',
    color: 'bg-purple-100 text-purple-800',
    icon: Mail
  },
  closed: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800',
    icon: MessageSquare
  }
}

/**
 * Valid contact statuses
 */
export const CONTACT_STATUSES = ['new', 'read', 'replied', 'newlyReplied', 'closed']

class ContactService {
  /**
   * Get status display information
   * @param {string} status - Contact status
   * @param {boolean} isUserView - Whether this is for user view (vs admin view)
   * @returns {{ label: string, color: string, icon: Component }}
   */
  getStatusDisplayInfo(status, isUserView = false) {
    const config = isUserView ? USER_STATUS_CONFIG : ADMIN_STATUS_CONFIG
    return config[status] || config.new
  }

  /**
   * Get status config object for building UI
   * @param {boolean} isUserView - Whether this is for user view
   * @returns {Object} Status configuration object
   */
  getStatusConfig(isUserView = false) {
    return isUserView ? { ...USER_STATUS_CONFIG } : { ...ADMIN_STATUS_CONFIG }
  }

  /**
   * Calculate the display status for a message (user view)
   * This determines what status to show based on discussion state
   * @param {Object} message - Contact message
   * @returns {string} Display status
   */
  getDisplayStatus(message) {
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
    if (
      lastDiscussionMessage.role === 'admin' &&
      lastDiscussionMessage.status === 'new' &&
      message.status === 'replied'
    ) {
      return 'newlyReplied'
    }

    // Otherwise → "Read"
    return 'read'
  }

  /**
   * Format date for display
   * @param {string|Date} dateString - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  formatDate(dateString, options = {}) {
    const defaultOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('fr-FR', { ...defaultOptions, ...options })
  }

  /**
   * Format date with full weekday name
   * @param {string|Date} dateString - Date to format
   * @returns {string} Formatted date with weekday
   */
  formatDateFull(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Format date short (for list views)
   * @param {string|Date} dateString - Date to format
   * @returns {string} Short formatted date
   */
  formatDateShort(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Filter messages by status
   * @param {Array} messages - Array of messages
   * @param {string} status - Status to filter by ('all' for no filter)
   * @returns {Array} Filtered messages
   */
  filterByStatus(messages, status) {
    if (!messages || !Array.isArray(messages)) return []
    if (status === 'all') return messages
    return messages.filter(message => message.status === status)
  }

  /**
   * Calculate statistics for messages
   * @param {Array} messages - Array of messages
   * @returns {Object} Statistics object
   */
  calculateStats(messages) {
    if (!messages || !Array.isArray(messages)) {
      return {
        total: 0,
        new: 0,
        read: 0,
        replied: 0,
        newlyReplied: 0,
        closed: 0
      }
    }

    return {
      total: messages.length,
      new: messages.filter(m => m.status === 'new').length,
      read: messages.filter(m => m.status === 'read').length,
      replied: messages.filter(m => m.status === 'replied').length,
      newlyReplied: messages.filter(m => m.status === 'newlyReplied').length,
      closed: messages.filter(m => m.status === 'closed').length
    }
  }

  /**
   * Get count of new/unread messages (for badges)
   * @param {Array} messages - Array of messages
   * @returns {number} Count of new messages
   */
  getNewMessagesCount(messages) {
    if (!messages || !Array.isArray(messages)) return 0
    return messages.filter(m => m.status === 'new' || m.status === 'newlyReplied').length
  }

  /**
   * Check if message has unread replies for a specific role
   * @param {Object} message - Contact message
   * @param {string} role - 'admin' or 'user'
   * @returns {boolean}
   */
  hasUnreadReplies(message, role) {
    if (!message.discussion || message.discussion.length === 0) {
      return false
    }

    // For admin: check if there are unread messages from users
    // For user: check if there are unread messages from admin
    const targetRole = role === 'admin' ? 'user' : 'admin'

    return message.discussion.some(
      reply => (reply.role === targetRole || (targetRole === 'user' && reply.role !== 'admin')) && reply.status === 'new'
    )
  }

  /**
   * Get unread replies from discussion
   * @param {Object} message - Contact message
   * @param {string} fromRole - Role to get unread messages from ('admin' or 'user')
   * @returns {Array} Array of unread replies
   */
  getUnreadReplies(message, fromRole) {
    if (!message.discussion || message.discussion.length === 0) {
      return []
    }

    if (fromRole === 'admin') {
      return message.discussion.filter(
        reply => reply.role === 'admin' && reply.status === 'new'
      )
    }

    // For user messages (not admin)
    return message.discussion.filter(
      reply => reply.role !== 'admin' && reply.status === 'new'
    )
  }

  /**
   * Check if user can reply to a message
   * @param {Object} message - Contact message
   * @returns {{ canReply: boolean, reason: string|null }}
   */
  canReplyToMessage(message) {
    if (message.status === 'closed') {
      return { canReply: false, reason: 'This conversation is closed. No more replies can be added.' }
    }

    return { canReply: true, reason: null }
  }

  /**
   * Check if admin can reply to a message (registered user check)
   * @param {Object} message - Contact message
   * @returns {{ canReply: boolean, reason: string|null }}
   */
  canAdminReply(message) {
    if (message.status === 'closed') {
      return { canReply: false, reason: 'This conversation is closed. No more replies can be added.' }
    }

    if (!message.userId || message.userId === 'deleted-user') {
      return {
        canReply: false,
        reason: 'Unregistered user. Please contact them by email or phone.'
      }
    }

    return { canReply: true, reason: null }
  }

  /**
   * Get reply count for a message
   * @param {Object} message - Contact message
   * @returns {number}
   */
  getReplyCount(message) {
    return message.discussion?.length || 0
  }

  /**
   * Sort messages by date (most recent first)
   * @param {Array} messages - Array of messages
   * @returns {Array} Sorted messages
   */
  sortByDate(messages, ascending = false) {
    if (!messages || !Array.isArray(messages)) return []

    return [...messages].sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return ascending ? dateA - dateB : dateB - dateA
    })
  }

  /**
   * Validate contact form data
   * @param {Object} data - Form data
   * @returns {{ isValid: boolean, errors: Object }}
   */
  validateContactForm(data) {
    return validateContactForm(data)
  }

  /**
   * Validate reply text
   * @param {string} text - Reply text
   * @param {number} maxLength - Max length
   * @returns {{ isValid: boolean, error: string|null }}
   */
  validateReply(text, maxLength = 1000) {
    return validateReply(text, maxLength)
  }

  /**
   * Check if contact form is complete
   * @param {Object} data - Form data
   * @returns {boolean}
   */
  isContactFormComplete(data) {
    return isContactFormComplete(data)
  }
}

// Export singleton instance
export default new ContactService()
