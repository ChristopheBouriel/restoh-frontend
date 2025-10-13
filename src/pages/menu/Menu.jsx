import { useState, useMemo } from 'react'
import { Search, Filter } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useMenu } from '../../hooks/useMenu'
import ImageWithFallback from '../../components/common/ImageWithFallback'
import SimpleSelect from '../../components/common/SimpleSelect'

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const { addItem } = useCart()
  const { items: allMenuItems, categories: menuCategories, isLoading } = useMenu()

  const handleAddToCart = (item) => {
    addItem(item)
  }

  const getCuisineStyle = (cuisine) => {
    const styles = {
      asian: { bg: 'bg-red-100', text: 'text-red-700', label: 'Asian' },
      lao: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Lao' },
      continental: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Continental' }
    }
    return styles[cuisine] || styles.continental
  }

  const categories = [
    { id: 'all', name: 'All dishes' },
    ...menuCategories.map(cat => ({ id: cat.id, name: cat.name }))
  ]

  const cuisineTypes = [
    { id: 'all', name: 'All cuisines' },
    { id: 'asian', name: 'Asian' },
    { id: 'lao', name: 'Lao' },
    { id: 'continental', name: 'Continental' }
  ]

  // Filter and sort menu items (show all items, including unavailable)
  const filteredItems = useMemo(() => {
    let filtered = allMenuItems

    // Filter by cuisine type
    if (selectedCuisine !== 'all') {
      filtered = filtered.filter(item => item.cuisine === selectedCuisine)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort - prioritize available items first, then by selected sort
    filtered.sort((a, b) => {
      // First sort by availability (available items first)
      if (a.isAvailable !== b.isAvailable) {
        return b.isAvailable ? 1 : -1
      }

      // Then by selected sort option
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [allMenuItems, selectedCuisine, selectedCategory, searchTerm, sortBy])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our selection of dishes prepared with fresh, quality ingredients
          </p>
        </div>

        {/* Filters and search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a dish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter by cuisine type */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <SimpleSelect
                value={selectedCuisine}
                onChange={setSelectedCuisine}
                options={cuisineTypes.map(c => ({ value: c.id, label: c.name }))}
                className="min-w-[200px]"
              />
            </div>

            {/* Filter by category */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <SimpleSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                className="min-w-[200px]"
              />
            </div>

            {/* Sort */}
            <SimpleSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'name', label: 'Sort by name' },
                { value: 'price-asc', label: 'Price ascending' },
                { value: 'price-desc', label: 'Price descending' }
              ]}
              className="min-w-[180px]"
            />
          </div>
        </div>

        {/* Dishes grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col ${
                  !item.isAvailable ? 'opacity-60' : ''
                }`}
              >
                <div className="h-48 overflow-hidden relative">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className={`w-full h-full object-cover hover:scale-105 transition-transform duration-300 ${
                      !item.isAvailable ? 'grayscale' : ''
                    }`}
                  />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-lg font-semibold ${item.isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.name}
                    </h3>
                    <span className={`text-lg font-bold ${item.isAvailable ? 'text-primary-600' : 'text-gray-400'}`}>
                      €{item.price.toFixed(2)}
                    </span>
                  </div>

                  <p className={`text-sm mb-3 line-clamp-2 ${item.isAvailable ? 'text-gray-600' : 'text-gray-400'}`}>
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                        item.isAvailable
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-500 bg-gray-100'
                      }`}>
                        {item.category}
                      </span>
                      {item.cuisine && (() => {
                        const style = getCuisineStyle(item.cuisine)
                        return (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        )
                      })()}
                      {item.isVegetarian && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                          🌱
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${item.isAvailable ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.preparationTime} min
                    </span>
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

                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.isAvailable}
                    className={`w-full py-2 rounded-lg font-medium mt-auto transition-colors ${
                      item.isAvailable
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.isAvailable ? 'Add to cart' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dishes found</h3>
            <p className="text-gray-600 mb-6">
              Try modifying your search criteria or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSortBy('name')
              }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Additional information */}
        <div className="mt-12 bg-primary-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-3">
            Important information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary-800">
            <div>
              <strong>Delivery:</strong>
              <br />
              Free from 25€ - Average time 30-45 min
            </div>
            <div>
              <strong>Allergies:</strong>
              <br />
              Inform us of your allergies when ordering
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Menu