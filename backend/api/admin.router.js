// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller.js');
const auth = require('../middleware/authMiddleware.js');
const { protect, authorize } = auth;
const { fileUpload, fileValidation } = require('../utils/multer.js');

//حماية كل الراوتر
router.use(protect);
router.use(authorize('admin'));

// ===== Donations =====
router.get('/donations',protect, authorize('admin'),adminController.getAllDonations);
router.get('/donations/:id',protect, authorize('admin'), adminController.getDonation);
router.put('/donations/:id/reject',protect, authorize('admin'),  adminController.rejectDonation);
router.put('/donations/:id/approve',protect, authorize('admin'), adminController.approveDonation);

// ===== Users =====
router.get('/users',protect, authorize('admin'), adminController.getAllUsers);
router.get('/users/:id',protect, authorize('admin'),adminController.getUser);
router.put('/users/:id',protect, authorize('admin'),  adminController.updateUser);
router.put('/users/:id/status',protect, authorize('admin'),  adminController.updateUserStatus);
router.delete('/users/:id',protect, authorize('admin'), adminController.deleteUser);

// ===== Requests =====
router.get('/requests',protect, authorize('admin'),  adminController.getAllDonationRequests);
router.get('/requests/stat', protect, authorize('admin'), adminController.getDonationRequestsStats);
router.put('/requests/:id/underReview',protect, authorize('admin'), adminController.markUnderReview);
router.put('/requests/:id/approved',protect, authorize('admin'), adminController.markApproved);
router.put('/requests/:id/rejected', protect, authorize('admin'), adminController.markRejected );
router.get('/requests/:id', protect, authorize('admin'), adminController.getDonationRequestById);

// ===== Reports =====
router.get('/reports', protect, authorize('admin'),  adminController.getReport);

// ===== Settings =====
router.put(
  '/settings',protect, authorize('admin'),
  fileUpload(fileValidation.image).fields([{ name: 'profilePic', maxCount: 1 }]),
  adminController.updateSettings
);

router.get('/settings/check-email', protect, authorize('admin'), adminController.checkEmail);
// ===== Dashboard =====
router.get('/dashboard', protect, authorize('admin'), adminController.dashboardStats);
router.get('/dashboard/latest-requests',protect, authorize('admin'), adminController.latestRequests);
router.get('/dashboard/latest-donations', protect, authorize('admin'), adminController.latestDonations);

// ===== Admin Profile =====
router.get('/me',protect, authorize('admin'), adminController.getAdminProfile);



// جلب عدد القصص المعلقة (لعداد الجرس)
router.get('/stories/pending/count',protect, authorize('admin'), adminController.getPendingStoriesCount);

// جلب قائمة القصص المعلقة
router.get('/stories/pending',protect, authorize('admin'), adminController.getPendingStories);
router.get('/stories/:id',protect, authorize('admin'), adminController.getStoryById);

// الموافقة على قصة
router.put('/stories/:id/approve',protect, authorize('admin'), adminController.approveStory);

// رفض / حذف القصة
router.put('/stories/:id/reject',protect, authorize('admin'), adminController.rejectAdminStory);

module.exports = router;
