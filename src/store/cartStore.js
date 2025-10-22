import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      totalItems: 0,
      totalPrice: 0,

      // Actions
      addItem: (product, variant, quantity = 1) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          item => 
            item.product.id === product.id && 
            item.variant.color === variant.color && 
            item.variant.size === variant.size
        );

        if (existingItemIndex > -1) {
          // Update existing item
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem = {
            id: `${product.id}-${variant.color}-${variant.size}`,
            product: {
              id: product.id,
              name: product.name,
              images: product.images,
              slug: product.slug
            },
            variant: {
              color: variant.color,
              size: variant.size
            },
            quantity,
            price: variant.price,
            discountedPrice: variant.discountedPrice
          };
          set({ items: [...items, newItem] });
        }

        get().calculateTotals();
      },

      removeItem: (itemId) => {
        const { items } = get();
        const updatedItems = items.filter(item => item.id !== itemId);
        set({ items: updatedItems });
        get().calculateTotals();
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const { items } = get();
        const updatedItems = items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
        get().calculateTotals();
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 });
      },

      calculateTotals: () => {
        const { items } = get();
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) => {
          const price = item.discountedPrice || item.price;
          return sum + (price * item.quantity);
        }, 0);

        set({ totalItems, totalPrice });
      },

      getItemQuantity: (productId, color, size) => {
        const { items } = get();
        const item = items.find(
          item => 
            item.product.id === productId && 
            item.variant.color === color && 
            item.variant.size === size
        );
        return item ? item.quantity : 0;
      },

      isInCart: (productId, color, size) => {
        const { items } = get();
        return items.some(
          item => 
            item.product.id === productId && 
            item.variant.color === color && 
            item.variant.size === size
        );
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);
