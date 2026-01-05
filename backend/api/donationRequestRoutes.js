//backend/api/donationRequestRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  createDonationRequest,
  getAllDonationRequests,
  getDonationRequestById,
  getMyDonationRequests,
  updateDonationRequestStatus,
  deleteDonationRequest,
  getDonationRequestStats
} = require('../controllers/donationRequestController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules for creating donation request
const createDonationRequestValidation = [
  body('requestType')
    .notEmpty()
    .withMessage('Request type is required')
    .isIn(['education', 'health', 'living', 'sponsoring', 'emergency', 'other'])
    .withMessage('Invalid request type'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('idNumber')
    .trim()
    .notEmpty()
    .withMessage('ID number is required')
    .isLength({ max: 20 })
    .withMessage('ID number cannot exceed 20 characters'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 50 })
    .withMessage('City name cannot exceed 50 characters'),
  body('urgencyLevel')
    .notEmpty()
    .withMessage('Urgency level is required')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid urgency level'),
  body('additionalNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Additional notes cannot exceed 1000 characters'),
  body('dynamicFields')
    .optional()
    .isObject()
    .withMessage('Dynamic fields must be an object')
];

// Validation rules for updating status
const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'under_review', 'approved', 'rejected', 'completed'])
    .withMessage('Invalid status'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters')
];

// Public routes
router.post('/', createDonationRequestValidation, createDonationRequest);

// Protected routes (require authentication)
router.get('/my-requests', protect, getMyDonationRequests);

// Admin routes (require authentication - add admin middleware if needed)
router.get('/stats', protect, getDonationRequestStats);
router.get('/', protect, getAllDonationRequests);
router.get('/:id', protect, getDonationRequestById);
router.put('/:id/status', protect, updateStatusValidation, updateDonationRequestStatus);
router.delete('/:id', protect, deleteDonationRequest);

module.exports = router;
