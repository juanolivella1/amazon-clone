import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase' 
import { 
  ShoppingCartIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export default function Navbar({ products = [] }) {
  const { user, signOut } = useAuth();
  const [role, setRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Obtiene el rol del usuario desde Supabase
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
  
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("store_name") // Selecciona el campo correcto
        .eq("user_id", user.id)
        .maybeSingle(); // Evita error si no hay datos
  
      if (error) {
        console.error("Error obteniendo el rol:", error.message);
        return;
      }
  
      console.log("Datos obtenidos:", data);
      setRole(data?.store_name); // Guarda el rol correctamente
    };
  
    fetchUserRole();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/search', { state: { searchQuery } });
  };

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
            <p className="text-sm font-bold">Colombia</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center h-10 flex-grow cursor-pointer bg-amazon-yellow hover:bg-yellow-500 rounded">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 h-full w-6 flex-grow flex-shrink rounded-l focus:outline-none px-4"
            placeholder="Search Amazon"
          />
          <button type="submit" className="h-10 p-3 bg-amazon-yellow hover:bg-yellow-500 rounded-r">
            <MagnifyingGlassIcon className="h-4 text-amazon" />
          </button>
        </form>

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

          {/* Mostrar solo si el usuario es admin */}
          {role === 'administrador' && (
  <Link to="/products" className="link">
    <p className="font-extrabold md:text-sm">Añade Un Producto</p>
  </Link>
)}
          <Link to="/orders" className="link">
            <p className="font-extrabold md:text-sm">Mis Pedidos</p>
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
    </div>
  );
}
