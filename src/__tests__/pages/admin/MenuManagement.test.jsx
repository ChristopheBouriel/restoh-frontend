import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import MenuManagement from '../../../pages/admin/MenuManagement'
import { useMenu } from '../../../hooks/useMenu'

// Mock data
const mockMenuItems = [
  {
    id: '1',
    name: 'Pizza Margherita',
    description: 'Classic pizza with tomato and mozzarella',
    price: 12.50,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    category: 'main',
    cuisine: 'continental',
    preparationTime: 15,
    ingredients: ['tomates', 'mozzarella', 'basilic'],
    allergens: ['gluten', 'lactose'],
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '2',
    name: 'Spaghetti Carbonara',
    description: 'Pâtes italiennes avec sauce crémeuse',
    price: 14.00,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
    category: 'main',
    cuisine: 'continental',
    preparationTime: 20,
    ingredients: ['pâtes', 'lardons', 'crème', 'parmesan'],
    allergens: ['gluten', 'lactose'],
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '3',
    name: 'Salade César',
    description: 'Salade fraîche avec croûtons et parmesan',
    price: 9.50,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
    category: 'appetizer',
    cuisine: 'continental',
    preparationTime: 10,
    ingredients: ['salade', 'croûtons', 'parmesan', 'sauce césar'],
    allergens: ['gluten', 'lactose'],
    isAvailable: false,
    isVegetarian: true
  },
  {
    id: '4',
    name: 'Tiramisu',
    description: 'Dessert italien au café et mascarpone',
    price: 6.50,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
    category: 'dessert',
    cuisine: 'continental',
    preparationTime: 5,
    ingredients: ['mascarpone', 'café', 'cacao', 'biscuits'],
    allergens: ['lactose', 'oeufs'],
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '5',
    name: 'Pad Thai',
    description: 'Thai stir-fried noodles',
    price: 13.50,
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop',
    category: 'main',
    cuisine: 'asian',
    preparationTime: 15,
    ingredients: ['noodles', 'shrimp', 'peanuts', 'tamarind'],
    allergens: ['gluten', 'nuts', 'shellfish'],
    isAvailable: true,
    isVegetarian: false
  }
]

// Mock hooks and dependencies
vi.mock('../../../hooks/useMenu')
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

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

// Mock ImageWithFallback component
vi.mock('../../../components/common/ImageWithFallback', () => ({
  default: ({ alt, className }) => (
    <div data-testid="menu-item-image" className={className}>
      {alt}
    </div>
  )
}))

// Mock ImageUpload component
vi.mock('../../../components/common/ImageUpload', () => ({
  default: ({ value, onChange, className }) => (
    <div data-testid="image-upload" className={className}>
      <input
        type="file"
        data-testid="image-upload-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onChange(file)
          }
        }}
        accept="image/jpeg,image/jpg,image/png,image/webp"
      />
      {value && <div data-testid="image-preview">Preview: {value instanceof File ? value.name : value}</div>}
    </div>
  )
}))

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true)
})

// Mock functions for useMenu hook
const mockAddItem = vi.fn()
const mockUpdateItem = vi.fn()
const mockDeleteItem = vi.fn()
const mockToggleAvailability = vi.fn()

// Test wrapper component
const MenuManagementWrapper = () => (
  <MemoryRouter initialEntries={['/admin/menu']}>
    <MenuManagement />
  </MemoryRouter>
)

