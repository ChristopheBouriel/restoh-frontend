import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useContactsStore from '../../store/contactsStore'
import { useAuth } from '../../hooks/useAuth'
import SimpleSelect from '../../components/common/SimpleSelect'

const Contact = () => {
  const navigate = useNavigate()
  const { createMessage, isLoading } = useContactsStore()
  const { user } = useAuth()
  const [messageSent, setMessageSent] = useState(false)

  // Redirect admins to admin panel
  useEffect(() => {
    if (user?.role === 'admin') {
      toast.error('Admins should use the Contacts Management page')
      navigate('/admin/contacts')
    }
  }, [user, navigate])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    contactReason: 'general'
  })

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }))
    }
  }, [user])


  const contactReasons = [
    { value: 'general', label: 'General inquiry' },
    { value: 'reservation', label: 'Reservation' },
    { value: 'catering', label: 'Catering' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'compliment', label: 'Compliment' },
    { value: 'job', label: 'Job application' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.name.trim()) {
      errors.push('Name is required')
    }

    if (!formData.email.trim()) {
      errors.push('Email is required')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Email is not valid')
    }

    if (!formData.subject.trim()) {
      errors.push('Subject is required')
    }

    if (!formData.message.trim()) {
      errors.push('Message is required')
    } else if (formData.message.trim().length < 10) {
      errors.push('Message must contain at least 10 characters')
    }
    
    return errors
  }

  // Check if form is valid to enable/disable button
  const isFormValid = () => {
    return formData.name.trim() && 
           formData.email.trim() && 
           /\S+@\S+\.\S+/.test(formData.email) &&
           formData.subject.trim() && 
           formData.message.trim().length >= 10
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }
    
    try {
      // Send message via store
      const result = await createMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: `${contactReasons.find(r => r.value === formData.contactReason)?.label} - ${formData.subject}`,
        message: formData.message
      })
      
      if (result.success) {
        // For registered users, show toast and reset form
        if (user) {
          toast.success('Message sent successfully! We will respond quickly.')
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            subject: '',
            message: '',
            contactReason: 'general'
          })
        } else {
          // For unregistered users, show confirmation message
          setMessageSent(true)
        }
      } else {
        toast.error('Error sending message. Please try again.')
      }
    } catch (error) {
      toast.error('Error sending message. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-brown-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A question? A suggestion? We're here to listen and help you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Our contact information
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Address</h3>
                    <p className="text-gray-600 mt-1">
                      123 Rue de la Gastronomie<br />
                      75001 Paris, France
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Phone</h3>
                    <p className="text-gray-600 mt-1">01 42 34 56 78</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Email</h3>
                    <p className="text-gray-600 mt-1">contact@restoh.fr</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Opening hours */}
            <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2" />
                Opening hours
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium">11h30 - 14h30<br />18h30 - 22h30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium">12h00 - 23h00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium">12h00 - 22h00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2" />
                {messageSent && !user ? 'Message sent successfully!' : 'Send us a message'}
              </h2>

              {messageSent && !user ? (
                /* Success message for unregistered users */
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Thank you for your message!
                    </h3>
                    <p className="text-gray-700 mb-4">
                      We have received your message and will contact you shortly <strong>by email or phone</strong>.
                    </p>
                    <p className="text-sm text-gray-600">
                      Please check your inbox (including spam folder) for our response.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setMessageSent(false)
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        subject: '',
                        message: '',
                        contactReason: 'general'
                      })
                    }}
                    className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-6" role="form">
                {/* Contact reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for contact
                  </label>
                  <SimpleSelect
                    options={contactReasons}
                    value={formData.contactReason}
                    onChange={(value) => setFormData(prev => ({ ...prev, contactReason: value }))}
                    className="w-full"
                    size="md"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input-primary"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input-primary"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-primary"
                    placeholder="01 23 45 67 89"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="input-primary"
                    placeholder="The subject of your message"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="input-primary"
                    placeholder="Your message..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.message.length} characters (minimum 10)
                  </p>
                </div>

                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !isFormValid()}
                    className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                      isLoading || !isFormValid()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                    } transition-colors`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send message
                      </>
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  * Required fields
                </p>
              </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Frequently asked questions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  How to book a table?
                </h3>
                <p className="text-gray-600 text-sm">
                  You can book directly online via our reservations page or call us at 01 42 34 56 78.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Do you offer delivery?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes, we deliver within a 5km radius around the restaurant. Order online or by phone.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Do you have vegetarian options?
                </h3>
                <p className="text-gray-600 text-sm">
                  Absolutely! Our menu offers numerous vegetarian and vegan options. Check out our online menu.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Can I cancel my order?
                </h3>
                <p className="text-gray-600 text-sm">
                  Orders can be cancelled free of charge up to 15 minutes after confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact