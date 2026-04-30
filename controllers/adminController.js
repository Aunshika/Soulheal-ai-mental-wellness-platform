const User = require('../models/User');
const MoodEntry = require('../models/MoodEntry');
const Assessment = require('../models/Assessment');
const Appointment = require('../models/Appointment');
const Resource = require('../models/Resource');
const Setting = require('../models/Setting');

// @desc  Get dashboard stats
// @route GET /api/admin/stats
// @access Private (admin)
const getStats = async (req, res, next) => {
  try {
    const [students, counselors, appointments, assessments, moodEntries] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'counselor' }),
      Appointment.countDocuments(),
      Assessment.countDocuments(),
      MoodEntry.countDocuments()
    ]);

    const pendingAppointments = await Appointment.countDocuments({ status: 'Pending' });
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('-password');

    res.json({
      success: true,
      stats: { students, counselors, appointments, assessments, moodEntries, pendingAppointments },
      recentUsers
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all users
// @route GET /api/admin/users
// @access Private (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc  Toggle user status
// @route PUT /api/admin/users/:id/toggle
// @access Private (admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    user.status = user.isActive ? 'active' : 'suspended';
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc  Update user status
// @route PUT /api/admin/users/:id/status
// @access Private (admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = status;
    user.isActive = status === 'active';
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc  Update user role
// @route PUT /api/admin/users/:id/role
// @access Private (admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all resources
// @route GET /api/admin/resources
// @access Private (admin)
const getResources = async (req, res, next) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    next(error);
  }
};

// @desc  Add resource
// @route POST /api/admin/resources
// @access Private (admin)
const addResource = async (req, res, next) => {
  try {
    const resource = await Resource.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, resource });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete resource
// @route DELETE /api/admin/resources/:id
// @access Private (admin)
const deleteResource = async (req, res, next) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all appointments (admin view)
// @route GET /api/admin/appointments
// @access Private (admin)
const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate('student', 'name email')
      .populate('counselor', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

// @desc  Get application settings
// @route GET /api/admin/settings
// @access Private (admin)
const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find();
    res.json({ success: true, settings });
  } catch (error) { next(error); }
};

// @desc  Update application setting
// @route PUT /api/admin/settings
// @access Private (admin)
const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    let setting = await Setting.findOne({ key });
    if (setting) {
      setting.value = value;
      await setting.save();
    } else {
      setting = await Setting.create({ key, value });
    }
    res.json({ success: true, setting });
  } catch (error) { next(error); }
};

module.exports = { getStats, getAllUsers, toggleUserStatus, updateUserStatus, updateUserRole, getResources, addResource, deleteResource, getAllAppointments, getSettings, updateSetting };
