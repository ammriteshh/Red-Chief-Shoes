import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    default: 'Red Chief'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['casual', 'formal', 'sports', 'boots', 'sandals', 'loafers'],
    lowercase: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  variants: [{
    color: {
      type: String,
      required: true,
      trim: true
    },
    sizes: [{
      size: {
        type: String,
        required: true
      },
      stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative'],
        default: 0
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      },
      discountedPrice: {
        type: Number,
        min: [0, 'Discounted price cannot be negative']
      },
      sku: {
        type: String,
        unique: true,
        sparse: true
      }
    }]
  }],
  features: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String
    }
  }],
  specifications: {
    material: String,
    sole: String,
    closure: String,
    heelHeight: String,
    weight: String,
    careInstructions: String,
    origin: {
      type: String,
      default: 'India'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  meta: {
    title: String,
    description: String,
    keywords: [String]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ createdAt: -1 });

// Generate slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Calculate average rating
productSchema.methods.calculateRating = function() {
  // This will be called when reviews are updated
  return this.model('Review').aggregate([
    { $match: { product: this._id, isActive: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]).then(result => {
    if (result.length > 0) {
      this.rating.average = Math.round(result[0].averageRating * 10) / 10;
      this.rating.count = result[0].totalReviews;
    } else {
      this.rating.average = 0;
      this.rating.count = 0;
    }
    return this.save();
  });
};

// Get primary image
productSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg ? primaryImg.url : (this.images.length > 0 ? this.images[0].url : '');
});

// Get minimum price
productSchema.virtual('minPrice').get(function() {
  let minPrice = Infinity;
  this.variants.forEach(variant => {
    variant.sizes.forEach(size => {
      const price = size.discountedPrice || size.price;
      if (price < minPrice) minPrice = price;
    });
  });
  return minPrice === Infinity ? 0 : minPrice;
});

// Get maximum price
productSchema.virtual('maxPrice').get(function() {
  let maxPrice = 0;
  this.variants.forEach(variant => {
    variant.sizes.forEach(size => {
      const price = size.discountedPrice || size.price;
      if (price > maxPrice) maxPrice = price;
    });
  });
  return maxPrice;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
