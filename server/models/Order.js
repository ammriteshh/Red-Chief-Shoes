import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      color: {
        type: String,
        required: true
      },
      size: {
        type: String,
        required: true
      }
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative']
    }
  }],
  shippingAddress: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India'
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  billingAddress: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India'
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    shippingCost: {
      type: Number,
      required: true,
      min: [0, 'Shipping cost cannot be negative'],
      default: 0
    },
    tax: {
      type: Number,
      required: true,
      min: [0, 'Tax cannot be negative'],
      default: 0
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    }
  },
  payment: {
    method: {
      type: String,
      required: true,
      enum: ['cod', 'card', 'upi', 'netbanking', 'wallet']
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentGateway: String,
    paidAt: Date,
    refundedAt: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  notes: {
    customer: String,
    admin: String
  },
  cancellation: {
    reason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin', 'system']
    }
  },
  return: {
    reason: String,
    requestedAt: Date,
    approvedAt: Date,
    processedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed']
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `RC${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate total before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('pricing')) {
    let subtotal = 0;
    
    this.items.forEach(item => {
      const price = item.discountedPrice || item.price;
      subtotal += price * item.quantity;
    });
    
    this.pricing.subtotal = subtotal;
    this.pricing.total = subtotal + this.pricing.shippingCost + this.pricing.tax - this.pricing.discount;
  }
  next();
});

// Get order summary
orderSchema.virtual('summary').get(function() {
  const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    totalItems,
    totalValue: this.pricing.total,
    status: this.status,
    orderDate: this.createdAt
  };
});

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Check if order can be returned
orderSchema.methods.canBeReturned = function() {
  return this.status === 'delivered' && 
         this.deliveredAt && 
         (new Date() - this.deliveredAt) <= (7 * 24 * 60 * 60 * 1000); // 7 days
};

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
