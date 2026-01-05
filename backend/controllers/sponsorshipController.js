// backend/controllers/sponsorshipController.js
const Sponsorship = require("../models/Sponsorship");
const DonationRequest = require("../models/DonationRequest");
const User = require("../models/User");
const NotificationService = require("../notificationService");

// ───── دوال مساعدة داخلية ───────────────────────────────────────────────

/**
 * ✅ أُعيدت من النسخة الأصلية — ضرورية للترتيب حسب درجة العجلة
 * تُعيّن أولوية رقمية لـ urgencyLevel: الأعلى أولوية = رقم أصغر
 */
const getUrgencyPriority = (level) => {
  const map = { critical: 1, high: 2, medium: 3, low: 4 };
  return map[level] || 3; // افتراضي: medium
};

/**
 * يحسب عدد الأشهر من periodLabel (مثال: "شهريًا" ← 1، "فصليًا" ← 3)
 */
const getMonthsFromPeriodLabel = (label) => {
  const l = (label || "").toLowerCase();
  if (l.includes("شهري")) return 1;
  if (l.includes("فصلي")) return 3;
  if (l.includes("نصف") || l.includes("6")) return 6;
  if (l.includes("سنو") || l.includes("12")) return 12;
  return 1; // افتراضي
};

/**
 * يحسب التاريخ التالي دائمًا من firstPaymentDate (وليس من now)
 * @param {Date} firstPaymentDate - تاريخ أول دفعة
 * @param {Number} paidPeriods - عدد الفترات المدفوعة *بعد* هذه الدفعة
 * @param {Number} monthsPerPeriod - عدد الأشهر لكل فترة
 */
const calculateNextDueDate = (
  firstPaymentDate,
  paidPeriods,
  monthsPerPeriod
) => {
  if (!firstPaymentDate || paidPeriods < 1) return null;
  const date = new Date(firstPaymentDate);
  date.setMonth(date.getMonth() + monthsPerPeriod * paidPeriods);
  return date;
};

// ───── 1. إنشاء كفالة (من قبل الآدمن فقط) ───────────────────────────────────

