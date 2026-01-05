// backend/models/Sponsorship.js
const mongoose = require("mongoose");

const sponsorshipSchema = new mongoose.Schema(
  {
    // 1. معرّف فريد خارجي (مرئي في الفرونت)
    caseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[A-Z]{3}\d{3}$/,
    },
    // 2. بيانات من طلب الدعم (بعد الموافقة)
    //الاسم الاول من طلب الدعم
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    //المنطقة
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    //نوع الكفالة
    type: {
      type: String,
      required: true,
      enum: ["orphans", "educational", "health", "living", "general"],
      default: "general",
    },
    //مبلغ كل فترة
    amountPerPeriod: {
      type: Number,
      required: true,
      min: 1,
    },
    //نص الفترة شهريا/فصليا/سنويا
    periodLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    //وصف نصي مثل12  شهرا الخ
    durationLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    //رقم الفترات الكلي وهو مدة الكفالة
    totalPeriods: {
      type: Number,
      required: true,
      min: 1,
      comment: "عدد الفترات الكلي (مثال: 12 = 12 شهرًا، 3 = 3 فصول دراسية)",
    },
    //درجة الالحاح
    urgencyLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    // 3. بيانات يدخلها الـ Admin فقط
    //وصف مختصر (ليس من طلب الدعم)
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // 4. روابط داخلية
    donationRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DonationRequest",
      required: true,
    },
    //  صاحب الكفالة
    needyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, //الكفيل
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // 5. حالة الدفع
    paidPeriods: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["not sponsored", "partially sponsored", "fully sponsored"],
      default: "not sponsored",
    },

    //  الإضافات المطلوبة فقط لدعم الإشعارات الزمنية
    //تاريخ الدفع الاول
    firstPaymentDate: {
      type: Date,
      default: null,
      comment: "تاريخ أول دفعة (يُضبط عند paidPeriods == 1)",
    },
    //تاريخ الدفع التالي
    nextDueDate: {
      type: Date,
      default: null,
      comment:
        "تاريخ الاستحقاق التالي — يُحسب دائمًا من firstPaymentDate + (paidPeriods × period)، وليس من تاريخ الدفع الفعلي (حتى لو تأخر)",
    },

    // 6. تتبع
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// فهارس
sponsorshipSchema.index({ status: 1 });
sponsorshipSchema.index({ type: 1 });
sponsorshipSchema.index({ urgencyLevel: 1 });
sponsorshipSchema.index({ needyId: 1 });
sponsorshipSchema.index({ sponsorId: 1 });
sponsorshipSchema.index({ firstPaymentDate: 1 }); // ← إضافة فهرس جديد
sponsorshipSchema.index({ nextDueDate: 1 }); // ← إضافة فهرس جديد

module.exports = mongoose.model("Sponsorship", sponsorshipSchema);
