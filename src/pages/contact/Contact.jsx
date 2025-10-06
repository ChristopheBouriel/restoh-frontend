import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useContactsStore from '../../store/contactsStore'

const Contact = () => {
  const { createMessage, isLoading } = useContactsStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    contactReason: 'general'
  })


  const contactReasons = [
    { value: 'general', label: 'Demande générale' },
    { value: 'reservation', label: 'Réservation' },
    { value: 'catering', label: 'Traiteur' },
    { value: 'complaint', label: 'Réclamation' },
    { value: 'compliment', label: 'Compliment' },
    { value: 'job', label: 'Candidature' }
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
      errors.push('Le nom est obligatoire')
    }
    
    if (!formData.email.trim()) {
      errors.push('L\'email est obligatoire')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('L\'email n\'est pas valide')
    }
    
    if (!formData.subject.trim()) {
      errors.push('L\'objet est obligatoire')
    }
    
    if (!formData.message.trim()) {
      errors.push('Le message est obligatoire')
    } else if (formData.message.trim().length < 10) {
      errors.push('Le message doit contenir au moins 10 caractères')
    }
    
    return errors
  }

  // Vérifier si le formulaire est valide pour activer/désactiver le bouton
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
      // Envoyer le message via le store
      const result = await createMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: `${contactReasons.find(r => r.value === formData.contactReason)?.label} - ${formData.subject}`,
        message: formData.message
      })
      
      if (result.success) {
        toast.success('Message envoyé avec succès ! Nous vous répondrons rapidement.')
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          contactReason: 'general'
        })
      } else {
        toast.error('Erreur lors de l\'envoi du message. Veuillez réessayer.')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message. Veuillez réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contactez-nous</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une question ? Une suggestion ? Nous sommes là pour vous écouter et vous aider.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de contact */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Nos coordonnées
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Adresse</h3>
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
                    <h3 className="font-medium text-gray-900">Téléphone</h3>
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
            
            {/* Horaires */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2" />
                Horaires d'ouverture
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lundi - Vendredi</span>
                  <span className="font-medium">11h30 - 14h30<br />18h30 - 22h30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Samedi</span>
                  <span className="font-medium">12h00 - 23h00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimanche</span>
                  <span className="font-medium">12h00 - 22h00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2" />
                Envoyez-nous un message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6" role="form">
                {/* Raison du contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif de contact
                  </label>
                  <select
                    name="contactReason"
                    value={formData.contactReason}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {contactReasons.map(reason => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Votre nom"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="01 23 45 67 89"
                  />
                </div>

                {/* Objet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objet *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="L'objet de votre message"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Votre message..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.message.length} caractères (minimum 10)
                  </p>
                </div>

                {/* Bouton submit */}
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
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  * Champs obligatoires
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Section FAQ rapide */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Questions fréquentes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Comment réserver une table ?
                </h3>
                <p className="text-gray-600 text-sm">
                  Vous pouvez réserver directement en ligne via notre page de réservations ou nous appeler au 01 42 34 56 78.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Proposez-vous la livraison ?
                </h3>
                <p className="text-gray-600 text-sm">
                  Oui, nous livrons dans un rayon de 5km autour du restaurant. Commandez en ligne ou par téléphone.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Avez-vous des options végétariennes ?
                </h3>
                <p className="text-gray-600 text-sm">
                  Absolument ! Notre carte propose de nombreuses options végétariennes et véganes. Consultez notre menu en ligne.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Puis-je annuler ma commande ?
                </h3>
                <p className="text-gray-600 text-sm">
                  Les commandes peuvent être annulées gratuitement jusqu'à 15 minutes après la confirmation.
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