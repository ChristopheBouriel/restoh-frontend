import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartUIProvider } from '../../contexts/CartUIContext'
import { useAuth } from '../../hooks/useAuth'
import Header from './Header'
import Footer from './Footer'
import CartModal from '../common/CartModal'
import EmailVerificationBanner from '../common/EmailVerificationBanner'

const Layout = () => {
  const { user, isAuthenticated } = useAuth()

  return (
    <CartUIProvider>
      <div className="min-h-screen flex flex-col">
      <Header />

      {/* Email verification banner for logged-in users with unverified email */}
      {isAuthenticated && user && !user.isEmailVerified && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <EmailVerificationBanner user={user} />
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
      
      {/* Cart Modal */}
      <CartModal />
      
      {/* Toast notifications */}
      <Toaster 
        position="top-left"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#DC2626',
            },
          },
        }}
      />
      </div>
    </CartUIProvider>
  )
}

export default Layout