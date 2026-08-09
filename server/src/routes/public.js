import express from 'express';
import { 
  getCategories, getSubjects, getFeaturedTutors, 
  searchTutors, getPlatformStats, getCategoryById, 
  saveCallbackRequest, getTutorById, getPublicSettings
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/stats/platform', getPlatformStats);
router.get('/settings', getPublicSettings);
router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryById);
router.get('/subjects', getSubjects);
router.get('/tutors/featured', getFeaturedTutors);
router.get('/tutors/search', searchTutors);
router.get('/tutors/:id', getTutorById);
router.post('/callback', saveCallbackRequest);

export default router;
