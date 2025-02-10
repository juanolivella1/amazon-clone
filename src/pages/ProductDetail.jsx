import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, ensureConnection } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { StarIcon } from '@heroicons/react/24/solid'
import Chat from '../components/Chat'

export default function ProductDetail() {
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    try {
      // Ensure connection before making requests
      const connected = await ensureConnection()
      if (!connected) {
        setProduct(null)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          admin_profiles (
            id,
            store_name,
            description
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
        return
      }

      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  async function addToCart() {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      // Get or create pending order
      let { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle()

      let order
      if (!orders) {
        const { data: newOrder, error: createError } = await supabase
          .from('orders')
          .insert([{ 
            user_id: user.id,
            status: 'pending',
            total: quantity * product.price
          }])
          .select()
          .single()

        if (createError) throw createError
        order = newOrder
      } else {
        order = orders
      }

      // Check if product already exists in cart
      const { data: existingItems, error: existingError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)
        .eq('product_id', product.id)
        .maybeSingle()

      if (existingError) throw existingError

      if (existingItems) {
        // Update quantity if product exists
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ quantity: existingItems.quantity + quantity })
          .eq('id', existingItems.id)

        if (updateError) throw updateError
      } else {
        // Add new item if product doesn't exist
        const { error: itemError } = await supabase
          .from('order_items')
          .insert([{
            order_id: order.id,
            product_id: product.id,
            quantity: quantity,
            price: product.price
          }])

        if (itemError) throw itemError
      }

      navigate('/cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Product not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Image and Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0 p-6">
                <img
                  className="h-96 w-full object-contain md:w-96"
                  src={product.image_url}
                  alt={product.name}
                />
              </div>
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-amazon-orange font-semibold">
                  {product.admin_profiles?.store_name || 'Amazon Store'}
                </div>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">{product.name}</h1>
                
                <div className="mt-2 flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-500">
                    {product.rating} ({product.reviews_count} reviews)
                  </span>
                </div>

                <p className="mt-4 text-3xl font-bold text-amazon-orange">
                  ${product.price.toFixed(2)}
                </p>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">Description</h3>
                  <p className="mt-2 text-gray-500">{product.description}</p>
                </div>

                {product.features && product.features.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">Key Features</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-500">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-6">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amazon-orange focus:border-amazon-orange sm:text-sm rounded-md"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    In Stock: {product.stock} units
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <button
                    onClick={addToCart}
                    disabled={product.stock === 0}
                    className={`w-full button-primary ${
                      product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>

                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="w-full button-secondary"
                  >
                    {showChat ? 'Hide Chat' : 'Chat with Seller'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className={`lg:col-span-1 ${showChat ? 'block' : 'hidden lg:block'}`}>
          {product.admin_profiles && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="font-bold text-lg mb-2">{product.admin_profiles.store_name}</h3>
              <p className="text-gray-600">{product.admin_profiles.description}</p>
            </div>
          )}
          {user ? (
            <Chat adminId={product.admin_profiles?.id} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-center text-gray-600">
                Please <button onClick={() => navigate('/login')} className="text-amazon-orange hover:underline">sign in</button> to chat with the seller
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}