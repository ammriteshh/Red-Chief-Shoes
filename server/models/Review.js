import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  pros: [{
    type: String,
    trim: true,
    maxlength: [100, 'Pro point cannot exceed 100 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [100, 'Con point cannot exceed 100 characters']
  }],
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative']
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  adminResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Indexes for better query performance
reviewSchema.index({ product: 1, isActive: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ verified: 1 });

// Update product rating when review is saved
reviewSchema.post('save', async function() {
  if (this.isActive) {
    await this.constructor.updateProductRating(this.product);
  }
});

// Update product rating when review is deleted
reviewSchema.post('deleteOne', async function() {
  await this.constructor.updateProductRating(this.product);
});

// Static method to update product rating
reviewSchema.statics.updateProductRating = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, isActive: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      'rating.average': Math.round(stats[0].averageRating * 10) / 10,
      'rating.count': stats[0].totalReviews
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      'rating.average': 0,
      'rating.count': 0
    });
  }
};

// Check if user can review this product
reviewSchema.statics.canUserReview = async function(userId, productId, orderId) {
  // Check if user has already reviewed this product
  const existingReview = await this.findOne({ user: userId, product: productId });
  if (existingReview) {
    return { canReview: false, reason: 'Already reviewed this product' };
  }

  // Check if user has purchased this product
  const order = await mongoose.model('Order').findOne({
    _id: orderId,
    user: userId,
    status: 'delivered',
    'items.product': productId
  });

  if (!order) {
    return { canReview: false, reason: 'Product not purchased or order not delivered' };
  }

  return { canReview: true };
};

// Mark review as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    await this.save();
    return true;
  }
  return false;
};

// Remove helpful mark
reviewSchema.methods.removeHelpful = async function(userId) {
  const index = this.helpful.users.indexOf(userId);
  if (index > -1) {
    this.helpful.users.splice(index, 1);
    this.helpful.count -= 1;
    await this.save();
    return true;
  }
  return false;
};

// Get rating distribution for a product
reviewSchema.statics.getRatingDistribution = async function(productId) {
  const distribution = await this.aggregate([
    { $match: { product: productId, isActive: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distribution.forEach(item => {
    result[item._id] = item.count;
  });

  return result;
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
