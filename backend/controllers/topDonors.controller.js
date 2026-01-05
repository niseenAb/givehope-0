const Donation = require('../models/Donationmodel.js');
const Project = require('../models/project.model.js');
const Campaign = require("../models/Campaign.js");

const User = require('../models/User.js');

// إجمالي التبرعات
exports.totalDonations = async (req, res) => {
   try {
            const donations = await Donation.aggregate([
                { $group: { _id: null, total: { $sum: "$amount" } }}
            ]);
            const total = donations[0]?.total || 0;
            res.json({ total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    
};

// عدد المتبرعين
exports.donorsCount = async (req, res) => {
  try {
    const count = await Donation.distinct("donorInfo.userId");
    res.json({ total: count.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// عدد المشاريع المدعومة
exports.supportedProjects = async (req, res) => {
    try {
        const count = await Project.countDocuments({});
        res.json({ total: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// معدل نجاح المشاريع
exports.projectSuccessRate = async (req, res) => {
    try {
        const totalProjects = await Project.countDocuments();
        const completedProjects = await Project.countDocuments({ status: "مكتمل" });
        let successRate = 0;
        if (totalProjects > 0) {
            successRate = ((completedProjects / totalProjects) * 100).toFixed(1);
        }
        res.json({ successRate: Number(successRate) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// إعادة حساب أفضل المتبرعين للشهر
// exports.recomputeTopDonorsForMonth = async (req, res) => {
//     try {
//         const month = req?.body?.month ?? (new Date().getMonth() + 1);
//         const year = req?.body?.year ?? new Date().getFullYear();
//         const start = new Date(year, month - 1, 1);
//         const end = new Date(year, month, 1);

//         const pipeline = [
//             { $match: { createdAt: { $gte: start, $lt: end } } },
//             {
//                 $addFields: {
//                     amountILS: {
//                         $switch: {
//                             branches: [
//                                 { case: { $eq: ["$currency", "ILS"] }, then: "$amount" },
//                                 { case: { $eq: ["$currency", "USD"] }, then: { $multiply: ["$amount", rates.USD] } },
//                                 { case: { $eq: ["$currency", "JOD"] }, then: { $multiply: ["$amount", rates.JOD] } },
//                                 { case: { $eq: ["$currency", "EUR"] }, then: { $multiply: ["$amount", rates.EUR] } }
//                             ],
//                             default: "$amount"
//                         }
//                     }
//                 }
//             },
//             { $group: { _id: "$donorId", totalDonatedILS: { $sum: "$amountILS" }, donationsCount: { $sum: 1 } } },
//             { $sort: { totalDonatedILS: -1 } },
//             { $limit: 100 }
//         ];

//         const agg = await Donation.aggregate(pipeline);
//         await TopDonor.deleteMany({ month, year });

//         const top10 = agg.slice(0, 10);
//         const docs = [];
//         for (let i = 0; i < top10.length; i++) {
//             const d = top10[i];
//             let user = null;
//             try { user = await User.findById(d._id).select('fullName profileImage').lean(); } catch (e) { user = null; }
//             docs.push({
//                 donorId: d._id,
//                 month,
//                 year,
//                 totalDonatedILS: d.totalDonatedILS,
//                 donationsCount: d.donationsCount,
//                 rank: i + 1,
//                 snapshotName: user?.fullName || null,
//                 snapshotImage: user?.profileImage || null
//             });
//         }

//         if (docs.length) await TopDonor.insertMany(docs);
//         return res.json({ ok: true, count: docs.length, docs });
//     } catch (error) {
//         console.error("recomputeTopDonors error:", error);
//         return res.status(500).json({ ok: false, error: error.message });
//     }
// };

exports.recomputeTopDonorsForMonth = async (req, res) => {
  try {
    const month = req?.body?.month ?? (new Date().getMonth() + 1);
    const year = req?.body?.year ?? new Date().getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const agg = await Donation.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lt: end },
          status: "completed"
        }
      },
      {
        $group: {
          _id: "$donorInfo.userId",
          totalDonated: { $sum: "$amount" },
          donationsCount: { $sum: 1 }
        }
      },
      { $sort: { totalDonated: -1 } },
      { $limit: 10 }
    ]);

    res.json({ ok: true, topDonors: agg });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};


// // جلب أفضل 10 متبرعين
// exports.getTopDonors = async (req, res) => {
//    // أفضل المتبرعين للشهر الحالي
// try {
//     const now = new Date();

//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const endOfMonth = new Date(
//       now.getFullYear(),
//       now.getMonth() + 1,
//       0,
//       23, 59, 59
//     );

//     const topDonors = await Donation.aggregate([
//       {
//         $match: {
//           status: 'completed',
//           donationDate: {
//             $gte: startOfMonth,
//             $lte: endOfMonth
//           }
//         }
//       },
//       {
//         $group: {
//           _id: "$donatee", // المتبرع
//           totalDonations: { $sum: "$donationAmount" },
//           donationsCount: { $sum: 1 }
//         }
//       },
//       { $sort: { totalDonations: -1 } }, // من الأعلى للأقل
//       { $limit: 10 },
//       {
//         $lookup: {
//           from: 'users',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'donor'
//         }
//       },
//       { $unwind: "$donor" },
//       {
//         $project: {
//           _id: 0,
//           donorId: "$donor._id",
//           name: {
//             $concat: ["$donor.firstName", " ", "$donor.lastName"]
//           },
//           totalDonations: 1,
//           donationsCount: 1,
//           profileImage: {
//             $ifNull: ["$donor.profilePic", "profile-icon.jpg"]
//           }
//         }
//       }
//     ]);

//     res.json({ topDonors });
//   } catch (error) {
//     console.error("getTopDonors error:", error);
//     res.status(500).json({
//       message: 'حدث خطأ أثناء جلب أفضل المتبرعين'
//     });
//   }
// };

exports.getTopDonors = async (req, res) => {
  try {
    const now = new Date();

    // بداية ونهاية الشهر الحالي
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23, 59, 59
    );

    const topDonors = await Donation.aggregate([
      // فقط التبرعات المكتملة في هذا الشهر
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },

      // تجميع التبرعات حسب المتبرع
      {
        $group: {
          _id: "$donorInfo.userId",
          totalDonations: { $sum: "$amount" },
          donationsCount: { $sum: 1 }
        }
      },

      // ترتيب من الأعلى للأقل
      { $sort: { totalDonations: -1 } },

      // أفضل 10
      { $limit: 10 },

      // جلب بيانات المستخدم
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "donor"
        }
      },

      { $unwind: "$donor" },

      // البيانات النهائية
      {
        $project: {
          _id: 0,
          donorId: "$donor._id",
          name: "$donor.fullName",
          totalDonations: 1,
          donationsCount: 1,
          profileImage: {
            $ifNull: ["$donor.profileImage", "profile-icon.jpg"]
          }
        }
      }
    ]);

    res.status(200).json({ topDonors });

  } catch (error) {
    console.error("getTopDonors error:", error);
    res.status(500).json({
      message: "حدث خطأ أثناء جلب أفضل المتبرعين"
    });
  }
};


