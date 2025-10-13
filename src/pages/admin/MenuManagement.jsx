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
import SimpleSelect from '../../components/common/SimpleSelect'
import ImageUpload from '../../components/common/ImageUpload'

const MenuManagement = () => {
  const [filteredItems, setFilteredItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Use centralized menu hook
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
    category: 'main',
    cuisine: 'continental',
    price: '',
    description: '',
    image: '',
    isAvailable: true,
    isVegetarian: false,
    preparationTime: '',
    ingredients: '',
    allergens: ''
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'appetizer', label: 'Appetizers' },
    { value: 'main', label: 'Main Courses' },
    { value: 'dessert', label: 'Desserts' },
    { value: 'beverage', label: 'Beverages' }
  ]

  const cuisines = [
    { value: 'asian', label: 'Asian' },
    { value: 'lao', label: 'Lao' },
    { value: 'continental', label: 'Continental' }
  ]

  // Remove loadMenuItems as useMenu hook handles initialization

  useEffect(() => {
    filterItems()
  }, [menuItems, searchTerm, selectedCategory])

  // loadMenuItems function removed - handled by useMenu

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

  // saveToStorage removed - handled by useMenu

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'main',
      cuisine: 'continental',
      price: '',
      description: '',
      image: '',
      isAvailable: true,
      isVegetarian: false,
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
      cuisine: item.cuisine || 'continental',
      price: item.price.toString(),
      description: item.description,
      image: item.image,
      isAvailable: item.isAvailable,
      isVegetarian: item.isVegetarian || false,
      preparationTime: item.preparationTime.toString(),
      ingredients: item.ingredients ? item.ingredients.join(', ') : '',
      allergens: item.allergens ? item.allergens.join(', ') : ''
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
      toast.error('Please fill in all required fields')
      return
    }

    // Validation: image is required for new items
    if (!editingItem && !formData.image) {
      toast.error('Please upload an image for the item')
      return
    }

    const itemData = {
      name: formData.name,
      category: formData.category,
      cuisine: formData.cuisine,
      price: parseFloat(formData.price),
      description: formData.description,
      image: formData.image, // Will be File object or existing URL string
      isAvailable: formData.isAvailable,
      isVegetarian: formData.isVegetarian,
      preparationTime: parseInt(formData.preparationTime) || 10,
      ingredients: formData.ingredients.split(',').map(ing => ing.trim()).filter(ing => ing),
      allergens: formData.allergens.split(',').map(all => all.trim()).filter(all => all)
    }

    if (editingItem) {
      const result = updateItem(editingItem.id, itemData)
      if (result.success) {
        toast.success('Item updated successfully!')
      } else {
        toast.error('Error updating item')
      }
    } else {
      const result = addItem(itemData)
      if (result.success) {
        toast.success('Item added successfully!')
      } else {
        toast.error('Error adding item')
      }
    }

    closeModal()
  }

  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const result = deleteItem(id)
      if (result.success) {
        toast.success('Item deleted')
      } else {
        toast.error('Error deleting item')
      }
    }
  }

  const handleToggleAvailability = (id) => {
    const result = toggleAvailability(id)
    if (result.success) {
      const item = result.item
      toast.success(`${item.name} ${item.isAvailable ? 'enabled' : 'disabled'}`)
    } else {
      toast.error('Error updating availability')
    }
  }

  const getCategoryLabel = (category) => {
    return categories.find(cat => cat.value === category)?.label || category
  }

  const getCuisineStyle = (cuisine) => {
    const styles = {
      asian: { bg: 'bg-red-100', text: 'text-red-700', label: 'Asian' },
      lao: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Lao' },
      continental: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Continental' }
    }
    return styles[cuisine] || styles.continental
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
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">{filteredItems.length} items • {menuItems.filter(item => item.isAvailable).length} available</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Item</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for an item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <SimpleSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories}
              className="min-w-[200px]"
            />
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
              <div className="absolute top-2 right-2 flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.isAvailable
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                {item.isVegetarian && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    🌱 Vegetarian
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className="text-lg font-bold text-primary-600">€{item.price.toFixed(2)}</span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded">{getCategoryLabel(item.category)}</span>
                  {item.cuisine && (() => {
                    const style = getCuisineStyle(item.cuisine)
                    return (
                      <span className={`px-2 py-1 rounded ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    )
                  })()}
                </div>
                <span>{item.preparationTime} min</span>
              </div>

              {item.allergens && item.allergens.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Allergens:</p>
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
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    item.isAvailable
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {item.isAvailable ? <EyeOff size={16} /> : <Eye size={16} />}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first menu item'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={openAddModal}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add an item
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
                  {editingItem ? 'Edit Item' : 'New Item'}
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
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Pizza Margherita"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <SimpleSelect
                    value={formData.category}
                    onChange={(value) => setFormData({...formData, category: value})}
                    options={categories.slice(1)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine Type *
                  </label>
                  <SimpleSelect
                    value={formData.cuisine}
                    onChange={(value) => setFormData({...formData, cuisine: value})}
                    options={cuisines}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (€) *
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
                    Preparation Time (min)
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
                  placeholder="Describe the dish, its main ingredients..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Image *
                </label>
                <ImageUpload
                  value={formData.image}
                  onChange={(file) => setFormData({...formData, image: file})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredients (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tomatoes, Mozzarella, Basil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergens (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Gluten, Lactose"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="text-sm font-medium text-gray-700">
                    Item available
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="vegetarian"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="vegetarian" className="text-sm font-medium text-gray-700">
                    Vegetarian dish
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingItem ? 'Update' : 'Add'}
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