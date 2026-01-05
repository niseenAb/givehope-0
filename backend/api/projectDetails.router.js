const { Router } = require('express');
const {
  getProjectFullDetails,
  getProjectReports,
  addReport,
  updateReportName,
  deleteReport
} = require('../controllers/projectDetails.controller');
const { fileUpload, fileValidation } = require('../utils/multer');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = Router();

// جلب جميع التفاصيل (بيانات المشروع + التقارير)
router.get('/:id', getProjectFullDetails);

router.get('/:id/report', getProjectReports);
router.post('/:id/report',protect, authorize('admin'), fileUpload(fileValidation.pdf).fields([{ name: 'report', maxCount: 1 }]),addReport);
router.put('/:projectId/report/:reportId',protect, authorize('admin'), updateReportName);
router.delete('/:projectId/report/:reportId',protect, authorize('admin'), deleteReport);

module.exports = router;
