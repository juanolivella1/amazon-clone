import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true);
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return;
    fetchCartItems();
  }, [user]);

  async function fetchCartItems() {
    try {
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
  
      if (orderError) throw orderError;
  
      if (!orders || orders.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }
  
      const allItems = [];
  
      for (const order of orders) {
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select("*, products(*)")
          .eq("order_id", order.id);
  
        if (itemsError) throw itemsError;
        allItems.push(...items);
      }
  
      setCartItems(allItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }
  async function removeItem(itemId) {
    try {
      await supabase.from('order_items').delete().eq('id', itemId)
      const { data: remainingItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', cartItems[0]?.order_id)

      if (!remainingItems.length) {
        await supabase.from('orders').delete().eq('id', cartItems[0]?.order_id)
      }
      fetchCartItems()
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  async function updateQuantity(itemId, quantity) {
    try {
      await supabase
        .from('order_items')
        .update({ quantity })
        .eq('id', itemId);
      fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }

  async function handleCheckout() {
    try {
      if (!cartItems.length) {
        console.error("No hay productos en el carrito.");
        return;
      }
  
      const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.products.price), 0);
      const orderId = cartItems[0]?.order_id;
  
      if (!orderId) {
        console.error("No se encontró una orden pendiente.");
        return;
      }

      // Obtener la orden actual antes de modificarla
      const { data: currentOrder, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
  
      if (orderError) throw orderError;
  
      // Insertar una nueva orden con estado "completed"
      const { data: newOrder, error: newOrderError } = await supabase
        .from('orders')
        .insert([{ 
          user_id: currentOrder.user_id, 
          total: total, 
          status: 'pending',  // ✅ Cambiar a 'pending' para seguir con el pago
          created_at: new Date()
        }])
        .select()
        .single();
  
      if (newOrderError) throw newOrderError;
  
      console.log("Nueva orden creada:", newOrder);
  
      if (!newOrder || !newOrder.id) {
        console.error("Error: newOrder.id no está definido");
        return;
      }
  
      // Esperar un momento para confirmar la orden en la base de datos
      await new Promise(res => setTimeout(res, 500));
  
      // Insertar productos en la nueva orden
      const orderItemsPromises = cartItems.map(async (item) => {
        if (!item.products || !item.products.id || !item.quantity) {
          console.error("Datos inválidos en item:", item);
          return;
        }
  
        const newItem = {
          order_id: newOrder.id,
          product_id: item.products.id,
          quantity: item.quantity,
          price: item.products.price  // ✅ Incluir el precio del producto
        };
  
        console.log("Insertando producto en order_items:", newItem);
        return supabase.from('order_items').insert([newItem]);
      });
  
      await Promise.all(orderItemsPromises);
      console.log("Productos insertados correctamente.");
  
      // Redirigir al usuario a la página de checkout con el ID de la orden
      navigate(`/checkout?orderId=${newOrder.id}`);
  
    } catch (error) {
      console.error("Error durante checkout:", error);
    }
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
                Total: ${cartItems.reduce((sum, item) => sum + (item.quantity * item.products.price), 0).toFixed(2)}
              </div>
              <button
                onClick={handleCheckout}
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