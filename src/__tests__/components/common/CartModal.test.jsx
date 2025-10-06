import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CartModal from '../../../components/common/CartModal'
import { useCart } from '../../../hooks/useCart'
import { useCartUI } from '../../../contexts/CartUIContext'

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock ImageWithFallback to avoid image loading issues
vi.mock('../../../components/common/ImageWithFallback', () => ({
  default: ({ alt, className }) => (
    <div data-testid="cart-item-image" className={className}>
      {alt}
    </div>
  )
}))

// Mock hooks
vi.mock('../../../hooks/useCart')
vi.mock('../../../contexts/CartUIContext')

// Mock data
const mockAvailableItem = {
  id: '1',
  name: 'Pizza Margherita',
  image: 'pizza-margherita.jpg',
  currentPrice: 12.50,
  quantity: 2,
  isAvailable: true,
  stillExists: true
}

const mockUnavailableItem = {
  id: '2',
  name: 'Pizza Pepperoni',
  image: 'pizza-pepperoni.jpg',
  currentPrice: 15.50,
  quantity: 1,
  isAvailable: false,
  stillExists: true
}

const mockDeletedItem = {
  id: '3',
  name: 'Pizza Deleted',
  image: 'pizza-deleted.jpg',
  currentPrice: 18.00,
  quantity: 1,
  isAvailable: true,
  stillExists: false
}

const mockIncreaseQuantity = vi.fn()
const mockDecreaseQuantity = vi.fn()
const mockRemoveItem = vi.fn()
const mockClearCart = vi.fn()
const mockSyncWithMenu = vi.fn()
const mockCloseCart = vi.fn()

// Test wrapper component
const CartModalWrapper = () => (
  <MemoryRouter>
    <CartModal />
  </MemoryRouter>
)

