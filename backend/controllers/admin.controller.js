// controllers/adminController.js

const Donation = require('../models/Donationmodel.js');
const Request = require('../models/DonationRequest.js');
const User = require('../models/User.js');
const Campaign = require('../models/Campaign.js');
const bcrypt = require('bcryptjs');
const Case = require('../models/ShowAllCasessmodel.js');
const Project = require('../models/project.model.js');
const Sponsorship = require('../models/Sponsorship.js'); 
const Story = require('../models/storiesmodel.js');
const cloudinary = require('../utils/cloudinary');

// ===== USERS =====

// جلب كل المستخدمين
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// حذف المستخدم
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Admins cannot be deleted' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// تحديث حالة المستخدم
exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

       if (user.role === "admin") {
      return res.status(403).json({ message: "Admin status cannot be changed" });
    }

    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();

    res.json({
      message: "User status updated",
      status: user.status
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }

};

// تحديث بيانات المستخدم
exports.updateUser = async (req, res) => {
  try {
    if (req.body.password) return res.status(400).json({ message: 'Use /update-password to change password' });
    
  // if (emailExists) return res.status(400).json({ success: false, message: 'هذا البريد الإلكتروني مستخدم بالفعل' });
    
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// جلب مستخدم واحد
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



// ===== DONATION REQUESTS =====

// جلب كل الطلبات للأدمن
exports.getAllDonationRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, donationRequests: requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// جلب طلب واحد حسب ID
exports.getDonationRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.status(200).json({ success: true, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



exports.markUnderReview = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
 const { adminNotes } = req.body;
    request.status = 'under_review';
    //request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
   request.adminNotes =adminNotes && adminNotes.trim().length > 0
        ? adminNotes
        : 'الطلب قيد المراجعة من قبل الإدارة';

    await request.save();
    res.status(200).json({ success: true, message: 'تم وضع الطلب قيد المراجعة', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// تحديث الحالة إلى "موافق"
// exports.markApproved = async (req, res) => {
//   try {
//     const request = await Request.findById(req.params.id);
    
//     if (!request) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

//     request.status = 'approved';
//    // request.reviewedBy = req.user.id;
//      request.reviewedAt = new Date();
//      request.adminNotes ='تم الموافقة على طلبك';
//     await request.save();
//     res.status(200).json({ success: true, message: 'تم الموافقة على الطلب', request });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// تحديث الحالة إلى "موافق" وحفظ وصف الكفالة
exports.markApproved = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    
    if (!request) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

    request.status = 'approved';
    request.reviewedAt = new Date();
    
    // تحديث ملاحظات الأدمن
    request.adminNotes = 'تم الموافقة على طلبك';
    
    // دمج أو تعيين وصف الكفالة إذا موجود في body
    if (req.body.additionalNotes) {
     request.additionalNotes = req.body.additionalNotes;
      } else {
            request.additionalNotes = '-';      
    }

    await request.save();
    res.status(200).json({ success: true, message: 'تم الموافقة على الطلب', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// تحديث الحالة إلى "مرفوض"
exports.markRejected = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

    if (!adminNotes || adminNotes?.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'يجب إدخال سبب الرفض' });
    }

    request.status = 'rejected';
    request.adminNotes = adminNotes;
   // request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();

    await request.save();
    res.status(200).json({ success: true, message: 'تم رفض الطلب', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// إحصائيات الطلبات  
exports.getDonationRequestsStats = async (req, res) => {
  try {
    const [
      newRequests,
      processingRequests,
      completedRequests,
      rejectedRequests
    ] = await Promise.all([
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'under_review' }),
      Request.countDocuments({ status: 'approved' }),
      Request.countDocuments({ status: 'rejected' })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        pending: newRequests,
        under_review: processingRequests,
        completed: completedRequests,
        rejected: rejectedRequests
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// ===== REPORTS =====


exports.getReport = async (req, res) => {
  try {
    const { period } = req.query;
    const monthsForCards = [1, 3, 6, 12].includes(Number(period)) ? Number(period) : 12;

    // ======== تحديد الفترة الحالية ========
    const currentStart = new Date();
    if (monthsForCards === 1) {
      currentStart.setDate(1);
    } else {
      currentStart.setMonth(currentStart.getMonth() - (monthsForCards - 1));
      currentStart.setDate(1);
    }
    currentStart.setHours(0, 0, 0, 0);

    const currentEnd = new Date(); // اليوم الحالي

    // ======== نفس الفترة من العام الماضي ========
    const lastYearStart = new Date(currentStart);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);

    const lastYearEnd = new Date(currentEnd);
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

    // ======== التبرعات الحالية ========
    const currentDonations = await Donation.find({
      donationDate: { $gte: currentStart, $lte: currentEnd },
      status: "completed"
    });

    const lastYearDonations = await Donation.find({
      donationDate: { $gte: lastYearStart, $lte: lastYearEnd },
      status: "completed"
    });

    // ======== إجمالي المبلغ ========
    const currentTotalAmount = currentDonations.reduce((sum, d) => sum + d.amount, 0);
    const lastYearTotalAmount = lastYearDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalAmountChange = lastYearTotalAmount > 0
      ? ((currentTotalAmount - lastYearTotalAmount) / lastYearTotalAmount) * 100
      : 0;

    // ======== عدد المتبرعين ========
    const currentTotalDonors = new Set(currentDonations.map(d => d.donorInfo.userId?.toString())).size;
    const lastYearTotalDonors = new Set(lastYearDonations.map(d => d.donorInfo.userId?.toString())).size;
    const totalDonorsChange = lastYearTotalDonors > 0
      ? ((currentTotalDonors - lastYearTotalDonors) / lastYearTotalDonors) * 100
      : 0;

    // ======== متوسط التبرع ========
    const currentAvgDonation = currentTotalDonors > 0
      ? Math.round(currentTotalAmount / currentTotalDonors)
      : 0;
    const lastYearAvgDonation = lastYearTotalDonors > 0
      ? Math.round(lastYearTotalAmount / lastYearTotalDonors)
      : 0;
    const avgDonationChange = lastYearAvgDonation > 0
      ? ((currentAvgDonation - lastYearAvgDonation) / lastYearAvgDonation) * 100
      : 0;

    // ======== الحملات النشطة ========
    const activeCampaigns = await Campaign.countDocuments({ status: "active" });

    // ======== التبرعات الشهرية آخر 12 شهر ========
    const monthsForChart = 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (monthsForChart - 1));
    startDate.setDate(1);
    startDate.setHours(0,0,0,0);

    const donationsForChart = await Donation.find({
      donationDate: { $gte: startDate },
      status: "completed"
    });

    const monthlyData = Array.from({ length: monthsForChart }, (_, i) => {
      const month = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const monthDonations = donationsForChart.filter(d => 
        d.donationDate.getMonth() === month.getMonth() &&
        d.donationDate.getFullYear() === month.getFullYear()
      );
      return {
        month: month.toLocaleString("ar-EG", { month: "long" }),
        amount: monthDonations.reduce((sum, d) => sum + d.amount, 0)
      };
    });

    const monthlyDonors = Array.from({ length: monthsForChart }, (_, i) => {
  const month = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);

  // فلترة التبرعات لهذا الشهر
  const monthDonations = donationsForChart.filter(d =>
    d.donationDate.getMonth() === month.getMonth() &&
    d.donationDate.getFullYear() === month.getFullYear()
  );

  // عدد المتبرعين الفريدين
  const uniqueDonors = new Set(monthDonations.map(d => d.donorInfo.userId?.toString()));

  return {
    month: month.toLocaleString("ar-EG", { month: "long" }),
    count: uniqueDonors.size
  };
});


    // التصنيفات بالعربي
    const categorySums = {
      "تعليمية": 0,
      "معيشية": 0,
      "صحية": 0,
      "رعاية أيتام": 0,
      "أخرى": 0,
    };

    // خريطة لتحويل القيم الإنجليزية إلى العربية
    const translateCategory = {
      education: "تعليمية",
      living: "معيشية",
      health: "صحية",
      orphans: "رعاية أيتام",
      other: "أخرى",
    };

    // دالة لجمع المبالغ حسب اسم الحقل
    const collect = (items, categoryField, amountField) => {
      items.forEach(item => {
        let cat = item[categoryField];
        if (!cat) return;

        // تحويل من الانجليزي للعربي إذا موجود
        if (translateCategory[cat]) cat = translateCategory[cat];

        if (categorySums[cat] !== undefined) {
          const amount = item[amountField] || 0;
          categorySums[cat] += amount;
        }
      });
    };

    // جلب كل البيانات
    const [projects, casesList, sponsorships] = await Promise.all([
      Project.find(),
      Case.find(),
      Sponsorship.find(),
    ]);

    // جمع التبرعات حسب التصنيف لكل موديل مع الحقل الخاص بالمبلغ
    collect(projects, 'category', 'collectedAmount');      // projects.category & projects.collectedAmount
    collect(casesList, 'type', 'donated');          // cases.type & cases.donated
    collect(sponsorships, 'type', 'amountPerPeriod');     // sponsorships.type & sponsorships.amountPerPeriod

   console.log("Period received:", req.query.period);

    // ======== إرسال البيانات ========
    res.status(200).json({
      totalAmount: { value: currentTotalAmount, change: totalAmountChange },
      totalDonors: { value: currentTotalDonors, change: totalDonorsChange },
      avgDonation: { value: currentAvgDonation, change: avgDonationChange },
      activeCampaigns: { value: activeCampaigns },
      monthlyData,
      monthlyDonors,
      categories: categorySums 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};




// ===== DASHBOARD =====


exports.updateSettings = async (req, res) => {
  const {firstName, lastName, email, phone, oldPassword, newPassword, removeProfilePic } = req.body;

  try {
     
    const adminId =req.user._id;
    const admin = await User.findById(adminId).select('+password');
    if (!admin) return res.status(404).json({ success: false, message: "الأدمن غير موجود" });

    // =====================================================
    // 1️⃣ رفع صورة جديدة (req.files.profilePic)
    // =====================================================
    if (req.files?.profilePic) {
      if (admin.profilePic?.publicId) {
        await cloudinary.uploader.destroy(admin.profilePic.publicId);
      }

      const uploaded = await cloudinary.uploader.upload(req.files.profilePic[0].path, {
        folder: `${process.env.APP_NAME}/admin/${admin.firstName}`,
      });

      admin.profilePic = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id
      };
    }

    // =====================================================
    // 2️⃣ إزالة صورة البروفايل نهائياً وإرجاع الافتراضية
    // =====================================================
    if (removeProfilePic === "true") {
      if (admin.profilePic?.publicId) {
        await cloudinary.uploader.destroy(admin.profilePic.publicId);
      }

      admin.profilePic = { url: "../../images/profile-icon.jpg", publicId: null };
    }

    // =====================================================
    // 3️⃣ تحديث البريد
    // =====================================================
    if (email && email !== admin.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ success: false, message: "هذا البريد مستخدم بالفعل" });
      }
      admin.email = email;
    }

    // =====================================================
    // 4️⃣ تحديث كلمة المرور مع تحقق
    // =====================================================
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ success: false, message: "يجب إدخال كلمة المرور الحالية لتغييرها" });
      }

      const match = await bcrypt.compare(oldPassword, admin.password);
      if (!match) {
        return res.status(400).json({ success: false, message: "كلمة المرور الحالية غير صحيحة" });
      }

      admin.password = await bcrypt.hash(newPassword, 10);
    }

    // =====================================================
    // 5️⃣ تحديث باقي الحقول
    // =====================================================
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;

    await admin.save();

    // =====================================================
    // 6️⃣ الرد للفرونت
    // =====================================================
    res.json({
      success: true,
      user: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        profilePic: admin.profilePic,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
  }
};


exports.checkEmail = async (req, res) => {
  try {
     
    const { email } = req.query;
    const adminId =req.user._id; 
    const admin = await User.findById(adminId);

    let exists = null;

    // البحث عن أي مستخدم بنفس الإيميل غير الحساب الحالي
    if (email && email !== admin.email) {
      exists = await User.findOne({ email });
    }

    res.json({ exists: !!exists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في التحقق من البريد' });
  }
};


// دالة حساب التغيير الشهري (منطقية 100%)
function calcChange(current, previous) {
  if (previous === 0 && current === 0) {
    return { percentage: 0, direction: 'equal' };
  }

  if (previous === 0) {
    return { percentage: 100, direction: 'increase' };
  }

  const diff = current - previous;
  const percentage = Math.round((Math.abs(diff) / previous) * 100);

  return {
    percentage,
    direction: diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'equal'
  };
}

exports.dashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = startOfThisMonth;

    // =========================
    // 1️⃣ الطلبات
    // =========================
    const totalOrdersThisMonth = await Request.countDocuments({
      createdAt: { $gte: startOfThisMonth, $lt: startOfNextMonth }
    });

    const totalOrdersLastMonth = await Request.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    const ordersChange = calcChange(
      totalOrdersThisMonth,
      totalOrdersLastMonth
    );

    // =========================
    // 2️⃣ التبرعات (مكتملة فقط + ILS)
    // =========================
    const donationsThisMonth = await Donation.find({
      status: 'completed',
      createdAt: { $gte: startOfThisMonth, $lt: startOfNextMonth }
    });

    const donationsLastMonth = await Donation.find({
      status: 'completed',
      createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    const totalDonationsThisMonth = donationsThisMonth.reduce(
      (sum, d) =>
        sum +
        (d.originalAmount *
          (exchangeRatesToILS[d.originalCurrency] || 1)),
      0
    );

    const totalDonationsLastMonth = donationsLastMonth.reduce(
      (sum, d) =>
        sum +
        (d.originalAmount *
          (exchangeRatesToILS[d.originalCurrency] || 1)),
      0
    );

    const donationsChange = calcChange(
      totalDonationsThisMonth,
      totalDonationsLastMonth
    );

// الطلبات الجديدة
const newOrdersThisMonth = await Request.countDocuments({
  status: 'pending',
  createdAt: { $gte: startOfThisMonth, $lt: startOfNextMonth }
});
const newOrdersLastMonth = await Request.countDocuments({
  status:'pending',
  createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
});

const newOrdersChange = calcChange(
  newOrdersThisMonth,
  newOrdersLastMonth
);


    // =========================
    // 3️⃣ الحالات المكتملة (funded)
    // =========================
    const completedCasesThisMonth = await Case.countDocuments({
      status: 'funded',
      updatedAt: { $gte: startOfThisMonth, $lt: startOfNextMonth }
    });

    const completedCasesLastMonth = await Case.countDocuments({
      status: 'funded',
      updatedAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    const completedCasesChange = calcChange(
      completedCasesThisMonth,
      completedCasesLastMonth
    );

    // =========================
    // 📦 النتيجة النهائية
    // =========================
    res.status(200).json({
      totalOrders: totalOrdersThisMonth,
      totalOrdersChange: ordersChange,


      newOrders: newOrdersThisMonth,
  newOrdersChange,


      totalDonations: Math.round(totalDonationsThisMonth),
      totalDonationsChange: donationsChange,
      currency: 'ILS',

      completedCases: completedCasesThisMonth,
      completedCasesChange
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Error loading dashboard stats' });
  }
};

// ===== LATEST REQUESTS & DONATIONS =====

exports.latestRequests = async (req, res) => {
  try {
     let latestRequests = await Request.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5);
   
       if (latestRequests.length === 0) {
      latestRequests = await Request.find().sort({ createdAt: -1 }).limit(5);
    }
 res.status(200).json({
      isFallback: latestRequests.length > 0 && latestRequests[0].status !== 'pending',
      latestRequests
    });

  
  } catch (error) {
    console.error('خطأ أثناء جلب أحدث الطلبات:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

// exports.latestDonations = async (req, res) => {
//   try {
//     const donations = await Donation.find()
//       .populate('donationRequest', 'caseId')
//       .populate('donatee', 'fullName')
//       .sort({ createdAt: -1 })
//       .limit(5);
//     res.json(donations);
//   } catch (error) {
//     console.error('Error fetching latest donations:', error);
//     res.status(500).json({ error: 'حدث خطأ أثناء جلب آخر التبرعات' });
//   }
// };

// ===== DONATIONS PAGE =====

exports.latestDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('caseId', 'firstName lastName') 
      .populate('donorInfo.userId', 'name email') 
      .sort({ createdAt: -1 })
      .limit(5);

    
    const donationsWithILS = donations.map(d => ({
      ...d.toObject(),
      amount: donations.amount
    }));

    res.json(donationsWithILS);
  } catch (error) {
    console.error('Error fetching latest donations:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب آخر التبرعات' });
  }
};




exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });

    const formatted = donations.map((donation, index) => ({
      id: donation._id,
      number: index + 1,

      donorName: donation.donorInfo?.anonymous 
  ? 'متبرع مجهول' 
  : donation.donorInfo?.name || 'غير محدد',

      projectTitle: donation.title || 'غير محدد',

      amount: donation.originalAmount,
      currency: donation.originalCurrency,

      status: donation.status,
       paymentMethod: donation.paymentMethod || 'غير محدد',
      date: donation.donationDate
        ? donation.donationDate.toISOString().split('T')[0]
        : 'غير محدد'
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب التبرعات' });
  }
};

exports.getDonation= async (req, res) => {
    try {
    const { id } = req.params;

    const donation = await Donation.findById(id)
      .populate('donorInfo.userId', 'firstName lastName') // جلب اسم المستخدم لو موجود
      

    if (!donation) {
      return res.status(404).json({ message: 'التبرع غير موجود' });
    }

    const details = {
      id: donation._id,
      donorName: donation.donorInfo?.anonymous 
        ? 'متبرع مجهول' 
        : donation.donorInfo?.name || 'غير محدد',
      donorEmail: donation.donorInfo?.email || '-',
      donorPhone: donation.donorInfo?.phone || '-',
      donorIdCard: donation.donorInfo?.idcard || '-',
      projectTitle: donation.title || 'غير محدد',
      amount: donation.originalAmount,
      currency: donation.originalCurrency,
      paymentMethod:donation.paymentMethod,
      status: donation.status,
      transactionId: donation.transactionId,
      donationDate: donation.donationDate ? donation.donationDate.toISOString() : '-',
      createdAt: donation.createdAt ? donation.createdAt.toISOString() : '-',
      authorName: donation.authorName || '-'
    };

    res.json({ success: true, donation: details });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب تفاصيل التبرع' });
  }
};


exports.rejectDonation = async (req, res) => {
 
  try {
    const { reason } = req.body;
     const id = req.params.id;
     
    const donation = await Donation.findByIdAndUpdate(id, {
        status: 'failed',
        notes: reason || 'تم رفض التبرع من قبل الإدارة'
      },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'التبرع غير موجود'});
    }

    res.json({
      message: 'تم رفض التبرع بنجاح',
      donation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء رفض التبرع' });
  }
};



exports.approveDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    if (!donation) return res.status(404).json({ message: 'التبرع غير موجود' });
    res.json({ message: 'تم اعتماد التبرع', donation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء اعتماد التبرع' });
  }
};

// ===== ADMIN PROFILE =====



exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await User.findById(adminId).select('firstName lastName email phone profilePic');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    res.json({
      success: true,
      user: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        profilePic: admin.profilePic 
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};



// جلب عدد القصص المعلقة (لعداد الجرس)
exports.getPendingStoriesCount = async (req, res) => {
    try {
        const count = await Story.countDocuments({ status: 'pending' });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//قصة وحدة

exports.getStoryById = async (req, res) => {
  const id=req.params.id;
    try {
        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({ message: "القصة غير موجودة" });
        }

        res.json(story);
    } catch (err) {
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
};

// جلب قائمة القصص المعلقة
exports.getPendingStories = async (req, res) => {
    try {
        const stories = await Story.find({ status: 'pending' })
            .select('title author authorName createdAt') // بيانات مختصرة للعرض
            .sort({ createdAt: -1 });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// الموافقة على قصة
exports.approveStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'القصة غير موجودة' });

        story.status = 'approved';
        await story.save();

        res.json({ message: 'تمت الموافقة على القصة', story });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// رفض 
exports.rejectAdminStory = async (req, res) => {
  try {
        const story = await Story.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
            { new: true }
        );

        if (!story) {
            return res.status(404).json({ message: 'القصة غير موجودة' });
        }

        res.json({ message: 'تم رفض القصة بنجاح', story });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

