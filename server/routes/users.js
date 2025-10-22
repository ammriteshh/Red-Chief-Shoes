import express from 'express';
import { body, query } from 'express-validator';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserOrders,
  getUserReviews,
  getAdminStats
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User routes (users can access their own data)
router.get('/profile', getUser);
router.put('/profile', updateUser);
router.get('/orders', getUserOrders);
router.get('/reviews', getUserReviews);

// Admin routes
router.use(authorize('admin'));

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Invalid role filter'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const userUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid phone number'),
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

router.get('/', queryValidation, validate, getUsers);
router.get('/stats', getAdminStats);
router.get('/:id', getUser);
router.put('/:id', userUpdateValidation, validate, updateUser);
router.delete('/:id', deleteUser);

export default router;
