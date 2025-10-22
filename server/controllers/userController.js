import User from '../models/User.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    search
  } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Users can only access their own data unless they're admin
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Users can only update their own data unless they're admin
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const updateData = req.body;

  // Only admins can change role and isActive
  if (req.user.role !== 'admin') {
    delete updateData.role;
    delete updateData.isActive;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from deleting themselves
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
export const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(filter)
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Order.countDocuments(filter);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// @desc    Get user reviews
// @route   GET /api/users/reviews
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

// @desc    Get admin statistics
// @route   GET /api/users/stats
// @access  Private/Admin
export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCustomers,
    totalAdmins,
    activeUsers,
    inactiveUsers,
    recentUsers,
    totalOrders,
    totalRevenue,
    totalReviews
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]),
    Review.countDocuments()
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        admins: totalAdmins,
        active: activeUsers,
        inactive: inactiveUsers,
        recent: recentUsers
      },
      orders: {
        total: totalOrders
      },
      revenue: {
        total: revenue
      },
      reviews: {
        total: totalReviews
      }
    }
  });
});