describe('CartModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mocks - cart is closed initially
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: false,
      closeCart: mockCloseCart
    })
  })

  // 1. MODAL VISIBILITY & BASIC RENDERING (3 tests)
  test('should not render when cart is closed', () => {
    vi.mocked(useCart).mockReturnValue({
      isEmpty: true,
      totalItems: 0,
      syncWithMenu: mockSyncWithMenu
    })

    const { container } = render(<CartModalWrapper />)
    
    expect(container.firstChild).toBeNull()
    expect(mockSyncWithMenu).not.toHaveBeenCalled()
  })

  test('should render modal with header when cart is open', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 3,
      enrichedItems: [mockAvailableItem],
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`
    })

    render(<CartModalWrapper />)
    
    expect(screen.getByText('Mon Panier (3)')).toBeInTheDocument()
    // Check X button exists by looking for the close button in header
    const closeButton = document.querySelector('.hover\\:bg-gray-100')
    expect(closeButton).toBeInTheDocument()
  })

  test('should sync with menu when cart opens', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: true,
      totalItems: 0,
      syncWithMenu: mockSyncWithMenu
    })

    render(<CartModalWrapper />)
    
    expect(mockSyncWithMenu).toHaveBeenCalledTimes(1)
  })

  // 2. EMPTY CART STATE (2 tests)
  test('should show empty cart message and menu button when cart is empty', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: true,
      totalItems: 0,
      syncWithMenu: mockSyncWithMenu
    })

    render(<CartModalWrapper />)
    
    expect(screen.getByText('Votre panier est vide')).toBeInTheDocument()
    expect(screen.getByText('Découvrez nos délicieux plats et ajoutez-les à votre panier !')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voir le menu' })).toBeInTheDocument()
  })

  test('should navigate to menu when "Voir le menu" button is clicked', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: true,
      totalItems: 0,
      syncWithMenu: mockSyncWithMenu
    })

    render(<CartModalWrapper />)
    
    const menuButton = screen.getByRole('button', { name: 'Voir le menu' })
    await user.click(menuButton)
    
    expect(mockCloseCart).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/menu')
  })

  // 3. CART ITEMS DISPLAY (3 tests)
  test('should display cart items with essential information', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 2,
      enrichedItems: [mockAvailableItem],
      hasUnavailableItems: false,
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      increaseQuantity: mockIncreaseQuantity,
      decreaseQuantity: mockDecreaseQuantity,
      removeItem: mockRemoveItem
    })

    render(<CartModalWrapper />)
    
    // Check item information using more specific selectors
    const itemName = document.querySelector('h3.font-medium')
    expect(itemName).toHaveTextContent('Pizza Margherita')
    expect(screen.getByText('12.50€ l\'unité')).toBeInTheDocument()
    expect(screen.getByText('25.00€')).toBeInTheDocument() // 12.50 * 2
    expect(screen.getByText('2')).toBeInTheDocument() // quantity
    
    // Check image is rendered
    expect(screen.getByTestId('cart-item-image')).toBeInTheDocument()
  })

  test('should show unavailable items with warning styling', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 2,
      enrichedItems: [mockUnavailableItem, mockDeletedItem],
      hasUnavailableItems: true,
      unavailableItems: [mockUnavailableItem, mockDeletedItem],
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      increaseQuantity: mockIncreaseQuantity,
      decreaseQuantity: mockDecreaseQuantity,
      removeItem: mockRemoveItem
    })

    render(<CartModalWrapper />)
    
    // Check unavailable item styling
    expect(screen.getByText('INDISPO')).toBeInTheDocument()
    expect(screen.getByText('SUPPRIMÉ')).toBeInTheDocument()
    expect(screen.getAllByText('Non inclus dans le total')).toHaveLength(2)
    
    // Check that item names have line-through styling
    const unavailableElements = document.querySelectorAll('.line-through')
    expect(unavailableElements.length).toBeGreaterThan(0)
  })

  test('should show availability alert when has unavailable items', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 3,
      enrichedItems: [mockAvailableItem, mockUnavailableItem],
      hasUnavailableItems: true,
      unavailableItems: [mockUnavailableItem],
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      increaseQuantity: mockIncreaseQuantity,
      decreaseQuantity: mockDecreaseQuantity,
      removeItem: mockRemoveItem
    })

    render(<CartModalWrapper />)
    
    expect(screen.getByText('1 article(s) non disponible(s) dans votre panier')).toBeInTheDocument()
  })

  // 4. QUANTITY CONTROLS (3 tests)
  test('should increase quantity when plus button clicked', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 2,
      enrichedItems: [mockAvailableItem],
      hasUnavailableItems: false,
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      increaseQuantity: mockIncreaseQuantity,
      decreaseQuantity: mockDecreaseQuantity,
      removeItem: mockRemoveItem
    })

    render(<CartModalWrapper />)
    
    // Find plus button by CSS selector
    const plusButton = document.querySelector('.rounded-r-md')
    await user.click(plusButton)
    
    expect(mockIncreaseQuantity).toHaveBeenCalledWith('1')
  })

  test('should decrease quantity when minus button clicked', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 2,
      enrichedItems: [mockAvailableItem],
      hasUnavailableItems: false,
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      increaseQuantity: mockIncreaseQuantity,
      decreaseQuantity: mockDecreaseQuantity,
      removeItem: mockRemoveItem
    })

    render(<CartModalWrapper />)
    
    // Find minus button by CSS selector
    const minusButton = document.querySelector('.rounded-l-md')
    await user.click(minusButton)
    
    expect(mockDecreaseQuantity).toHaveBeenCalledWith('1')
  })

  test('should remove item when trash button clicked', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 2,
      enrichedItems: [mockAvailableItem],
      hasUnavailableItems: false,
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      increaseQuantity: mockIncreaseQuantity,
      decreaseQuantity: mockDecreaseQuantity,
      removeItem: mockRemoveItem
    })

    render(<CartModalWrapper />)
    
    // Find trash button by CSS selector (red color indicator)
    const trashButton = document.querySelector('.text-red-500')
    await user.click(trashButton)
    
    expect(mockRemoveItem).toHaveBeenCalledWith('1', 'Pizza Margherita')
  })

  // 5. PRICE CALCULATIONS & CHECKOUT (2 tests)
  test('should show correct total calculations with mixed availability', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 3,
      enrichedItems: [mockAvailableItem, mockUnavailableItem],
      hasUnavailableItems: true,
      unavailableItems: [mockUnavailableItem],
      totalItemsAvailable: 2,
      formattedTotalPrice: '40.50€',
      formattedTotalPriceAvailable: '25.00€',
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      clearCart: mockClearCart
    })

    render(<CartModalWrapper />)
    
    // Check detailed totals display
    expect(screen.getByText('Total original:')).toBeInTheDocument()
    expect(screen.getByText('40.50€')).toBeInTheDocument()
    expect(screen.getByText('Total disponible (2 articles):')).toBeInTheDocument()
    expect(screen.getByText('Total à payer:')).toBeInTheDocument()
    
    // Check that multiple 25.00€ are present (item total, available total, final total)
    const priceElements = screen.getAllByText('25.00€')
    expect(priceElements.length).toBeGreaterThanOrEqual(2)
  })

  test('should handle checkout navigation correctly', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 2,
      enrichedItems: [mockAvailableItem],
      hasUnavailableItems: false,
      totalItemsAvailable: 2,
      formattedTotalPrice: '25.00€',
      formattedTotalPriceAvailable: '25.00€',
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`
    })

    render(<CartModalWrapper />)
    
    // Check checkout button is enabled and shows correct text
    const checkoutButton = screen.getByRole('button', { name: /Commander - 25.00€/ })
    expect(checkoutButton).toBeInTheDocument()
    expect(checkoutButton).not.toBeDisabled()
    
    await user.click(checkoutButton)
    
    expect(mockCloseCart).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
  })

  // 6. NAVIGATION & CONTROLS (1 test)
  test('should close cart through various methods', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 2,
      enrichedItems: [mockAvailableItem],
      hasUnavailableItems: false,
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`
    })

    render(<CartModalWrapper />)
    
    // Test X button click
    const xButton = document.querySelector('.hover\\:bg-gray-100')
    await user.click(xButton)
    expect(mockCloseCart).toHaveBeenCalledTimes(1)
    
    // Test overlay click
    const overlay = document.querySelector('.bg-black.bg-opacity-50')
    expect(overlay).toBeInTheDocument()
    await user.click(overlay)
    expect(mockCloseCart).toHaveBeenCalledTimes(2)
    
    // Test continue shopping button
    const continueButton = screen.getByRole('button', { name: 'Continuer mes achats' })
    await user.click(continueButton)
    expect(mockCloseCart).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledWith('/menu')
  })

  // Additional test for clear cart functionality
  test('should clear cart when clear button clicked', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart
    })
    
    vi.mocked(useCart).mockReturnValue({
      isEmpty: false,
      totalItems: 2,
      enrichedItems: [mockAvailableItem],
      hasUnavailableItems: false,
      syncWithMenu: mockSyncWithMenu,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      clearCart: mockClearCart
    })

    render(<CartModalWrapper />)
    
    const clearButton = screen.getByRole('button', { name: 'Vider le panier' })
    await user.click(clearButton)
    
    expect(mockClearCart).toHaveBeenCalledTimes(1)
  })
})