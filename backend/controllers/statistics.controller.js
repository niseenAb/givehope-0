const Donation = require('../models/Donationmodel.js');
const Project = require('../models/project.model.js');
const Campaign = require('../models/Campaign.js');
const User = require('../models/User.js'); 
const Case = require('../models/ShowAllCasessmodel.js'); 
const Sponsorship = require('../models/Sponsorship.js'); 



  
const exchangeRatesToILS = {
  ILS: 1,
  USD: 3.7,
  JOD: 5.2,
  AED: 1.01
};

exports.totalDonations = async (req, res) => {
  try {
    // جلب كل التبرعات المكتملة
    const donations = await Donation.find({ status: 'completed' });

    // تحويل كل amount إلى ILS وجمعها
    const totalILS = donations.reduce((sum, d) => {
      const rate = exchangeRatesToILS[d.originalCurrency] || 1;
      return sum + d.originalAmount * rate;
    }, 0);

    res.status(200).json({
      total: totalILS,
      currency: 'ILS'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error calculating total donations in ILS',
      error: error.message
    });
  }
};


// عدد المتبرعين
exports.donorsCount = async (req, res) => {
    try {
        const donors = await User.countDocuments({ role: "donor" });
        res.json({ count: donors });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// عدد المستفيدين
exports.beneficiariesCount = async (req, res) => {
    try {
        const total = await User.countDocuments({ role: "needy" });
        res.json({ total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// الحملات النشطة
exports.activeCampaigns = async (req, res) => {
    try {
        const count = await Campaign.countDocuments({ status: "active" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// المشاريع المكتملة
exports.completedProjects = async (req, res) => {
    try {
        const count = await Project.countDocuments({ status: "مكتمل" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// الحملات المكتملة
exports.completedCampaigns = async (req, res) => {
    try {
        const count = await Campaign.countDocuments({ status: "completed" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// التبرعات حسب الفئة
exports.donationCategories = async (req, res) => {
    try {
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

    res.json({ categories: categorySums });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
   
};

// عدد المتبرعين شهرياً (آخر 12 شهر)
exports.monthlyDonors = async (req, res) => {
    try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // أول يوم قبل 12 شهر
    const endDate = now;

    // جلب التبرعات المكتملة خلال آخر 12 شهر
    const donations = await Donation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          donors: { $addToSet: "$donorInfo.userId" } // تجميع كل متبرع مرة واحدة
        }
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          count: { $size: "$donors" },
          _id: 0
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    // ملء الشهور اللي ما فيها تبرعات بـ 0
    const result = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthData = donations.find(d => d.year === year && d.month === month);
      result.unshift({ year, month, count: monthData ? monthData.count : 0 });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// التبرعات الشهرية (آخر 12 شهر)
// exports.monthlyDonations = async (req, res) => {
//    try {
//     const now = new Date();
//     const lastYear = new Date(now.getFullYear(), now.getMonth() - 11, 1); // أول يوم قبل 12 شهر

//     const data = await Donation.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: lastYear },
//           status: 'completed'
//         }
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" }
//           },
//           total: { $sum: "$amount" }
//         }
//       },
//       {
//         $project: {
//           month: "$_id.month",
//           year: "$_id.year",
//           total: 1,
//           _id: 0
//         }
//       },
//       { $sort: { year: 1, month: 1 } }
//     ]);

//     res.json(data);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.monthlyDonations = async (req, res) => {
  try {
    const now = new Date();
    const lastYear = new Date(now.getFullYear(), now.getMonth() - 11, 1); // أول يوم قبل 12 شهر

    // جلب كل التبرعات المكتملة
    const donations = await Donation.find({ createdAt: { $gte: lastYear }, status: 'completed' });

    // تحويل كل originalAmount إلى ILS
    const donationsWithILS = donations.map(d => ({
      ...d._doc,
      amountILS: d.originalAmount * (exchangeRatesToILS[d.originalCurrency] || 1)
    }));

    // تجميع حسب الشهر والسنة
    const monthlyDataMap = {};

    donationsWithILS.forEach(d => {
      const date = new Date(d.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // شهر 1-12
      const key = `${year}-${month}`;

      if (!monthlyDataMap[key]) {
        monthlyDataMap[key] = 0;
      }
      monthlyDataMap[key] += d.amountILS;
    });

    // إنشاء المصفوفة النهائية للـ 12 شهر
    const result = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      result.unshift({
        year,
        month,
        total: parseFloat((monthlyDataMap[key] || 0).toFixed(2))
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
 
// متوسط التبرع للشهر السابق
// exports.averageDonationLastMonth = async (req, res) => {
//  try {
//     const now = new Date();
//     const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

//     // جلب التبرعات المكتملة للشهر الماضي
//     const donations = await Donation.find({
//       createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
//       status: 'completed'
//     });

//     if (donations.length === 0) {
//       return res.json({ average: 0 });
//     }

//     // حساب المتوسط
//     const total = donations.reduce((sum, d) => sum + d.amount, 0);
//     const average = total / donations.length;

//     res.json({ average: parseFloat(average.toFixed(2)) });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.averageDonationLastMonth = async (req, res) => {
  try {
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // جلب التبرعات المكتملة للشهر الماضي
    const donations = await Donation.find({
      createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
      status: 'completed'
    });

    if (donations.length === 0) {
      return res.json({ average: 0, currency: 'ILS' });
    }

    // تحويل كل originalAmount إلى ILS
    const totalILS = donations.reduce((sum, d) => {
      const rate = exchangeRatesToILS[d.originalCurrency] || 1;
      return sum + d.originalAmount * rate;
    }, 0);

    const average = totalILS / donations.length;

    res.json({ average: parseFloat(average.toFixed(2)), currency: 'ILS' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
 
// المتبرعين الجدد لهذا الشهر
exports.newDonorsThisMonth = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const count = await User.countDocuments({
      role: 'donor',
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });

    res.json({ newDonorsThisMonth: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// حملات مكتملة هذا العام
exports.completedCampaignsThisYear = async (req, res) => {
   try {
    const now = new Date();
    const firstDayYear = new Date(now.getFullYear(), 0, 1); // 1 يناير السنة الحالية
    const lastDayYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // 31 ديسمبر

    const count = await Campaign.countDocuments({
      status: "completed",
      endDate: { $gte: firstDayYear, $lte: lastDayYear }
    });

    res.json({ completedThisYear: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// عدد الحملات المكتملة (إجمالي)
exports.allCompletedCampaigns = async (req, res) => {
    try {
        const count = await Campaign.countDocuments({ status: "completed" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
