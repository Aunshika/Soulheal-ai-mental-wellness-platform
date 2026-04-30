const User = require('../models/User');
const Setting = require('../models/Setting');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// Verify reCAPTCHA token
const verifyCaptcha = async (token) => {
  // Skip verification in development or if using static bypass token to prevent lockout
  if (token === 'dev-bypass' || !process.env.RECAPTCHA_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY === 'your_recaptcha_secret_key') {
    return true;
  }
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: token } }
    );
    return response.data.success;
  } catch {
    return false;
  }
};

const getCaptchaStatus = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: 'captchaEnabled' });
    const enabled = setting ? setting.value : true;
    res.json({ success: true, enabled });
  } catch (error) { next(error); }
};

// @desc  Register user
// @route POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, email, password, role, gender, captchaToken } = req.body;

    // Verify CAPTCHA
    const setting = await Setting.findOne({ key: 'captchaEnabled' });
    const captchaEnabled = setting ? setting.value : true;
    if (captchaEnabled) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) return res.status(400).json({ message: 'CAPTCHA verification failed' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    // Create user (don't allow admin self-registration)
    const allowedRole = role === 'admin' ? 'student' : (role || 'student');
    const userGender = gender || 'male';
    const avatar = userGender === 'female' ? 'https://avatar.iran.liara.run/public/girl' : 'https://avatar.iran.liara.run/public/boy';
    
    const user = await User.create({ name, email, password, role: allowedRole, gender: userGender, avatar });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password, captchaToken } = req.body;

    // Verify CAPTCHA
    const setting = await Setting.findOne({ key: 'captchaEnabled' });
    const captchaEnabled = setting ? setting.value : true;
    if (captchaEnabled) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) return res.status(400).json({ message: 'CAPTCHA verification failed' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isActive || user.status === 'suspended' || user.status === 'temporary_suspended') {
      return res.status(403).json({ message: `Account ${user.status === 'active' ? 'deactivated' : user.status.replace('_', ' ')}. Contact admin.` });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get current user
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc  Update profile
// @route PUT /api/auth/profile
// @access Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, specialization, geminiApiKey, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, specialization, geminiApiKey, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, getCaptchaStatus };
