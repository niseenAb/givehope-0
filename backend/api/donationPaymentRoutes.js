//backend/api/donationPaymentRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  createDonationPayment,
  getAllDonationPayments,
  getDonationPaymentById,
  getPaymentsByDonationRequest,
  getPaymentsByDonatee,
  updateDonationPayment,
  updateDonationPaymentStatus,
  deleteDonationPayment,
  getDonationPaymentStats
} = require('../controllers/donationPaymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules for creating donation payment
const createDonationPaymentValidation = [
  body('donationRequest')
    .notEmpty()
    .withMessage('Donation request reference is required')
    .isMongoId()
    .withMessage('Invalid donation request ID'),
  body('donatee')
    .notEmpty()
    .withMessage('Donatee reference is required')
    .isMongoId()
    .withMessage('Invalid donatee ID'),
  body('donationAmount')
    .notEmpty()
    .withMessage('Donation amount is required')
    .isNumeric()
    .withMessage('Donation amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Donation amount must be positive'),
  body('donationDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid status'),
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'cash', 'other'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID cannot exceed 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Validation rules for updating donation payment
const updateDonationPaymentValidation = [
  body('donationAmount')
    .optional()
    .isNumeric()
    .withMessage('Donation amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Donation amount must be positive'),
  body('donationDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid status'),
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'cash', 'other'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID cannot exceed 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Validation rules for updating status
const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'processing', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid status')
];

// Protected routes (require authentication)
router.post('/', protect, createDonationPaymentValidation, createDonationPayment);
router.get('/stats', protect, getDonationPaymentStats);
router.get('/request/:requestId', protect, getPaymentsByDonationRequest);
router.get('/donatee/:donateeId', protect, getPaymentsByDonatee);
router.get('/', protect, getAllDonationPayments);
router.get('/:id', protect, getDonationPaymentById);
router.put('/:id/status', protect, updateStatusValidation, updateDonationPaymentStatus);
router.put('/:id', protect, updateDonationPaymentValidation, updateDonationPayment);
router.delete('/:id', protect, deleteDonationPayment);

module.exports = router;
