import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StarIcon } from '@heroicons/react/24/solid';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    rating: '5',
    reviews_count: '0',
    features: ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.email.endsWith('@admin.com')) {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      alert('Error fetching products: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product) {
    let featuresList = [];
    
    if (typeof product.features === 'string') {
      try {
        featuresList = JSON.parse(product.features);
        if (!Array.isArray(featuresList)) {
          throw new Error('Parsed features is not an array');
        }
      } catch (error) {
        console.error('Error parsing features:', error, 'Product:', product);
        featuresList = []; // Evita que se rompa el formulario
      }
    }
  
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image_url: product.image_url,
      rating: product.rating.toString(),
      reviews_count: product.reviews_count.toString(),
      features: featuresList.join('\n') // Convierte el array en texto para mostrar en el textarea
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (formData.id && !window.confirm('Are you sure you want to update this product?')) return;
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        image_url: formData.image_url,
        rating: parseFloat(formData.rating) || 5,
        reviews_count: parseInt(formData.reviews_count) || 0,
        features: JSON.stringify(formData.features.split('\n').filter(f => f.trim()))
      };

      if (formData.id) {
        const { error } = await supabase.from('products').update(productData).eq('id', formData.id).select();
        if (error) throw error;
        alert('Product updated successfully!');
      } else {
        const { error } = await supabase.from('products').insert([productData]).select();
        if (error) throw error;
        alert('Product added successfully!');
      }

      setFormData({ id: '', name: '', description: '', price: '', stock: '', image_url: '', rating: '5', reviews_count: '0', features: '' });
      fetchProducts();
    } catch (error) {
      alert('Error saving product: ' + error.message);
    }
  }

  async function handleDelete(productId) {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      alert('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      alert('Error deleting product: ' + error.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4">
        <input className="w-full p-2 border rounded" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Name" required />
        <textarea className="w-full p-2 border rounded" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" required />
        <input className="w-full p-2 border rounded" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Price" required />
        <input className="w-full p-2 border rounded" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="Stock" required />
        <input className="w-full p-2 border rounded" type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="Image URL" required />
        <button className="bg-blue-500 text-black px-4 py-2 rounded" type="submit">{formData.id ? 'Update Product' : 'Add Product'}</button>
      </form>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Rating</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} className="border">
              <td className="border p-2">{product.name}</td>
              <td className="border p-2">${product.price.toFixed(2)}</td>
              <td className="border p-2">{product.stock}</td>
              <td className="border p-2 flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                ))} ({product.reviews_count})
              </td>
              <td className="border p-2 space-x-2">
                <button className="bg-yellow-500 text-black px-3 py-1 rounded" onClick={() => handleEdit(product)}>Edit</button>
                <button className="bg-red-500 text-black px-3 py-1 rounded" onClick={() => handleDelete(product.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
