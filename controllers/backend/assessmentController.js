const Assessment = require('../models/Assessment');
const axios = require('axios');

// Assessment questions
const assessmentQuestions = {
  Stress: [
    { id: 1, text: "How often do you feel unable to control the important things in your life?" },
    { id: 2, text: "How often do you feel nervous or stressed?" },
    { id: 3, text: "How often have you been upset because of something that happened unexpectedly?" },
    { id: 4, text: "How often do you find it difficult to relax?" },
    { id: 5, text: "How often have you felt difficulties were piling up so high that you could not overcome them?" }
  ],
  Anxiety: [
    { id: 1, text: "Feeling nervous, anxious or on edge" },
    { id: 2, text: "Not being able to stop or control worrying" },
    { id: 3, text: "Worrying too much about different things" },
    { id: 4, text: "Trouble relaxing" },
    { id: 5, text: "Being so restless that it is hard to sit still" }
  ],
  Depression: [
    { id: 1, text: "Little interest or pleasure in doing things" },
    { id: 2, text: "Feeling down, depressed, or hopeless" },
    { id: 3, text: "Trouble falling or staying asleep, or sleeping too much" },
    { id: 4, text: "Feeling tired or having little energy" },
    { id: 5, text: "Feeling bad about yourself — or that you are a failure" }
  ],
  Focus: [
    { id: 1, text: "How often do you have trouble concentrating on tasks?" },
    { id: 2, text: "How often do you feel mentally foggy or unclear?" },
    { id: 3, text: "How often do you find yourself easily distracted?" },
    { id: 4, text: "How often do you forget important information?" },
    { id: 5, text: "How often do you struggle to complete tasks you start?" }
  ],
  'Overall Wellness': [
    { id: 1, text: "How satisfied are you with your current mental health?" },
    { id: 2, text: "How well are you managing your daily responsibilities?" },
    { id: 3, text: "How connected do you feel to people around you?" },
    { id: 4, text: "How well are you sleeping and eating?" },
    { id: 5, text: "How hopeful do you feel about your future?" }
  ]
};

// Calculate severity
const getSeverity = (score, type) => {
  const total = 20; // 5 questions * max 4
  const pct = (score / total) * 100;

  if (type === 'Overall Wellness') {
    if (pct >= 75) return { severity: 'Low', result: 'Excellent Wellness' };
    if (pct >= 50) return { severity: 'Moderate', result: 'Moderate Wellness' };
    if (pct >= 25) return { severity: 'High', result: 'Needs Improvement' };
    return { severity: 'Severe', result: 'Critical — Please Seek Help' };
  }

  if (pct <= 20) return { severity: 'Low', result: `Minimal ${type}` };
  if (pct <= 40) return { severity: 'Low', result: `Mild ${type}` };
  if (pct <= 60) return { severity: 'Moderate', result: `Moderate ${type}` };
  if (pct <= 80) return { severity: 'High', result: `Severe ${type}` };
  return { severity: 'Severe', result: `Extremely Severe ${type}` };
};

// Get AI recommendations
const getAIRecommendations = async (assessmentType, severity, score, userGeminiApiKey) => {
  try {
    const apiKey = userGeminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      const recs = {
        Low: `Great news! Your ${assessmentType} levels are manageable. Keep practicing self-care, regular exercise, and maintaining social connections.`,
        Moderate: `Your ${assessmentType} levels need attention. Try daily mindfulness (10 min), regular exercise, adequate sleep (7-8 hrs), and consider talking to a counselor.`,
        High: `Your ${assessmentType} levels are concerning. Please consider booking a counselor appointment. Practice deep breathing, limit social media, and prioritize rest.`,
        Severe: `Your results indicate severe ${assessmentType}. We strongly recommend speaking with a mental health professional immediately. You are not alone. 💙`
      };
      return recs[severity] || "Please consider reaching out to a mental health professional for personalized support.";
    }

    const prompt = `A student scored ${score}/20 on a ${assessmentType} assessment with ${severity} severity. Provide 3 specific, actionable mental health recommendations. Be compassionate and practical. Under 100 words.`;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch {
    return "Consider speaking with a counselor for personalized guidance. Daily exercise, adequate sleep, and mindfulness can significantly improve mental wellness.";
  }
};

// @desc  Get assessment questions
// @route GET /api/assessment/questions/:type
// @access Private
const getQuestions = (req, res) => {
  const { type } = req.params;
  const questions = assessmentQuestions[type];
  if (!questions) return res.status(400).json({ message: 'Invalid assessment type' });
  res.json({ success: true, questions, types: Object.keys(assessmentQuestions) });
};

// @desc  Submit assessment
// @route POST /api/assessment
// @access Private (student)
const submitAssessment = async (req, res, next) => {
  try {
    const { assessmentType, answers } = req.body;
    const score = answers.reduce((sum, a) => sum + a.answer, 0);
    const { severity, result } = getSeverity(score, assessmentType);
    
    // Fetch user to check for Gemini API key
    const user = await require('../models/User').findById(req.user._id);

    const aiRecommendations = await getAIRecommendations(assessmentType, severity, score, user?.geminiApiKey);

    const assessment = await Assessment.create({
      student: req.user._id,
      assessmentType,
      answers,
      score,
      result,
      severity,
      aiRecommendations
    });

    res.status(201).json({ success: true, assessment });
  } catch (error) {
    next(error);
  }
};

// @desc  Get student assessments
// @route GET /api/assessment
// @access Private
const getAssessments = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'student' ? req.user._id : req.query.studentId;
    const assessments = await Assessment.find({ student: studentId }).sort({ completedAt: -1 });
    res.json({ success: true, assessments });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuestions, submitAssessment, getAssessments };
