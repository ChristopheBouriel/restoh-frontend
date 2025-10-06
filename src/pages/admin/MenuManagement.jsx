import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Filter,
  X,
  Upload
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useMenu } from '../../hooks/useMenu'
import ImageWithFallback from '../../components/common/ImageWithFallback'

const MenuManagement = () => {
  const [filteredItems, setFilteredItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Utiliser le hook de menu centralisé
  const {
    items: menuItems,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    toggleAvailability
  } = useMenu()
  const [formData, setFormData] = useState({
    name: '',
    category: 'plats',
    price: '',
    description: '',
    image: '',
    available: true,
    preparationTime: '',
    ingredients: '',
    allergens: ''
  })

  const categories = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'entrees', label: 'Entrées' },
    { value: 'plats', label: 'Plats' },
    { value: 'desserts', label: 'Desserts' },
    { value: 'boissons', label: 'Boissons' }
  ]

  // Supprimer loadMenuItems car le hook useMenu gère l'initialisation

  useEffect(() => {
    filterItems()
  }, [menuItems, searchTerm, selectedCategory])

  // Fonction loadMenuItems supprimée - gérée par useMenu

  const filterItems = () => {
    let filtered = menuItems

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredItems(filtered)
  }

  // saveToStorage supprimé - géré par useMenu

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'plats',
      price: '',
      description: '',
      image: '',
      available: true,
      preparationTime: '',
      ingredients: '',
      allergens: ''
    })
  }

  const openAddModal = () => {
    resetForm()
    setEditingItem(null)
    setShowModal(true)
  }

  const openEditModal = (item) => {
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image: item.image,
      available: item.available,
      preparationTime: item.preparationTime.toString(),
      ingredients: item.ingredients.join(', '),
      allergens: item.allergens.join(', ')
    })
    setEditingItem(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    resetForm()
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || !formData.description) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const itemData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description,
      image: formData.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      available: formData.available,
      preparationTime: parseInt(formData.preparationTime) || 10,
      ingredients: formData.ingredients.split(',').map(ing => ing.trim()).filter(ing => ing),
      allergens: formData.allergens.split(',').map(all => all.trim()).filter(all => all)
    }

    if (editingItem) {
      const result = updateItem(editingItem.id, itemData)
      if (result.success) {
        toast.success('Article modifié avec succès !')
      } else {
        toast.error('Erreur lors de la modification')
      }
    } else {
      const result = addItem(itemData)
      if (result.success) {
        toast.success('Article ajouté avec succès !')
      } else {
        toast.error('Erreur lors de l\'ajout')
      }
    }

    closeModal()
  }

  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      const result = deleteItem(id)
      if (result.success) {
        toast.success('Article supprimé')
      } else {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleToggleAvailability = (id) => {
    const result = toggleAvailability(id)
    if (result.success) {
      const item = result.item
      toast.success(`${item.name} ${item.available ? 'activé' : 'désactivé'}`)
    } else {
      toast.error('Erreur lors de la modification')
    }
  }

  const getCategoryLabel = (category) => {
    return categories.find(cat => cat.value === category)?.label || category
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="h-40 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du Menu</h1>
          <p className="text-gray-600">{filteredItems.length} articles • {menuItems.filter(item => item.available).length} disponibles</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nouvel article</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="relative">
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.available ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className="text-lg font-bold text-primary-600">€{item.price.toFixed(2)}</span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className="capitalize bg-gray-100 px-2 py-1 rounded">{getCategoryLabel(item.category)}</span>
                <span>{item.preparationTime} min</span>
              </div>

              {item.allergens.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Allergènes:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.map((allergen, idx) => (
                      <span key={idx} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 mt-auto">
                <button
                  onClick={() => openEditModal(item)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Edit size={16} />
                  <span>Modifier</span>
                </button>

                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    item.available
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {item.available ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>

                <button
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* État vide */}
      {filteredItems.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article trouvé</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par ajouter votre premier article au menu'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={openAddModal}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ajouter un article
            </button>
          )}
        </div>
      )}

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? 'Modifier l\'article' : 'Nouvel article'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'article *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Pizza Margherita"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="15.90"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temps de préparation (min)
                  </label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Décrivez le plat, ses ingrédients principaux..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingrédients (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tomates, Mozzarella, Basilic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergènes (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Gluten, Lactose"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({...formData, available: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="available" className="text-sm text-gray-700">
                  Article disponible
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingItem ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuManagement