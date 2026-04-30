const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createMoodEntry, getMoodEntries, deleteMoodEntry, getStudentMoodEntries } = require('../controllers/moodController');

router.post('/', protect, authorize('student'), createMoodEntry);
router.get('/', protect, authorize('student'), getMoodEntries);
router.delete('/:id', protect, authorize('student'), deleteMoodEntry);
router.get('/student/:studentId', protect, authorize('counselor', 'admin'), getStudentMoodEntries);

module.exports = router;
