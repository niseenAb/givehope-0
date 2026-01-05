const ProjectDetailsModel = require('../models/projectDetails.model.js');
const ProjectModel = require('../models/project.model.js');
const mongoose = require('mongoose');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');

const getProjectFullDetails = async (req, res) => {
  try {
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    const project = await ProjectModel.findById(projectId);
    if (!project) return res.status(404).json({ message: "المشروع غير موجود" });

    const details = await ProjectDetailsModel.findOne({ project: projectId });

    res.json({ project, details });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getProjectReports = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'معرف المشروع غير صحيح' });
    }

    const details = await ProjectDetailsModel.findOne({ project: projectId });

    if (!details) {
      return res.status(404).json({ message: 'لم يتم العثور على تفاصيل المشروع' });
    }

    res.status(200).json({ success: true, reports: details.reports });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReport = async (req, res) => {
  try {
    let projectId;
    try {
      projectId = new mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
      return res.status(400).json({ message: "معرف المشروع غير صالح" });
    }

   let details = await ProjectDetailsModel.findOne({ project: projectId });
if (!details) {
  // إنشاء تفاصيل المشروع إذا لم تكن موجودة
  details = await ProjectDetailsModel.create({ project: projectId, reports: [] });
}
    if (!req.files || !req.files.report || req.files.report.length === 0) {
      return res.status(400).json({ message: 'الرجاء رفع ملف تقرير واحد على الأقل' });
    }

    const file = req.files.report[0];

    const result = await cloudinary.uploader.upload(file.path, {
      folder: `${process.env.APP_NAME}/reports`,
      resource_type: 'raw',
    });

    fs.unlinkSync(file.path);

    const reportData = {
      fileUrl: result.secure_url,
      fileName: req.body.customName || file.originalname,
      publicId: result.public_id,
    };

    details.reports.push(reportData);
    await details.save();

    res.status(200).json({ success: true, message: 'تم رفع التقرير بنجاح', reports: details.reports });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { projectId, reportId } = req.params;

    // التحقق من صلاحية الـ ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "معرف المشروع غير صالح" });
    }
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "معرف التقرير غير صالح" });
    }

    // جلب تفاصيل المشروع
    const details = await ProjectDetailsModel.findOne({ project: projectId });
    if (!details) return res.status(404).json({ message: 'لم يتم العثور على تفاصيل المشروع' });

    // البحث عن التقرير
    const report = details.reports.id(reportId);
    if (!report) return res.status(404).json({ message: 'لم يتم العثور على التقرير' });

    const publicId = report.publicId;

    // حذف التقرير من المصفوفة في MongoDB
   details.reports.pull({ _id: reportId });
    await details.save();

    // حذف التقرير من Cloudinary
    try {
      await cloudinary.uploader.destroy(`GiveHope/reports/${publicId}`, { resource_type: 'raw' });
    } catch (err) {
      console.warn('⚠️ لم يتم حذف الملف من Cloudinary:', err.message);
    }

    res.json({ message: 'تم حذف التقرير بنجاح', reports: details.reports });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReportName = async (req, res) => {
  try {
    const { newName } = req.body;
    const { projectId, reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'معرف المشروع غير صحيح' });
    }

    const details = await ProjectDetailsModel.findOne({ project: projectId});

    if (!details) {
      return res.status(404).json({ message: 'لم يتم العثور على تفاصيل المشروع' });
    }

    // البحث عن التقرير بالمصفوفة
    const report =details.reports.id(reportId);
    if (!report) return res.status(404).json({ message: 'لم يتم العثور على التقرير المطلوب' });

    // تعديل اسم التقرير
    report.fileName = newName;
    await details.save();

    res.status(200).json({ message: 'تم تعديل اسم التقرير بنجاح', report });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }

};



module.exports = {
  getProjectFullDetails,
  getProjectReports,
  addReport,
  deleteReport,
  updateReportName
};
