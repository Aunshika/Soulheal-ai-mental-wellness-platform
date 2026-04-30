const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Message = require('../models/Message');

// @desc  Get all counselors
// @route GET /api/appointments/counselors
// @access Private
const getCounselors = async (req, res, next) => {
  try {
    const counselors = await User.find({ role: 'counselor', isActive: true }).select('-password');
    res.json({ success: true, counselors });
  } catch (error) {
    next(error);
  }
};

// @desc  Book appointment
// @route POST /api/appointments
// @access Private (student)
const bookAppointment = async (req, res, next) => {
  try {
    const { counselorId, appointmentDate, timeSlot, type, reason } = req.body;

    // Check counselor exists
    const counselor = await User.findById(counselorId);
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    // Check for conflict
    const conflict = await Appointment.findOne({
      counselor: counselorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: { $in: ['Pending', 'Confirmed'] }
    });
    if (conflict) return res.status(400).json({ message: 'This time slot is already booked' });

    const appointment = await Appointment.create({
      student: req.user._id,
      counselor: counselorId,
      appointmentDate,
      timeSlot,
      type: type || 'Chat',
      reason
    });

    await appointment.populate(['student', 'counselor'], 'name email');
    res.status(201).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

// @desc  Get student appointments
// @route GET /api/appointments/my
// @access Private (student)
const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ student: req.user._id })
      .populate('counselor', 'name email specialization avatar')
      .sort({ appointmentDate: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

// @desc  Get counselor appointments
// @route GET /api/appointments/counselor
// @access Private (counselor)
const getCounselorAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { counselor: req.user._id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('student', 'name email avatar')
      .sort({ appointmentDate: 1 });
    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

// @desc  Update appointment status
// @route PUT /api/appointments/:id
// @access Private (counselor, admin)
const updateAppointment = async (req, res, next) => {
  try {
    const { status, notes, meetingLink } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Counselor can only update their own
    if (req.user.role === 'counselor' && appointment.counselor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;
    if (meetingLink) appointment.meetingLink = meetingLink;

    await appointment.save();
    await appointment.populate(['student', 'counselor'], 'name email');

    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

// @desc  Cancel appointment (student)
// @route PUT /api/appointments/:id/cancel
// @access Private (student)
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    appointment.status = 'Cancelled';
    await appointment.save();
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get appointment messages
// @route GET /api/appointments/:id/messages
// @access Private
const getAppointmentMessages = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Make sure user is part of the appointment (student or counselor)
    if (appointment.student.toString() !== req.user._id.toString() && appointment.counselor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ appointmentId: req.params.id }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCounselors, bookAppointment, getMyAppointments, getCounselorAppointments, updateAppointment, cancelAppointment, getAppointmentMessages };
