const { Router } = require('express');
const controller = require('../controllers/topDonors.controller.js');

const router = Router();

router.get("/", controller.getTopDonors);
router.get("/donors-count", controller.donorsCount);
router.get("/total-donations", controller.totalDonations);
router.get("/supported-projects", controller.supportedProjects);
router.get("/projects-success-rate", controller.projectSuccessRate);

module.exports = router;
