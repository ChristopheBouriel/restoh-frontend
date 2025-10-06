import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Menu from '../../../pages/menu/Menu'
import { useMenu } from '../../../hooks/useMenu'
import { useCart } from '../../../hooks/useCart'

// Mock data
const mockMenuItems = [
  {
    id: '1',
    name: 'Pizza Margherita',
    description: 'Pizza classique avec tomate et mozzarella',
    price: 12.50,
    image: 'pizza-margherita.jpg',
    category: 'pizza',
    preparationTime: 15,
    allergens: ['gluten', 'lactose']
  },
  {
    id: '2',
    name: 'Spaghetti Carbonara',
    description: 'Pâtes italiennes avec sauce crémeuse',
    price: 14.00,
    image: 'spaghetti-carbonara.jpg',
    category: 'pasta',
    preparationTime: 20,
    allergens: ['gluten', 'lactose']
  },
  {
    id: '3',
    name: 'Tiramisu',
    description: 'Dessert italien au café et mascarpone',
    price: 6.50,
    image: 'tiramisu.jpg',
    category: 'dessert',
    preparationTime: 5,
    allergens: ['lactose', 'oeufs']
  },
  {
    id: '4',
    name: 'Pizza Pepperoni',
    description: 'Pizza avec pepperoni et fromage',
    price: 15.50,
    image: 'pizza-pepperoni.jpg',
    category: 'pizza',
    preparationTime: 18,
    allergens: ['gluten']
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
    
    // Default mock setup
    vi.mocked(useMenu).mockReturnValue({
      availableItems: mockMenuItems,
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
    
    expect(screen.getByText('Notre Menu')).toBeInTheDocument()
    expect(screen.getByText(/Découvrez notre sélection de plats préparés avec des ingrédients frais/)).toBeInTheDocument()
  })

  test('should render search and filter controls', () => {
    render(<MenuWrapper />)
    
    expect(screen.getByPlaceholderText('Rechercher un plat...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Tous les plats')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Trier par nom')).toBeInTheDocument()
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
    const addButtons = screen.getAllByText('Ajouter au panier')
    expect(addButtons).toHaveLength(4)
  })

  // 2. FONCTIONNALITÉS DE RECHERCHE (3 tests)
  test('should filter items by name when user searches', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Rechercher un plat...')
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
    
    const searchInput = screen.getByPlaceholderText('Rechercher un plat...')
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
    
    const searchInput = screen.getByPlaceholderText('Rechercher un plat...')
    await user.type(searchInput, 'PIZZA')
    
    // Should still find pizza items despite uppercase
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pizza Pepperoni', level: 3 })).toBeInTheDocument()
  })

  // 3. FILTRAGE PAR CATÉGORIE (2 tests)
  test('should filter by category when user selects option', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const categorySelect = screen.getByDisplayValue('Tous les plats')
    await user.selectOptions(categorySelect, 'pizza')
    
    // Should show only pizza items
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pizza Pepperoni', level: 3 })).toBeInTheDocument()
    
    // Should not show other categories
    expect(screen.queryByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tiramisu', level: 3 })).not.toBeInTheDocument()
  })

  test('should show all items when "Tous les plats" is selected', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const categorySelect = screen.getByDisplayValue('Tous les plats')
    
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

  // 4. FONCTIONNALITÉS DE TRI (2 tests)
  test('should sort by price ascending when selected', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const sortSelect = screen.getByDisplayValue('Trier par nom')
    await user.selectOptions(sortSelect, 'price-asc')
    
    // Check prices appear in ascending order
    const prices = screen.getAllByText(/€\d+\.\d+/).map(el => 
      parseFloat(el.textContent.replace('€', ''))
    )
    
    // Should be sorted: 6.50, 12.50, 14.00, 15.50
    expect(prices[0]).toBe(6.50) // Tiramisu
    expect(prices[1]).toBe(12.50) // Pizza Margherita
    expect(prices[2]).toBe(14.00) // Spaghetti Carbonara  
    expect(prices[3]).toBe(15.50) // Pizza Pepperoni
  })

  test('should sort by price descending when selected', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const sortSelect = screen.getByDisplayValue('Trier par nom')
    await user.selectOptions(sortSelect, 'price-desc')
    
    // Check prices appear in descending order
    const prices = screen.getAllByText(/€\d+\.\d+/).map(el => 
      parseFloat(el.textContent.replace('€', ''))
    )
    
    // Should be sorted: 15.50, 14.00, 12.50, 6.50
    expect(prices[0]).toBe(15.50) // Pizza Pepperoni
    expect(prices[1]).toBe(14.00) // Spaghetti Carbonara
    expect(prices[2]).toBe(12.50) // Pizza Margherita
    expect(prices[3]).toBe(6.50) // Tiramisu
  })

  // 5. INTERACTION PANIER (1 test)
  test('should call addItem when user clicks add to cart button', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const addButtons = screen.getAllByText('Ajouter au panier')
    await user.click(addButtons[0])
    
    expect(mockAddItem).toHaveBeenCalledTimes(1)
    expect(mockAddItem).toHaveBeenCalledWith(mockMenuItems[0])
  })

  // 6. FILTRES COMBINÉS (1 test)
  test('should combine search and category filters correctly', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    // Search for "pizza" and filter by pizza category
    const searchInput = screen.getByPlaceholderText('Rechercher un plat...')
    const categorySelect = screen.getByDisplayValue('Tous les plats')
    
    await user.type(searchInput, 'pizza')
    await user.selectOptions(categorySelect, 'pizza')
    
    // Should show pizza items that match both filters
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pizza Pepperoni', level: 3 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).not.toBeInTheDocument()
  })

  // 7. ÉTATS SPÉCIAUX (3 tests)
  test('should show loading state when isLoading is true', () => {
    vi.mocked(useMenu).mockReturnValue({
      availableItems: [],
      categories: [],
      isLoading: true
    })
    
    render(<MenuWrapper />)
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    
    // Should not show main content
    expect(screen.queryByPlaceholderText('Rechercher un plat...')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pizza Margherita', level: 3 })).not.toBeInTheDocument()
  })

  test('should show empty state when no items match filters', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Rechercher un plat...')
    await user.type(searchInput, 'nonexistentdish')
    
    // Should show empty state message
    expect(screen.getByText('🔍')).toBeInTheDocument()
    expect(screen.getByText('Aucun plat trouvé')).toBeInTheDocument()
    expect(screen.getByText(/Essayez de modifier vos critères/)).toBeInTheDocument()
    expect(screen.getByText('Réinitialiser les filtres')).toBeInTheDocument()
  })

  test('should reset all filters when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<MenuWrapper />)
    
    // Apply filters first
    const searchInput = screen.getByPlaceholderText('Rechercher un plat...')
    const categorySelect = screen.getByDisplayValue('Tous les plats')
    const sortSelect = screen.getByDisplayValue('Trier par nom')
    
    await user.type(searchInput, 'pizza')
    await user.selectOptions(categorySelect, 'pasta')
    await user.selectOptions(sortSelect, 'price-desc')
    
    // Search for something that doesn't exist to show empty state
    await user.clear(searchInput)
    await user.type(searchInput, 'nonexistent')
    
    // Click reset button
    const resetButton = screen.getByText('Réinitialiser les filtres')
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
    
    expect(screen.getByText('Informations importantes')).toBeInTheDocument()
    expect(screen.getByText(/Livraison :/)).toBeInTheDocument()
    expect(screen.getByText(/Gratuite à partir de 25€/)).toBeInTheDocument()
    expect(screen.getByText(/Allergies :/)).toBeInTheDocument()
    expect(screen.getByText(/Informez-nous de vos allergies/)).toBeInTheDocument()
  })
})