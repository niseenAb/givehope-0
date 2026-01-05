// backend/controllers/donationPaymentController.js
const { validationResult } = require('express-validator');
const DonationPayment = require('../models/DonationPayment');

// @desc    Create a new donation payment
// @route   POST /api/donation-payments
// @access  Private
exports.createDonationPayment = async (req, res) => {
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
      donationRequest,
      donatee,
      donationAmount,
      donationDate,
      status,
      paymentMethod,
      transactionId,
      notes
    } = req.body;

    // Create donation payment
    const donationPayment = await DonationPayment.create({
      donationRequest,
      donatee,
      donationAmount,
      donationDate: donationDate || Date.now(),
      status: status || 'pending',
      paymentMethod,
      transactionId,
      notes
    });

    // Populate references
    await donationPayment.populate('donationRequest');
    await donationPayment.populate('donatee', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Donation payment created successfully',
      donationPayment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating donation payment',
      error: error.message
    });
  }
};

// @desc    Get all donation payments
// @route   GET /api/donation-payments
// @access  Private/Admin
exports.getAllDonationPayments = async (req, res) => {
  try {
    const {
      status,
      donatee,
      page = 1,
      limit = 10,
      sortBy = 'donationDate',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (donatee) query.donatee = donatee;

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const donationPayments = await DonationPayment.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donationRequest')
      .populate('donatee', 'firstName lastName email');

    // Count total documents
    const count = await DonationPayment.countDocuments(query);

    res.status(200).json({
      success: true,
      donationPayments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPayments: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching donation payments'
    });
  }
};

// @desc    Get single donation payment by ID
// @route   GET /api/donation-payments/:id
// @access  Private
exports.getDonationPaymentById = async (req, res) => {
  try {
    const donationPayment = await DonationPayment.findById(req.params.id)
      .populate('donationRequest')
      .populate('donatee', 'firstName lastName email phone');

    if (!donationPayment) {
      return res.status(404).json({
        success: false,
        message: 'Donation payment not found'
      });
    }

    res.status(200).json({
      success: true,
      donationPayment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching donation payment'
    });
  }
};

// @desc    Get payments by donation request
// @route   GET /api/donation-payments/request/:requestId
// @access  Private
exports.getPaymentsByDonationRequest = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = { donationRequest: req.params.requestId };

    const donationPayments = await DonationPayment.find(query)
      .sort({ donationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donatee', 'firstName lastName email');

    const count = await DonationPayment.countDocuments(query);

    res.status(200).json({
      success: true,
      donationPayments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPayments: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments for donation request'
    });
  }
};

// @desc    Get payments by donatee
// @route   GET /api/donation-payments/donatee/:donateeId
// @access  Private
exports.getPaymentsByDonatee = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { donatee: req.params.donateeId };
    if (status) query.status = status;

    const donationPayments = await DonationPayment.find(query)
      .sort({ donationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donationRequest');

    const count = await DonationPayment.countDocuments(query);

    res.status(200).json({
      success: true,
      donationPayments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPayments: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments for donatee'
    });
  }
};

// @desc    Update donation payment
// @route   PUT /api/donation-payments/:id
// @access  Private/Admin
exports.updateDonationPayment = async (req, res) => {
  try {
    const {
      donationAmount,
      donationDate,
      status,
      paymentMethod,
      transactionId,
      notes
    } = req.body;

    const donationPayment = await DonationPayment.findById(req.params.id);

    if (!donationPayment) {
      return res.status(404).json({
        success: false,
        message: 'Donation payment not found'
      });
    }

    // Update fields
    if (donationAmount !== undefined) donationPayment.donationAmount = donationAmount;
    if (donationDate !== undefined) donationPayment.donationDate = donationDate;
    if (status !== undefined) donationPayment.status = status;
    if (paymentMethod !== undefined) donationPayment.paymentMethod = paymentMethod;
    if (transactionId !== undefined) donationPayment.transactionId = transactionId;
    if (notes !== undefined) donationPayment.notes = notes;

    await donationPayment.save();

    // Populate references
    await donationPayment.populate('donationRequest');
    await donationPayment.populate('donatee', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Donation payment updated successfully',
      donationPayment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating donation payment'
    });
  }
};

// @desc    Update donation payment status
// @route   PUT /api/donation-payments/:id/status
// @access  Private/Admin
exports.updateDonationPaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const donationPayment = await DonationPayment.findById(req.params.id);

    if (!donationPayment) {
      return res.status(404).json({
        success: false,
        message: 'Donation payment not found'
      });
    }

    donationPayment.status = status;
    await donationPayment.save();

    res.status(200).json({
      success: true,
      message: 'Donation payment status updated successfully',
      donationPayment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status'
    });
  }
};

// @desc    Delete donation payment
// @route   DELETE /api/donation-payments/:id
// @access  Private/Admin
exports.deleteDonationPayment = async (req, res) => {
  try {
    const donationPayment = await DonationPayment.findById(req.params.id);

    if (!donationPayment) {
      return res.status(404).json({
        success: false,
        message: 'Donation payment not found'
      });
    }

    await donationPayment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Donation payment deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting donation payment'
    });
  }
};

// @desc    Get donation payment statistics
// @route   GET /api/donation-payments/stats
// @access  Private/Admin
exports.getDonationPaymentStats = async (req, res) => {
  try {
    const totalPayments = await DonationPayment.countDocuments();
    const pendingPayments = await DonationPayment.countDocuments({ status: 'pending' });
    const processingPayments = await DonationPayment.countDocuments({ status: 'processing' });
    const completedPayments = await DonationPayment.countDocuments({ status: 'completed' });
    const failedPayments = await DonationPayment.countDocuments({ status: 'failed' });
    const refundedPayments = await DonationPayment.countDocuments({ status: 'refunded' });

    // Calculate total donation amount
    const totalAmount = await DonationPayment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$donationAmount' } } }
    ]);

    // Payments by status
    const paymentsByStatus = await DonationPayment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$donationAmount' }
        }
      }
    ]);

    // Payments by payment method
    const paymentsByMethod = await DonationPayment.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalPayments,
        pending: pendingPayments,
        processing: processingPayments,
        completed: completedPayments,
        failed: failedPayments,
        refunded: refundedPayments,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        byStatus: paymentsByStatus,
        byMethod: paymentsByMethod
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
