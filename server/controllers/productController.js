import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getFileUrl } from '../middleware/upload.js';

// @desc    Get all products with filtering and pagination
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    brand,
    sort = 'newest',
    search
  } = req.query;

  // Build filter object
  const filter = { isActive: true };

  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (search) {
    filter.$text = { $search: search };
  }

  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'price-low':
      sortObj = { minPrice: 1 };
      break;
    case 'price-high':
      sortObj = { minPrice: -1 };
      break;
    case 'rating':
      sortObj = { 'rating.average': -1 };
      break;
    case 'popular':
      sortObj = { 'rating.count': -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const products = await Product.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('category', 'name')
    .lean();

  // Apply price filtering after getting products (since price is virtual)
  let filteredProducts = products;
  if (minPrice || maxPrice) {
    filteredProducts = products.filter(product => {
      const price = product.minPrice || 0;
      if (minPrice && price < parseFloat(minPrice)) return false;
      if (maxPrice && price > parseFloat(maxPrice)) return false;
      return true;
    });
  }

  // Get total count for pagination
  const total = await Product.countDocuments(filter);

  res.json({
    success: true,
    data: {
      products: filteredProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + filteredProducts.length < total,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (!product.isActive && (!req.user || req.user.role !== 'admin')) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: { product }
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const productData = req.body;

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    productData.images = req.files.map((file, index) => ({
      url: getFileUrl(req, file.path),
      alt: productData.images?.[index]?.alt || '',
      isPrimary: index === 0
    }));
  }

  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const updateData = req.body;

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file, index) => ({
      url: getFileUrl(req, file.path),
      alt: updateData.images?.[index]?.alt || '',
      isPrimary: index === 0
    }));

    // Merge with existing images or replace
    if (updateData.replaceImages) {
      updateData.images = newImages;
    } else {
      updateData.images = [...(product.images || []), ...newImages];
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product: updatedProduct }
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  await Product.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    isFeatured: true
  })
    .sort({ 'rating.average': -1 })
    .limit(8)
    .lean();

  res.json({
    success: true,
    data: { products }
  });
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
export const getNewArrivals = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    isNewArrival: true
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  res.json({
    success: true,
    data: { products }
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
export const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const products = await Product.find({
    $text: { $search: q },
    isActive: true
  })
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Product.countDocuments({
    $text: { $search: q },
    isActive: true
  });

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, rating, sort = 'newest' } = req.query;

  const filter = {
    product: req.params.id,
    isActive: true
  };

  if (rating) {
    filter.rating = parseInt(rating);
  }

  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'rating-high':
      sortObj = { rating: -1 };
      break;
    case 'rating-low':
      sortObj = { rating: 1 };
      break;
    case 'helpful':
      sortObj = { 'helpful.count': -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await Review.find(filter)
    .populate('user', 'firstName lastName avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Review.countDocuments(filter);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total,
        hasNext: skip + reviews.length < total,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// @desc    Get product rating distribution
// @route   GET /api/products/:id/rating-distribution
// @access  Public
export const getProductRatingDistribution = asyncHandler(async (req, res) => {
  const distribution = await Review.getRatingDistribution(req.params.id);

  res.json({
    success: true,
    data: { distribution }
  });
});
