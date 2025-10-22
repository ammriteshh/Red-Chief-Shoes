import express from 'express';
import { body, query } from 'express-validator';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  cancelOrder,
  getUserOrders,
  getOrderStats
} from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/my-orders', getUserOrders);
router.get('/stats', getOrderStats);

// Order validation
const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.variant.color')
    .trim()
    .notEmpty()
    .withMessage('Color is required'),
  body('items.*.variant.size')
    .trim()
    .notEmpty()
    .withMessage('Size is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('payment.method')
    .isIn(['cod', 'card', 'upi', 'netbanking', 'wallet'])
    .withMessage('Invalid payment method')
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
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid status filter'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'total-high', 'total-low'])
    .withMessage('Invalid sort option')
];

// User can create orders
router.post('/', orderValidation, validate, createOrder);
router.get('/:id', getOrder);

// Admin routes
router.use(authorize('admin'));

router.get('/', queryValidation, validate, getOrders);
router.put('/:id', updateOrder);
router.put('/:id/cancel', cancelOrder);

export default router;
