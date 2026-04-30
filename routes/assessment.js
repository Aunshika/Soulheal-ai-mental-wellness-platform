const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getQuestions, submitAssessment, getAssessments } = require('../controllers/assessmentController');

router.get('/questions/:type', protect, getQuestions);
router.post('/', protect, authorize('student'), submitAssessment);
router.get('/', protect, getAssessments);

module.exports = router;
