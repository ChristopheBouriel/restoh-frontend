/**
 * Validation rules for React Hook Form
 * Centralized validation configuration for all forms
 */

export const validationRules = {
  // Email validation
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },

  // Password validation (for login - just required)
  passwordRequired: {
    required: 'Password is required'
  },

  // Password validation (for registration/reset - with length)
  password: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters'
    }
  },

  // Name validation
  name: {
    required: 'Name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters'
    }
  },

  // Phone validation (optional field, validated only if provided)
  phone: {
    pattern: {
      value: /^(\+33|0)[1-9](\d{2}){4}$/,
      message: 'Invalid phone number format (ex: 0612345678)'
    }
  },

  // Phone required (for pickup orders)
  phoneRequired: {
    required: 'Phone number is required',
    pattern: {
      value: /^(\+33|0)[1-9](\d{2}){4}$/,
      message: 'Invalid phone number format (ex: 0612345678)'
    }
  },

  // Message/Textarea validation
  message: {
    required: 'Message is required',
    minLength: {
      value: 10,
      message: 'Message must be at least 10 characters'
    }
  },

  // Subject validation (for contact form)
  subject: {
    required: 'Subject is required'
  },

  // Address validation (for delivery)
  address: {
    required: 'Address is required for delivery'
  },

  // Guests validation (for reservations)
  guests: {
    required: 'Number of guests is required',
    min: {
      value: 1,
      message: 'At least 1 guest required'
    },
    max: {
      value: 20,
      message: 'Maximum 20 guests'
    }
  },

  // Date validation (for reservations)
  date: {
    required: 'Date is required'
  },

  // Time validation (for reservations)
  time: {
    required: 'Time is required'
  }
}

/**
 * Validate that password confirmation matches password
 * @param {string} confirmPassword - The confirmation password value
 * @param {string} password - The original password value
 * @returns {boolean|string} - true if valid, error message if invalid
 */
export const validatePasswordMatch = (confirmPassword, password) => {
  return confirmPassword === password || 'Passwords do not match'
}

/**
 * Create a conditional required rule
 * @param {boolean} condition - Whether the field is required
 * @param {string} message - Error message if required and empty
 * @returns {object|boolean} - Validation rule or false
 */
export const conditionalRequired = (condition, message = 'This field is required') => {
  return condition ? { required: message } : {}
}