exports.createSponsorship = async (req, res) => {
  try {
    const {
      donationRequestId,
      amountPerPeriod,
      periodLabel,
      durationLabel,
      shortDescription,
      totalPeriods,
    } = req.body;

    // ✅ التحقق من وجود الطلب وصلاحيته — نفس منطق النسخة الأصلية (واضح وفصل)
    const request = await DonationRequest.findById(donationRequestId).populate(
      "userId",
      "firstName"
    );
    if (!request) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'لا يمكن إنشاء كفالة إلا من طلب معتمد' });
    }
    if (request.requestType !== 'sponsoring') {
      return res.status(400).json({ success: false, message: 'الطلب ليس من نوع "كفالة"' });
    }
    if (!request.userId) {
      return res.status(400).json({ success: false, message: 'الطلب لا يحتوي على معرف مستخدم مرتبط' });
    }

    // ✅ التحقق من صحة المدخلات
    if (amountPerPeriod == null || amountPerPeriod <= 0) 
      return res.status(400).json({ success: false, message: "المبلغ يجب أن يكون > 0" });
    if (!periodLabel || typeof periodLabel !== 'string' || periodLabel.trim() === '') 
      return res.status(400).json({ success: false, message: "وصف الفترة مطلوب" });
    if (!durationLabel || typeof durationLabel !== 'string' || durationLabel.trim() === '') 
      return res.status(400).json({ success: false, message: "وصف المدة مطلوب" });
    if (!shortDescription || shortDescription.trim() === '' || shortDescription.length > 500) 
      return res.status(400).json({ success: false, message: "الوصف المبسط مطلوب (≤500 حرف)" });
    if (totalPeriods == null || !Number.isInteger(totalPeriods) || totalPeriods < 1) 
      return res.status(400).json({ success: false, message: "عدد الفترات ≥ 1" });

    // ✅ جمع البيانات من الطلب
    const firstName = request.firstName?.trim().split(" ")[0] || "مجهول";
    const city = request.city?.trim() || "";
    const type = request.dynamicFields?.sponsoringType || "living";
    const validTypes = ['orphans', 'educational', 'health', 'living', 'general'];
    if (!validTypes.includes(type)) 
      return res.status(400).json({ success: false, message: `نوع الكفالة "${type}" غير مدعوم` });
    const urgencyLevel = request.urgencyLevel || "medium";
    const needyId = request.userId;

    // ✅ توليد caseId
    const prefixMap = {
      orphans: "ORP", educational: "EDU", health: "HEA", living: "LIV", general: "GEN"
    };
    const prefix = prefixMap[type];
    const latest = await Sponsorship.findOne({
      caseId: new RegExp(`^${prefix}\\d{3}$`),
    }).sort({ caseId: -1 });
    const nextNum = latest ? parseInt(latest.caseId.slice(3), 10) + 1 : 1;
    const caseId = `${prefix}${String(nextNum).padStart(3, "0")}`;

    // ✅ إنشاء الكفالة (بدون preferredSponsorshipDeadline — حُذف تمامًا)
    const newSponsorship = await Sponsorship.create({
      caseId,
      firstName,
      city,
      type,
      amountPerPeriod,
      periodLabel,
      durationLabel,
      shortDescription: shortDescription.trim(),
      urgencyLevel,
      totalPeriods,
      donationRequestId: request._id,
      needyId,
      sponsorId: null,
      paidPeriods: 0,
      status: "not sponsored",
      createdBy: req.user._id,
      firstPaymentDate: null,
      nextDueDate: null,
    });

    // ✅ إشعار للمحتاج: "تم قبول طلب دعمك — كفالة ..."
    if (needyId) {
      const typeText = {
        orphans: "أيتام", educational: "تعليمية", health: "صحية",
        living: "معيشية", general: "شاملة"
      }[type] || type;
      await NotificationService.createNotification({
        user: needyId,
        title: "تمت الموافقة على كفالتك",
        message: `تم قبول طلب دعمك — كفالة (${typeText}) ${caseId}، وتم عرض حالتك في صفحة الكفالات.`,
        type: "sponsorship_request_approved",
        channels: ["dashboard", "push"],
        referenceId: newSponsorship._id,
        metadata: { caseId, type },
      });
    }

    res.status(201).json({
      success: true,
      message: "تم إنشاء الكفالة بنجاح",
      sponsorship: newSponsorship,
    });

  } catch (error) {
    console.error("❌ Error in createSponsorship:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء إنشاء الكفالة" });
  }
};

// ───── 2. معالجة دفعة جديدة ─────────────────────────────────────────────────
// (تم الاحتفاظ بها كما هي — لم تُطلب أي تعديلات هنا)

