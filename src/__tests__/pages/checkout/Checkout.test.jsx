import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Checkout from '../../../pages/checkout/Checkout'
import { useCart } from '../../../hooks/useCart'
import { useAuth } from '../../../hooks/useAuth'
import useOrdersStore from '../../../store/ordersStore'
import { toast } from 'react-hot-toast'
import { ROUTES } from '../../../constants'

// Mock data
const mockUser = {
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com'
}

const mockCartItems = [
  {
    id: 1,
    name: 'Pizza Margherita',
    price: 15.90,
    quantity: 2,
    image: 'pizza-margherita.jpg'
  },
  {
    id: 2,
    name: 'Salade César',
    price: 12.50,
    quantity: 1,
    image: 'salade-cesar.jpg'
  }
]

// Mock external dependencies
vi.mock('../../../hooks/useAuth')
vi.mock('../../../hooks/useCart')
vi.mock('../../../store/ordersStore')
vi.mock('react-hot-toast')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const mockCreateOrder = vi.fn()
const mockClearCart = vi.fn()
const mockFormatPrice = vi.fn((price) => `${price.toFixed(2)}€`)

// Test wrapper component
const CheckoutWrapper = () => (
  <MemoryRouter initialEntries={['/checkout']}>
    <Checkout />
  </MemoryRouter>
)

