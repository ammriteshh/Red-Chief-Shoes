import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    sort = 'newest',
    search
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
      { 'shippingAddress.lastName': { $regex: search, $options: 'i' } },
      { 'shippingAddress.email': { $regex: search, $options: 'i' } }
    ];
  }

  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'total-high':
      sortObj = { 'pricing.total': -1 };
      break;
    case 'total-low':
      sortObj = { 'pricing.total': 1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(filter)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name images')
    .sort(sortObj)
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('items.product', 'name images variants');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Users can only access their own orders unless they're admin
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { order }
  });
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const orderData = req.body;
  orderData.user = req.user._id;

  // Validate products and calculate pricing
  let subtotal = 0;
  const validatedItems = [];

  for (const item of orderData.items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return res.status(400).json({
        success: false,
        message: `Product not found: ${item.product}`
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: `Product is not available: ${product.name}`
      });
    }

    // Find the specific variant and size
    const variant = product.variants.find(v => v.color === item.variant.color);
    if (!variant) {
      return res.status(400).json({
        success: false,
        message: `Color not available: ${item.variant.color}`
      });
    }

    const size = variant.sizes.find(s => s.size === item.variant.size);
    if (!size) {
      return res.status(400).json({
        success: false,
        message: `Size not available: ${item.variant.size}`
      });
    }

    if (size.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.name} (${item.variant.color}, ${item.variant.size})`
      });
    }

    const price = size.discountedPrice || size.price;
    subtotal += price * item.quantity;

    validatedItems.push({
      product: item.product,
      variant: item.variant,
      quantity: item.quantity,
      price: size.price,
      discountedPrice: size.discountedPrice
    });
  }

  // Calculate shipping cost (free shipping over $100)
  const shippingCost = subtotal >= 100 ? 0 : 10;
  
  // Calculate tax (10% of subtotal)
  const tax = subtotal * 0.1;
  
  // Calculate total
  const total = subtotal + shippingCost + tax - (orderData.pricing?.discount || 0);

  orderData.items = validatedItems;
  orderData.pricing = {
    subtotal,
    shippingCost,
    tax,
    discount: orderData.pricing?.discount || 0,
    total
  };

  const order = await Order.create(orderData);

  // Update product stock
  for (const item of validatedItems) {
    const product = await Product.findById(item.product);
    const variant = product.variants.find(v => v.color === item.variant.color);
    const size = variant.sizes.find(s => s.size === item.variant.size);
    
    size.stock -= item.quantity;
    await product.save();
  }

  // Populate the created order
  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name images');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order: populatedOrder }
  });
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private/Admin
export const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const updateData = req.body;

  // Update tracking information
  if (updateData.tracking) {
    order.tracking = { ...order.tracking, ...updateData.tracking };
  }

  // Update status
  if (updateData.status) {
    order.status = updateData.status;
    
    // Set timestamps based on status
    if (updateData.status === 'shipped' && !order.tracking.shippedAt) {
      order.tracking.shippedAt = new Date();
    }
    if (updateData.status === 'delivered' && !order.tracking.deliveredAt) {
      order.tracking.deliveredAt = new Date();
    }
  }

  // Update admin notes
  if (updateData.notes?.admin) {
    order.notes.admin = updateData.notes.admin;
  }

  await order.save();

  const updatedOrder = await Order.findById(order._id)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name images');

  res.json({
    success: true,
    message: 'Order updated successfully',
    data: { order: updatedOrder }
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Users can only cancel their own orders unless they're admin
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (!order.canBeCancelled()) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  order.status = 'cancelled';
  order.cancellation = {
    reason: req.body.reason || 'Cancelled by user',
    cancelledAt: new Date(),
    cancelledBy: req.user.role === 'admin' ? 'admin' : 'customer'
  };

  // Restore product stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    const variant = product.variants.find(v => v.color === item.variant.color);
    const size = variant.sizes.find(s => s.size === item.variant.size);
    
    size.stock += item.quantity;
    await product.save();
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order }
  });
});

// @desc    Get user orders
// @route   GET /api/orders/my-orders
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

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
export const getOrderStats = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' ? undefined : req.user._id;
  
  const filter = userId ? { user: userId } : {};

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    averageOrderValue
  ] = await Promise.all([
    Order.countDocuments(filter),
    Order.countDocuments({ ...filter, status: 'pending' }),
    Order.countDocuments({ ...filter, status: 'confirmed' }),
    Order.countDocuments({ ...filter, status: 'shipped' }),
    Order.countDocuments({ ...filter, status: 'delivered' }),
    Order.countDocuments({ ...filter, status: 'cancelled' }),
    Order.aggregate([
      { $match: { ...filter, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]),
    Order.aggregate([
      { $match: { ...filter, status: 'delivered' } },
      { $group: { _id: null, average: { $avg: '$pricing.total' } } }
    ])
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
  const avgValue = averageOrderValue.length > 0 ? averageOrderValue[0].average : 0;

  res.json({
    success: true,
    data: {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      revenue: {
        total: revenue,
        averageOrderValue: avgValue
      }
    }
  });
});