exports.processSponsorshipPayment = async (req, res) => {
  try {
    const { sponsorshipId } = req.body;
    const sponsorId = req.user._id;

    if (!sponsorshipId)
      return res.status(400).json({ success: false, message: "معرّف الكفالة مطلوب" });

    const sponsorship = await Sponsorship.findById(sponsorshipId)
      .populate("needyId", "_id")
      .populate("sponsorId", "_id");
    if (!sponsorship)
      return res.status(404).json({ success: false, message: "الكفالة غير موجودة" });

    if (sponsorship.status === "fully sponsored") {
      return res.status(400).json({ success: false, message: "الكفالة مكتملة بالكامل" });
    }

    if (
      sponsorship.status === "partially sponsored" &&
      sponsorship.sponsorId &&
      sponsorship.sponsorId._id.toString() !== sponsorId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "لا يمكنك الدفع — هذه الكفالة مكفولة جزئيًا من قبل متبرع آخر",
      });
    }

    const oldPaid = sponsorship.paidPeriods;
    const newPaid = oldPaid + 1;
    const now = new Date();
    const monthsPerPeriod = getMonthsFromPeriodLabel(sponsorship.periodLabel);

    let updateData = { paidPeriods: newPaid };
    if (oldPaid === 0) {
      updateData.firstPaymentDate = now;
      updateData.sponsorId = sponsorId;
    }

    const firstDate = updateData.firstPaymentDate || sponsorship.firstPaymentDate;
    updateData.nextDueDate = calculateNextDueDate(firstDate, newPaid, monthsPerPeriod);

    if (newPaid >= sponsorship.totalPeriods) {
      updateData.status = "fully sponsored";
    } else {
      updateData.status = "partially sponsored";
    }

    const updatedSponsorship = await Sponsorship.findByIdAndUpdate(
      sponsorshipId,
      updateData,
      { new: true }
    );

    // ─── إرسال الإشعارات (كما هي — بدون تغيير) ─────────────────────────
    const admins = await User.find({ role: "admin" }).select("_id");
    const needy = sponsorship.needyId;
    const sponsor = await User.findById(sponsorId);
    const caseId = updatedSponsorship.caseId;
    const amount = updatedSponsorship.amountPerPeriod;
    const periodNum = newPaid;

    if (oldPaid === 0) {
      const sponsorEmail = sponsor?.email || "مجهول الهوية";
      for (const admin of admins) {
        await NotificationService.createNotification({
          user: admin._id,
          title: "كفالة جديدة",
          message: `قام متبرع (${sponsorEmail}) بكفالة الحالة ${caseId}`,
          type: "sponsorship_started",
          channels: ["dashboard", "push"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId, sponsorId, periodNum },
        });
      }
      if (sponsor) {
        await NotificationService.createNotification({
          user: sponsor._id,
          title: "تمت الكفالة بنجاح",
          message: `شكرًا لك لتكفلك الحالة ${caseId}. يرجى الالتزام بمواعيد الدفع — سيتم تذكيرك قبل كل دفعة بأسبوعين: أولًا قبل 7 أيام، ثم قبل يومين.`,
          type: "sponsorship_started",
          channels: ["dashboard", "push", "email"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId, periodNum },
        });
      }
      if (needy) {
        await NotificationService.createNotification({
          user: needy._id,
          title: "تمت كفالة حالتك",
          message: `مبروك! تم كفالة حالتك (${caseId}) من قبل متبرع.`,
          type: "sponsorship_started",
          channels: ["dashboard", "push"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId, sponsorId: sponsor?._id },
        });
      }
    } else {
      const wasOnTime =
        oldPaid === 0
          ? true
          : sponsorship.nextDueDate && now <= sponsorship.nextDueDate;
      const notifType = wasOnTime
        ? "sponsorship_payment"
        : "sponsorship_delayed_payment";
      const periodMsg = wasOnTime
        ? `لفترة ${periodNum}`
        : `لفترة ${periodNum} (متأخر)`;

      for (const admin of admins) {
        await NotificationService.createNotification({
          user: admin._id,
          title: wasOnTime ? "دفعة جديدة" : "دفع متأخر",
          message: `قام الكفيل بدفع ${amount} ₪ للحالة ${caseId} ${periodMsg}.`,
          type: notifType,
          channels: ["dashboard", "push"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId, periodNum, wasDelayed: !wasOnTime },
        });
      }
      if (sponsor) {
        await NotificationService.createNotification({
          user: sponsor._id,
          title: "تم الدفع بنجاح",
          message: `تم دفع ${amount} ₪ للحالة ${caseId} ${periodMsg}.`,
          type: notifType,
          channels: ["dashboard"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId, periodNum },
        });
      }
      if (needy) {
        await NotificationService.createNotification({
          user: needy._id,
          title: "تم الدفع لحالتك",
          message: `قام الكفيل بدفع ${amount} ₪ ${periodMsg} لحالتك (${caseId}).`,
          type: notifType,
          channels: ["dashboard", "push"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId, periodNum },
        });
      }
    }

    if (updatedSponsorship.status === "fully sponsored") {
      for (const admin of admins) {
        await NotificationService.createNotification({
          user: admin._id,
          title: "اكتملت الكفالة",
          message: `تمت كفالة الحالة ${caseId} بالكامل.`,
          type: "sponsorship_completed",
          channels: ["dashboard"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId },
        });
      }
      if (sponsor) {
        await NotificationService.createNotification({
          user: sponsor._id,
          title: "تمت الكفالة بالكامل",
          message: `تم دفع جميع فترات الكفالة (${updatedSponsorship.totalPeriods}) للحالة ${caseId}. شكرًا لعطائك!`,
          type: "sponsorship_completed",
          channels: ["dashboard", "email"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId, totalPeriods: updatedSponsorship.totalPeriods },
        });
      }
      if (needy) {
        await NotificationService.createNotification({
          user: needy._id,
          title: "مبروك! اكتملت كفالتك",
          message: `تمت كفالة حالتك (${caseId}) بالكامل.`,
          type: "sponsorship_completed",
          channels: ["dashboard"],
          referenceId: updatedSponsorship._id,
          metadata: { caseId },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "تمت معالجة الدفعة بنجاح",
      sponsorship: {
        caseId: updatedSponsorship.caseId,
        paidPeriods: updatedSponsorship.paidPeriods,
        status: updatedSponsorship.status,
        nextDueDate: updatedSponsorship.nextDueDate,
      },
    });

  } catch (error) {
    console.error("❌ Error in processSponsorshipPayment:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء معالجة الدفعة" });
  }
};

