import { Link } from 'react-router-dom'

export default function Success() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">¡Pedido completado con éxito!</h1>
        <p className="text-gray-500 mb-4">Gracias por tu compra. Tu pedido ha sido procesado correctamente.</p>
        <Link to="/" className="button-primary inline-block mt-4">
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}