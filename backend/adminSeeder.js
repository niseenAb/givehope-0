const mongoose = require('mongoose');
const User = require('./models/User.js'); // تأكد من المسار الصحيح
require('dotenv').config();

async function createAdmin() {
  try {
    // ربط مع MongoDB مع خيارات إضافية
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // تحقق إذا فيه أدمن موجود ونشط
    const adminExists = await User.findOne({ role: "admin", status: "active" });
    if (adminExists) {
      console.log("ℹ️ Admin already exists");
      await mongoose.connection.close();
      return process.exit(0);
    }

    // إنشاء الأدمن (استخدم متغيرات بيئة للبيانات الحساسة)
    const admin = await User.create({
      firstName: "Nisreen",
      lastName: "AbuBaker",
      email: "nisrin0460@gmail.com",
      password:"Admin123!", // تأكد من أنها تطابق التحقق
      role: "admin",
      status: "active" // أضف هذا إذا لم يكن افتراضيًا
    });

    console.log("✅ Admin created successfully");
    
    // إغلاق الاتصال
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();