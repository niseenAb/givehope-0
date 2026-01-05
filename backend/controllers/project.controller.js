const projectModel = require('../models/project.model.js');
const projectDetailsModel = require('../models/projectDetails.model.js');
const cloudinary = require('../utils/cloudinary');

const checkUrgency = (project) => {
  const now = new Date();
  const diffDays = Math.ceil((project.endDate - now) / (1000 * 60 * 60 * 24)); // الأيام المتبقية
  if (diffDays <= 20) return true; // عاجل تلقائي
  return project.isUrgent; // أو اختيار الأدمن
};

// إضافة مشروع
exports.createProject = async (req, res) => {
  try {
    const { title } = req.body;

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.mainImage[0].path, {
      folder: `${process.env.APP_NAME}/project/${title}`,
    });

    req.body.subImages = [];
    if (req.files.subImages) {
      for (const file of req.files.subImages) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `${process.env.APP_NAME}/project/${title}`,
        });
        req.body.subImages.push({ secure_url: result.secure_url, public_id: result.public_id });
      }
    }

    req.body.mainImage = { secure_url, public_id };

    const project = await projectModel.create(req.body);
    project.isUrgent = checkUrgency(project);
    await project.save();

    const newDetails = new projectDetailsModel({
      project: project._id,
      reports: [],
    });
    await newDetails.save();

    res.status(201).json({ message: 'تم إنشاء المشروع بنجاح', project });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المشروع', error: error.message });
  }
};



exports.createDetailsForAllProjects = async (req, res) => {
  try {
    // جلب كل المشاريع
    const projects = await projectModel.find();

    for (const project of projects) {
      const exists = await projectDetailsModel.findOne({ project: project._id });
      if (!exists) {
        await projectDetailsModel.create({
          project: project._id,
          reports: []
        });
        console.log(`تم إنشاء تفاصيل للمشروع: ${project._id}`);
      }
    }

    res.status(200).json({ message: 'تم التحقق من كل المشاريع وإنشاء التفاصيل الناقصة بنجاح' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};




// عرض كل المشاريع
exports.getProjects = async (req, res) => {
  try {
    const { category, sort = "default", search = "", page = 1, limit = 9 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (category && category !== "all") {
      const map = {
        education: "تعليمية",
        health: "صحية",
        living: "معيشية",
        orphans: "رعاية أيتام",
      };
      if (map[category]) filter.category = map[category];
    }

    if (search && search.trim() !== "") {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { details: { $regex: term, $options: "i" } },
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === "oldest") sortObj = { createdAt: 1 };
    else if (sort === "urgent") sortObj = { isUrgent: -1, endDate: 1 };
    else if (sort === "remaining") sortObj = { endDate: 1 };

    const [total, projects] = await Promise.all([
      projectModel.countDocuments(filter),
      projectModel
        .find(filter)
        .select("title category goalAmount collectedAmount status mainImage isUrgent startDate endDate donorsCount description")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    const prepared = projects.map(p => {
      const progress = p.goalAmount > 0 ? Math.round((p.collectedAmount / p.goalAmount) * 100) : 0;
      const imageUrl = p.mainImage?.secure_url || p.mainImage;
      const remainingDays = Math.ceil((new Date(p.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      return { ...p, progress, mainImageUrl: imageUrl, remainingDays };
    });

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      projects: prepared
    });

  } catch (error) {
    console.error("getProjects error:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في الخادم، يرجى المحاولة لاحقًا " });
  }
};

// عرض مشروع معين بالتفاصيل
exports.getDetails = async (req, res) => {
 try {
    const { id } = req.params;

    const project = await projectModel.findById(id).lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const progress = project.goalAmount > 0
      ? Math.round((project.collectedAmount / project.goalAmount) * 100)
      : 0;

    const remainingDays = Math.ceil(
      (new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );



    res.status(200).json({
      success: true,
      project: {
        ...project,
        progress,
        remainingDays
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }

};


// تعديل مشروع
exports.updateProject = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // تحديث صورة رئيسية إذا تم رفع صورة جديدة
    if (req.files?.mainImage) {
      if (project.mainImage?.public_id) {
        await cloudinary.uploader.destroy(project.mainImage.public_id);
      }
      const mainImageUpload = await cloudinary.uploader.upload(req.files.mainImage[0].path, {
        folder: `${process.env.APP_NAME}/project/${project.title}`,
      });
      project.mainImage = { secure_url: mainImageUpload.secure_url, public_id: mainImageUpload.public_id };
    }

    // تحديث الصور فرعية إذا وجد
  
if (req.files?.subImages) {

  // 1️⃣ حذف الصور القديمة من Cloudinary
  if (project.subImages && project.subImages.length > 0) {
    for (const img of project.subImages) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }
  }

  // 2️⃣ تفريغ المصفوفة
  project.subImages = [];

  // 3️⃣ رفع الصور الجديدة
  for (const file of req.files.subImages) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `${process.env.APP_NAME}/project/${project.title}`,
    });

    project.subImages.push({
      secure_url: result.secure_url,
      public_id: result.public_id,
    });
  }
}


    // تحديث باقي الحقول
    Object.assign(project, req.body);

    // تصحيح isUrgent لأنها تصل كنص وليس Boolean
    if (req.body.isUrgent !== undefined) {
      project.isUrgent = req.body.isUrgent === 'true';
    }

    project.isUrgent = checkUrgency(project);

    await project.save();

    res.status(200).json({ message: 'Project updated successfully', project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const deleteProjectImages = async (project) => {
  // حذف الصورة الأساسية
  if (project.mainImage?.public_id) {
    await cloudinary.uploader.destroy(project.mainImage.public_id);
  }

  // حذف الصور الفرعية
  if (project.subImages && project.subImages.length > 0) {
    for (const img of project.subImages) {
      await cloudinary.uploader.destroy(img.public_id);
    }
  }
};

// حذف مشروع
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectModel.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
   
      // حذف صور Cloudinary
  await deleteProjectImages(project);

    
     await projectModel.findByIdAndDelete(id);

    res.status(200).json({ message: 'Project and its images deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};