import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Dashboard from '../../../pages/admin/Dashboard'

describe('Dashboard Component', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Core Rendering Tests
  describe('Core Rendering', () => {
    it('should render dashboard header initially', () => {
      renderComponent()
      
      // Should always show the Dashboard title
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should show loading skeleton initially', () => {
      const { container } = renderComponent()
      
      // Should show skeleton loading cards initially
      const skeletonCards = container.querySelectorAll('.animate-pulse')
      expect(skeletonCards.length).toBeGreaterThan(0)
    })

    it('should display dashboard content after loading', async () => {
      renderComponent()
      
      // Wait for content to load (with sufficient timeout)
      await waitFor(() => {
        expect(screen.getByText('Vue d\'ensemble de votre restaurant')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  // 2. Statistics Cards Display Tests
  describe('Statistics Cards Display', () => {
    it('should display all four statistics cards with correct data', async () => {
      renderComponent()
      
      await waitFor(() => {
        // Revenue card
        expect(screen.getByText('Today's revenue')).toBeInTheDocument()
        expect(screen.getByText('€1250')).toBeInTheDocument()
        expect(screen.getByText('€28,500 this month')).toBeInTheDocument()
        
        // Orders card
        expect(screen.getByText('Orders aujourd\'hui')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText('634 this month')).toBeInTheDocument()
        
        // Customers card
        expect(screen.getByText('Total customers')).toBeInTheDocument()
        expect(screen.getByText('1248')).toBeInTheDocument()
        expect(screen.getByText('+89 new')).toBeInTheDocument()
        
        // Reservations card
        expect(screen.getByText('Reservations aujourd\'hui')).toBeInTheDocument()
        expect(screen.getByText('12')).toBeInTheDocument()
        expect(screen.getByText('67 this week')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should format currency and numbers properly', async () => {
      renderComponent()
      
      await waitFor(() => {
        // Check currency formatting
        expect(screen.getByText('€1250')).toBeInTheDocument()
        expect(screen.getByText('€28,500 this month')).toBeInTheDocument()
        
        // Check number formatting
        expect(screen.getByText('1248')).toBeInTheDocument()
        expect(screen.getByText('634 this month')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should show growth indicators', async () => {
      renderComponent()
      
      await waitFor(() => {
        // Positive growth indicators
        expect(screen.getByText('+12.5%')).toBeInTheDocument()
        expect(screen.getByText('+8.2%')).toBeInTheDocument()
        expect(screen.getByText('+15.3%')).toBeInTheDocument()
        
        // Negative growth indicator (displayed as positive number)
        expect(screen.getByText('2.1%')).toBeInTheDocument()
        
        // Growth comparison text
        expect(screen.getAllByText('vs last month')).toHaveLength(3)
        expect(screen.getByText('vs last week')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  // 3. Recent Orders Section Tests
  describe('Recent Orders Section', () => {
    it('should display recent orders section with header', async () => {
      renderComponent()
      
      await waitFor(() => {
        expect(screen.getByText('Recent orders')).toBeInTheDocument()
        expect(screen.getAllByText('View all')).toHaveLength(2) // Orders and reservations sections
      }, { timeout: 2000 })
    })

    it('should display order information and status badges', async () => {
      renderComponent()
      
      await waitFor(() => {
        // Check order details
        expect(screen.getByText('#12387')).toBeInTheDocument()
        expect(screen.getByText('Marie Dubois')).toBeInTheDocument()
        expect(screen.getByText('€42.5')).toBeInTheDocument()
        expect(screen.getByText('14:30 - 3 items')).toBeInTheDocument()
        
        expect(screen.getByText('#12386')).toBeInTheDocument()
        expect(screen.getByText('Jean Martin')).toBeInTheDocument()
        expect(screen.getByText('€28.9')).toBeInTheDocument()
        
        expect(screen.getByText('#12385')).toBeInTheDocument()
        expect(screen.getByText('Sophie Laurent')).toBeInTheDocument()
        
        expect(screen.getByText('#12384')).toBeInTheDocument()
        expect(screen.getByText('Pierre Durand')).toBeInTheDocument()
        
        // Check order status badges
        expect(screen.getByText('Preparing')).toBeInTheDocument()
        expect(screen.getByText('Ready')).toBeInTheDocument()
        expect(screen.getByText('Delivered')).toBeInTheDocument()
        expect(screen.getByText('Confirmed')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  // 4. Recent Reservations Section Tests
  describe('Recent Reservations Section', () => {
    it('should display recent reservations section with header', async () => {
      renderComponent()
      
      await waitFor(() => {
        expect(screen.getByText('Recent reservations')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should display reservation details and status badges', async () => {
      renderComponent()
      
      await waitFor(() => {
        // Check reservation details
        expect(screen.getByText('Emma Wilson')).toBeInTheDocument()
        expect(screen.getByText('22/01/2024 à 19:30')).toBeInTheDocument()
        expect(screen.getByText('4 personnes')).toBeInTheDocument()
        
        expect(screen.getByText('Readcas Bernard')).toBeInTheDocument()
        expect(screen.getByText('22/01/2024 à 20:00')).toBeInTheDocument()
        expect(screen.getByText('2 personnes')).toBeInTheDocument()
        
        expect(screen.getByText('Camille Moreau')).toBeInTheDocument()
        expect(screen.getByText('23/01/2024 à 19:00')).toBeInTheDocument()
        expect(screen.getByText('6 personnes')).toBeInTheDocument()
        
        // Check reservation status badges
        expect(screen.getAllByText('Confirmed')).toHaveLength(2) // Emma and Camille
        expect(screen.getByText('Pending')).toBeInTheDocument() // Readcas
      }, { timeout: 2000 })
    })

    it('should format dates correctly in French locale', async () => {
      renderComponent()
      
      await waitFor(() => {
        // Check French date formatting
        expect(screen.getByText('22/01/2024 à 19:30')).toBeInTheDocument()
        expect(screen.getByText('22/01/2024 à 20:00')).toBeInTheDocument()
        expect(screen.getByText('23/01/2024 à 19:00')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  // 5. Status Mapping Tests
  describe('Status Mapping', () => {
    it('should correctly map all order statuses', async () => {
      renderComponent()
      
      await waitFor(() => {
        // All order statuses should be properly mapped and displayed
        expect(screen.getByText('Preparing')).toBeInTheDocument() // preparing
        expect(screen.getByText('Ready')).toBeInTheDocument() // ready
        expect(screen.getByText('Delivered')).toBeInTheDocument() // delivered
        expect(screen.getByText('Confirmed')).toBeInTheDocument() // confirmed
      }, { timeout: 2000 })
    })

    it('should correctly map all reservation statuses', async () => {
      renderComponent()
      
      await waitFor(() => {
        // All reservation statuses should be properly mapped and displayed
        expect(screen.getAllByText('Confirmed')).toHaveLength(2) // confirmed (2 reservations)
        expect(screen.getByText('Pending')).toBeInTheDocument() // pending
      }, { timeout: 2000 })
    })
  })

  // 6. Overall Layout Test
  describe('Overall Layout', () => {
    it('should display complete dashboard layout after loading', async () => {
      renderComponent()
      
      await waitFor(() => {
        // Header section
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Vue d\'ensemble de votre restaurant')).toBeInTheDocument()
        
        // Statistics section (4 cards)
        expect(screen.getByText('Today's revenue')).toBeInTheDocument()
        expect(screen.getByText('Orders aujourd\'hui')).toBeInTheDocument()
        expect(screen.getByText('Total customers')).toBeInTheDocument()
        expect(screen.getByText('Reservations aujourd\'hui')).toBeInTheDocument()
        
        // Recent activity section
        expect(screen.getByText('Recent orders')).toBeInTheDocument()
        expect(screen.getByText('Recent reservations')).toBeInTheDocument()
        
        // "View all" buttons
        expect(screen.getAllByText('View all')).toHaveLength(2)
      }, { timeout: 2000 })
    })
  })
})