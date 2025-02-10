import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ensureConnection } from '../lib/supabase'
import { StarIcon } from '@heroicons/react/24/solid'
import { 
  FunnelIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [showFilters, setShowFilters] = useState(false)

  const banners = [
    'https://m.media-amazon.com/images/I/61TD5JLGhIL._SX3000_.jpg',
    'https://m.media-amazon.com/images/I/71tIrZqybrL._SX3000_.jpg',
    'https://m.media-amazon.com/images/I/61jovjd+f9L._SX3000_.jpg',
    'https://m.media-amazon.com/images/I/61DUO0NqyyL._SX3000_.jpg',
  ]
  const [currentBanner, setCurrentBanner] = useState(0)

  useEffect(() => {
    fetchProducts()
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [selectedCategory, priceRange, searchQuery, sortBy])

  async function fetchProducts() {
    try {
      // Ensure connection before making requests
      const connected = await ensureConnection()
      if (!connected) {
        setProducts([])
        return
      }

      let query = supabase
        .from('products')
        .select(`
          *,
          admin_profiles (
            store_name
          )
        `)

      // Apply filters
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory.toLowerCase())
      }
      
      if (priceRange.min) {
        query = query.gte('price', parseFloat(priceRange.min))
      }
      
      if (priceRange.max) {
        query = query.lte('price', parseFloat(priceRange.max))
      }
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'rating':
          query = query.order('rating', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100">
      {/* Banner */}
      <div className="relative">
        <div className="absolute w-full h-32 bg-gradient-to-t from-gray-100 to-transparent bottom-0 z-20" />
        <div className="relative">
          <img
            loading="lazy"
            src={banners[currentBanner]}
            alt="Banner"
            className="w-full h-[600px] object-cover"
          />
          <button
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-r-lg opacity-50 hover:opacity-100"
            onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
          >
            ❮
          </button>
          <button
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-l-lg opacity-50 hover:opacity-100"
            onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
          >
            ❯
          </button>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4">
        {/* Search and Filters */}
        <div className="sticky top-0 z-30 bg-white shadow-md rounded-lg p-4 -mt-10 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-amazon-orange focus:border-transparent"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border p-2 focus:ring-2 focus:ring-amazon-orange focus:border-transparent"
              >
                <option value="created_at">Latest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Best Rating</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border p-2"
                >
                  <option value="">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="home">Home & Kitchen</option>
                  <option value="fashion">Fashion</option>
                  <option value="books">Books</option>
                  <option value="toys">Toys & Games</option>
                  <option value="beauty">Beauty & Personal Care</option>
                  <option value="sports">Sports & Outdoors</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Min Price</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="mt-1 block w-full rounded-lg border p-2"
                  placeholder="Min price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Price</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="mt-1 block w-full rounded-lg border p-2"
                  placeholder="Max price"
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="relative pb-4">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-52 w-full object-contain"
                />
                {product.admin_profiles?.store_name && (
                  <p className="absolute top-2 right-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {product.admin_profiles.store_name}
                  </p>
                )}
              </div>
              
              <h4 className="font-medium line-clamp-2 h-12">{product.name}</h4>
              
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-1 text-xs text-gray-500">
                  ({product.reviews_count})
                </span>
              </div>

              <p className="text-xs my-2 line-clamp-2 text-gray-500">
                {product.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <div className="font-bold text-lg">
                  ${product.price.toFixed(2)}
                </div>
                {product.stock > 0 ? (
                  <span className="text-xs text-green-600">In Stock</span>
                ) : (
                  <span className="text-xs text-red-600">Out of Stock</span>
                )}
              </div>

              <button className="mt-4 w-full button-primary text-sm">
                View Details
              </button>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}

        {/* Featured Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-12">
          {[
            {
              title: "Electronics",
              image: "https://images-na.ssl-images-amazon.com/images/G/01/AmazonExports/Fuji/2020/May/Dashboard/Fuji_Dash_Electronics_1x._SY304_CB432774322_.jpg"
            },
            {
              title: "Home & Kitchen",
              image: "https://images-na.ssl-images-amazon.com/images/G/01/AmazonExports/Fuji/2020/May/Dashboard/Fuji_Dash_HomeBedding_Single_Cat_1x._SY304_CB418596953_.jpg"
            },
            {
              title: "Fashion",
              image: "https://images-na.ssl-images-amazon.com/images/G/01/AmazonExports/Fuji/2020/May/Dashboard/Fuji_Dash_WomenFashion_Sweatshirt_Quad_Cat_1x._SY116_CB418609101_.jpg"
            },
            {
              title: "Beauty & Personal Care",
              image: "https://images-na.ssl-images-amazon.com/images/G/01/AmazonExports/Fuji/2020/May/Dashboard/Fuji_Dash_Beauty_1x._SY304_CB432774351_.jpg"
            }
          ].map((category) => (
            <div key={category.title} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">{category.title}</h2>
              <img
                src={category.image}
                alt={category.title}
                className="w-full h-[300px] object-cover rounded-md"
              />
              <Link 
                to="/" 
                className="text-amazon-orange hover:underline block mt-4"
                onClick={() => {
                  setSelectedCategory(category.title.toLowerCase())
                  window.scrollTo(0, 0)
                }}
              >
                See more
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}