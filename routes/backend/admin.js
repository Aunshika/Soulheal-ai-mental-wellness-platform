const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats,
  getAllUsers,
  toggleUserStatus,
  updateUserStatus,
  updateUserRole,
  getResources,
  addResource,
  deleteResource,
  getAllAppointments,
  getSettings,
  updateSetting
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.get('/resources', getResources);
router.post('/resources', addResource);
router.delete('/resources/:id', deleteResource);
router.get('/appointments', getAllAppointments);
router.get('/settings', getSettings);
router.put('/settings', updateSetting);

module.exports = router;
