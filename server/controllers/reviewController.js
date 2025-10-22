import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getFileUrl } from '../middleware/upload.js';

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    rating,
    verified,
    sort = 'newest',
    product
  } = req.query;

  const filter = { isActive: true };
  if (rating) filter.rating = parseInt(rating);
  if (verified !== undefined) filter.verified = verified === 'true';
  if (product) filter.product = product;

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
    .populate('product', 'name images')
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

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
export const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'firstName lastName avatar')
    .populate('product', 'name images')
    .populate('order', 'orderNumber');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  if (!review.isActive && (!req.user || req.user.role !== 'admin')) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  res.json({
    success: true,
    data: { review }
  });
});

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res) => {
  const reviewData = req.body;
  reviewData.user = req.user._id;

  // Check if user can review this product
  const canReview = await Review.canUserReview(
    req.user._id,
    reviewData.product,
    reviewData.order
  );

  if (!canReview.canReview) {
    return res.status(400).json({
      success: false,
      message: canReview.reason
    });
  }

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    reviewData.images = req.files.map(file => ({
      url: getFileUrl(req, file.path),
      alt: file.originalname
    }));
  }

  // Mark as verified if user has purchased the product
  const order = await Order.findOne({
    _id: reviewData.order,
    user: req.user._id,
    status: 'delivered',
    'items.product': reviewData.product
  });

  if (order) {
    reviewData.verified = true;
  }

  const review = await Review.create(reviewData);

  // Populate the created review
  const populatedReview = await Review.findById(review._id)
    .populate('user', 'firstName lastName avatar')
    .populate('product', 'name images')
    .populate('order', 'orderNumber');

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: { review: populatedReview }
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Users can only update their own reviews unless they're admin
  if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const updateData = req.body;

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(file => ({
      url: getFileUrl(req, file.path),
      alt: file.originalname
    }));

    // Merge with existing images or replace
    if (updateData.replaceImages) {
      updateData.images = newImages;
    } else {
      updateData.images = [...(review.images || []), ...newImages];
    }
  }

  // Handle admin response
  if (req.user.role === 'admin' && updateData.message) {
    updateData.adminResponse = {
      message: updateData.message,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };
    delete updateData.message;
  }

  const updatedReview = await Review.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('user', 'firstName lastName avatar')
    .populate('product', 'name images')
    .populate('order', 'orderNumber');

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: { review: updatedReview }
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Users can only delete their own reviews unless they're admin
  if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Soft delete by setting isActive to false
  review.isActive = false;
  await review.save();

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Get user reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getUserReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Review.countDocuments({ user: req.user._id });

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

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markReviewHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  if (!review.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  const wasMarked = await review.markHelpful(req.user._id);

  if (wasMarked) {
    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: { helpfulCount: review.helpful.count }
    });
  } else {
    res.json({
      success: true,
      message: 'You have already marked this review as helpful',
      data: { helpfulCount: review.helpful.count }
    });
  }
});

// @desc    Get review statistics
// @route   GET /api/reviews/stats
// @access  Private
export const getReviewStats = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' ? undefined : req.user._id;
  
  const filter = userId ? { user: userId } : { isActive: true };

  const [
    totalReviews,
    averageRating,
    ratingDistribution,
    verifiedReviews,
    recentReviews
  ] = await Promise.all([
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]),
    Review.countDocuments({ ...filter, verified: true }),
    Review.countDocuments({
      ...filter,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  ]);

  const avgRating = averageRating.length > 0 ? averageRating[0].average : 0;

  // Format rating distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingDistribution.forEach(item => {
    distribution[item._id] = item.count;
  });

  res.json({
    success: true,
    data: {
      reviews: {
        total: totalReviews,
        verified: verifiedReviews,
        recent: recentReviews,
        averageRating: Math.round(avgRating * 10) / 10
      },
      distribution
    }
  });
});
