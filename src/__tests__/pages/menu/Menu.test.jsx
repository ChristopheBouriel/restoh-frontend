import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach, beforeAll } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Menu from '../../../pages/menu/Menu'
import { useMenu } from '../../../hooks/useMenu'
import { useCart } from '../../../hooks/useCart'

// Mock menuApi to prevent real API calls
vi.mock('../../../api/menuApi', () => ({
  getMenuItems: vi.fn(),
  getCategories: vi.fn(),
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  deleteMenuItem: vi.fn()
}))

// Mock reviewsApi to prevent real API calls for rating stats
vi.mock('../../../api/reviewsApi', () => ({
  getMenuItemRatingStats: vi.fn(),
  getMenuItemReviews: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn()
}))

// Mock authStore to provide user state
vi.mock('../../../store/authStore', () => ({
  default: vi.fn(() => ({
    user: null,
    isAuthenticated: false
  }))
}))

// Get mocked API functions
let mockGetMenuItems, mockGetCategories, mockGetMenuItemRatingStats, mockGetMenuItemReviews, mockCreateReview, mockUpdateReview, mockDeleteReview, mockUseAuthStore
beforeAll(async () => {
  const menuApi = await import('../../../api/menuApi')
  const reviewsApi = await import('../../../api/reviewsApi')
  const authStore = await import('../../../store/authStore')

  mockGetMenuItems = menuApi.getMenuItems
  mockGetCategories = menuApi.getCategories
  mockGetMenuItemRatingStats = reviewsApi.getMenuItemRatingStats
  mockGetMenuItemReviews = reviewsApi.getMenuItemReviews
  mockCreateReview = reviewsApi.createReview
  mockUpdateReview = reviewsApi.updateReview
  mockDeleteReview = reviewsApi.deleteReview
  mockUseAuthStore = authStore.default
})

// Mock data
const mockMenuItems = [
  {
    id: '1',
    name: 'Pizza Margherita',
    description: 'Pizza classique avec tomate et mozzarella',
    price: 12.50,
    image: 'pizza-margherita.jpg',
    category: 'pizza',
    cuisine: 'continental',
    preparationTime: 15,
    allergens: ['gluten', 'lactose'],
    isAvailable: true
  },
  {
    id: '2',
    name: 'Spaghetti Carbonara',
    description: 'Pâtes italiennes avec sauce crémeuse',
    price: 14.00,
    image: 'spaghetti-carbonara.jpg',
    category: 'pasta',
    cuisine: 'continental',
    preparationTime: 20,
    allergens: ['gluten', 'lactose'],
    isAvailable: true
  },
  {
    id: '3',
    name: 'Tiramisu',
    description: 'Dessert italien au café et mascarpone',
    price: 6.50,
    image: 'tiramisu.jpg',
    category: 'dessert',
    cuisine: 'continental',
    preparationTime: 5,
    allergens: ['lactose', 'oeufs'],
    isAvailable: true
  },
  {
    id: '4',
    name: 'Pizza Pepperoni',
    description: 'Pizza avec pepperoni et fromage',
    price: 15.50,
    image: 'pizza-pepperoni.jpg',
    category: 'pizza',
    cuisine: 'continental',
    preparationTime: 18,
    allergens: ['gluten'],
    isAvailable: true
  },
  {
    id: '5',
    name: 'Pad Thai',
    description: 'Nouilles sautées thaïlandaises',
    price: 13.50,
    image: 'pad-thai.jpg',
    category: 'main',
    cuisine: 'asian',
    preparationTime: 15,
    allergens: ['gluten'],
    isAvailable: true
  },
  {
    id: '6',
    name: 'Laap',
    description: 'Salade de viande hachée épicée laotienne',
    price: 11.00,
    image: 'laap.jpg',
    category: 'main',
    cuisine: 'lao',
    preparationTime: 20,
    allergens: [],
    isAvailable: true
  }
]

const mockCategories = [
  { id: 'pizza', name: 'Pizzas' },
  { id: 'pasta', name: 'Pâtes' },
  { id: 'dessert', name: 'Desserts' }
]

// Mock hooks
vi.mock('../../../hooks/useMenu')
vi.mock('../../../hooks/useCart')

