const { validationResult } = require('express-validator');
const DonationRequest = require('../models/DonationRequest');

// @desc    Create a new donation request
// @route   POST /api/donation-requests
// @access  Public
exports.createDonationRequest = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      requestType,
      firstName,
      lastName,
      idNumber,
      phoneNumber,
      email,
      city,
      dynamicFields,
      additionalNotes,
      urgencyLevel
    } = req.body;

    // Create donation request
    const donationRequest = await DonationRequest.create({
      userId: req.user ? req.user.id : null, // If user is authenticated
      requestType,
      firstName,
      lastName,
      idNumber,
      phoneNumber,
      totalAmount: dynamicFields?.totalAmount ?? 0,
      totalDonations: 0,
      email,
      city,
      dynamicFields: dynamicFields || {},
      additionalNotes,
      urgencyLevel,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Donation request submitted successfully',
      donationRequest: {
        id: donationRequest._id,
        requestType: donationRequest.requestType,
        firstName: donationRequest.firstName,
        lastName: donationRequest.lastName,
        email: donationRequest.email,
        status: donationRequest.status,
        createdAt: donationRequest.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating donation request'
    });
  }
};

// @desc    Get all donation requests
// @route   GET /api/donation-requests
// @access  Private/Admin
exports.getAllDonationRequests = async (req, res) => {
  try {
    const {
      status,
      requestType,
      urgencyLevel,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;
    if (urgencyLevel) query.urgencyLevel = urgencyLevel;

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const donationRequests = await DonationRequest.find(query)
      .sort(sort)
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName');

    res.status(200).json(donationRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching donation requests'
    });
  }
};

// @desc    Get single donation request by ID
// @route   GET /api/donation-requests/:id
// @access  Private/Admin
exports.getDonationRequestById = async (req, res) => {
  try {
    const donationRequest = await DonationRequest.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName email');

    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    res.status(200).json(donationRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching donation request'
    });
  }
};

// @desc    Get user's own donation requests
// @route   GET /api/donation-requests/my-requests
// @access  Private
exports.getMyDonationRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, requestType } = req.query;

    // Build query for user's email
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;

    // Execute query with pagination
    const donationRequests = await DonationRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Count total documents
    const count = await DonationRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      donationRequests,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalRequests: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your donation requests'
    });
  }
};

// @desc    Update donation request status
// @route   PUT /api/donation-requests/:id/status
// @access  Private/Admin
exports.updateDonationRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const donationRequest = await DonationRequest.findById(req.params.id);

    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    // Update status and review information
    donationRequest.status = status;
    if (adminNotes) donationRequest.adminNotes = adminNotes;
    donationRequest.reviewedBy = req.user.id;
    donationRequest.reviewedAt = Date.now();

    await donationRequest.save();

    res.status(200).json({
      success: true,
      message: 'Donation request status updated successfully',
      donationRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating donation request'
    });
  }
};

// @desc    Delete donation request
// @route   DELETE /api/donation-requests/:id
// @access  Private/Admin
exports.deleteDonationRequest = async (req, res) => {
  try {
    const donationRequest = await DonationRequest.findById(req.params.id);

    if (!donationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found'
      });
    }

    await donationRequest.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Donation request deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting donation request'
    });
  }
};

// @desc    Get donation request statistics
// @route   GET /api/donation-requests/stats
// @access  Private/Admin
exports.getDonationRequestStats = async (req, res) => {
  try {
    const totalRequests = await DonationRequest.countDocuments();
    const pendingRequests = await DonationRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await DonationRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await DonationRequest.countDocuments({ status: 'rejected' });
    const completedRequests = await DonationRequest.countDocuments({ status: 'completed' });

    // Count by request type
    const requestsByType = await DonationRequest.aggregate([
      {
        $group: {
          _id: '$requestType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Count by urgency level
    const requestsByUrgency = await DonationRequest.aggregate([
      {
        $group: {
          _id: '$urgencyLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
        completed: completedRequests,
        byType: requestsByType,
        byUrgency: requestsByUrgency
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};
