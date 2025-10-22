import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

const ShoppingCart = ({ isOpen, onClose }) => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Shopping Cart ({totalItems})</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Your cart is empty</p>
                <Link
                  to="/products"
                  onClick={onClose}
                  className="mt-4 inline-block bg-coral-red text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                    {/* Product Image */}
                    <div className="h-16 w-16 flex-shrink-0">
                      <img
                        src={item.product.images?.[0]?.url || '/placeholder-shoe.jpg'}
                        alt={item.product.name}
                        className="h-full w-full object-cover rounded-md"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.variant.color} - Size {item.variant.size}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        ${(item.discountedPrice || item.price).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t px-4 py-4">
              {/* Total */}
              <div className="flex justify-between text-lg font-semibold mb-4">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={clearCart}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Clear Cart
                </button>
                
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="block w-full bg-gray-900 text-white text-center py-2 rounded-md hover:bg-gray-800"
                >
                  View Cart
                </Link>
                
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="block w-full bg-coral-red text-white text-center py-2 rounded-md hover:bg-red-600"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
