const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCounselors,
  bookAppointment,
  getMyAppointments,
  getCounselorAppointments,
  updateAppointment,
  cancelAppointment,
  getAppointmentMessages
} = require('../controllers/appointmentController');

router.get('/counselors', protect, getCounselors);
router.post('/', protect, authorize('student'), bookAppointment);
router.get('/my', protect, authorize('student'), getMyAppointments);
router.get('/counselor', protect, authorize('counselor'), getCounselorAppointments);
router.put('/:id', protect, authorize('counselor', 'admin'), updateAppointment);
router.put('/:id/cancel', protect, authorize('student'), cancelAppointment);
router.get('/:id/messages', protect, getAppointmentMessages);

module.exports = router;
