import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken, verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getFileUrl } from '../middleware/upload.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      },
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we'll just send a success response
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, addresses } = req.body;
  
  const updateData = {};
  
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone) updateData.phone = phone;
  if (addresses) updateData.addresses = addresses;
  
  // Handle avatar upload
  if (req.file) {
    updateData.avatar = getFileUrl(req, req.file.path);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses
      }
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found with this email'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire time (10 minutes)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  await user.save();

  // In a real application, you would send this token via email
  // For now, we'll return it in the response (only for development)
  res.json({
    success: true,
    message: 'Password reset token sent to email',
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with this token and check if token is not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid or has expired'
    });
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with this token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid or has expired'
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found with this email'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  await user.save();

  // In a real application, you would send this token via email
  res.json({
    success: true,
    message: 'Verification email sent',
    ...(process.env.NODE_ENV === 'development' && { verificationToken })
  });
});
