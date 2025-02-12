import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'

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
    fetchOrders()
  }, [user, navigate])

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, user_id, status, total, created_at,
          order_items (
            id, order_id, quantity, price,
            products (id, name, image_url, price)
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
  
      if (error) throw error;
  
      if (!data || data.length === 0) {
        console.warn("No se encontraron órdenes pendientes.");
        return;
      }
  
      setOrder(data[0]); // ✅ Guardar la primera orden pendiente
    } catch (error) {
      console.error("Error al obtener las órdenes:", error);
      setError("Error loading orders");
    } finally {
      setLoading(false);
    }
  }

  async function createPreference() {
    try {
      setPaymentInitialized(false)

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
      setError('Please fill in all shipping information');
      return;
    }

    try {
      // Here you would typically:
      // 1. Save shipping address
      // 2. Update order status
      // 3. Process payment
      // For demo, we'll just show success
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update order status to 'completed'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)

      if (updateError) throw updateError

      // Delete items from cart
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id)

      if (deleteError) throw deleteError

      // Redirigir al usuario a la página de pedidos
      navigate('/orders')
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

  if (!order || !order.order_items || order.order_items.length === 0) {
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
    );
  }

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + (item.quantity * item.products.price),
    0
  )
  const shipping = 0
  const total = subtotal + shipping

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={shippingAddress.fullName}
            onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Address"
            value={shippingAddress.address}
            onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="City"
            value={shippingAddress.city}
            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="State"
            value={shippingAddress.state}
            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Zip Code"
            value={shippingAddress.zipCode}
            onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Phone"
            value={shippingAddress.phone}
            onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
            className="input-field"
          />
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        <div className="mt-6">
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
          </div>
          <div className="mt-4 text-right">
            <p className="font-bold">Subtotal: ${subtotal.toFixed(2)}</p>
            <p className="font-bold">Shipping: ${shipping.toFixed(2)}</p>
            <p className="font-bold">Total: ${total.toFixed(2)}</p>
          </div>
        </div>
        {paymentInitialized && (
          <div className="mt-6">
            <Wallet initialization={{ preferenceId }} />
          </div>
        )}
        <button
          onClick={handlePayment}
          className="mt-6 button-primary w-full"
        >
          Place Order
        </button>
      </div>
    </div>
  )
}