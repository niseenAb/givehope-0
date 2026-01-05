
//backend/api/casedetailsroutes.js
const router = require("express").Router();
const bodyparser = require("body-parser");
const casedetailscontroller = require('../controllers/casedetailscontroller');
const check = require("express-validator").check;

const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:id', casedetailscontroller.getCaseDetails);



module.exports = router;
