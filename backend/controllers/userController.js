// backend/controllers/userController.js
const { validationResult } = require('express-validator');
const User = require('../models/User');
const DonationPayment = require('../models/DonationPayment');
const { default: mongoose } = require('mongoose');

// @desc    Update logged in user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { firstName, lastName, phone } = req.body;

  try {
    // Get user from req.user (set by protect middleware)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update only allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone; // Allow empty string to remove phone

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const data = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      donationGoal: user.donationGoal
    }

    if (user.role === 'donor') {
      data.totalDonationAmount = (await DonationPayment.aggregate([
        {
          $match: {
            donatee: new mongoose.Types.ObjectId(user._id)
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$donationAmount'
            }
          }
        }
      ]))?.[0]?.total ?? 0
      data.totalDonationRequests = (await DonationPayment.find({
        donatee: user._id
      }).distinct('donationRequest')).length
    }

    res.status(200).json({
      success: true,
      user: data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user donation goal
// @route   PUT /api/users/goal
// @access  Private
exports.updateGoal = async (req, res) => {
  try {
    const { goal } = req.body;

    if (!goal || isNaN(goal) || Number(goal) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid goal amount'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.donationGoal = Number(goal);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      goal: user.donationGoal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating goal'
    });
  }
};
