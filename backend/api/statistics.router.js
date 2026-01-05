const express = require('express');
const router = express.Router();
const controller = require('../controllers/statistics.controller.js');

// ملخّصات سريعة
router.get('/total-donations', controller.totalDonations);
router.get('/donors-count', controller.donorsCount);
router.get('/beneficiaries-count', controller.beneficiariesCount);
router.get('/active-campaigns', controller.activeCampaigns);
router.get('/completed-projects', controller.completedProjects);
router.get('/completed-campaigns', controller.completedCampaigns);

// بيانات لرسوم بيانية
router.get('/donation-categories', controller.donationCategories); // تصنيف التبرعات
router.get('/monthly-donors', controller.monthlyDonors); // عدد المتبرعين شهرياً (آخر 12 شهر)
router.get('/monthly-donations', controller.monthlyDonations); // إجمالي التبرعات شهرياً (آخر 12 شهر)
router.get('/average-donation-last-month', controller.averageDonationLastMonth);
router.get('/new-donors-this-month', controller.newDonorsThisMonth);
router.get('/completed-campaigns-this-year', controller.completedCampaignsThisYear);
router.get('/all-Completed-Campaigns', controller.allCompletedCampaigns);

module.exports = router;
