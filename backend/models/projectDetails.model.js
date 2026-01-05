const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const projectDetailsSchema = new Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reports: [
    {
      fileUrl: { type: String, required: true },
      fileName: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }
  ]
});

const ProjectDetailsModel = model('ProjectDetails', projectDetailsSchema);

module.exports = ProjectDetailsModel;
