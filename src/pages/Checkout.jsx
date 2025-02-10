import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Initialize MercadoPago with the public key
initMercadoPago('TEST-d0f0e96d-6c3b-4150-8bd5-81bf28a8e0f6', {
  locale: 'en-US'
})

export default function Checkout() {
  const [preferenceId, setPreferenceId] = useState(null)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentInitialized, setPaymentInitialized] = useState(false)
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  })
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchOrder()
  }, [user, navigate])

  async function fetchOrder() {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

      if (orderError && orderError.code !== 'PGRST116') {
        throw orderError
      }

      if (!order) {
        setLoading(false)
        return
      }

      setOrder(order)
      await createPreference(order)
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Error loading order')
    } finally {
      setLoading(false)
    }
  }

  async function createPreference(order) {
    try {
      setPaymentInitialized(false)
      const items = order.order_items.map(item => ({
        title: item.products.name,
        unit_price: parseFloat(item.products.price),
        quantity: item.quantity,
        currency_id: 'USD',
        description: item.products.description,
        picture_url: item.products.image_url
      }))

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, we'll use a test preference ID
      const testPreferenceId = 'TEST-d0f0e96d-6c3b-4150-8bd5-81bf28a8e0f6'
      setPreferenceId(testPreferenceId)
      setPaymentInitialized(true)
    } catch (error) {
      console.error('Error creating preference:', error)
      setError('Error initializing payment. Please try again.')
    }
  }

  async function handlePayment() {
    if (!isValidShippingAddress()) {
      setError('Please fill in all shipping information')
      return
    }

    try {
      // Here you would typically:
      // 1. Save shipping address
      // 2. Update order status
      // 3. Process payment
      // For demo, we'll just show success
      await new Promise(resolve => setTimeout(resolve, 1000))
      navigate('/success') // You'll need to create a success page
    } catch (error) {
      console.error('Payment error:', error)
      setError('Payment processing failed. Please try again.')
    }
  }

  function isValidShippingAddress() {
    return Object.values(shippingAddress).every(value => value.trim() !== '')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
      </div>
    )
  }

  if (!order || order.order_items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Your cart is empty</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 button-primary"
          >
            Return to Shop
          </button>
        </div>
      </div>
    )
  }

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + (item.quantity * item.products.price),
    0
  )
  const shipping = 0 // Free shipping for demo
  const total = subtotal + shipping

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-800 hover:text-red-900"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={shippingAddress.fullName}
                onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                required
                className="input-field"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={shippingAddress.zipCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  required
                  className="input-field"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>
          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4">
                <img
                  src={item.products.image_url}
                  alt={item.products.name}
                  className="w-16 h-16 object-contain"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.products.name}</h3>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity} x ${item.products.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">
                  ${(item.quantity * item.products.price).toFixed(2)}
                </p>
              </div>
            ))}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {paymentInitialized ? (
              <div className="mt-6">
                {preferenceId ? (
                  <>
                    <button
                      onClick={handlePayment}
                      className="w-full button-primary mb-4"
                      disabled={!isValidShippingAddress()}
                    >
                      Place Order
                    </button>
                    <div className="mt-4 text-sm text-gray-500 text-center">
                      <p>This is a test checkout. No actual charges will be made.</p>
                      <p>Test Card: 5031 7557 3453 0604</p>
                      <p>CVV: 123 | Expiry: 11/25</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-red-600">
                    Error loading payment options. Please try again.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amazon-orange"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}