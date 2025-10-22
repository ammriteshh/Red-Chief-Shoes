import express from 'express';
import { body, query } from 'express-validator';
import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
  markReviewHelpful,
  getReviewStats
} from '../controllers/reviewController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/errorHandler.js';
import { uploadReviewImages } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Review validation
const reviewValidation = [
  body('product')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('order')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Review title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('pros')
    .optional()
    .isArray()
    .withMessage('Pros must be an array'),
  body('cons')
    .optional()
    .isArray()
    .withMessage('Cons must be an array')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating filter must be between 1 and 5'),
  query('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified filter must be a boolean'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'rating-high', 'rating-low', 'helpful'])
    .withMessage('Invalid sort option')
];

// User routes
router.get('/my-reviews', getUserReviews);
router.get('/stats', getReviewStats);
router.post('/', uploadReviewImages, reviewValidation, validate, createReview);
router.put('/:id', uploadReviewImages, reviewValidation, validate, updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markReviewHelpful);

// Public routes (for product reviews)
router.get('/', queryValidation, validate, getReviews);
router.get('/:id', getReview);

// Admin routes
router.use(authorize('admin'));

// Admin can manage all reviews
router.put('/:id/admin-response', [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Response message is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Response must be between 5 and 500 characters')
], validate, updateReview);

export default router;
