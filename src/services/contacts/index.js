/**
 * Contacts Service Layer
 * Exports all contact-related services and validators
 */

export { default as ContactService } from './contactService'
export { CONTACT_STATUSES } from './contactService'

export {
  validateContactForm,
  isContactFormComplete,
  validateReply
} from './contactValidator'