// ───── 3. دوال cron (تذكير + تأخير) — كما هي — لم تُطلب تعديلات ───────────

exports.sendPaymentReminders = async () => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.setDate(today.getDate() + 7));
  const twoDaysFromNow = new Date(today.setDate(today.getDate() + 2));

  const sponsorships = await Sponsorship.find({
    status: "partially sponsored",
    nextDueDate: { $gte: new Date() },
  }).populate("sponsorId", "_id");

  for (const s of sponsorships) {
    if (!s.sponsorId || !s.nextDueDate) continue;
    const daysUntilDue = Math.ceil((new Date(s.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const periodNum = s.paidPeriods + 1;
    let shouldRemind = false, stage = null, title = "", message = "";

    if (daysUntilDue === 7) {
      shouldRemind = true; stage = "7d";
      title = "تذكير مبكر بدفعة قادمة";
      message = `يرجى تجهيز ${s.amountPerPeriod} ₪ للحالة ${s.caseId} للفترة ${periodNum}. موعد الاستحقاق: ${new Date(s.nextDueDate).toLocaleDateString("ar-EG")}.`;
    } else if (daysUntilDue === 2) {
      shouldRemind = true; stage = "2d";
      title = "تذكير أخير بدفعة قريبة";
      message = `⚠️ تبقى يومان فقط لدفع ${s.amountPerPeriod} ₪ للحالة ${s.caseId} للفترة ${periodNum} قبل ${new Date(s.nextDueDate).toLocaleDateString("ar-EG")}.`;
    }

    if (shouldRemind) {
      await NotificationService.createNotification({
        user: s.sponsorId._id,
        title, message,
        type: "sponsorship_payment_reminder",
        channels: ["dashboard", "push", "email"],
        referenceId: s._id,
        metadata: { caseId: s.caseId, periodNum, dueDate: s.nextDueDate, reminderStage: stage, daysUntilDue },
      });
    }
  }
};

exports.checkDelayedPayments = async () => {
  const today = new Date();
  const delayed = await Sponsorship.find({
    status: "partially sponsored",
    nextDueDate: { $lt: today },
  }).populate("needyId sponsorId");

  for (const s of delayed) {
    const periodDue = s.paidPeriods + 1;
    const delayDays = Math.floor((today - new Date(s.nextDueDate)) / (1000 * 60 * 60 * 24));
    const admins = await User.find({ role: "admin" }).select("_id");

    for (const admin of admins) {
      await NotificationService.createNotification({
        user: admin._id,
        title: "تأخر في الدفع",
        message: `الكفيل تأخر ${delayDays} يوم(أيام) في دفع الفترة ${periodDue} للحالة ${s.caseId}.`,
        type: "sponsorship_payment_delayed",
        channels: ["dashboard", "push"],
        referenceId: s._id,
        metadata: { caseId: s.caseId, periodNum: periodDue, delayDays },
      });
    }
    if (s.sponsorId) {
      await NotificationService.createNotification({
        user: s.sponsorId._id,
        title: "لقد تأخرت في الدفع!",
        message: `لقد تأخرت ${delayDays} يوم في دفع ${s.amountPerPeriod} ₪ للفترة ${periodDue} للحالة ${s.caseId}.`,
        type: "sponsorship_payment_delayed",
        channels: ["dashboard", "push", "email"],
        referenceId: s._id,
        metadata: { caseId: s.caseId, periodNum: periodDue, delayDays },
      });
    }
    if (s.needyId) {
      await NotificationService.createNotification({
        user: s.needyId._id,
        title: "تأخر في دفع الكفالة",
        message: `لقد تأخر الكفيل في دفع الفترة ${periodDue} لحالتك (${s.caseId}). سيتم متابعة الموضوع.`,
        type: "sponsorship_payment_delayed",
        channels: ["dashboard"],
        referenceId: s._id,
        metadata: { caseId: s.caseId, periodNum: periodDue },
      });
    }
  }
};

// ───── 4. عرض الكفالات — ✅ الترتيب المطلوب بدقة ───────────────────────────

exports.getAllSponsorships = async (req, res) => {
  try {
    let sponsorships = await Sponsorship.find({})
      .select(
        "caseId firstName city type amountPerPeriod periodLabel durationLabel " +
        "shortDescription urgencyLevel totalPeriods paidPeriods status createdAt"
      );

    // إضافة remainingPeriods
    sponsorships = sponsorships.map(s => ({
      ...s._doc,
      remainingPeriods: Math.max(0, s.totalPeriods - s.paidPeriods)
    }));

    // ✅ الترتيب المطلوب تمامًا:
    // 1. الحالة: not sponsored (1) → partially sponsored (2) → fully sponsored (3)
    // 2. داخل كل حالة: حسب درجة العجلة (critical > high > medium > low)
    // 3. لا يُستخدم التاريخ أبدًا — حُذف ترتيب preferredSponsorshipDeadline بالكامل
    const statusOrder = { 'not sponsored': 1, 'partially sponsored': 2, 'fully sponsored': 3 };
    sponsorships.sort((a, b) => {
      const sa = statusOrder[a.status], sb = statusOrder[b.status];
      if (sa !== sb) return sa - sb;

      const ua = getUrgencyPriority(a.urgencyLevel);
      const ub = getUrgencyPriority(b.urgencyLevel);
      if (ua !== ub) return ua - ub;

      // (اختياري) ترتيب ثانوي: الأحدث أولاً — لضمان ثبات النتائج إن تساوت الحالة والعجلة
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json({ success: true, sponsorships });
  } catch (error) {
    console.error("Error in getAllSponsorships:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تحميل الكفالات" });
  }
};

// ───── 5. عرض كفالة واحدة — كما هي — لا تعديل مطلوب ───────────────────────

exports.getSponsorshipById = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsorship = await Sponsorship.findById(id).select(
      "caseId firstName city type amountPerPeriod periodLabel durationLabel " +
      "shortDescription urgencyLevel totalPeriods paidPeriods status createdAt"
    );
    if (!sponsorship)
      return res.status(404).json({ success: false, message: "الكفالة غير موجودة" });

    res.status(200).json({
      success: true,
      sponsorship: {
        ...sponsorship._doc,
        remainingPeriods: Math.max(0, sponsorship.totalPeriods - sponsorship.paidPeriods),
      },
    });
  } catch (error) {
    console.error("Error in getSponsorshipById:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تحميل التفاصيل" });
  }
};