// Mock SimpleSelect to be a native select for easier testing
vi.mock('../../../components/common/SimpleSelect', () => ({
  default: ({ value, onChange, options, className }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="simple-select"
      className={className}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}))

// Mock ImageWithFallback component (avoid image loading issues)
vi.mock('../../../components/common/ImageWithFallback', () => ({
  default: ({ alt }) => <div data-testid="menu-item-image">{alt}</div>
}))

const mockAddItem = vi.fn()

// Test wrapper component
const MenuWrapper = () => (
  <MemoryRouter initialEntries={['/menu']}>
    <Menu />
  </MemoryRouter>
)

describe('Menu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock API responses to prevent real backend calls
    mockGetMenuItems.mockResolvedValue({
      success: true,
      data: mockMenuItems
    })

    mockGetCategories.mockResolvedValue({
      success: true,
      data: mockCategories
    })

    // Mock reviews API to prevent backend calls
    mockGetMenuItemRatingStats.mockResolvedValue({
      success: true,
      data: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    })

    mockGetMenuItemReviews.mockResolvedValue({
      success: true,
      data: []
    })

    // Default mock setup
    vi.mocked(useMenu).mockReturnValue({
      items: mockMenuItems,
      categories: mockCategories,
      isLoading: false
    })

    vi.mocked(useCart).mockReturnValue({
      addItem: mockAddItem
    })
  })

  // 1. RENDU DE BASE (3 tests)
  test('should render menu header and description', () => {
    render(<MenuWrapper />)
    
    expect(screen.getByText('Our Menu')).toBeInTheDocument()
    expect(screen.getByText(/Discover our selection of dishes prepared with fresh, quality ingredients/)).toBeInTheDocument()
  })

  test('should render search and filter controls', () => {
    render(<MenuWrapper />)

    expect(screen.getByPlaceholderText('Search for a dish...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All dishes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All cuisines')).toBeInTheDocument()
    // The default sort option has value='name' but label='Sort by price' (seems like a bug in Menu.jsx but testing what's actually there)
    expect(screen.getByDisplayValue('Sort by price')).toBeInTheDocument()
  })

  test('should display menu items with essential information', () => {
    render(<MenuWrapper />)
    
    // Check that all items are displayed
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiramisu', level: 3 })).toBeInTheDocument()
    
    // Check prices are formatted correctly
    expect(screen.getByText('€12.50')).toBeInTheDocument()
    expect(screen.getByText('€14.00')).toBeInTheDocument()
    expect(screen.getByText('€6.50')).toBeInTheDocument()
    
    // Check add to cart buttons are present
    const addButtons = screen.getAllByText('Add to cart')
    expect(addButtons).toHaveLength(6)
  })

  // 2. FONCTIONNALITÉS DE RECHERCHE (3 tests)
  test('should filter items by name when user searches', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Search for a dish...')
    await user.type(searchInput, 'pizza')
    
    // Should show pizza items
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pizza Pepperoni', level: 3 })).toBeInTheDocument()
    
    // Should not show other items
    expect(screen.queryByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tiramisu', level: 3 })).not.toBeInTheDocument()
  })

  test('should filter items by description when user searches', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Search for a dish...')
    await user.type(searchInput, 'italien')
    
    // Should show items with "italien" in description
    expect(screen.getByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiramisu', level: 3 })).toBeInTheDocument()
    
    // Should not show pizza items
    expect(screen.queryByRole('heading', { name: 'Pizza Margherita', level: 3 })).not.toBeInTheDocument()
  })

  test('should be case insensitive when searching', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Search for a dish...')
    await user.type(searchInput, 'PIZZA')
    
    // Should still find pizza items despite uppercase
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pizza Pepperoni', level: 3 })).toBeInTheDocument()
  })

  // 3. FILTRAGE PAR CATÉGORIE (2 tests)
  test('should filter by category when user selects option', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    const categorySelect = screen.getByDisplayValue('All dishes')
    await user.selectOptions(categorySelect, 'pizza')

    // Should show only pizza items
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pizza Pepperoni', level: 3 })).toBeInTheDocument()
    
    // Should not show other categories
    expect(screen.queryByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tiramisu', level: 3 })).not.toBeInTheDocument()
  })

  test('should show all items when "All dishes" is selected', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    const categorySelect = screen.getByDisplayValue('All dishes')

    // First filter by pizza
    await user.selectOptions(categorySelect, 'pizza')
    expect(screen.queryByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).not.toBeInTheDocument()

    // Then switch back to all
    await user.selectOptions(categorySelect, 'all')

    // Should show all items again
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiramisu', level: 3 })).toBeInTheDocument()
  })

  // 4. FILTRAGE PAR CUISINE (4 tests)
  test('should filter by cuisine when user selects Asian', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    const cuisineSelect = screen.getByDisplayValue('All cuisines')
    await user.selectOptions(cuisineSelect, 'asian')

    // Should show only Asian items
    expect(screen.getByRole('heading', { name: 'Pad Thai', level: 3 })).toBeInTheDocument()

    // Should not show continental or lao items
    expect(screen.queryByRole('heading', { name: 'Pizza Margherita', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Laap', level: 3 })).not.toBeInTheDocument()
  })

  test('should filter by cuisine when user selects Lao', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    const cuisineSelect = screen.getByDisplayValue('All cuisines')
    await user.selectOptions(cuisineSelect, 'lao')

    // Should show only Lao items
    expect(screen.getByRole('heading', { name: 'Laap', level: 3 })).toBeInTheDocument()

    // Should not show other cuisines
    expect(screen.queryByRole('heading', { name: 'Pizza Margherita', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pad Thai', level: 3 })).not.toBeInTheDocument()
  })

  test('should filter by cuisine when user selects Continental', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    const cuisineSelect = screen.getByDisplayValue('All cuisines')
    await user.selectOptions(cuisineSelect, 'continental')

    // Should show only Continental items
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiramisu', level: 3 })).toBeInTheDocument()

    // Should not show Asian or Lao items
    expect(screen.queryByRole('heading', { name: 'Pad Thai', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Laap', level: 3 })).not.toBeInTheDocument()
  })

  test('should show cuisine badge on menu items', () => {
    render(<MenuWrapper />)

    // Check that cuisine badges are displayed (appear in both selects and badges)
    expect(screen.getAllByText('Continental').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Asian').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lao').length).toBeGreaterThan(0)
  })

  // 5. FONCTIONNALITÉS DE TRI (2 tests)
  test('should sort by price ascending when selected', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    const sortSelect = screen.getByDisplayValue('Sort by price')
    await user.selectOptions(sortSelect, 'price-asc')

    // Check prices appear in ascending order
    const prices = screen.getAllByText(/€\d+\.\d+/).map(el =>
      parseFloat(el.textContent.replace('€', ''))
    )

    // Should be sorted: 6.50, 11.00, 12.50, 13.50, 14.00, 15.50
    expect(prices[0]).toBe(6.50) // Tiramisu
    expect(prices[1]).toBe(11.00) // Laap
    expect(prices[2]).toBe(12.50) // Pizza Margherita
    expect(prices[3]).toBe(13.50) // Pad Thai
    expect(prices[4]).toBe(14.00) // Spaghetti Carbonara
    expect(prices[5]).toBe(15.50) // Pizza Pepperoni
  })

  test('should sort by price descending when selected', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    const sortSelect = screen.getByDisplayValue('Sort by price')
    await user.selectOptions(sortSelect, 'price-desc')

    // Check prices appear in descending order
    const prices = screen.getAllByText(/€\d+\.\d+/).map(el =>
      parseFloat(el.textContent.replace('€', ''))
    )

    // Should be sorted: 15.50, 14.00, 13.50, 12.50, 11.00, 6.50
    expect(prices[0]).toBe(15.50) // Pizza Pepperoni
    expect(prices[1]).toBe(14.00) // Spaghetti Carbonara
    expect(prices[2]).toBe(13.50) // Pad Thai
    expect(prices[3]).toBe(12.50) // Pizza Margherita
    expect(prices[4]).toBe(11.00) // Laap
    expect(prices[5]).toBe(6.50) // Tiramisu
  })

  // 6. INTERACTION PANIER (1 test)
  test('should call addItem when user clicks add to cart button', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    const addButtons = screen.getAllByText('Add to cart')
    await user.click(addButtons[0])

    expect(mockAddItem).toHaveBeenCalledTimes(1)
    expect(mockAddItem).toHaveBeenCalledWith(mockMenuItems[0])
  })

  // 7. FILTRES COMBINÉS (1 test)
  test('should combine search and category filters correctly', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    // Search for "pizza" and filter by pizza category
    const searchInput = screen.getByPlaceholderText('Search for a dish...')
    const categorySelect = screen.getByDisplayValue('All dishes')

    await user.type(searchInput, 'pizza')
    await user.selectOptions(categorySelect, 'pizza')

    // Should show pizza items that match both filters
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pizza Pepperoni', level: 3 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).not.toBeInTheDocument()
  })

  // 8. ÉTATS SPÉCIAUX (3 tests)
  test('should show loading state when isLoading is true', () => {
    vi.mocked(useMenu).mockReturnValue({
      items: [],
      categories: [],
      isLoading: true
    })
    
    render(<MenuWrapper />)
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    
    // Should not show main content
    expect(screen.queryByPlaceholderText('Search for a dish...')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pizza Margherita', level: 3 })).not.toBeInTheDocument()
  })

  test('should show empty state when no items match filters', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Search for a dish...')
    await user.type(searchInput, 'nonexistentdish')
    
    // Should show empty state message
    expect(screen.getByText('🔍')).toBeInTheDocument()
    expect(screen.getByText('No dishes found')).toBeInTheDocument()
    expect(screen.getByText(/Try modifying your search criteria or filters/)).toBeInTheDocument()
    expect(screen.getByText('Reset filters')).toBeInTheDocument()
  })

  test('should reset all filters when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)

    // Apply filters first
    const searchInput = screen.getByPlaceholderText('Search for a dish...')
    const categorySelect = screen.getByDisplayValue('All dishes')
    const sortSelect = screen.getByDisplayValue('Sort by price')

    await user.type(searchInput, 'pizza')
    await user.selectOptions(categorySelect, 'pasta')
    await user.selectOptions(sortSelect, 'price-desc')

    // Search for something that doesn't exist to show empty state
    await user.clear(searchInput)
    await user.type(searchInput, 'nonexistent')

    // Click reset button
    const resetButton = screen.getByText('Reset filters')
    await user.click(resetButton)

    // All filters should be reset to default values
    expect(searchInput).toHaveValue('')
    expect(categorySelect).toHaveValue('all')
    expect(sortSelect).toHaveValue('name')

    // All items should be visible again
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiramisu', level: 3 })).toBeInTheDocument()
  })

  // 8. CONTENU INFORMATIONNEL (1 test)
  test('should display information section with delivery and allergy info', () => {
    render(<MenuWrapper />)

    expect(screen.getByText('Important information')).toBeInTheDocument()
    expect(screen.getByText(/Delivery:/)).toBeInTheDocument()
    expect(screen.getByText(/Free from 25€/)).toBeInTheDocument()
    expect(screen.getByText(/Allergies:/)).toBeInTheDocument()
    expect(screen.getByText(/Inform us of your allergies/)).toBeInTheDocument()
  })

  // 9. REVIEWS FUNCTIONALITY (New tests for review system)
  describe('Reviews Functionality', () => {
    test('should display rating stats on menu item cards', async () => {
      // Mock rating stats for first item
      mockGetMenuItemRatingStats.mockImplementation((itemId) => {
        if (itemId === '1') {
          return Promise.resolve({
            success: true,
            data: {
              averageRating: 4.5,
              reviewCount: 10,
              ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }
            }
          })
        }
        return Promise.resolve({
          success: true,
          data: {
            averageRating: 0,
            reviewCount: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }
        })
      })

      render(<MenuWrapper />)

      // Wait for rating stats to load
      await waitFor(() => {
        // Check for reviews text in format "(10 reviews)"
        expect(screen.getByText(/\(10 reviews\)/)).toBeInTheDocument()
      })
    })

    test('should display "No reviews yet" for items without reviews', async () => {
      render(<MenuWrapper />)

      await waitFor(() => {
        // At least one item should show "No reviews yet"
        const noReviewsElements = screen.getAllByText('No reviews yet')
        expect(noReviewsElements.length).toBeGreaterThan(0)
      })
    })

    test('should open modal when clicking on menu item image', async () => {
      const user = userEvent.setup()
      render(<MenuWrapper />)

      // Find the first menu item card by looking for the item name
      const pizzaMargheritaElements = screen.getAllByText('Pizza Margherita')
      const pizzaMargherita = pizzaMargheritaElements[0]
      const card = pizzaMargherita.closest('.bg-white')

      // Find the image container (has cursor-pointer class) within the card
      const imageContainer = card.querySelector('.cursor-pointer')

      // Click the image to open modal
      await user.click(imageContainer)

      // Modal should be visible with item details
      await waitFor(() => {
        const allPizzaTitles = screen.getAllByText('Pizza Margherita')
        expect(allPizzaTitles.length).toBeGreaterThan(1) // Card + modal header
      })
    })

    test('should display reviews in modal when item is selected', async () => {
      const user = userEvent.setup()

      const mockReviews = [
        {
          id: 'review-1',
          userId: 'user-1',
          userName: 'John Doe',
          rating: 5,
          comment: 'Excellent pizza!',
          createdAt: new Date().toISOString()
        },
        {
          id: 'review-2',
          userId: 'user-2',
          userName: 'Jane Smith',
          rating: 4,
          comment: 'Very good!',
          createdAt: new Date().toISOString()
        }
      ]

      // Mock reviews for selected item
      mockGetMenuItemReviews.mockResolvedValue({
        success: true,
        data: mockReviews
      })

      render(<MenuWrapper />)

      // Click on first menu item to open modal
      const pizzaMargheritaElements = screen.getAllByText('Pizza Margherita')
      const pizzaMargherita = pizzaMargheritaElements[0]
      const card = pizzaMargherita.closest('.bg-white')
      const imageContainer = card.querySelector('.cursor-pointer')
      await user.click(imageContainer)

      // Wait for reviews to load in modal
      await waitFor(() => {
        expect(screen.getByText('Customer Reviews')).toBeInTheDocument()
        expect(screen.getByText('Excellent pizza!')).toBeInTheDocument()
        expect(screen.getByText('Very good!')).toBeInTheDocument()
      })
    })

    test('should display "No reviews yet" message in modal when no reviews', async () => {
      const user = userEvent.setup()

      // Mock empty reviews
      mockGetMenuItemReviews.mockResolvedValue({
        success: true,
        data: []
      })

      render(<MenuWrapper />)

      // Click on menu item
      const pizzaMargheritaElements = screen.getAllByText('Pizza Margherita')
      const pizzaMargherita = pizzaMargheritaElements[0]
      const card = pizzaMargherita.closest('.bg-white')
      const imageContainer = card.querySelector('.cursor-pointer')
      await user.click(imageContainer)

      // Should show empty state message
      await waitFor(() => {
        expect(screen.getAllByText('No reviews yet').length).toBeGreaterThan(0)
        expect(screen.getByText('Be the first to review this dish!')).toBeInTheDocument()
      })
    })

    test('should show "Write a Review" button for authenticated users', async () => {
      const user = userEvent.setup()

      // Mock authenticated user
      mockUseAuthStore.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        isAuthenticated: true
      })

      mockGetMenuItemReviews.mockResolvedValue({
        success: true,
        data: []
      })

      render(<MenuWrapper />)

      // Open modal
      const pizzaMargheritaElements = screen.getAllByText('Pizza Margherita')
      const pizzaMargherita = pizzaMargheritaElements[0]
      const card = pizzaMargherita.closest('.bg-white')
      const imageContainer = card.querySelector('.cursor-pointer')
      await user.click(imageContainer)

      // Should show "Write a Review" button
      await waitFor(() => {
        expect(screen.getByText('Write a Review')).toBeInTheDocument()
      })
    })

    test('should show login message for non-authenticated users', async () => {
      const user = userEvent.setup()

      // Mock non-authenticated user (default)
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false
      })

      mockGetMenuItemReviews.mockResolvedValue({
        success: true,
        data: []
      })

      render(<MenuWrapper />)

      // Open modal
      const pizzaMargheritaElements = screen.getAllByText('Pizza Margherita')
      const pizzaMargherita = pizzaMargheritaElements[0]
      const card = pizzaMargherita.closest('.bg-white')
      const imageContainer = card.querySelector('.cursor-pointer')
      await user.click(imageContainer)

      // Should show login message instead of review button
      await waitFor(() => {
        expect(screen.getByText('Please login to write a review')).toBeInTheDocument()
        expect(screen.queryByText('Write a Review')).not.toBeInTheDocument()
      })
    })

    test('should close modal when clicking close button', async () => {
      const user = userEvent.setup()

      mockGetMenuItemReviews.mockResolvedValue({
        success: true,
        data: []
      })

      render(<MenuWrapper />)

      // Open modal
      const pizzaMargheritaElements = screen.getAllByText('Pizza Margherita')
      const pizzaMargherita = pizzaMargheritaElements[0]
      const card = pizzaMargherita.closest('.bg-white')
      const imageContainer = card.querySelector('.cursor-pointer')
      await user.click(imageContainer)

      // Modal should be open - verify modal content exists
      await waitFor(() => {
        expect(screen.getAllByText('Pizza Margherita').length).toBeGreaterThan(1)
      })

      // Find close button by looking for X icon in modal
      const closeButtons = Array.from(document.querySelectorAll('button'))
      const xButton = closeButtons.find(btn => {
        const svg = btn.querySelector('svg')
        return svg && btn.className.includes('text-gray-400')
      })

      expect(xButton).toBeTruthy()
      await user.click(xButton)

      // Modal should be closed - check that modal-specific content is gone
      await waitFor(() => {
        // Modal has specific text "No reviews yet" in modal body, cards also have it
        // But modal has "Be the first to review this dish!" which is unique to modal
        expect(screen.queryByText('Be the first to review this dish!')).not.toBeInTheDocument()
      })
    })
  })
})