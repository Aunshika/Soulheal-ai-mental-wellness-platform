const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentType: {
    type: String,
    enum: ['Stress', 'Anxiety', 'Depression', 'Focus', 'Overall Wellness'],
    required: true
  },
  answers: [{ questionId: Number, answer: Number }],
  score: { type: Number, required: true },
  result: { type: String, required: true }, // e.g., "Moderate Stress"
  severity: { type: String, enum: ['Low', 'Moderate', 'High', 'Severe'], required: true },
  aiRecommendations: { type: String, default: '' },
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
