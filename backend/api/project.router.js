const { Router } = require('express');
const router = Router();

const Controller = require('../controllers/project.controller');
const { fileUpload, fileValidation } = require('../utils/multer');

const { protect, authorize } = require('../middleware/authMiddleware');


// روابط المشاريع
router.post(
  '/',
  fileUpload(fileValidation.image).fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'subImages', maxCount: 8 }
  ]), protect, authorize('admin'),
  Controller.createProject
);

router.get('/createDetailsForAllProjects',protect,authorize("admin"), Controller.createDetailsForAllProjects);
router.get('/', Controller.getProjects);
router.get('/:id', Controller.getDetails);

router.put( '/:id',
  fileUpload(fileValidation.image).fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'subImages', maxCount: 8 }
  ]),protect, authorize('admin'),
  Controller.updateProject
);

router.delete('/:id',protect, authorize('admin'),Controller.deleteProject);

module.exports = router;
