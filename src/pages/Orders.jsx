import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
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
        .from('orders')
        .select(`
          id, user_id, status, total, created_at,
          order_items (
            id, order_id, quantity, price,
            products (id, name, image_url, price)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed') // 🔥 Solo mostrar órdenes completadas
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">No has realizado ningún pedido</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 button-primary"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis Pedidos</h1>
      {orders.map((order) => (
        <div key={order.id} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-medium mb-4">Pedido #{order.id}</h2>
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
                    Cantidad: {item.quantity} x ${item.products.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">
                  ${(item.quantity * item.products.price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <p className="font-bold">Total: ${order.total.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
