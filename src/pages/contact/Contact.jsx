import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useContactsStore from '../../store/contactsStore'
import { useAuth } from '../../hooks/useAuth'
import SimpleSelect from '../../components/common/SimpleSelect'
import { validationRules } from '../../utils/formValidators'

const Contact = () => {
  const navigate = useNavigate()
  const { createMessage, isLoading } = useContactsStore()
  const { user } = useAuth()
  const [messageSent, setMessageSent] = useState(false)
  const [contactReason, setContactReason] = useState('general')

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    }
  })

  // Watch message for character count
  const messageValue = watch('message', '')

  // Redirect admins to admin panel
  useEffect(() => {
    if (user?.role === 'admin') {
      toast.error('Admins should use the Contacts Management page')
      navigate('/admin/contacts')
    }
  }, [user, navigate])

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        subject: '',
        message: ''
      })
    }
  }, [user, reset])


  const contactReasons = [
    { value: 'general', label: 'General inquiry' },
    { value: 'reservation', label: 'Reservation' },
    { value: 'catering', label: 'Catering' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'compliment', label: 'Compliment' },
    { value: 'job', label: 'Job application' }
  ]

  const onSubmit = async (data) => {
    try {
      // Send message via store
      const result = await createMessage({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: `${contactReasons.find(r => r.value === contactReason)?.label} - ${data.subject}`,
        message: data.message
      })

      if (result.success) {
        // For registered users, show toast and reset form
        if (user) {
          toast.success('Message sent successfully! We will respond quickly.')
          reset({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            subject: '',
            message: ''
          })
          setContactReason('general')
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

              <div className="space-y-4">
                <div>
                  <div className="font-medium text-gray-900">Monday - Friday:</div>
                  <div className="text-gray-600 ml-4">11h00 - 14h30</div>
                  <div className="text-gray-600 ml-4">18h30 - 22h30</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Saturday - Sunday:</div>
                  <div className="text-gray-600 ml-4">11h00 - 22h30</div>
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
                      reset({
                        name: '',
                        email: '',
                        phone: '',
                        subject: '',
                        message: ''
                      })
                      setContactReason('general')
                    }}
                    className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" role="form">
                {/* Contact reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for contact
                  </label>
                  <SimpleSelect
                    options={contactReasons}
                    value={contactReason}
                    onChange={(value) => setContactReason(value)}
                    className="w-full"
                    size="md"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register('name', validationRules.name)}
                      className={`input-primary ${errors.name ? 'border-red-300' : ''}`}
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email', validationRules.email)}
                      className={`input-primary ${errors.email ? 'border-red-300' : ''}`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone', validationRules.phone)}
                    className={`input-primary ${errors.phone ? 'border-red-300' : ''}`}
                    placeholder="0612345678"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    id="subject"
                    type="text"
                    {...register('subject', validationRules.subject)}
                    className={`input-primary ${errors.subject ? 'border-red-300' : ''}`}
                    placeholder="The subject of your message"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    {...register('message', validationRules.message)}
                    rows={6}
                    className={`input-primary ${errors.message ? 'border-red-300' : ''}`}
                    placeholder="Your message..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {messageValue.length} characters (minimum 10)
                  </p>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !isValid}
                    className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                      isLoading || !isValid
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