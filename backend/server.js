// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

dotenv.config();

const app = express();

// ================================
// Middlewares عامة
// ================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//Frontend static
app.use(express.static(path.join(__dirname, '..')));

// ✅ Static files — آمنة ومحددة
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/public/sponsor', express.static(path.join(__dirname, '../public/sponsor')));


// ================================
// Multer setup — لرفع الصور
// ================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    if (ext && mimeType) return cb(null, true);
    cb(new Error('Only JPEG, JPG, PNG, WEBP allowed'));
  }
});

// ================================
// Routes — ✅ جميعها مضبوطة ومُفعَّلة
// ================================

// ✅ Authentication
const authRoutes = require('./api/authRoutes');
app.use('/api/auth', authRoutes);

// ✅ Users
const userRoutes = require('./api/userRoutes');
app.use('/api/users', userRoutes);

// ✅ Donation Requests (ملاحظة: الاسم الصحيح — لا يحتوي typo)
const donationRequestRoutes = require('./api/donationRequestRoutes'); // 
app.use('/api/donation-requests', donationRequestRoutes);

// ✅ Donation (تبرعات مباشرة)
const donationRoutes = require('./api/donationRoutes');
app.use('/api/donations', donationRoutes); // ← مسار منطقي: /api/donations

// ✅ Donation Payments (دفعات إدارية/مخصصة)
const donationPaymentRoutes = require('./api/donationPaymentRoutes');
app.use('/api/donation-payments', donationPaymentRoutes);

// ✅ Campaigns — ✅ باستخدام routes جاهزة + middleware الأمان
const campaignRoutes = require('./api/campaignRoutes');
app.use('/api/campaigns', campaignRoutes);

// ✅ Sponsorships
const sponsorshipRoutes = require('./api/sponsorshipRoutes');
app.use('/api/sponsorships', sponsorshipRoutes);

// ✅ Cases (ShowAllCasess)
const casesRoutes = require('./api/ShowAllCasessroute');
app.use('/api/cases', casesRoutes); // ← استخدام مسار منطقي: /api/cases

// ✅ Case Details (مع route واحد فقط)
const caseDetailsRoutes = require('./api/casedetailsroute');
app.use('/api/case', caseDetailsRoutes); // GET /api/case/:id

// ✅ Stories
const storiesRoutes = require('./api/storiesroute');
app.use('/api/stories', storiesRoutes);

// ✅ Complaints
const complaintRoutes = require('./api/complaints');
app.use('/api/complaints', complaintRoutes);

// ✅ Zakat
const zakatRoutes = require('./api/zakat');
app.use('/api/zakat', zakatRoutes);
const zakatRatesRoutes = require('./api/zakatRates');
app.use('/api/zakat', zakatRatesRoutes); // GET /api/zakat/rates

// ✅ Homepage stats & urgent cases
const homePageRoutes = require('./api/HomePageroute');
app.use('/api/home', homePageRoutes); // GET /api/home/stats, /api/home/urgent-cases, ...

// ✅ Notifications — مُفعَّلة الآن ✅
const notificationRoutes = require('./api/notifications');
app.use('/api/notifications', notificationRoutes);

// ✅ project
const projectRouter = require("./api/project.router.js");
app.use('/api/project', projectRouter);

// ✅ projectDetails
const projectDetailsRouter = require("./api/projectDetails.router.js");
  app.use('/api/project/details', projectDetailsRouter);

// ✅ statistics
const statisticsRoutes = require('./api/statistics.router.js');
    app.use('/api/statistics', statisticsRoutes);

 // ✅ topDonors   
 const topDonorsRoutes = require('./api/topDonors.router.js'); 
    app.use('/api/topDonors', topDonorsRoutes);

  // ✅ admin
  const adminRoutes = require('./api/admin.router.js');   
    app.use('/api/admin', adminRoutes);

// ================================
// Database Connection
// ================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/givehope', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ================================
// Error Handling Middleware
// ================================
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ================================
// Start Server
// ================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
