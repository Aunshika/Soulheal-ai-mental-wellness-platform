const MoodEntry = require('../models/MoodEntry');
const axios = require('axios');

// AI suggestion based on mood
const getAISuggestion = async (mood, moodScore, notes) => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      // Fallback suggestions when no API key
      const fallback = {
        Happy: "Great to see you're feeling happy! Keep nurturing positive activities. Consider journaling this feeling.",
        Calm: "Your calm state is wonderful. Practice mindfulness to deepen this peace.",
        Anxious: "Try deep breathing: inhale for 4s, hold 4s, exhale 4s. Break tasks into small steps.",
        Sad: "It's okay to feel sad. Reach out to someone you trust, or try a short walk outside.",
        Angry: "Try a 10-minute cooldown walk. Write down what triggered you to process your feelings.",
        Overwhelmed: "Pause and prioritize. Write a list of 3 tasks only. Rest is productive.",
        Motivated: "Harness this energy! Set a clear goal for today and start with the hardest task first.",
        Neutral: "Use this stable state to plan ahead. Light exercise can boost your mood."
      };
      return fallback[mood] || "Take care of yourself today. Small steps lead to big changes.";
    }

    const prompt = `A student is feeling ${mood} with a mood score of ${moodScore}/10. Notes: "${notes || 'No notes provided'}". 
    As a mental health assistant, provide 2-3 short, compassionate, actionable suggestions to help them feel better. Keep it warm and under 80 words.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch {
    return "Remember to take breaks, stay hydrated, and reach out for support when needed. You've got this! 💙";
  }
};

// @desc  Create mood entry
// @route POST /api/mood
// @access Private (student)
const createMoodEntry = async (req, res, next) => {
  try {
    const { mood, moodScore, notes, tags } = req.body;

    const aiSuggestion = await getAISuggestion(mood, moodScore, notes);

    const entry = await MoodEntry.create({
      student: req.user._id,
      mood,
      moodScore,
      notes,
      tags: tags || [],
      aiSuggestion
    });

    res.status(201).json({ success: true, entry });
  } catch (error) {
    next(error);
  }
};

// @desc  Get mood entries for current student
// @route GET /api/mood
// @access Private (student)
const getMoodEntries = async (req, res, next) => {
  try {
    const { limit = 30, startDate, endDate } = req.query;
    const filter = { student: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const entries = await MoodEntry.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    // Calculate average mood score
    const avg = entries.length
      ? (entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length).toFixed(1)
      : 0;

    res.json({ success: true, count: entries.length, avgScore: parseFloat(avg), entries });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete mood entry
// @route DELETE /api/mood/:id
// @access Private (student - own entries only)
const deleteMoodEntry = async (req, res, next) => {
  try {
    const entry = await MoodEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await entry.deleteOne();
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get mood entries for a specific student (counselor/admin)
// @route GET /api/mood/student/:studentId
// @access Private (counselor, admin)
const getStudentMoodEntries = async (req, res, next) => {
  try {
    const entries = await MoodEntry.find({ student: req.params.studentId })
      .sort({ date: -1 })
      .limit(30);
    res.json({ success: true, entries });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMoodEntry, getMoodEntries, deleteMoodEntry, getStudentMoodEntries };
