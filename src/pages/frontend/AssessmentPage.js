import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const TYPES = ['Stress', 'Anxiety', 'Depression', 'Focus', 'Overall Wellness'];
const ANSWER_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Sometimes', value: 1 },
  { label: 'Often', value: 2 },
  { label: 'Very Often', value: 3 },
  { label: 'Always', value: 4 },
];

const SEVERITY_CONFIG = {
  Low: { color: 'var(--success)', bg: 'var(--success-light)', icon: 'fi fi-sr-smile' },
  Moderate: { color: 'var(--warning)', bg: 'var(--warning-light)', icon: 'fi fi-sr-meh' },
  High: { color: 'var(--accent)', bg: 'var(--accent-light)', icon: 'fi fi-sr-frown' },
  Severe: { color: 'var(--danger)', bg: 'var(--danger-light)', icon: 'fi fi-sr-sad' },
};

export default function AssessmentPage() {
  const { user } = useAuth();
  const [step, setStep] = useState('select'); // select | quiz | result | history
  const [selectedType, setSelectedType] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'student') { setHistLoading(false); return; }
    API.get('/assessment').then(r => setHistory(r.data.assessments || [])).finally(() => setHistLoading(false));
  }, [user]);

  const startAssessment = async (type) => {
    setLoading(true);
    try {
      const res = await API.get(`/assessment/questions/${encodeURIComponent(type)}`);
      setQuestions(res.data.questions);
      setSelectedType(type);
      setAnswers({});
      setStep('quiz');
    } catch {
      alert('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));

  const submitAssessment = async () => {
    if (Object.keys(answers).length < questions.length) return alert('Please answer all questions');
    setLoading(true);
    try {
      const ansArr = questions.map(q => ({ questionId: q.id, answer: answers[q.id] }));
      const res = await API.post('/assessment', { assessmentType: selectedType, answers: ansArr });
      setResult(res.data.assessment);
      setStep('result');
      // Refresh history
      const h = await API.get('/assessment');
      setHistory(h.data.assessments || []);
    } catch {
      alert('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const progress = questions.length ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const cfg = result ? SEVERITY_CONFIG[result.severity] : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>Self Assessment</h1>
          <p>Validated mental health questionnaires to help understand your wellbeing</p>
        </div>

        <div className="tabs">
          {['select', 'history'].map(t => (
            <button key={t} className={`tab-btn ${step === t || (step === 'quiz' && t === 'select') || (step === 'result' && t === 'select') ? 'active' : ''}`}
              onClick={() => setStep(t)}>
              {t === 'select' ? 'Take Assessment' : 'My Results'}
            </button>
          ))}
        </div>

        {/* Select Assessment */}
        {step === 'select' && (
          <div>
            <h3 style={{ marginBottom: 20, color: 'var(--text-mid)', fontWeight: 500 }}>Choose an assessment to begin:</h3>
            <div className="grid-3">
              {TYPES.map(type => {
                const icons = { Stress: 'fi-sr-stress', Anxiety: 'fi-sr-thought-bubble', Depression: 'fi-sr-sad', Focus: 'fi-sr-target', 'Overall Wellness': 'fi-sr-heart-health' };
                const colors = { Stress: 'orange', Anxiety: 'purple', Depression: 'red', Focus: 'blue', 'Overall Wellness': 'green' };
                const descs = { Stress: 'Measure your stress levels and coping capacity', Anxiety: 'Assess anxiety symptoms (GAD-7 based)', Depression: 'Screen for depression indicators (PHQ-5)', Focus: 'Evaluate your concentration and clarity', 'Overall Wellness': 'Holistic mental health check-in' };
                return (
                  <div key={type} className="card" style={{ cursor: 'pointer', transition: 'var(--transition)' }}
                    onClick={() => startAssessment(type)}>
                    <div className={`resource-category-icon ${colors[type] === 'orange' ? '' : ''}`}
                      style={{ background: `var(--${colors[type] === 'orange' ? 'accent' : colors[type] === 'purple' ? 'secondary' : colors[type] === 'red' ? 'danger' : colors[type] === 'blue' ? 'primary' : 'success'}-light)`, color: `var(--${colors[type] === 'orange' ? 'accent' : colors[type] === 'purple' ? 'secondary' : colors[type] === 'red' ? 'danger' : colors[type] === 'blue' ? 'primary' : 'success'})` }}>
                      <i className={`fi ${icons[type]}`} />
                    </div>
                    <h3 style={{ marginBottom: 8 }}>{type}</h3>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-light)', marginBottom: 16 }}>{descs[type]}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>5 questions · ~2 min</span>
                      <button className="btn btn-primary btn-sm" disabled={loading}>Start →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quiz */}
        {step === 'quiz' && (
          <div style={{ maxWidth: 700 }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3>{selectedType} Assessment</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{Object.keys(answers).length}/{questions.length} answered</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {questions.map((q, i) => (
              <div key={q.id} className="assessment-question fade-in">
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Question {i + 1} of {questions.length}
                </div>
                <p style={{ fontWeight: 600, marginBottom: 4, lineHeight: 1.5 }}>{q.text}</p>
                <div className="answer-options">
                  {ANSWER_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      className={`answer-btn ${answers[q.id] === opt.value ? 'selected' : ''}`}
                      onClick={() => handleAnswer(q.id, opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-outline" onClick={() => setStep('select')}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAssessment}
                disabled={Object.keys(answers).length < questions.length || loading}>
                {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</> : 'Submit Assessment →'}
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {step === 'result' && result && cfg && (
          <div style={{ maxWidth: 680 }}>
            <div className="card" style={{ textAlign: 'center', padding: '36px 32px', marginBottom: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
                <i className={cfg.icon} style={{ color: cfg.color }} />
              </div>
              <h2 style={{ marginBottom: 6 }}>{result.result}</h2>
              <p style={{ color: 'var(--text-light)', marginBottom: 16 }}>Score: {result.score}/20 · {result.assessmentType} Assessment</p>
              <span className={`badge badge-${result.severity === 'Low' ? 'green' : result.severity === 'Moderate' ? 'orange' : 'red'}`} style={{ fontSize: '0.88rem', padding: '6px 16px' }}>
                {result.severity} Severity
              </span>
            </div>

            {result.aiRecommendations && (
              <div className="card" style={{ borderLeft: '4px solid var(--primary)', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div className="stat-icon blue" style={{ width: 40, height: 40, fontSize: 18, flexShrink: 0 }}><i className="fi fi-sr-brain" /></div>
                  <div>
                    <h3>AI Recommendations</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>Personalized suggestions based on your results</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-mid)', lineHeight: 1.7 }}>{result.aiRecommendations}</p>
              </div>
            )}

            {(result.severity === 'High' || result.severity === 'Severe') && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <strong>Important:</strong> Your results indicate you may benefit from professional support. Please consider booking a counselor appointment.
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep('select')}>Take Another</button>
              <button className="btn btn-primary" onClick={() => setStep('history')}>View All Results</button>
            </div>
          </div>
        )}

        {/* History */}
        {step === 'history' && (
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Assessment History</h3>
            {histLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : history.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th><th>Type</th><th>Score</th><th>Result</th><th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(a => (
                      <tr key={a._id}>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{new Date(a.completedAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a.assessmentType}</td>
                        <td><strong>{a.score}</strong><span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>/20</span></td>
                        <td style={{ fontSize: '0.85rem' }}>{a.result}</td>
                        <td>
                          <span className={`badge badge-${a.severity === 'Low' ? 'green' : a.severity === 'Moderate' ? 'orange' : 'red'}`}>{a.severity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                No assessments yet. <button className="btn btn-primary btn-sm" onClick={() => setStep('select')}>Start one →</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
