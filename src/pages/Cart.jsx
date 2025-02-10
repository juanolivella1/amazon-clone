import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchCartItems()
  }, [user, navigate])

  async function fetchCartItems() {
    try {
      // First, try to get the pending order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (orderError) throw orderError

      // If there's no pending order, return empty cart
      if (!order) {
        setCartItems([])
        setLoading(false)
        return
      }

      // Get the order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (*)
        `)
        .eq('order_id', order.id)

      if (itemsError) throw itemsError
      setCartItems(items || [])

      // Update order total
      const total = (items || []).reduce((sum, item) => {
        return sum + (item.quantity * item.products.price)
      }, 0)

      const { error: updateError } = await supabase
        .from('orders')
        .update({ total })
        .eq('id', order.id)

      if (updateError) throw updateError
    } catch (error) {
      console.error('Error fetching cart:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  async function updateQuantity(itemId, newQuantity) {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error
      fetchCartItems()
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

 async function removeItem(itemId) {
  try {
    await supabase.from('order_items').delete().eq('id', itemId);
    const { data: remainingItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', cartItems[0]?.order_id); // Revisar si quedan productos


        if (!remainingItems.length) {
          await supabase.from('orders').delete().eq('id', cartItems[0]?.order_id);
        }
      fetchCartItems();
  } catch (error) {
    console.error('Error removing item:', error);
  }
}
  const total = cartItems.reduce((sum, item) => {
    return sum + (item.quantity * item.products.price)
  }, 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Your cart is empty</p>
          <Link to="/" className="button-primary inline-block mt-4">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-20 w-20 flex-shrink-0">
                        <img
                          className="h-20 w-20 rounded object-contain"
                          src={item.products.image_url}
                          alt={item.products.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.products.name}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2 max-w-md">
                          {item.products.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-20 input-field"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      ${(item.quantity * item.products.price).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium text-gray-900">
                Total: ${total.toFixed(2)}
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="button-primary"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}