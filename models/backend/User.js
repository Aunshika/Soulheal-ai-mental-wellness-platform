const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'counselor', 'admin'], default: 'student' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  specialization: { type: String, default: '' }, // for counselors
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'suspended', 'temporary_suspended'], default: 'active' },
  geminiApiKey: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
