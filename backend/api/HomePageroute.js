//backend/api/HomePageroute.js
const check = require("express-validator").check


const ShowAllCase = require('../models/ShowAllCasessmodel');
const Story = require('../models/storiesmodel'); 
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/HomePagecontroller');

// routes للحالات العاجلة
router.get('/urgent-cases', homeController.getUrgentCases);

// routes للإحصائيات
router.get('/stats', homeController.getHomeStats);

// routes للقصص الناجحة
router.get('/success-stories', homeController.getSuccessStories);





module.exports = router;