describe('Checkout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful mock setup
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser
    })
    
    vi.mocked(useCart).mockReturnValue({
      availableItems: mockCartItems,
      totalItemsAvailable: 3,
      formattedTotalPriceAvailable: '44.30€',
      totalPriceAvailable: 44.30,
      clearCart: mockClearCart,
      formatPrice: mockFormatPrice
    })
    
    vi.mocked(useOrdersStore).mockReturnValue({
      createOrder: mockCreateOrder
    })
    
    mockCreateOrder.mockResolvedValue({
      success: true,
      orderId: 'ORDER123'
    })
  })

  // 1. NAVIGATION GUARDS (3 tests)
  test('should redirect to login when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null
    })
    
    render(<CheckoutWrapper />)
    
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.LOGIN)
  })

  test('should redirect to menu when cart is empty', () => {
    vi.mocked(useCart).mockReturnValue({
      availableItems: [],
      totalItemsAvailable: 0,
      formattedTotalPriceAvailable: '0.00€',
      totalPriceAvailable: 0,
      clearCart: mockClearCart,
      formatPrice: mockFormatPrice
    })
    
    render(<CheckoutWrapper />)
    
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MENU)
  })

  test('should render checkout form when user is authenticated with cart items', () => {
    render(<CheckoutWrapper />)
    
    expect(screen.getByText('Complete your order')).toBeInTheDocument()
    expect(screen.getByText('Complete your delivery information')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Order - 44.30€/i })).toBeInTheDocument()
  })

  // 2. FORM MANAGEMENT (3 tests)
  test('should update form fields when user types in inputs', async () => {
    const user = userEvent.setup()
    render(<CheckoutWrapper />)
    
    const addressField = screen.getByPlaceholderText('123 Rue de la Paix, 75001 Paris')
    const phoneField = screen.getByPlaceholderText('06 12 34 56 78')
    const notesField = screen.getByPlaceholderText('Floor, access code, special instructions...')
    
    await user.type(addressField, '123 Rue de la Paix')
    await user.type(phoneField, '0123456789')
    await user.type(notesField, 'Ring at 2nd floor')
    
    expect(addressField).toHaveValue('123 Rue de la Paix')
    expect(phoneField).toHaveValue('0123456789')
    expect(notesField).toHaveValue('Ring at 2nd floor')
  })

  test('should change payment method when user selects different option', async () => {
    const user = userEvent.setup()
    render(<CheckoutWrapper />)
    
    const cardOption = screen.getByRole('radio', { name: /Credit card/i })
    const cashOption = screen.getByRole('radio', { name: /Cash on delivery/i })
    
    // Card should be selected by default
    expect(cardOption).toBeChecked()
    expect(cashOption).not.toBeChecked()
    
    // Switch to cash payment
    await user.click(cashOption)
    
    expect(cashOption).toBeChecked()
    expect(cardOption).not.toBeChecked()
  })

  test('should require delivery address and phone fields for form submission', async () => {
    const user = userEvent.setup()
    render(<CheckoutWrapper />)
    
    const submitButton = screen.getByRole('button', { name: /Order - 44.30€/i })
    
    // Try to submit without filling required fields
    await user.click(submitButton)
    
    // Form should not submit (createOrder should not be called)
    expect(mockCreateOrder).not.toHaveBeenCalled()
    
    // Required field validation is handled by HTML5 required attribute
    const addressField = screen.getByPlaceholderText('123 Rue de la Paix, 75001 Paris')
    const phoneField = screen.getByPlaceholderText('06 12 34 56 78')
    
    expect(addressField).toBeRequired()
    expect(phoneField).toBeRequired()
  })

  // 3. ORDER PROCESSING (3 tests)
  test('should create order successfully when form is submitted with valid data', async () => {
    const user = userEvent.setup()
    render(<CheckoutWrapper />)
    
    // Fill required fields
    await user.type(screen.getByPlaceholderText('123 Rue de la Paix, 75001 Paris'), '123 Rue de la Paix')
    await user.type(screen.getByPlaceholderText('06 12 34 56 78'), '0123456789')
    await user.type(screen.getByPlaceholderText('Floor, access code, special instructions...'), 'Ring at 2nd')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Order - 44.30€/i }))
    
    // Wait for async operations to complete
    await vi.waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalled()
    }, { timeout: 3000 })
    
    expect(mockCreateOrder).toHaveBeenCalledWith({
      userId: mockUser.id,
      userEmail: mockUser.email,
      userName: mockUser.name,
      items: mockCartItems,
      totalPrice: 44.30,
      deliveryAddress: '123 Rue de la Paix',
      phone: '0123456789',
      notes: 'Ring at 2nd',
      orderType: 'delivery',
      paymentMethod: 'card'
    })
    
    expect(mockClearCart).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('🎉 Order placed successfully!')
  })

  test('should show loading state during order processing', async () => {
    const user = userEvent.setup()
    
    // Mock slow order creation
    let resolveOrder
    const orderPromise = new Promise(resolve => {
      resolveOrder = resolve
    })
    mockCreateOrder.mockReturnValue(orderPromise)
    
    render(<CheckoutWrapper />)
    
    // Fill required fields
    await user.type(screen.getByPlaceholderText('123 Rue de la Paix, 75001 Paris'), '123 Rue de la Paix')
    await user.type(screen.getByPlaceholderText('06 12 34 56 78'), '0123456789')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Order - 44.30€/i }))
    
    // Should show loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Processing.../i })).toBeDisabled()
    
    // Resolve the promise to cleanup
    resolveOrder({ success: true, orderId: 'ORDER123' })
  })

  test('should handle order creation errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock order creation failure
    mockCreateOrder.mockResolvedValue({
      success: false,
      error: 'Payment failed'
    })
    
    render(<CheckoutWrapper />)
    
    // Fill required fields and submit
    await user.type(screen.getByPlaceholderText('123 Rue de la Paix, 75001 Paris'), '123 Rue de la Paix')
    await user.type(screen.getByPlaceholderText('06 12 34 56 78'), '0123456789')
    await user.click(screen.getByRole('button', { name: /Order - 44.30€/i }))
    
    // Wait for order processing to complete and error to be handled
    await vi.waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalled()
    }, { timeout: 3000 })
    
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error processing order')
    }, { timeout: 3000 })
    
    // Should not clear cart on error
    expect(mockClearCart).not.toHaveBeenCalled()
  })

  // 4. ORDER SUMMARY DISPLAY (2 tests)
  test('should display cart items with correct prices and quantities', () => {
    render(<CheckoutWrapper />)
    
    // Check item names
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument()
    expect(screen.getByText('Salade César')).toBeInTheDocument()
    
    // Check quantities and individual prices
    expect(screen.getByText('15.90€ × 2')).toBeInTheDocument()
    expect(screen.getByText('12.50€ × 1')).toBeInTheDocument()
    
    // Check calculated line totals
    expect(screen.getByText('31.80€')).toBeInTheDocument() // 15.90 × 2
    expect(screen.getByText('12.50€')).toBeInTheDocument() // 12.50 × 1
  })

  test('should show formatted total price and item count', () => {
    render(<CheckoutWrapper />)
    
    // Check total in summary section
    expect(screen.getByText('Total (3 items)')).toBeInTheDocument()
    expect(screen.getByText('44.30€')).toBeInTheDocument()
    
    // Check total in submit button
    expect(screen.getByRole('button', { name: /Order - 44.30€/i })).toBeInTheDocument()
  })

  // 5. SUCCESS CONFIRMATION (1 test)
  test('should show order confirmation with order details after successful submission', async () => {
    const user = userEvent.setup()
    render(<CheckoutWrapper />)
    
    // Fill form and submit
    await user.type(screen.getByPlaceholderText('123 Rue de la Paix, 75001 Paris'), '123 Rue de la Paix')
    await user.type(screen.getByPlaceholderText('06 12 34 56 78'), '0123456789')
    await user.click(screen.getByRole('button', { name: /Order - 44.30€/i }))
    
    // Wait for success state
    await vi.waitFor(() => {
      expect(screen.getByText('Order confirmed!')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Check order confirmation details
    expect(screen.getByText(/Your order/)).toBeInTheDocument()
    expect(screen.getByText('#ORDER123')).toBeInTheDocument()
    expect(screen.getByText('Total paid:')).toBeInTheDocument()
    expect(screen.getByText('Items:')).toBeInTheDocument()
    
    // Check navigation buttons
    expect(screen.getByRole('button', { name: 'View my orders' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue shopping' })).toBeInTheDocument()
  })
})