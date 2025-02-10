import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  ShoppingCartIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="bg-amazon text-white">
      {/* Main navbar */}
      <div className="flex items-center p-2 flex-grow">
        <Link to="/" className="mt-2 flex items-center flex-grow sm:flex-grow-0">
          <img
            src="https://pngimg.com/uploads/amazon/amazon_PNG11.png"
            alt="Amazon Logo"
            className="h-[35px] object-contain cursor-pointer px-4"
          />
        </Link>

        {/* Delivery Address */}
        <div className="hidden md:flex items-center mx-6 text-white hover:text-amazon-yellow cursor-pointer">
          <MapPinIcon className="h-6" />
          <div className="ml-1">
            <p className="text-xs text-gray-200">Deliver to</p>
            <p className="text-sm font-bold">United States</p>
          </div>
        </div>

        {/* Search */}
        <div className="hidden sm:flex items-center h-10 flex-grow cursor-pointer bg-amazon-yellow hover:bg-yellow-500 rounded">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 h-full w-6 flex-grow flex-shrink rounded-l focus:outline-none px-4"
            placeholder="Search Amazon"
          />
          <div className="h-10 p-3 bg-amazon-yellow hover:bg-yellow-500 rounded-r">
            <MagnifyingGlassIcon className="h-4 text-amazon" />
          </div>
        </div>

        {/* Right */}
        <div className="text-white flex items-center text-xs space-x-6 mx-6 whitespace-nowrap">
          <div className="link">
            {user ? (
              <div>
                <p>Hello, {user.email}</p>
                <button
                  onClick={() => signOut()}
                  className="font-extrabold md:text-sm hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login">
                <p>Hello, sign in</p>
                <p className="font-extrabold md:text-sm">Account & Lists</p>
              </Link>
            )}
          </div>

          <Link to="/products" className="link">
            <p>Returns</p>
            <p className="font-extrabold md:text-sm">& Orders</p>
          </Link>

          <Link to="/cart" className="relative link flex items-center">
            <span className="absolute top-0 right-0 md:right-10 h-4 w-4 bg-amazon-yellow text-center rounded-full text-black font-bold">
              0
            </span>
            <ShoppingCartIcon className="h-10" />
            <p className="hidden md:inline font-extrabold md:text-sm mt-2">Cart</p>
          </Link>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center space-x-3 p-2 pl-6 bg-amazon-light text-white text-sm">
        <p className="link flex items-center">
          <Bars3Icon className="h-6 mr-1" />
          All
        </p>
        <p className="link">Today Deals</p>
        <p className="link">Customer Service</p>
        <p className="link">Registry</p>
        <p className="link">Gift Cards</p>
        <p className="link">Sell</p>
      </div>
    </div>
  )
}