describe('MenuManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm.mockReturnValue(true)
    
    // Default mock setup for useMenu hook
    vi.mocked(useMenu).mockReturnValue({
      items: mockMenuItems,
      isLoading: false,
      addItem: mockAddItem.mockReturnValue({ success: true }),
      updateItem: mockUpdateItem.mockReturnValue({ success: true }),
      deleteItem: mockDeleteItem.mockReturnValue({ success: true }),
      toggleAvailability: mockToggleAvailability.mockReturnValue({
        success: true,
        item: { ...mockMenuItems[0], isAvailable: !mockMenuItems[0].isAvailable }
      })
    })
  })

  // 1. INITIAL RENDERING & BASIC DISPLAY TESTS (3 tests)
  test('should render menu management header with stats', () => {
    render(<MenuManagementWrapper />)
    
    expect(screen.getByRole('heading', { name: 'Menu Management', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/5 items/)).toBeInTheDocument()
    expect(screen.getByText(/4 available/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New item/i })).toBeInTheDocument()
  })

  test('should display menu items grid when data loaded', () => {
    render(<MenuManagementWrapper />)
    
    // Check that all items are displayed
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Salade César', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiramisu', level: 3 })).toBeInTheDocument()
    
    // Check prices are formatted correctly
    expect(screen.getByText('€12.50')).toBeInTheDocument()
    expect(screen.getByText('€14.00')).toBeInTheDocument()
    expect(screen.getByText('€9.50')).toBeInTheDocument()
    expect(screen.getByText('€6.50')).toBeInTheDocument()
    
    // Check availability status
    expect(screen.getAllByText('Available')).toHaveLength(4)
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  test('should show loading skeleton while loading', () => {
    vi.mocked(useMenu).mockReturnValue({
      items: [],
      isLoading: true,
      addItem: mockAddItem,
      updateItem: mockUpdateItem,
      deleteItem: mockDeleteItem,
      toggleAvailability: mockToggleAvailability
    })
    
    render(<MenuManagementWrapper />)
    
    // Should show skeleton cards
    expect(screen.queryByText('Menu Management')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pizza Margherita' })).not.toBeInTheDocument()
  })

  // 2. CORE FUNCTIONALITY TESTS (5 tests)
  test('should filter items when user types in search field', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Search for an item...')
    await user.type(searchInput, 'pizza')
    
    // Should show pizza items
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    
    // Should not show other items
    expect(screen.queryByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Salade César', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tiramisu', level: 3 })).not.toBeInTheDocument()
  })

  test('should filter by category when user selects category', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)

    const categorySelect = screen.getByDisplayValue('All Categories')
    await user.selectOptions(categorySelect, 'dessert')

    // Should show only dessert
    expect(screen.getByRole('heading', { name: 'Tiramisu', level: 3 })).toBeInTheDocument()

    // Should not show other categories
    expect(screen.queryByRole('heading', { name: 'Pizza Margherita', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Salade César', level: 3 })).not.toBeInTheDocument()
  })

  test('should open add modal when "New item" button clicked', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    // Find the button specifically (not modal header)
    const addButton = screen.getByRole('button', { name: /New item/i })
    await user.click(addButton)
    
    // Modal should be visible - check for form elements
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Pizza Margherita')).toBeInTheDocument()
    })
    
    // Check that form elements are present
    expect(screen.getByPlaceholderText('15.90')).toBeInTheDocument() // Price input
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()

    // Check that category and cuisine selects are present with correct default values
    // There are multiple selects: 1 for filtering outside modal + 2 inside modal (category + cuisine)
    const allSelects = screen.getAllByTestId('simple-select')
    expect(allSelects.length).toBeGreaterThanOrEqual(3)

    // The last 2 selects should be in the modal (category and cuisine)
    const modalSelects = allSelects.slice(-2)
    expect(modalSelects[0]).toHaveValue('main') // Category select in modal
    expect(modalSelects[1]).toHaveValue('continental') // Cuisine select in modal
  })

  test('should open edit modal with prefilled data when edit button clicked', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    // Find edit buttons and click the first one
    const editButtons = screen.getAllByText('Edit')
    await user.click(editButtons[0]) // Click first edit button (Pizza Margherita)
    
    // Form should be prefilled with existing data
    expect(screen.getByDisplayValue('Pizza Margherita')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Classic pizza with tomato and mozzarella')).toBeInTheDocument()
    
    // Check that modal is open by verifying we have multiple "Edit" buttons (one in modal, others in cards)
    const allEditButtons = screen.getAllByText('Edit')
    expect(allEditButtons.length).toBeGreaterThan(1)
  })

  test('should show delete confirmation when delete button clicked', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    // Find the delete button specifically - it should have both bg-red-100 and not contain eye icons
    const allButtons = screen.getAllByRole('button')
    
    // The delete button should be in the last position and have bg-red-100 but not contain an eye icon
    const deleteButton = allButtons.find(button => {
      const classList = button.className || ''
      const hasRedStyling = classList.includes('bg-red-100') && classList.includes('text-red-700')
      const hasTrashIcon = button.innerHTML.includes('trash') || button.querySelector('svg')?.innerHTML.includes('M3 6h18')
      return hasRedStyling && hasTrashIcon
    })
    
    if (!deleteButton) {
      // Fallback: just find any red button that's not an availability toggle
      const redButtons = allButtons.filter(button => {
        const classList = button.className || ''
        return classList.includes('bg-red-100') && classList.includes('text-red-700')
      })
      // The delete button should be the one without eye icons (those are availability toggles)
      const actualDeleteButton = redButtons.find(button => {
        const hasEyeIcon = button.innerHTML.includes('eye') || button.querySelector('svg')?.innerHTML.includes('eye')
        return !hasEyeIcon
      })
      
      expect(actualDeleteButton).toBeInTheDocument()
      await user.click(actualDeleteButton)
    } else {
      await user.click(deleteButton)
    }
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Pizza Margherita"?')
    expect(mockDeleteItem).toHaveBeenCalledWith('1')
  })

  // 3. CRUD OPERATIONS TESTS (4 tests)
  test('should add new item when form submitted with valid data', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)

    // Open add modal
    await user.click(screen.getByRole('button', { name: /New item/i }))

    // Wait for modal to appear and use placeholder text to find inputs
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Pizza Margherita')).toBeInTheDocument()
    })

    // Fill form using placeholder text
    await user.type(screen.getByPlaceholderText('e.g. Pizza Margherita'), 'New Plat')
    await user.type(screen.getByPlaceholderText('15.90'), '15.90')
    await user.type(screen.getByPlaceholderText('Describe the dish, its main ingredients...'), 'Description du nouveau plat')

    // Upload an image file
    const file = new File(['dummy content'], 'test-image.png', { type: 'image/png' })
    const imageInput = screen.getByTestId('image-upload-input')
    await user.upload(imageInput, file)

    // Submit form
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Plat',
      price: 15.90,
      description: 'Description du nouveau plat',
      category: 'main',
      isAvailable: true,
      image: file
    }))
  })

  test('should update existing item when edit form submitted', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    // Open edit modal
    const editButtons = screen.getAllByText('Edit')
    await user.click(editButtons[0])
    
    // Wait for modal to appear and be populated
    await waitFor(() => {
      expect(screen.getByDisplayValue('Pizza Margherita')).toBeInTheDocument()
    })
    
    // Modify form data
    const nameInput = screen.getByDisplayValue('Pizza Margherita')
    await user.clear(nameInput)
    await user.type(nameInput, 'Pizza Margherita Modifiée')
    
    // Submit form by pressing Enter on the input (simpler than finding button)
    await user.keyboard('{Enter}')
    
    expect(mockUpdateItem).toHaveBeenCalledWith('1', expect.objectContaining({
      name: 'Pizza Margherita Modifiée'
    }))
  })

  test('should toggle item availability when availability button clicked', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    // Find and click availability toggle button for first available item
    const availabilityButtons = screen.getAllByRole('button')
    const toggleButton = availabilityButtons.find(button => 
      button.querySelector('svg') && 
      (button.getAttribute('class')?.includes('bg-red-100') || 
       button.getAttribute('class')?.includes('bg-green-100'))
    )
    
    await user.click(toggleButton)
    
    expect(mockToggleAvailability).toHaveBeenCalledWith('1')
  })

  test('should show validation error when required fields missing', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    // Open add modal
    await user.click(screen.getByRole('button', { name: /New item/i }))
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Pizza Margherita')).toBeInTheDocument()
    })
    
    // Submit form without filling required fields
    await user.click(screen.getByRole('button', { name: 'Add' }))
    
    // Should not call addItem since form validation should prevent it
    expect(mockAddItem).not.toHaveBeenCalled()
  })

  // 4. STATE MANAGEMENT TESTS (2 tests)
  test('should show empty state when no items match filters', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Search for an item...')
    await user.type(searchInput, 'nonexistent')
    
    // Should show empty state
    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
  })

  test('should reset search and show all items when search is cleared', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)
    
    const searchInput = screen.getByPlaceholderText('Search for an item...')
    
    // First search for pizza
    await user.type(searchInput, 'pizza')
    expect(screen.queryByRole('heading', { name: 'Tiramisu', level: 3 })).not.toBeInTheDocument()
    
    // Clear search
    await user.clear(searchInput)
    
    // All items should be visible again
    expect(screen.getByRole('heading', { name: 'Pizza Margherita', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Spaghetti Carbonara', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Salade César', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiramisu', level: 3 })).toBeInTheDocument()
  })

  // 5. EDGE CASES TEST (1 test)
  test('should handle empty menu data gracefully', () => {
    vi.mocked(useMenu).mockReturnValue({
      items: [],
      isLoading: false,
      addItem: mockAddItem,
      updateItem: mockUpdateItem,
      deleteItem: mockDeleteItem,
      toggleAvailability: mockToggleAvailability
    })

    render(<MenuManagementWrapper />)

    // Should show empty state for no data
    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('Start by adding your first menu item')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add an item' })).toBeInTheDocument()
  })

  // 6. CUISINE FIELD TESTS (3 tests)
  test('should display cuisine field in add item form', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)

    // Open add modal
    const addButton = screen.getByRole('button', { name: /new item/i })
    await user.click(addButton)

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'New Item' })).toBeInTheDocument()
    })

    // Check that cuisine field exists with correct options
    expect(screen.getByText('Cuisine Type *')).toBeInTheDocument()

    // Check that cuisine select is present with correct default value
    const cuisineSelects = screen.getAllByTestId('simple-select')
    const cuisineSelect = cuisineSelects.find(select =>
      Array.from(select.querySelectorAll('option')).some(opt => opt.value === 'asian')
    )
    expect(cuisineSelect).toBeInTheDocument()
    expect(cuisineSelect).toHaveValue('continental') // Default value
  })

  test('should include cuisine field when creating new item', async () => {
    const user = userEvent.setup()
    render(<MenuManagementWrapper />)

    // Open add modal
    const addButton = screen.getByRole('button', { name: /new item/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'New Item' })).toBeInTheDocument()
    })

    // Fill form
    await user.type(screen.getByPlaceholderText('e.g. Pizza Margherita'), 'Test Asian Dish')
    await user.type(screen.getByPlaceholderText('15.90'), '15.50')
    await user.type(screen.getByPlaceholderText('Describe the dish, its main ingredients...'), 'Test description')

    // Upload an image file
    const file = new File(['dummy content'], 'test-asian-dish.png', { type: 'image/png' })
    const imageInput = screen.getByTestId('image-upload-input')
    await user.upload(imageInput, file)

    // Select Asian cuisine
    const cuisineSelects = screen.getAllByTestId('simple-select')
    const cuisineSelect = cuisineSelects.find(select =>
      Array.from(select.querySelectorAll('option')).some(opt => opt.value === 'asian')
    )
    if (cuisineSelect) {
      await user.selectOptions(cuisineSelect, 'asian')
    }

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Add' })
    await user.click(submitButton)

    // Check that addItem was called with cuisine field
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalled()
      const callArgs = mockAddItem.mock.calls[0][0]
      expect(callArgs).toHaveProperty('cuisine')
      expect(callArgs.cuisine).toBe('asian')
    })
  })

  test('should display cuisine badges on menu item cards', () => {
    render(<MenuManagementWrapper />)

    // Check that cuisine badges are displayed
    expect(screen.getAllByText('Continental').length).toBeGreaterThan(0)
    expect(screen.getByText('Asian')).toBeInTheDocument()
  })
})