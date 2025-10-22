import express from 'express';
import { body, query } from 'express-validator';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getNewArrivals,
  searchProducts,
  getProductReviews,
  getProductRatingDistribution
} from '../controllers/productController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/errorHandler.js';
import { uploadProductImages } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['casual', 'formal', 'sports', 'boots', 'sandals', 'loafers'])
    .withMessage('Invalid category'),
  body('variants')
    .isArray({ min: 1 })
    .withMessage('At least one variant is required'),
  body('variants.*.color')
    .trim()
    .notEmpty()
    .withMessage('Color is required for each variant'),
  body('variants.*.sizes')
    .isArray({ min: 1 })
    .withMessage('At least one size is required for each variant'),
  body('variants.*.sizes.*.size')
    .trim()
    .notEmpty()
    .withMessage('Size is required'),
  body('variants.*.sizes.*.price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('variants.*.sizes.*.stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer')
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
  query('category')
    .optional()
    .isIn(['casual', 'formal', 'sports', 'boots', 'sandals', 'loafers'])
    .withMessage('Invalid category filter'),
  query('minPrice')
    .optional()
    .isNumeric()
    .withMessage('Min price must be a number'),
  query('maxPrice')
    .optional()
    .isNumeric()
    .withMessage('Max price must be a number'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'price-low', 'price-high', 'rating', 'popular'])
    .withMessage('Invalid sort option')
];

// Public routes
router.get('/', queryValidation, validate, optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/search', queryValidation, validate, optionalAuth, searchProducts);
router.get('/:id', optionalAuth, getProduct);
router.get('/:id/reviews', getProductReviews);
router.get('/:id/rating-distribution', getProductRatingDistribution);

// Protected routes (Admin only)
router.use(authenticate);
router.use(authorize('admin'));

router.post('/', uploadProductImages, productValidation, validate, createProduct);
router.put('/:id', uploadProductImages, productValidation, validate, updateProduct);
router.delete('/:id', deleteProduct);

export default router;
