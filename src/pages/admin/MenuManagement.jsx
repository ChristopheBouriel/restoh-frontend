import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  X,
  Star,
  StarOff,
  ChefHat,
  RotateCcw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useMenu } from '../../hooks/useMenu'
import { MenuService } from '../../services/menu'
import ImageWithFallback from '../../components/common/ImageWithFallback'
import SimpleSelect from '../../components/common/SimpleSelect'
import ImageUpload from '../../components/common/ImageUpload'

const MenuManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null) // 'suggested', 'excluded', 'popular' or null

  // Use centralized menu hook
  const {
    items: menuItems,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    toggleAvailability,
    togglePopularOverride,
    resetAllPopularOverrides,
    toggleSuggested
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

  // Use MenuService for filtering logic
  const filteredItems = useMemo(() => {
    // First filter by category if needed
    let filtered = selectedCategory !== 'all'
      ? MenuService.filter(menuItems, { category: selectedCategory })
      : menuItems

    // Then search if there's a search term
    if (searchTerm) {
      filtered = MenuService.search(filtered, searchTerm)
    }

    // Apply active filter
    if (activeFilter === 'suggested') {
      filtered = filtered.filter(item => item.isSuggested)
    } else if (activeFilter === 'excluded') {
      filtered = filtered.filter(item => item.isPopularOverride)
    } else if (activeFilter === 'popular') {
      filtered = filtered.filter(item => item.isPopular && !item.isPopularOverride)
    }

    return filtered
  }, [menuItems, searchTerm, selectedCategory, activeFilter])

  // Toggle filter chip (only one active at a time)
  const toggleFilter = (filter) => {
    setActiveFilter(prev => prev === filter ? null : filter)
  }

  // Count items for filter badges
  const filterCounts = useMemo(() => ({
    suggested: menuItems.filter(item => item.isSuggested).length,
    excluded: menuItems.filter(item => item.isPopularOverride).length,
    popular: menuItems.filter(item => item.isPopular && !item.isPopularOverride).length
  }), [menuItems])

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

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

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
      const result = await updateItem(editingItem.id, itemData)
      if (result.success) {
        toast.success('Item updated successfully!')
      } else {
        toast.error('Error updating item')
      }
    } else {
      const result = await addItem(itemData)
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

  const handleTogglePopularOverride = async (id, name) => {
    const result = await togglePopularOverride(id)
    if (result.success) {
      const isExcluded = result.item?.isPopularOverride
      toast.success(`${name} ${isExcluded ? 'excluded from' : 'included in'} popular items`)
    } else {
      toast.error(result.error || 'Error updating popular status')
    }
  }

  const handleResetAllPopularOverrides = async () => {
    if (filterCounts.excluded === 0) {
      toast.error('No items to reset')
      return
    }
    if (window.confirm(`Reset all ${filterCounts.excluded} excluded items to be included in popular calculation?`)) {
      const result = await resetAllPopularOverrides()
      if (result.success) {
        toast.success(`${result.count || filterCounts.excluded} items reset`)
      } else {
        toast.error(result.error || 'Error resetting popular overrides')
      }
    }
  }

  const handleToggleSuggested = async (id, name) => {
    const result = await toggleSuggested(id)
    if (result.success) {
      const isSuggested = result.item?.isSuggested
      toast.success(`${name} ${isSuggested ? 'added to' : 'removed from'} suggestions`)
    } else {
      toast.error(result.error || 'Error updating suggestion status')
    }
  }

  const getCategoryLabel = (category) => {
    return categories.find(cat => cat.value === category)?.label || category
  }

  const getCuisineStyle = (cuisine) => {
    const styles = {
      asian: { bg: 'bg-terracotta-100', text: 'text-terracotta-700', label: 'Asian' },
      lao: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Lao' },
      continental: { bg: 'bg-brown-100', text: 'text-brown-700', label: 'Continental' }
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
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-brown-400">
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
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-brown-400">
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

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Quick filters:</span>

          <button
            onClick={() => toggleFilter('suggested')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'suggested'
                ? 'bg-brown-600 text-white'
                : 'bg-brown-100 text-brown-700 hover:bg-brown-200'
            }`}
          >
            <ChefHat size={14} />
            <span>Suggested ({filterCounts.suggested})</span>
          </button>

          <button
            onClick={() => toggleFilter('popular')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'popular'
                ? 'bg-apricot-600 text-white'
                : 'bg-apricot-100 text-apricot-700 hover:bg-apricot-200'
            }`}
          >
            <Star size={14} />
            <span>Popular ({filterCounts.popular})</span>
          </button>

          <button
            onClick={() => toggleFilter('excluded')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'excluded'
                ? 'bg-brown-600 text-white'
                : 'bg-brown-100 text-brown-700 hover:bg-brown-200'
            }`}
          >
            <StarOff size={14} />
            <span>Excluded ({filterCounts.excluded})</span>
          </button>

          {filterCounts.excluded > 0 && (
            <button
              onClick={handleResetAllPopularOverrides}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-terracotta-600 text-white hover:bg-terracotta-700 transition-colors ml-2"
              title="Reset all excluded items"
            >
              <RotateCcw size={14} />
              <span>Reset Exclusions</span>
            </button>
          )}

          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={14} />
              <span>Clear filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Liste des articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-brown-400">
            <div className="relative">
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex flex-wrap gap-1 max-w-[60%] justify-end">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border-2 ${
                  item.isAvailable
                    ? 'bg-white border-primary-500 text-primary-500'
                    : 'bg-terracotta-200 text-terracotta-800 border-terracotta-200'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                {item.isVegetarian && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-white border-2 border-emerald-700 text-emerald-700">
                    🌱 Veg
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
                      <span key={idx} className="text-xs bg-cream-200 text-cream-800 px-2 py-1 rounded">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons - Row 1: Main actions */}
              <div className="flex space-x-2 mt-auto">
                <button
                  onClick={() => openEditModal(item)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md transition-colors border-2 ${
                    item.isAvailable
                      ? 'bg-terracotta-200 border-terracotta-200 text-terracotta-800 hover:bg-terracotta-300 hover:border-terracotta-300'
                      : 'bg-white border-primary-500 text-primary-500 hover:bg-primary-50'
                  }`}
                  title={item.isAvailable ? 'Disable' : 'Enable'}
                >
                  {item.isAvailable ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>

                <button
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Action buttons - Row 2: Popular & Suggestion toggles */}
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => handleToggleSuggested(item.id, item.name)}
                  className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    item.isSuggested
                      ? 'bg-brown-600 text-white hover:bg-brown-700'
                      : 'bg-brown-100 text-brown-700 hover:bg-brown-200'
                  }`}
                  title={item.isSuggested ? 'Remove from suggestions' : 'Add to suggestions'}
                >
                  <ChefHat size={16} />
                  <span className="text-xs">{item.isSuggested ? 'Suggested' : 'Suggest'}</span>
                </button>

                <button
                  onClick={() => handleTogglePopularOverride(item.id, item.name)}
                  className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    item.isPopularOverride
                      ? 'bg-brown-600 text-white hover:bg-brown-700'
                      : item.isPopular
                        ? 'bg-apricot-700 text-white hover:bg-apricot-800'
                        : 'bg-apricot-100 text-apricot-700 hover:bg-apricot-200'
                  }`}
                  title={item.isPopularOverride ? 'Include in popular' : 'Exclude from popular'}
                >
                  {item.isPopularOverride ? <StarOff size={16} /> : <Star size={16} />}
                  <span className="text-xs">{item.isPopularOverride ? 'Excluded' : 'Popular'}</span>
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-brown-400">
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
                    size="md"
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
                    size="md"
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