import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

// Reemplaza con una clave pública válida
initMercadoPago('TEST-9cdd24c6-2911-4a17-a632-4fc08a0734e5', { locale: 'es-AR' });

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
    if (order) {
      createPreference();
    }
  }, [user, navigate, order])

  async function fetchOrder() {
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const orderId = queryParams.get('orderId');
  
      if (!orderId) {
        console.error("No se encontró orderId en la URL.");
        return;
      }
  
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, user_id, status, total, created_at,
          order_items (
            id, order_id, quantity, price,
            products (id, name, image_url, price)
          )
        `)
        .eq("id", orderId)
        .single(); // 🔥 Ahora solo trae la orden específica
  
      if (error) throw error;
      
      setOrder(data);
    } catch (error) {
      console.error("Error al obtener la orden:", error);
      setError("Error loading order");
    } finally {
      setLoading(false);
    }
  }
  
  async function createPreference() {
    try {
      const response = await fetch("http://localhost:5000/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: order.order_items.map(item => ({
            title: item.products.name,
            unit_price: item.products.price,
            quantity: item.quantity
          })),
          back_urls: {
            success: "http://localhost:5173/success",
            failure: "http://localhost:5173/failure",
            pending: "http://localhost:5173/pending"
          },
          auto_return: "approved"
        })
      });
  
      const data = await response.json();
      if (data.id) {
        setPreferenceId(data.id);
        setPaymentInitialized(true);
      } else {
        console.error("Error creando preferencia:", data);
      }
    } catch (error) {
      console.error("Error en createPreference:", error);
    }
  }
  
  async function handlePayment() {
    if (!isValidShippingAddress()) {
      setError('Please fill in all shipping information')
      return
    }
  
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const orderId = queryParams.get('orderId');
  
      if (!orderId) {
        console.error("No se encontró orderId en la URL.");
        return;
      }
  
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      // 1️⃣ Actualizar el estado de la orden a "completed"
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);
  
      if (orderError) throw orderError;
  
      // 2️⃣ Redirigir a la página de órdenes
      navigate('/orders');
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment processing failed. Please try again.');
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