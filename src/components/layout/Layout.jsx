import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartUIProvider } from '../../contexts/CartUIContext'
import Header from './Header'
import Footer from './Footer'
import CartModal from '../common/CartModal'

const Layout = () => {
  return (
    <CartUIProvider>
      <div className="min-h-screen flex flex-col">
      <Header />
      
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