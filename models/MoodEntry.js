const mongoose = require('mongoose');

const MoodEntrySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: {
    type: String,
    enum: ['Happy', 'Calm', 'Anxious', 'Sad', 'Angry', 'Overwhelmed', 'Motivated', 'Neutral'],
    required: true
  },
  moodScore: { type: Number, min: 1, max: 10, required: true }, // 1=very bad, 10=excellent
  notes: { type: String, default: '' },
  aiSuggestion: { type: String, default: '' },
  tags: [{ type: String }],
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MoodEntry', MoodEntrySchema);
