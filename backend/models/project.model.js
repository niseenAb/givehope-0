const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const projectSchema = new Schema({
  title: { type: String, required: true }, // عنوان المشروع
  category: { type: String, required: true, enum: ['تعليمية', 'صحية', 'رعاية أيتام', 'معيشية'] },
  description: { type: String, required: true }, // وصف مختصر
  details: { type: String, required: true }, // التفاصيل الكاملة
  goals: { type: String, required: true }, // اهداف المشروع
  goalAmount: { type: Number, required: true }, // المبلغ المطلوب
  collectedAmount: { type: Number, default: 0 }, // المبلغ المجمّع
  donorsCount: { type: Number, default: 0 }, // عدد المتبرعين
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { // حالة المشروع
    type: String,
    enum: ['قيد التنفيذ', 'مكتمل', 'منتهي'],
    default: 'قيد التنفيذ'
  },
  mainImage: { type: Object }, // الصورة الرئيسية
  subImages: [{ type: Object }], // صور إضافية
  createdAt: { type: Date, default: Date.now },
  isUrgent: { type: Boolean, default: false }
});

// تحديد الحالة تلقائيًا قبل الحفظ
projectSchema.pre('save', function (next) {
  const now = new Date();
  if (this.endDate < this.startDate) {
    return next(new Error('تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية'));
  }
  if (this.collectedAmount >= this.goalAmount) {
    this.status = 'مكتمل';
  } else if (now > this.endDate) {
    this.status = 'منتهي';
  } else {
    this.status = 'قيد التنفيذ';
  }
  next();
});

// اختيار الصورة الافتراضية حسب نوع المشروع
projectSchema.pre('save', function (next) {
  if (!this.mainImage) {
    switch (this.category) {
      case 'تعليمية':
        this.mainImage = 'edu.jpeg';
        break;
      case 'صحية':
        this.mainImage = 'hospital.jpg';
        break;
      case 'معيشية':
        this.mainImage = '/uploads/default_living.jpg';
        break;
      case 'رعاية أيتام':
        this.mainImage = 'fam - Copy.jpg';
        break;
      default:
        this.mainImage = '/uploads/default_project.jpg';
    }
  }
  next();
});

const projectModel = mongoose.models.Project || model('Project', projectSchema);

module.exports = projectModel;
